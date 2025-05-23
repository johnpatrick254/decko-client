"use client"
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Link2Icon, MapPinIcon, ShareIcon } from "lucide-react"; // Update this import path
import { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useEffect } from "react";
import { useGetEventByIdQuery, useRegisterEventOpenMutation, useShareEventMutation } from "@/store/services/events.api";
import GoogleMap from "./geomap";
import { calculateDistance } from "@/lib/geolocation";
export function EventDetail({ eventId }: { eventId: string }) {
    const { data: event, isLoading, error } = useGetEventByIdQuery({ id: parseInt(eventId) });
    const [shareEvent] = useShareEventMutation();
    const [registerEventOpen] = useRegisterEventOpenMutation();

    // Register that the event was opened when component mounts
    useEffect(() => {
        if (event?.id) {
            registerEventOpen({ id: event.id });
        }
    }, [event?.id, registerEventOpen]);

    const handleShare = async () => {
        if (event?.id) {
            try {
                await shareEvent({ id: event.id }).unwrap();
                // Optionally show success message
            } catch (error) {
                console.error('Failed to share event:', error);
            }
        }
    };

    const handleCopyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            // Optionally show success message
            console.log('Link copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy link:', err);
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-full flex-col">
                <div className="container mx-auto flex flex-1 items-center justify-center px-4">
                    <p className="text-lg text-gray-500">Loading event...</p>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="flex h-full flex-col">
                <div className="container mx-auto flex flex-1 items-center justify-center px-4">
                    <p className="text-lg text-gray-500">Event not found</p>
                </div>
            </div>
        );
    }

    // Format the event date
    const formatEventDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).replace(',', ' •');
    };

    const formattedDate = formatEventDate(event.eventstartdatetime);
    let distanceInMiles = null
    const userCoords = localStorage.getItem('user_coordinates')
    if (userCoords) {
        try {
            const parsedCoordinates = (JSON.parse(userCoords) as string[]);
            const distance = calculateDistance(
                +parsedCoordinates[0],
                +parsedCoordinates[1],
                +event.geolocation[0],
                +event.geolocation[1]
            )
            distanceInMiles = distance;
        } catch (error) {
            console.error('Error parsing coordinates:', error);
        }

    }
    return (
        <div className="flex h-full flex-col">
            {/* Image section */}
            <div className="relative h-96 w-full">
                <img
                    src={event.imagedata?.selectedImg || event.imageUrl || '/placeholder-event.jpg'}
                    alt={event.eventname || 'Event'}
                    className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h1 className="text-3xl font-bold">{event.eventname}</h1>
                    <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-base opacity-90">
                            <CalendarIcon className="h-4 w-4 text-white" />
                            <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-base opacity-90">
                            <MapPinIcon className="h-4 w-4 text-white" />
                            <span>{distanceInMiles}</span>
                        </div>
                    </div>
                </div>

                {/* Share buttons */}
                <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 rounded-full p-0 bg-white/90 hover:bg-white"
                        onClick={handleShare}
                    >
                        <ShareIcon className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-10 rounded-full p-0 bg-white/90 hover:bg-white"
                        onClick={handleCopyLink}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                    </Button>
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
                                    <span>{getRelativeTime(formattedDate)}</span>
                                </div>
                                {/* Distance calculation would need user's location */}
                                {distanceInMiles && <div className="flex items-center gap-1">
                                    <MapPinIcon className="h-4 w-4" />
                                    <span>{distanceInMiles} miles</span>
                                </div>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {event.metadata?.price && (
                                    <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
                                        {event.metadata.price}
                                    </Badge>
                                )}
                                {event.metadata?.soldOut && (
                                    <Badge variant="outline" className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200">
                                        Sold Out
                                    </Badge>
                                )}
                                {event.metadata?.eventTags?.Categories?.map((category: boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | Key | null | undefined) => (
                                    <Badge key={category?.toString()} variant="outline" className="bg-gray-100 dark:bg-gray-800">
                                        {category}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* About section */}
                        <div className="rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                            <h3 className="mb-2 font-medium">About this event</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                {event.metadata?.eventLongDescription || event.eventdescription ||
                                    `Join us for ${event.eventname}. This event will be held at ${event.eventvenuename} in ${event.city}, ${event.state}.`}
                            </p>
                        </div>

                        {/* Additional event info */}
                        {event.metadata?.address && (
                            <div className="space-y-4">
                                <h3 className="font-medium">Address</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {event.metadata.address}
                                </p>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-4">
                            {event.metadata?.url && (
                                <Button variant="outline" className="flex items-center">
                                    <Link2Icon/> 
                                    <a href={event.metadata.url} target="_blank" rel="noopener noreferrer">
                                        Event Link
                                    </a>
                                </Button>
                            )}
                            {event.metadata?.google_calendar_url && (
                                <Button  asChild>
                                    <a href={event.metadata.google_calendar_url} target="_blank" rel="noopener noreferrer">
                                        Add to Calendar
                                    </a>
                                </Button>
                            )}
                        </div>

                        {/* Map section */}
                        <div className="space-y-4">
                            <h3 className="font-medium">Location</h3>
                            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                <GoogleMap
                                    coordinates={event.geolocation as any}
                                    title={event.eventname || 'Event'}
                                    venue={event.eventvenuename}
                                    address={`${event.city}, ${event.state}`}
                                    height="256px"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getRelativeTime(dateString: string): string {
    try {
        // Parse the date from format "Sat, Jul 15 • 7:00 PM"
        const [_, monthStr, dayStr, timeStr, period] = dateString.split(/[ ,•]+/);

        // Map month abbreviations to numbers (0-11)
        const months: { [key: string]: number } = {
            Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
            Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
        };

        const month = months[monthStr];
        const day = parseInt(dayStr, 10);

        // Parse time
        const [hours, minutes] = timeStr.split(":").map(Number);
        let hours24 = hours;

        if (period === 'PM' && hours < 12) {
            hours24 = hours + 12;
        } else if (period === 'AM' && hours === 12) {
            hours24 = 0;
        }

        // Create event date (using current year or next year if the event has already passed this year)
        const now = new Date();
        let eventDate = new Date(now.getFullYear(), month, day, hours24, minutes);

        // If the event has already passed this year, use next year's date
        if (eventDate < now) {
            eventDate = new Date(now.getFullYear() + 1, month, day, hours24, minutes);
        }

        // Calculate difference in days
        const diffInMs = eventDate.getTime() - now.getTime();
        const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

        // Return appropriate relative time string
        if (diffInDays < 0) return "Event passed";
        if (diffInDays === 0) return "Today";
        if (diffInDays === 1) return "Tomorrow";
        if (diffInDays < 7) return `${diffInDays} days from now`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} from now`;
        return `${Math.floor(diffInDays / 30)} month${Math.floor(diffInDays / 30) > 1 ? 's' : ''} from now`;
    } catch (error) {
        console.error('Error parsing date:', error);
        return dateString; // Return original string if parsing fails
    }
}