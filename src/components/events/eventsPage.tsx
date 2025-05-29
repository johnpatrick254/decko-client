"use client"

import { useState, useEffect, Suspense, ReactElement, JSXElementConstructor, ReactNode, ReactPortal, Key } from "react"
import { motion, useAnimation, useMotionValue, useTransform, type PanInfo } from "framer-motion"
import {  CalendarDays, CalendarIcon, HeartIcon, Link2Icon, Loader2, MapPinIcon } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import {  formatEventDate } from "@/lib/utils"
import fallbackImage from "../../../public/Image-folder.jpg"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import EmptyState from "@/components/shared/emptystate"
import { useEventQueue } from "@/provider/eventsqueue"
import { useEventsCounterContext } from "@/provider/eventcounterprovider"
import { useEventFilter } from "@/provider/eventfilterprovider"
import { useSettings } from "@/provider/settingsprovider"
import { usePostHog } from "posthog-js/react"
import { getUserId } from "@/lib/getuserid"
import Link from "next/link"
import { Category, type Event, FILTERS, useAttendEventMutation, useRegisterEventOpenMutation } from "@/store/services/events.api"
import { useTutorial } from "@/provider/tutorialprovider"
import ShareButton from "../header/share"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import GoogleMap from "./geomap"
import { calculateDistance } from "@/lib/geolocation"
import Image from "next/image"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"

export function EventCards({ filter }: { filter: FILTERS | Category }) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const eventId = searchParams.get('id');
    const {
        queue: events,
        loading: isLoading,
        fetchBatch,
        nextEvent,
        resetQueue,
        preloadNextFiveImages,
        fetchEventById
    } = useEventQueue()
    const isMobile = useIsMobile()
    const { saveAndUpdateCount, archiveAndUpdateCount } =
        useEventsCounterContext();
    const { showSwipeIcons } = useSettings();
    const { searchLocation } = useEventFilter();
    const [eventFromId, setEventFromId] = useState<null | Event[]>(null);
    const [isTopTrayVisible, setIsTopTrayVisible] = useState(false);
    const [isArticleVisible, setIsArticleVisible] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
    const [showSwipeIcon, setShowSwipeIcon] = useState(false);
    const [isDraggingVertically, setIsDraggingVertically] = useState(false);
    const [hasRecordedEventOpen, setHasRecordedEventOpen] = useState(false);
    const activeEvent = (eventFromId && eventFromId[0]) ?? (events && events.length > 0 ? events[0] : null)
    const cardX = useMotionValue(0);
    const cardY = useMotionValue(0);
    const cardRotate = useTransform(cardX, [-200, 200], [-10, 10]);
    const cardOpacity = useTransform(cardX, [-500, -400, 400, 500], [0, 1, 1, 0]);
    const swipeIconOpacity = useTransform(cardX, [-300, -150, 0, 150, 300], [0.8, 0.5, 0, 0.5, 0.8]);
    const cardControls = useAnimation();
    const stackControls = useAnimation();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const PROD = process.env.NODE_ENV === "production" || false;
    const posthog = usePostHog();
    const [registerEventOpen] = useRegisterEventOpenMutation();
    const [attendEvent, { isLoading: isUpdating }] = useAttendEventMutation();

    // We only need to know if the tutorial is active to adjust the UI
    const { showTutorial } = useTutorial();

    // Initial load effect - only runs once
    useEffect(() => {
        const initialLoad = async () => {
            if (eventId) {
                const parsedId = parseInt(eventId, 10);
                if (!isNaN(parsedId)) {
                    const event = await fetchEventById(parsedId);
                    if (event) {
                        setEventFromId([event]);

                    }
                }
            }
            await fetchBatch({ reset: true, location: searchLocation,filter });
            preloadNextFiveImages();
        };
        initialLoad();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only depend on eventId to prevent infinite loops


    useEffect(() => {
        if (activeEvent && activeEvent.id !== parseInt(eventId || '0', 10)) {
            const params = new URLSearchParams(searchParams);
            params.set('id', `${activeEvent.id}`);
            params.set('title', activeEvent?.eventname?.toString());
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
            document.title = activeEvent.eventname || "Decko - Story";
            setHasRecordedEventOpen(false);
        }
        preloadNextFiveImages();
    }, [activeEvent]);

    // Function to refresh news items
    const handleRefresh = () => {
        resetQueue(searchLocation,filter)
    };

    // Add keyboard event listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Skip keyboard navigation if there are no news items
            if (!eventFromId && !events) return;

            // Only allow horizontal swipes when card is in neutral position
            if (!isArticleVisible && !isTopTrayVisible) {
                if (e.key === "ArrowLeft") {
                    handleSwipe("left")
                } else if (e.key === "ArrowRight") {
                    handleSwipe("right")
                }
            }

            if (e.key === "ArrowUp") {
                if (!isArticleVisible && !isTopTrayVisible) {
                    // Set vertical dragging flag
                    setIsDraggingVertically(true)
                    // Move entire stack up, leaving only 20% visible at top of screen
                    stackControls
                        .start({
                            y: "-82vh", // Move up to leave just 20% visible
                            transition: { type: "tween" },
                        })
                        .then(() => {
                            setIsDraggingVertically(false)
                        })
                    setIsArticleVisible(true)
                    if (activeEvent?.id && !hasRecordedEventOpen) {
                        setHasRecordedEventOpen(true);
                        try {
                            registerEventOpen({ id: activeEvent.id });
                            // Also track in PostHog for analytics
                            if (PROD) {
                                posthog.identify(getUserId());
                                posthog.capture("event_opened", {
                                    eventTitle: activeEvent.eventname,
                                    eventId: activeEvent.id,
                                    source: "swipe_up"
                                });
                            }
                        } catch (error) {
                            console.error('Failed to register event open:', error);
                        }
                    }
                } else if (isTopTrayVisible) {
                    // Hide top tray by moving stack back up
                    stackControls.start({
                        y: 0,
                        transition: { type: "tween" },
                    })
                    setIsTopTrayVisible(false)
                }
            } else if (e.key === "ArrowDown") {
                if (isArticleVisible) {
                    // Set vertical dragging flag
                    setIsDraggingVertically(true)
                    stackControls
                        .start({
                            y: 0,
                            transition: { type: "tween" },
                        })
                        .then(() => {
                            setIsDraggingVertically(false);
                        })
                    setIsArticleVisible(false);
                } else if (!isTopTrayVisible) {
                    // Set vertical dragging flag
                    setIsDraggingVertically(true)
                    // Show top tray by moving stack down
                    stackControls
                        .start({
                            y: "10vh", // Move stack down to reveal tray (approx 10% of viewport)
                            transition: { type: "tween" },
                        })
                        .then(() => {
                            setIsDraggingVertically(false)
                        })
                    setIsTopTrayVisible(true)
                } else {
                    // Hide top tray
                    stackControls.start({
                        y: 0,
                        transition: { type: "tween" },
                    })
                    setIsTopTrayVisible(false)
                }
            }
        }

        window.addEventListener("keydown", handleKeyDown)
        return () => {
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [isArticleVisible, isTopTrayVisible, stackControls, events]);

    const handleAttendingToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (isUpdating || !activeEvent) return;

        try {
            posthog.identify(getUserId());

            if (!activeEvent?.attending) {
                if (PROD) {
                    posthog.capture("event_attended", {
                        eventTitle: activeEvent.eventname,
                        eventId: activeEvent.id
                    });
                }
            }

            await attendEvent({ id: activeEvent.id });
        } catch (error) {
            console.error('Failed to update attending status:', error);
        }
    };

    const handleCardDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // Skip if there are no news items
        if (!eventFromId && !events) return;
        // Only allow horizontal swipes when card is in neutral position
        if (!isArticleVisible && !isTopTrayVisible) {
            // Handle horizontal swipe
            if (Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
                setIsDraggingVertically(false)
                cardX.set(info.offset.x)

                // Update swipe direction based on drag direction
                if (info.offset.x > 50) {
                    setSwipeDirection("right")
                    showSwipeIcons && setShowSwipeIcon(true)
                } else if (info.offset.x < -50) {
                    setSwipeDirection("left")
                    showSwipeIcons && setShowSwipeIcon(true)
                } else {
                    showSwipeIcons && setShowSwipeIcon(false)
                }
            }
        } else {
            // Only allow vertical gestures when in toggled states
            if (isArticleVisible) {
                // Allow dragging down to close article
                if (info.offset.y > 0) {
                    const dragAmount = Math.min(info.offset.y, window.innerHeight * 0.85) // 85vh max
                    cardY.set(-window.innerHeight * 0.85 + dragAmount)
                }
            } else if (isTopTrayVisible) {
                // Allow dragging up to close tray
                if (info.offset.y < 0) {
                    const dragAmount = Math.max(info.offset.y, window.innerHeight * -0.1) // -10vh max
                    cardY.set(window.innerHeight * 0.1 + dragAmount)
                }
            }
        }
    };

    const handleCardDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // Skip if there are no news items
        if (!eventFromId && !events) return;

        // Reset vertical dragging flag
        setIsDraggingVertically(false)

        // Only allow horizontal swipes when card is in neutral position
        if (!isArticleVisible && !isTopTrayVisible) {
            // Handle horizontal swipe end
            if (Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
                if (Math.abs(info.offset.x) > 10) {
                    // Use the handleSwipe function instead of the direct implementation
                    const direction = info.offset.x > 0 ? "right" : "left"
                    handleSwipe(direction)
                } else {
                    // Return to center if not swiped far enough
                    cardControls.start({
                        x: 0,
                        transition: { type: "tween" },
                    })
                    // Reset swipe direction and hide icon
                    setSwipeDirection(null)
                    showSwipeIcons && setShowSwipeIcon(false)
                }
            }
            // Handle vertical drag end
            else {
                // Top tray interaction
                if (info.offset.y > 0) {
                    if (info.offset.y > window.innerHeight * 0.05) {
                        // 5vh threshold
                        // Keep top tray visible by keeping active card down
                        cardControls.start({
                            y: window.innerHeight * 0.1,
                            transition: { type: "tween" },
                        })
                        setIsTopTrayVisible(true)
                    } else {
                        // Hide top tray by moving active card back
                        cardControls.start({
                            y: 0,
                            transition: { type: "tween" },
                        })
                        setIsTopTrayVisible(false)
                    }
                }
                // Article interaction
                else if (info.offset.y < 0) {
                    if (info.offset.y < window.innerHeight * -0.02) {
                        // -20vh threshold
                        // Keep article visible by keeping active card up, leaving just 20% visible
                        cardControls.start({
                            y: window.innerHeight * -0.82,
                            transition: { type: "tween" },
                        })
                        // Only track if the article wasn't already visible
                        const wasArticleVisible = isArticleVisible;
                        setIsArticleVisible(true);

                        if (activeEvent?.id && !hasRecordedEventOpen) {
                            setHasRecordedEventOpen(true);
                            try {
                                registerEventOpen({ id: activeEvent.id });
                                if (PROD) {
                                    posthog.identify(getUserId());
                                    posthog.capture("event_opened", {
                                        eventTitle: activeEvent.eventname,
                                        eventId: activeEvent.id,
                                        source: "swipe_up"
                                    });
                                }
                            } catch (error) {
                                console.error('Failed to register event open:', error);
                            }
                        }
                    } else {
                        // Set vertical dragging flag
                        setIsDraggingVertically(true)
                        stackControls
                            .start({
                                y: 0,
                                transition: { type: "tween" },
                            })
                            .then(() => {
                                setIsDraggingVertically(false);
                            })
                        setIsArticleVisible(false);
                    }
                }
                cardY.set(0) // Reset cardY
            }
        } else {
            // Handle drag end when in toggled states
            if (isArticleVisible) {
                if (info.offset.y > window.innerHeight * 0.02) {
                    // 15vh threshold
                    // Close article if dragged down far enough
                    cardControls.start({
                        y: 0,
                        transition: { type: "tween" },
                    })
                    setIsArticleVisible(false)
                } else {
                    // Return to article view
                    cardControls.start({
                        y: window.innerHeight * -0.82,
                        transition: { type: "tween" },
                    })
                }
            } else if (isTopTrayVisible) {
                if (info.offset.y < window.innerHeight * -0.05) {
                    // -5vh threshold
                    // Close tray if dragged up far enough
                    cardControls.start({
                        y: 0,
                        transition: { type: "tween" },
                    })
                    setIsTopTrayVisible(false)
                } else {
                    // Return to tray view
                    cardControls.start({
                        y: window.innerHeight * 0.1,
                        transition: { type: "tween" },
                    })
                }
            }
            cardY.set(0) // Reset cardY after animations
        }
    };

    const handleSwipe = (direction: "left" | "right") => {
        if (!eventFromId && !events) return;
        if (eventFromId) {
            setEventFromId(null)
        }
        if (isArticleVisible || isTopTrayVisible) return;
        setSwipeDirection(direction)
        showSwipeIcons && setShowSwipeIcon(true)
        const xPosition = direction === "left" ? -500 : 500;
        if (activeEvent?.id) {
            posthog.identify(getUserId());
            if (direction === 'right') {
                saveAndUpdateCount(activeEvent.id)
                if (PROD) {
                    posthog.capture("event_saved", {
                        eventTitle: activeEvent.eventname,
                        eventId: activeEvent.id,
                    });
                }
            } else {
                archiveAndUpdateCount(activeEvent.id)
                if (PROD) {
                    posthog.capture("event_archived", {
                        eventTitle: activeEvent.eventname,
                        eventId: activeEvent.id,
                    });
                }
            }
        }

        cardControls
            .start({
                x: xPosition,
                transition: { duration: 0.25 },
            })
            .then(() => {
                nextEvent(filter).then(() => {
                    cardX.set(0)
                    cardControls.set({ x: 0 })

                    setSwipeDirection(null)
                    showSwipeIcons && setShowSwipeIcon(false)

                    preloadNextFiveImages()
                })
            })
    };

    // Get visible cards using events from the queue
    const visibleCards = () => {
        if (eventFromId?.length) {
            return eventFromId.slice(0, 3)
        }
        if (!events || events.length === 0) return []
        return events.slice(0, 3)
    }

    const placeHolder = 'https://placehold.co/600x400/png?text=Image+Processing+Failed';
    const imageUrl = activeEvent?.imagedata.alts[1]?.imgUrl;
    let distanceInMiles = null;
    const userCoords = localStorage.getItem('user_coordinates');
    if (userCoords && activeEvent && activeEvent.geolocation?.length) {
        try {
            const parsedCoordinates = (JSON.parse(userCoords) as string[]);
            const distance = calculateDistance(
                +parsedCoordinates[0],
                +parsedCoordinates[1],
                +activeEvent.geolocation[0],
                +activeEvent.geolocation[1]
            );
            distanceInMiles = distance;
        } catch (error) {
            console.error('Error parsing coordinates:', error);
        }

    }
    return (
        <div className="relative font-sans flex justify-center items-center">

            {/* iPhone Max width container - all elements will be constrained to this width */}
            <div className="relative flex flex-1 justify-center">

                {/* Main content container */}
                <motion.div className="relative h-screen w-full flex items-center justify-center" animate={stackControls}>
                    {/* Loading state */}
                    {isLoading && (
                        <div className="h-[88dvh] w-full flex flex-col items-center justify-center bg-background rounded-3xl shadow-xl mx-4 p-8">
                            <div className="flex flex-col items-center">
                                <motion.div
                                    className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full mb-4"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                />
                                <p className="text-gray-600">Loading events...</p>
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!isLoading && ((!events || events.length === 0) && (!eventFromId || eventFromId.length === 0)) &&
                        <div
                            className="relative w-full h-full flex items-start justify-center pt-[4dvh] "
                        > <motion.div
                            className="absolute standard-card mx-auto h-[90dvh] w-[94vw] flex flex-col items-center justify-center  rounded-3xl shadow-xl custom-shadow p-8"
                            animate={cardControls}
                            style={{
                                x: cardX,
                                y: cardY,
                                rotate: cardRotate
                            }}
                            drag={true}
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                            dragElastic={0.7}
                            onDrag={handleCardDrag}
                            onDragEnd={handleCardDragEnd}
                        >
                                <EmptyState type="Story" onRefresh={handleRefresh} />
                            </motion.div>
                        </div>
                    }

                    {/* Card Stack */}
                    {!isLoading && ((events && events.length > 0) || (eventFromId && eventFromId.length > 0)) && (
                        <div className="relative w-full h-full flex items-start justify-center pt-[9vh]">
                            {/* Tutorial Card Manager - handles all tutorial-related rendering */}
                            {/* {showTutorial && <TutorialCardManager fallbackImage={fallbackImage} textSize={textSize} />} */}
                            {/* Render multiple cards in stack */}
                            {visibleCards().map((eventItem, index) => (
                                <motion.div
                                    key={`${eventItem.id}-${index}`}
                                    className="absolute rounded-xl overflow-hidden shadow-md standard-card mx-auto ring-1 ring-card-foreground/10 h-[84dvh] w-[90%] md:max-w-[90%] lg:max-w-[450px] event-card z-50"
                                    data-event={index === 0 ? JSON.stringify(eventItem) : ''}
                                    // Only apply animations to the top card (index 0)
                                    animate={index === 0 ? cardControls : undefined}
                                    style={{
                                        // Only apply motion values to the top card
                                        x: index === 0 ? cardX : 0,
                                        y: index === 0 ? cardY : 0, 
                                        rotate: index === 0 ? cardRotate : 0,
                                        // Only apply opacity changes to the top card during horizontal swipes
                                        opacity:
                                            index === 0 ? cardOpacity : isDraggingVertically || isArticleVisible || isTopTrayVisible ? 0 : 1,
                                        // Stack cards with decreasing z-index
                                        zIndex: 20 - index,
                                        // Hide background cards during vertical drag with pointer-events
                                        pointerEvents:
                                            (isDraggingVertically || isArticleVisible || isTopTrayVisible) && index > 0 ? "none" : "auto",
                                        // Use visibility instead of opacity/scale to hide cards without changing dimensions
                                        visibility:
                                            (isDraggingVertically || isArticleVisible || isTopTrayVisible) && index > 0
                                                ? "hidden"
                                                : "visible",
                                    }}
                                    // Only make the top card draggable
                                    drag={index === 0}
                                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                                    dragElastic={0.7}
                                    // Only attach drag handlers to the top card
                                    onDrag={handleCardDrag}
                                    onDragEnd={index === 0 ? handleCardDragEnd : undefined}
                                >
                                    <div className="bg-background relative h-full w-full sm:max-w-[94vw] flex flex-col">
                                        <div className="relative w-full flex gap-3 justify-end p-3">
                                            {
                                                activeEvent?.metadata?.google_calendar_url
                                                &&
                                                <Link href={activeEvent.metadata?.google_calendar_url ?? "#"} target="_blank" className="flex justify-between items-center gap-1 z-50">
                                                    <div
                                                        className="h-11 w-11 flex items-center justify-center rounded-full bg-card-foreground border-2 p-2 cursor-pointer transition-colors duration-200"
                                                        title="Add to Google Calendar"
                                                    >
                                                        <CalendarDays size={18} className="text-primary-foreground" />
                                                    </div>
                                                </Link>
                                            }
                                            <ShareButton title={activeEvent?.eventname ?? "Decko"} url={`${origin}/events/${activeEvent?.id}?id=${activeEvent?.id}`} />
                                        </div>
                                        <div className="absolute h-full-w-full inset-0 bg-gradient-to-t from-black via-black/70 to-primary-black/40 z-10" ></div>
                                        <Image height={1200} width={780} priority quality={80} src={(!imageUrl || imageUrl == placeHolder) ? fallbackImage : imageUrl} alt={activeEvent?.eventname ?? "Event image"} className="absolute inset-0 h-full w-full" />
                                        <div className="absolute inset-x-0 bottom-0 z-20 p-4  text-white">
                                            <h3 className="text-xl font-bold leading-tight mb-3">
                                                {activeEvent?.eventname}
                                            </h3>
                                            <p className="text-sm opacity-90 mb-1.5">
                                                {activeEvent?.eventstartdatetime && formatEventDate(activeEvent.eventstartdatetime)}
                                            </p>
                                            <p className="text-sm opacity-90">
                                                {activeEvent?.eventvenuename}
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {activeEvent?.metadata.price?.length && activeEvent?.metadata.price !== '0' && (
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-primary-foreground/50 text-white border-white/20"
                                                    >
                                                        {activeEvent?.metadata.price}
                                                    </Badge>
                                                )}
                                                {distanceInMiles && (
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-primary-foreground/50 text-white border-white/20"
                                                    >
                                                        {distanceInMiles} miles
                                                    </Badge>
                                                )}
                                                {activeEvent?.metadata.eventTags.Categories.map((tag) => {
                                                    return <Badge
                                                        key={tag}
                                                        variant="outline"
                                                        className="bg-primary-foreground/50 text-white border-white/20"
                                                    >
                                                        {tag}
                                                    </Badge>
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Swipe indicator icons */}
                            {showSwipeIcon && (
                                <motion.div
                                    className="fixed top-[50%] -translate-y-1/2 z-30 pointer-events-none"
                                    style={{
                                        opacity: swipeIconOpacity,
                                        x: swipeDirection === "left" ? "-30%" : "50%",
                                        left: swipeDirection === "left" ? "10%" : "70%",
                                    }}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div
                                        className={`rounded-full h-[70px] w-[70px] p-2 ${swipeDirection === "left" ? "bg-blue-600" : "bg-green-600"}`}
                                    >
                                        {swipeDirection === "left" ? (
                                            <div className="flex h-full w-full flex-col items-center justify-center">
                                                <div className="text-white font-bold ">Snooze</div>
                                                <div className="flex">
                                                    <motion.span
                                                        className="text-white text-xl font-bold"
                                                        animate={{
                                                            y: [4, -8, 4],
                                                            opacity: [0.3, 1, 0.3]
                                                        }}
                                                        transition={{
                                                            duration: 1.2,
                                                            repeat: Infinity,
                                                            delay: 0
                                                        }}
                                                    >Z</motion.span>
                                                    <motion.span
                                                        className="text-white text-lg font-bold"
                                                        animate={{
                                                            y: [4, -6, 4],
                                                            opacity: [0.3, 1, 0.3]
                                                        }}
                                                        transition={{
                                                            duration: 1.2,
                                                            repeat: Infinity,
                                                            delay: 0.2
                                                        }}
                                                    >z</motion.span>
                                                    <motion.span
                                                        className="text-white text-md font-bold"
                                                        animate={{
                                                            y: [4, -4, 4],
                                                            opacity: [0.3, 1, 0.3]
                                                        }}
                                                        transition={{
                                                            duration: 1.2,
                                                            repeat: Infinity,
                                                            delay: 0.4
                                                        }}
                                                    >z</motion.span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex h-full w-full flex-col items-center justify-center">
                                                <div className="text-white font-bold mb-1">Save</div>
                                                <motion.div
                                                    animate={{
                                                        scale: [1, 1.2, 1],
                                                    }}
                                                    transition={{
                                                        duration: 0.8,
                                                        repeat: Infinity,
                                                        repeatType: "reverse"
                                                    }}
                                                >
                                                    <HeartIcon className="h-6 w-6 text-white" />
                                                </motion.div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}
                </motion.div>
                <div className="absolute overflow-auto w-full max-w-[740px]">
                    {/* Article Content - Positioned 25% down from the top and 0% from bottom */}
                    {isArticleVisible && activeEvent && (
                        <div className="mx-auto w-full h-[140vh] pb-[42vh] z-5">
                            <div className="flex h-full flex-col">
                                {/* Image section */}
                                <div className="relative h-76 w-full">
                                    <img
                                        src={activeEvent.imagedata?.selectedImg || activeEvent.imageUrl || '/placeholder-event.jpg'}
                                        alt={activeEvent.eventname || 'Event'}
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                        <h1 className="text-3xl font-bold">{activeEvent.eventname}</h1>
                                        <div className="mt-2 space-y-1">
                                            <div className="flex items-center gap-2 text-base opacity-90">
                                                <CalendarIcon className="h-4 w-4 text-white" />
                                                <span>{formatEventDate(activeEvent.eventstartdatetime)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-base opacity-90">
                                                <MapPinIcon className="h-4 w-4 text-white" />
                                                <span>{distanceInMiles} miles</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Content section */}
                                <div className="flex-1 overflow-y-auto">
                                    <div className="max-w-4xl mx-auto p-6 w-full">
                                        <div className="space-y-6">
                                            {/* Event details */}
                                            <div className="space-y-4">
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center gap-1">
                                                        <CalendarIcon className="h-4 w-4" />
                                                        <span>{formatEventDate(activeEvent.eventstartdatetime)}</span>
                                                    </div>
                                                    {/* Distance calculation would need user's location */}
                                                    {distanceInMiles && <div className="flex items-center gap-1">
                                                        <MapPinIcon className="h-4 w-4" />
                                                        <span>{distanceInMiles} miles</span>
                                                    </div>}
                                                    {/* Attending button positioned absolutely at bottom right */}
                                                    <div className=" right-3 z-[5]">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    {isUpdating ? (
                                                                        <div className="bg-primary/80 rounded-sm px-2 py-1 shadow-md z-[10] cursor-wait text-md  font-medium text-primary-foreground flex items-center gap-1">
                                                                            <Loader2 className="h-3 w-3 text-primary-foreground animate-spin" />
                                                                            Updating...
                                                                        </div>
                                                                    ) : activeEvent.attending ? (
                                                                        <button
                                                                            onClick={handleAttendingToggle}
                                                                            disabled={isUpdating}
                                                                            className="bg-primary rounded-sm px-2 py-1 shadow-md z-[10] cursor-pointer text-md  font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus:ring-2 focus:ring-primary/30 focus:outline-none hover:scale-105"
                                                                            aria-label="Mark as not attending"
                                                                        >
                                                                            Attending
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={handleAttendingToggle}
                                                                            disabled={isUpdating}
                                                                            className="bg-muted rounded-sm px-2 py-1 shadow-md z-[10] cursor-pointer text-md  font-medium border border-border hover:bg-muted/80 transition-colors focus:ring-2 focus:ring-muted/50 focus:outline-none hover:scale-105"
                                                                            aria-label="Mark as attending"
                                                                        >
                                                                            Not Attending
                                                                        </button>
                                                                    )}
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {isUpdating ? (
                                                                        <p>Updating attendance status...</p>
                                                                    ) : (
                                                                        <p>Click to {activeEvent.attending ? 'remove' : 'add'} yourself as attending</p>
                                                                    )}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {activeEvent.metadata?.price && (
                                                        <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
                                                            {activeEvent.metadata.price}
                                                        </Badge>
                                                    )}
                                                    {activeEvent.metadata?.soldOut && (
                                                        <Badge variant="outline" className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200">
                                                            Sold Out
                                                        </Badge>
                                                    )}
                                                    {activeEvent.metadata?.eventTags?.Categories?.map((category: boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | Key | null | undefined) => (
                                                        <Badge key={category?.toString()} variant="outline" className="bg-gray-100 dark:bg-gray-800">
                                                            {category}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            {/* Action buttons */}
                                            <div className="flex justify-start flex-wrap gap-4">
                                                {activeEvent.metadata?.url && (
                                                    <Button variant="outline" className="flex items-center">
                                                        <Link2Icon />
                                                        <a href={activeEvent.metadata.url} target="_blank" rel="noopener noreferrer">
                                                        Visit source
                                                        </a>
                                                    </Button>
                                                )}
                                                {activeEvent.metadata?.google_calendar_url && (
                                                    <Button asChild>
                                                        <a href={activeEvent.metadata.google_calendar_url} target="_blank" rel="noopener noreferrer">
                                                            Add to Calendar
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                            {/* About section */}
                                            <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                                                <h3 className="mb-2 font-medium">About this event</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                                    {activeEvent.metadata?.eventLongDescription || activeEvent.eventdescription ||
                                                        `Join us for ${activeEvent.eventname}. This event will be held at ${activeEvent.eventvenuename} in ${activeEvent.city}, ${activeEvent.state}.`}
                                                </p>
                                            </div>

                                            {/* Additional event info */}
                                            {activeEvent.metadata?.address && (
                                                <div className="space-y-4">
                                                    <h3 className="font-medium">Address</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300">
                                                        {activeEvent.metadata.address}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Map section */}
                                            <div className="space-y-4">
                                                <h3 className="font-medium">Location</h3>
                                                <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                                    <GoogleMap
                                                        coordinates={activeEvent.geolocation as any}
                                                        title={activeEvent.eventname || 'Event'}
                                                        venue={activeEvent.eventvenuename}
                                                        address={`${activeEvent.city}, ${activeEvent.state}`}
                                                        height="256px"
                                                        className="w-full"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {/* Keyboard controls hint - fades out when card is swiped up or down */}
                {
                    !isMobile && events && events.length > 0 && (
                        <motion.div
                            className="absolute bottom-[0.8dvh] right-[2dvh] bg-white/80 backdrop-blur-sm rounded-lg p-2 text-xs  text-gray-600"
                            animate={{
                                opacity: isArticleVisible || isTopTrayVisible ? 0 : 1,
                            }}
                            transition={{ duration: 0.3 }}
                        >
                            <p>← → to swipe, ↑ ↓ to reveal content</p>
                        </motion.div>
                    )
                }
            </div >
        </div >
    )
}

export const EventPage = ({filter}:{filter:FILTERS | Category}) => {
    return (
        <Suspense fallback={(
            <div className="flex items-center justify-center h-96">
                <div className="animate-pulse">Loading...</div>
            </div>
        )}>
            <EventCards filter={filter} />
        </Suspense>
    );
};