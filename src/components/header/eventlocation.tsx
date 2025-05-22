"use client";

import * as React from "react";
import { useEventFilter } from "@/provider/eventfilterprovider";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useEventQueue } from "@/provider/eventsqueue";
import { DEFAULT_LOCATIONS } from "@/store/services/events.api";
import { MapPin } from "lucide-react";
import { usePathname } from "next/navigation";

// Convert default locations object to array for the dropdown
const locations = Object.values(DEFAULT_LOCATIONS).map(location => ({
    label: location.displayName,
    value: location.displayName
}));

export function EventLocationSelect() {
    const pathname = usePathname();
    const isEventsPage = pathname.includes("/events");
    const isIndexPage = pathname === "/";
    const isSavedEventsPage = pathname.includes("/events/saved");
    const { searchLocation } = useEventFilter();
    const displayLocation = typeof searchLocation === 'string' ? searchLocation : searchLocation.displayName;
    const { setFilter } = useEventQueue()

    const handleValueChange = (value: string) => {
        // Find the location data for this display name if it exists in DEFAULT_LOCATIONS
        const locationEntry = Object.values(DEFAULT_LOCATIONS).find(loc => loc.displayName === value);

        if (locationEntry) {
            // If it's a predefined location, use the full LocationData
            setFilter(locationEntry);
        } else {
            // If it's a custom location, just use the string (this should be handled by the backend)
            setFilter(value);
        }
    }
    // Don't show on saved events page or non-event pages
    if (isSavedEventsPage || (!isEventsPage && !isIndexPage)) {
        return null;
    }

    // Check if the current location is in our predefined list
    const isCustomLocation = !Object.values(DEFAULT_LOCATIONS).some(
        loc => loc.displayName === displayLocation
    );

    // If it's a custom location, add it to the dropdown list
    const displayLocations = isCustomLocation
        ? [{ label: displayLocation, value: displayLocation }, ...locations]
        : locations;

    return (
        <Select onValueChange={handleValueChange} defaultValue={displayLocation}>
            <SelectTrigger className="w-[190px] z-20 flex outline-none border-none gap-1.5 align-center justify-normal">
                <MapPin className="h-4 w-4" />
                <SelectValue placeholder={displayLocation} />
            </SelectTrigger>
            <SelectContent className="bg-background">
                <SelectGroup>
                    {
                        displayLocations.map(location =>
                            <SelectItem key={location.value} value={location.value}>
                                {location.value}
                            </SelectItem>
                        )
                    }
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}