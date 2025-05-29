import { Badge } from "@/components/ui/badge";
import { cn, extractDateFromISOWithFallback, formatDateParts, formatTimeWithTimezone } from "@/lib/utils";
import Link from "next/link";
import fallbackImage from "../../../public/Image-folder.jpg"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { useAttendEventMutation, useUnsaveEventMutation } from "@/store/services/events.api";
import posthog from "posthog-js";
import { getUserId } from "@/lib/getuserid";
import { Loader2, Trash2, Check } from "lucide-react";
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
    const cardRef = useRef<HTMLDivElement>(null);
    const linkRef = useRef<HTMLAnchorElement>(null);

    const SWIPE_THRESHOLD = 100; // Minimum distance to trigger action
    const MAX_DRAG = 150; // Maximum drag distance for visual effect

    const handleAttendingToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (isUpdatingAttend) return;

        try {
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
        }
    };

    const handleUnsave = async () => {
        try {
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
        }
    };

    const handleMarkAttending = async () => {
        if (!attending) {
            try {
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
            }
        }
    };

    // Touch events
    const handleTouchStart = (e: React.TouchEvent) => {
        setStartX(e.touches[0].clientX);
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;

        const currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;

        // Limit drag distance
        const limitedDeltaX = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, deltaX));
        setDragX(limitedDeltaX);
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;

        setIsDragging(false);

        if (Math.abs(dragX) > SWIPE_THRESHOLD) {
            if (dragX < 0) {
                // Left swipe - unsave
                handleUnsave();
            } else {
                // Right swipe - mark as attending
                handleMarkAttending();
            }
        }

        // Reset position
        setDragX(0);
    };

    // Mouse events for desktop
    const handleMouseDown = (e: React.MouseEvent) => {
        setStartX(e.clientX);
        setIsDragging(true);
        e.preventDefault();
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;

        const currentX = e.clientX;
        const deltaX = currentX - startX;

        const limitedDeltaX = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, deltaX));
        setDragX(limitedDeltaX);
    };

    const handleMouseUp = () => {
        if (!isDragging) return;

        setIsDragging(false);

        if (Math.abs(dragX) > SWIPE_THRESHOLD) {
            if (dragX < 0) {
                handleUnsave();
            } else {
                handleMarkAttending();
            }
        }

        setDragX(0);
    };

    // Global mouse events
    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const currentX = e.clientX;
            const deltaX = currentX - startX;

            const limitedDeltaX = Math.max(-MAX_DRAG, Math.min(MAX_DRAG, deltaX));
            setDragX(limitedDeltaX);
        };

        const handleGlobalMouseUp = () => {
            if (!isDragging) return;

            setIsDragging(false);

            if (Math.abs(dragX) > SWIPE_THRESHOLD) {
                if (dragX < 0) {
                    handleUnsave();
                } else {
                    handleMarkAttending();
                }
            }

            setDragX(0);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleGlobalMouseMove);
            document.addEventListener('mouseup', handleGlobalMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging, startX, dragX]);

    const handleCardClick = (e: React.MouseEvent) => {
        // Prevent navigation if we just finished dragging
        if (Math.abs(dragX) > 5) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const cardContent = (
        <div className="relative w-full overflow-hidden">
            {/* Background action indicators */}
            <div className="absolute inset-0 flex">
                {/* Left side - Unsave (Red) */}
                <div
                    className={cn(
                        "flex items-center justify-start pl-4 bg-red-500 w-1/2 transition-opacity duration-200",
                        dragX < -20 ? "opacity-100" : "opacity-0"
                    )}
                >
                    <div className="flex items-center gap-2 text-white">
                        <Trash2 className="h-6 w-6" />
                        <span className="font-medium">Unsave</span>
                    </div>
                </div>

                {/* Right side - Mark Attending (Green) */}
                <div
                    className={cn(
                        "flex items-center justify-end pr-4 bg-green-500 w-1/2 transition-opacity duration-200",
                        dragX > 20 && !attending ? "opacity-100" : "opacity-0"
                    )}
                >
                    <div className="flex items-center gap-2 text-white">
                        <span className="font-medium">Attending</span>
                        <Check className="h-6 w-6" />
                    </div>
                </div>
            </div>

            {/* Main card */}
            <div
                ref={cardRef}
                className={cn(
                    "relative overflow-hidden rounded-xl shadow-lg transition-transform h-[200px] w-full bg-amber-800 cursor-grab active:cursor-grabbing",
                    isDragging ? "transition-none" : "transition-transform duration-300 ease-out"
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

                        {/* Action Icons when dragging */}
                        {isDragging && Math.abs(dragX) > 20 && (
                            <div className="flex items-center">
                                {dragX < 0 ? (
                                    <div className="flex items-center gap-2 bg-red-500/90 px-3 py-1.5 rounded-lg text-white">
                                        <Trash2 className="h-4 w-4" />
                                        <span className="text-sm font-medium">Unsave</span>
                                    </div>
                                ) : dragX > 0 && !attending ? (
                                    <div className="flex items-center gap-2 bg-green-500/90 px-3 py-1.5 rounded-lg text-white">
                                        <Check className="h-4 w-4" />
                                        <span className="text-sm font-medium">Attending</span>
                                    </div>
                                ) : null}
                            </div>
                        )}

                        {/* Regular attending button when not dragging */}
                        {!isDragging && (
                            <div className="right-3 z-[5]">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            {(isUpdatingAttend || isUnsaving) ? (
                                                <div className="text-nowrap bg-primary/80 rounded-sm px-2 py-1.5 shadow-md z-[10] cursor-wait text-md font-medium text-primary-foreground flex items-center gap-1">
                                                    <Loader2 className="h-3 w-3 text-primary-foreground animate-spin" />
                                                    {isUnsaving ? "Unsaving..." : "Updating..."}
                                                </div>
                                            ) : attending ? (
                                                <button
                                                    onClick={handleAttendingToggle}
                                                    disabled={isUpdatingAttend || isUnsaving}
                                                    className="text-nowrap bg-primary rounded-sm px-2 py-1.5 shadow-md z-[10] cursor-pointer text-md font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus:ring-2 focus:ring-primary/30 focus:outline-none hover:scale-105"
                                                    aria-label="Mark as not attending"
                                                >
                                                    Attending
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleAttendingToggle}
                                                    disabled={isUpdatingAttend || isUnsaving}
                                                    className="text-nowrap bg-muted rounded-sm px-2 py-1.5 shadow-md z-[10] cursor-pointer text-md font-medium border border-border hover:bg-muted/80 transition-colors focus:ring-2 focus:ring-muted/50 focus:outline-none hover:scale-105"
                                                    aria-label="Mark as attending"
                                                >
                                                    Not Attending
                                                </button>
                                            )}
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {(isUpdatingAttend || isUnsaving) ? (
                                                <p>{isUnsaving ? "Removing from saved events..." : "Updating attendance status..."}</p>
                                            ) : (
                                                <p>Click to {attending ? 'remove' : 'add'} yourself as attending</p>
                                            )}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        )}
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