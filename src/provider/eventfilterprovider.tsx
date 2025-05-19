"use client";

import { createContext, useContext, ReactNode } from 'react';
import { SEARCH_LOCATIONS, DEFAULT_LOCATIONS, LocationData } from '@/store/services/events.api';
import { useLocalStorage } from '@/hooks/uselocalstorage';

const EVENT_FILTER_KEY = 'event_search_location';

type EventFilterContextType = {
    searchLocation: SEARCH_LOCATIONS;
    saveSearchLocation: (state: SEARCH_LOCATIONS) => void;
};

const EventFilterContext = createContext<EventFilterContextType>({
    searchLocation: DEFAULT_LOCATIONS.FORT_LAUDERDALE,
    saveSearchLocation: () => { },
});

export function EventFilterProvider({ children }: { children: ReactNode }) {
    const [searchLocation, setSearchLocation] = useLocalStorage<SEARCH_LOCATIONS>(
        EVENT_FILTER_KEY,
        DEFAULT_LOCATIONS.FORT_LAUDERDALE
    );

    return (
        <EventFilterContext.Provider
            value={{
                searchLocation,
                saveSearchLocation: setSearchLocation
            }}
        >
            {children}
        </EventFilterContext.Provider>
    );
}

export function useEventFilter() {
    return useContext(EventFilterContext);
}