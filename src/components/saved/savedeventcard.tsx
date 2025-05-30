import { Badge } from "@/components/ui/badge";
import { cn, extractDateFromISOWithFallback, formatDateParts, formatTimeWithTimezone } from "@/lib/utils";
import Link from "next/link";
import fallbackImage from "../../../public/Image-folder.jpg"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { useAttendEventMutation, useUnsaveEventMutation } from "@/store/services/events.api";
import posthog from "posthog-js";
import { getUserId } from "@/lib/getuserid";
import { Loader2, Trash2, Check, CalendarArrowDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const PROD = process.env.NODE_ENV === "production" || false;

export interface EventCardProps {
    id: number;
    title: string;
    date: string;
    location: string;
    imageUrl: string;
    price: string | null;
    distance?: string | null;
    tags?: string[];
    className?: string;
    style?: React.CSSProperties;
    attending?: boolean;
}

export default function SavedEventCard({
    id,
    title,
    date,
    location,
    imageUrl,
    price,
    distance,
    attending
}: EventCardProps) {
    const placeHolder = 'https://placehold.co/600x400/png?text=Image+Processing+Failed';
    const day = extractDateFromISOWithFallback(date);

    const [attendEvent, { isLoading: isUpdatingAttend }] = useAttendEventMutation();
    const [unsaveEvent, { isLoading: isUnsaving }] = useUnsaveEventMutation();

    // Swipe state
    const [dragX, setDragX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [isPerformingAction, setIsPerformingAction] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const linkRef = useRef<HTMLAnchorElement>(null);

    const SWIPE_THRESHOLD = 100; // Minimum distance to trigger action
    const MAX_DRAG = 150; // Maximum drag distance for visual effect

    const handleAttendingToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (isUpdatingAttend || isPerformingAction) return;

        try {
            setIsPerformingAction(true);
            posthog.identify(getUserId());

            if (attending) {
                if (PROD) {
                    posthog.capture("event_attended", {
                        eventTitle: title,
                        eventId: id
                    });
                }
            }

            await attendEvent({ id: id });
        } catch (error) {
            console.error('Failed to update attending status:', error);
        } finally {
            setIsPerformingAction(false);
        }
    };

    const handleUnsave = async () => {
        if (isPerformingAction) return;

        try {
            setIsPerformingAction(true);
            posthog.identify(getUserId());
            if (PROD) {
                posthog.capture("event_unsaved", {
                    eventTitle: title,
                    eventId: id
                });
            }
            await unsaveEvent({ id });
        } catch (error) {
            console.error('Failed to unsave event:', error);
        } finally {
            setTimeout(() => setIsPerformingAction(false), 500);
        }
    };

    const handleMarkAttending = async () => {
        if (!attending && !isPerformingAction) {
            try {
                setIsPerformingAction(true);
                posthog.identify(getUserId());
                if (PROD) {
                    posthog.capture("event_attended_swipe", {
                        eventTitle: title,
                        eventId: id
                    });
                }
                await attendEvent({ id });
            } catch (error) {
                console.error('Failed to mark as attending:', error);
            } finally {
                setIsPerformingAction(false);
            }
        } else {
            setDragX(0);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (isPerformingAction) return;
        setStartX(e.touches[0].clientX);
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging || isPerformingAction) return;

        const currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;

        const limitedDeltaX = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, deltaX));
        setDragX(limitedDeltaX);
    };

    const handleTouchEnd = () => {
        if (!isDragging || isPerformingAction) return;

        setIsDragging(false);

        if (Math.abs(dragX) > SWIPE_THRESHOLD) {
            // Fixed: Left-to-right swipe (positive dragX) = unsave
            // Right-to-left swipe (negative dragX) = mark attending
            if (dragX > 0) {
                handleUnsave();
            } else {
                handleMarkAttending();
            }
        } else {
            setDragX(0);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isPerformingAction) return;
        setStartX(e.clientX);
        setIsDragging(true);
        e.preventDefault();
    };

    // Global mouse events
    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!isDragging || isPerformingAction) return;

            const currentX = e.clientX;
            const deltaX = currentX - startX;

            const limitedDeltaX = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, deltaX));
            setDragX(limitedDeltaX);
        };

        const handleGlobalMouseUp = () => {
            if (!isDragging || isPerformingAction) return;

            setIsDragging(false);

            if (Math.abs(dragX) > SWIPE_THRESHOLD) {
                // Fixed: Left-to-right swipe (positive dragX) = unsave
                // Right-to-left swipe (negative dragX) = mark attending  
                if (dragX > 0) {
                    handleUnsave();
                } else {
                    handleMarkAttending();
                }
            } else {
                setDragX(0);
            }
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleGlobalMouseMove);
            document.addEventListener('mouseup', handleGlobalMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging, startX, dragX, isPerformingAction]);

    // Reset drag position after action completes
    useEffect(() => {
        if (!isUpdatingAttend && !isUnsaving && !isPerformingAction) {
            const timer = setTimeout(() => {
                setDragX(0);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isUpdatingAttend, isUnsaving, isPerformingAction]);

    const handleCardClick = (e: React.MouseEvent) => {
        // Prevent navigation if we just finished dragging or performing an action
        if (Math.abs(dragX) > 5 || isPerformingAction) {
            e.preventDefault();
            e.stopPropagation();
        }
    };


    const cardContent = (
        <div className="relative w-full overflow-hidden">
            {/* Background action indicators */}
            <div className="absolute inset-0 flex">
                {/* Left side - Unsave (Red) - shows when swiping left-to-right */}
                <div
                    className={cn(
                        "flex items-center rounded-xl justify-start pl-6 bg-gradient-to-l from-red-500/40 via-red-500/70 to-red-500 w-1/2 transition-all duration-200",
                    )}
                >
                    <div className="flex items-center gap-2 text-white">
                        <Trash2 className="h-8 w-8 animate-bounce" />
                    </div>
                </div>

                {/* Right side - Mark Attending (Green) - shows when swiping right-to-left */}
                <div
                    className={cn(
                        "flex items-center rounded-xl justify-end pr-6 bg-gradient-to-r from-green-500/40 via-green-500/70 to-green-500 w-1/2 transition-all duration-200",
                    )}
                >
                    <div className="flex items-center gap-2 text-white">
                        <CalendarArrowDown className="h-8 w-8 animate-bounce" />
                    </div>
                </div>
            </div>

            {/* Main card */}
            <div
                ref={cardRef}
                className={cn(
                    "relative overflow-hidden rounded-xl shadow-lg h-[200px] w-full bg-amber-800",
                    isDragging || isPerformingAction ? "cursor-grabbing" : "cursor-grab",
                    // Only apply transition when not dragging and not performing action
                    !isDragging && !isPerformingAction ? "transition-transform duration-300 ease-out" : "transition-none"
                )}
                style={{
                    transform: `translateX(${dragX}px)`,
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onClick={handleCardClick}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30 z-10" />
                <img
                    src={imageUrl == placeHolder ? fallbackImage.src : imageUrl}
                    alt={title}
                    className="absolute inset-0 h-full w-full object-cover"
                    draggable={false}
                />
                <div className="absolute space-y-1.5 inset-x-0 bottom-0 z-20 p-4 text-white">
                    <h3 className="text-xl font-bold leading-tight">{title}</h3>
                    <p className="mt-1 text-sm opacity-90">{day} {formatTimeWithTimezone(date)}</p>
                    <p className="text-sm opacity-90">{location}</p>
                    <div className="mt-3 flex flex-nowrap justify-between gap-2">
                        <div className="flex items-center flex-wrap gap-2">
                            {price?.length && price !== '0' && (
                                <Badge
                                    variant="outline"
                                    className="bg-primary-foreground/50 text-white border-white/20"
                                >
                                    {price}
                                </Badge>
                            )}
                            {distance && (
                                <Badge
                                    variant="outline"
                                    className="bg-black/50 text-white border-white/20"
                                >
                                    {distance}
                                </Badge>
                            )}
                        </div>

                        {/* Regular attending button when not dragging */}

                        <div className="right-3 z-[5]">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        {(isUpdatingAttend || isUnsaving || isPerformingAction) ? (
                                            <div className="text-nowrap bg-primary/80 rounded-sm px-2 py-1.5 shadow-md z-[10] cursor-wait text-sm font-medium text-primary-foreground flex items-center gap-1">
                                                <Loader2 className="h-3 w-3 text-primary-foreground animate-spin" />
                                                {isUnsaving ? "Unsaving..." : "Updating..."}
                                            </div>
                                        ) : attending ? (
                                            <button
                                                onClick={handleAttendingToggle}
                                                disabled={isUpdatingAttend || isUnsaving || isPerformingAction}
                                                className="text-nowrap bg-primary rounded-sm px-2 py-1.5 shadow-md z-[10] cursor-pointer text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus:ring-2 focus:ring-primary/30 focus:outline-none hover:scale-105"
                                                aria-label="Mark as not attending"
                                            >
                                                Attending
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleAttendingToggle}
                                                disabled={isUpdatingAttend || isUnsaving || isPerformingAction}
                                                className="text-nowrap bg-muted rounded-sm px-2 py-1.5 shadow-md z-[10] cursor-pointer text-sm font-medium border border-border hover:bg-muted/80 transition-colors focus:ring-2 focus:ring-muted/50 focus:outline-none hover:scale-105"
                                                aria-label="Mark as attending"
                                            >
                                                Not Attending
                                            </button>
                                        )}
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {(isUpdatingAttend || isUnsaving || isPerformingAction) ? (
                                            <p>{isUnsaving ? "Removing from saved events..." : "Updating attendance status..."}</p>
                                        ) : (
                                            <p>Click to {attending ? 'remove' : 'add'} yourself as attending</p>
                                        )}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <Link
            ref={linkRef}
            href={`/event/${id}`}
            className="w-full block"
            onClick={handleCardClick}
        >
            {cardContent}
        </Link>
    );
}