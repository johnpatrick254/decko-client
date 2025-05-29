import { Badge } from "@/components/ui/badge";
import { cn, extractDateFromISOWithFallback, formatDateParts, formatTimeWithTimezone } from "@/lib/utils";
import Link from "next/link";
import fallbackImage from "../../../public/Image-folder.jpg"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { useAttendEventMutation } from "@/store/services/events.api";
import posthog from "posthog-js";
import { getUserId } from "@/lib/getuserid";
import { Loader2 } from "lucide-react";

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
    attending?:boolean
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
    const day = extractDateFromISOWithFallback(date)
    const [attendEvent, { isLoading: isUpdating }] = useAttendEventMutation();
    const handleAttendingToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (isUpdating ) return;

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
    const cardContent = (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl shadow-lg transition-transform h-[200px] w-full bg-amber-800",
            )}
        >
           
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30 z-10" />
            <img
                src={imageUrl == placeHolder ? fallbackImage.src : imageUrl}
                alt={title}
                className="absolute inset-0 h-full w-full object-cover"
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
                    <div className=" right-3 z-[5]">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    {isUpdating ? (
                                        <div className="text-nowrap bg-primary/80 rounded-sm px-2 py-1.5 shadow-md z-[10] cursor-wait text-md  font-medium text-primary-foreground flex items-center gap-1">
                                            <Loader2 className="h-3 w-3 text-primary-foreground animate-spin" />
                                            Updating...
                                        </div>
                                    ) : attending ? (
                                        <button
                                            onClick={handleAttendingToggle}
                                            disabled={isUpdating}
                                            className="text-nowrap bg-primary rounded-sm px-2 py-1.5 shadow-md z-[10] cursor-pointer text-md  font-medium text-primary-foreground hover:bg-primary/90 transition-colors focus:ring-2 focus:ring-primary/30 focus:outline-none hover:scale-105"
                                            aria-label="Mark as not attending"
                                        >
                                            Attending
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleAttendingToggle}
                                            disabled={isUpdating}
                                            className="text-nowrap bg-muted rounded-sm px-2 py-1.5 shadow-md z-[10] cursor-pointer text-md  font-medium border border-border hover:bg-muted/80 transition-colors focus:ring-2 focus:ring-muted/50 focus:outline-none hover:scale-105"
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
                                        <p>Click to {attending ? 'remove' : 'add'} yourself as attending</p>
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <Link href={`/event/${id}`} className="w-full">
            {cardContent}
        </Link>
    );
}
