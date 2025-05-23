"use client"

import { useState, useEffect, Suspense } from "react"
import { motion, useAnimation, useMotionValue, useTransform, type PanInfo, AnimatePresence } from "framer-motion"
import { AlertCircle, CalendarDays, DollarSign, ExternalLinkIcon, HeartIcon } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { formatDateParts, formatTimeWithTimezone } from "@/lib/utils"
import fallbackImage from "../../../public/Image-folder.jpg"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import EmptyState from "@/components/shared/emptystate"
import { useEventQueue } from "@/provider/eventsqueue"
import { useEventsCounterContext } from "@/provider/eventcounterprovider"
import { useEventFilter } from "@/provider/eventfilterprovider"
import clsx from "clsx"
import { useSettings } from "@/provider/settingsprovider"
import { usePostHog } from "posthog-js/react"
import { getUserId } from "@/lib/getuserid"
import Image from "next/image"
import Link from "next/link"
import { type Event, useRegisterEventOpenMutation } from "@/store/services/events.api"
import { useTutorial } from "@/provider/tutorialprovider"
import { TutorialCardManager } from "@/components/tutorial/TutorialCardManager"
import ShareButton from "../header/share"

export function EventCards() {
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
    const { showSwipeIcons, textSize } = useSettings();
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
            await fetchBatch({ reset: true, location: null });
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
        resetQueue(searchLocation)
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
                            y: "-85vh", // Move up to leave just 20% visible
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
                    cardY.set(-window.innerHeight * 0.8 + dragAmount)
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
                            y: window.innerHeight * -0.85,
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
                        y: window.innerHeight * -0.85,
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
        // Skip if there are no news items
        if (!eventFromId && !events) return;
        if (eventFromId) {
            setEventFromId(null)
        }
        // Only allow swipes when in neutral position
        if (isArticleVisible || isTopTrayVisible) return;
        // Set swipe direction and show icon
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
                // Use nextEvent function to advance in the queue
                nextEvent().then(() => {
                    // Reset position for the new card
                    cardX.set(0)
                    cardControls.set({ x: 0 })

                    // Reset swipe direction and hide icon
                    setSwipeDirection(null)
                    showSwipeIcons && setShowSwipeIcon(false)

                    // Preload next images for smoother experience
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
        // Use the first card from the queue as current, then show up to 2 more
        return events.slice(0, 3)
    }

    return (
        <div className="relative h-screen w-full overflow-hidden font-sans flex justify-center items-center">

            {/* iPhone Max width container - all elements will be constrained to this width */}
            <div className="relative w-full h-full flex justify-center">
                <div className='absolute justify-self-end flex flex-col w-max right-0 gap-3 p-5'>
                    <ShareButton title={activeEvent?.eventname ?? "Fast news"} url={`${origin}/events/${activeEvent?.id}?id=${activeEvent?.id}`} />
                </div>
                {/* Main content container */}
                <motion.div className="relative h-full w-full flex items-center justify-center" animate={stackControls}>
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
                            className="absolute standard-card mx-auto h-[94dvh] flex flex-col items-center justify-center bg-background rounded-3xl shadow-xl custom-shadow p-8"
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
                        <div className="relative w-full h-full flex items-start justify-center pt-[11vh]">
                            {/* Tutorial Card Manager - handles all tutorial-related rendering */}
                            {showTutorial && <TutorialCardManager fallbackImage={fallbackImage} textSize={textSize} />}
                            {/* Render multiple cards in stack */}
                            {visibleCards().map((eventItem, index) => (
                                <motion.div
                                    key={`${eventItem.id}-${index}`}
                                    className="absolute standard-card mx-auto ring-1 ring-card-foreground/10 shadow-md h-[84dvh] event-card"
                                    data-event={index === 0 ? JSON.stringify(eventItem) : ''}
                                    // Only apply animations to the top card (index 0)
                                    animate={index === 0 ? cardControls : undefined}
                                    style={{
                                        // Only apply motion values to the top card
                                        x: index === 0 ? cardX : 0,
                                        y: index === 0 ? cardY : 0, // Add this line to apply cardY to top card only
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
                                    <div className="bg-background h-full rounded-xl overflow-hidden shadow-xl flex flex-col">
                                        <div className="absolute h-full w-full -z-0 flex-1 min-h-[15%] overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                                            <Image
                                                quality={100}
                                                fill={true}
                                                priority
                                                src={eventItem.imagedata.selectedImg ?? fallbackImage.src}
                                                alt={`Illustration for ${eventItem?.eventname}`}
                                                className={clsx(
                                                    `transition-transform hover:scale-105 duration-300`,
                                                )}
                                            />
                                        </div>
                                        <div className={`p-3  h-full z-20 flex flex-col items-start justify-end hide-scroll bg-gradient-to-t from-card via-card to-transparent from-0% to-55%`}>
                                            <Link
                                                href={eventItem.metadata?.google_calendar_url ?? "#"}
                                                className=" flex ml-auto mb-auto items-center justify-center rounded-full bg-card-foreground border-2 p-2 cursor-pointer transition-colors duration-200"
                                                title="Add to Google Calendar"
                                                target="blank"
                                            >
                                                <CalendarDays size={24} className="text-primary-foreground" />
                                            </Link>
                                            <div className=
                                                {clsx("flex flex-wrap w-full gap-2  mb-2 ", {
                                                    "text-[0.55rem]": textSize === 'sm',
                                                    "text-[0.65rem]": textSize === 'md',
                                                    "text-[0.8rem]": textSize === 'lg'
                                                })}

                                            >

                                                {(!!eventItem?.metadata?.price  ) && (
                                                    <div className="inline-flex items-center gap-1 bg-emerald-600/90 text-white px-2 py-1 rounded-full font-medium shadow-md">
                                                        <DollarSign className="w-3 h-3" />
                                                        <span>{eventItem.metadata?.price}</span>
                                                    </div>
                                                )}
                                                {eventItem?.metadata?.soldOut && (
                                                    <div className="inline-flex items-center gap-1 bg-red-600/90 text-white px-2 py-1 rounded-full font-medium shadow-md">
                                                        <AlertCircle className="w-3 h-3" />
                                                        <span>Sold Out</span>
                                                    </div>
                                                )}
                                            </div>

                                            <h3
                                                className={
                                                    clsx("flex font-bold max-h-fit  pb-1 relative", {
                                                        "text-[1.2rem]": textSize === 'sm',
                                                        "text-[1.56rem]": textSize === 'md',
                                                        "text-[1.92rem]": textSize === 'lg'
                                                    })}
                                            >
                                                {eventItem?.eventname}
                                            </h3>

                                            <div className={
                                                clsx(
                                                    `text-sm flex items-start justify-start w-full gap-4 text-neutral-600 dark:text-neutral-300 leading-relaxed`,
                                                    {
                                                        "text-[0.9rem]": textSize === 'sm',
                                                        "text-[1.05rem]": textSize === 'md',
                                                        "text-[1.2rem]": textSize === 'lg'
                                                    })
                                            }>
                                                <div className="self-center flex flex-col items-center">
                                                    <div className="w-16 h-16 rounded-md overflow-hidden flex flex-col border border-neutral-300 dark:border-neutral-600">
                                                        <div className="bg-card-foreground text-primary-foreground font-medium py-1 text-center">
                                                            {formatDateParts(eventItem?.eventstartdatetime).month}
                                                        </div>
                                                        <div className="flex-1 bg-white dark:bg-neutral-800 flex items-center justify-center">
                                                            <span className="font-bold">{formatDateParts(eventItem?.eventstartdatetime).day}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="rounded-md flex flex-col items-start gap-1">
                                                    <span className="font-bold">Location</span>
                                                    {eventItem?.metadata?.address ?? eventItem.eventvenuename}
                                                </div>
                                                <div className="flex flex-col items-start gap-1 ml-auto min-w-20">
                                                    <span className="font-bold">Start Time</span>
                                                    <p className="p-0 w-16">
                                                        {formatTimeWithTimezone(eventItem?.eventstartdatetime)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Swipe indicator icons */}
                            {showSwipeIcon && (
                                <motion.div
                                    className="absolute top-[30%] -translate-y-1/2 z-30 pointer-events-none"
                                    style={{
                                        opacity: swipeIconOpacity,
                                        x: swipeDirection === "left" ? "-30%" : "50%",
                                        left: swipeDirection === "left" ? "10%" : "65%",
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
                <div className="absolute top-[12dvh] h-full mx-auto max-w-[900px]">
                    {/* Article Content - Positioned 25% down from the top and 0% from bottom */}
                    {isArticleVisible && activeEvent && (
                        <div className="h-full mx-auto w-full px-6 z-5">
                            <div className="w-full flex justify-center gap-8 px-1.5 border-neutral-200 dark:border-neutral-700 mb-4">
                                {
                                    activeEvent.metadata?.google_calendar_url
                                    &&
                                    <Link href={activeEvent.metadata?.google_calendar_url ?? "#"} target="_blank" className="flex justify-between items-center gap-1">
                                        <div
                                            className="h-9 w-9 flex items-center justify-center rounded-full bg-card-foreground border-2 p-2 cursor-pointer transition-colors duration-200"
                                            title="Add to Google Calendar"
                                        >
                                            <CalendarDays size={14} className="text-primary-foreground" />
                                        </div>
                                        <span className="font-medium text-sm">Add to Calender</span>
                                    </Link>
                                }
                                {
                                    activeEvent.metadata?.url
                                    &&
                                    <Link href={activeEvent.metadata?.url ?? "#"} target="_blank" className="flex justify-between items-center gap-1">
                                        <div
                                            className="h-9 w-9 flex items-center justify-center rounded-full bg-card-foreground border-2 p-2 cursor-pointer transition-colors duration-200"
                                            title="Add to Google Calendar"
                                        >
                                            <ExternalLinkIcon size={14} className="text-primary-foreground" />
                                        </div>
                                        <span className="font-medium text-sm">Event Link</span>
                                    </Link>
                                }
                            </div>
                            <h4 className="text-sm font-bold px-3 mx-auto w-max mb-3">Description</h4>
                            <p
                                id="event-description"
                                className={clsx("text-primary  leading-relaxed",
                                    {
                                        "text-[1.02rem]": textSize === 'sm',
                                        "text-[1.2rem]": textSize === 'md',
                                        "text-[1.35rem]": textSize === 'lg'
                                    })}
                            >
                                {(activeEvent.metadata?.eventLongDescription ?? activeEvent.eventdescription ?? "No description available").trim()}
                            </p>
                        </div>
                    )}
                </div>
                {/* Keyboard controls hint - fades out when card is swiped up or down */}
                {
                    !isMobile && events && events.length > 0 && (
                        <motion.div
                            className="absolute bottom-[0.8dvh] right-[2dvh] bg-white/80 backdrop-blur-sm rounded-lg p-2 text-xs text-gray-600"
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

export const EventPage = () => {
    return (
        <Suspense fallback={(
            <div className="flex items-center justify-center h-96">
                <div className="animate-pulse">Loading...</div>
            </div>
        )}>
            <EventCards />
        </Suspense>
    );
};