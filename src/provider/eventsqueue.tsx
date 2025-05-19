"use client";
import React, {
    createContext,
    useContext,
    useCallback,
    useState
} from "react";
import {
    Event,
    useLazyGetBatchEventsWithFilterQuery,
    useLazyGetRandomEventWithFilterQuery,
    useLazyGetEventByIdQuery,
    SEARCH_LOCATIONS,
} from "@/store/services/events.api";
import { useEventFilter } from "./eventfilterprovider";
import { useMaxDaysOld } from "./maxDaysOldProvider";

interface EventQueueContextType {
    currentEvent: Event | null;
    nextEvent: () => Promise<Event | null>;
    fetchBatch: ({ reset, updatedMaxDaysOld }: { reset: null | boolean, location: null | SEARCH_LOCATIONS, updatedMaxDaysOld?: number }) => Promise<void>;
    fetchEventById: (id: number) => Promise<Event | undefined>;
    fetchRandomEvent: () => Promise<void>;
    preloadNextFiveImages: () => Promise<void>;
    setFilter: (filterLocation: SEARCH_LOCATIONS) => void;
    resetQueue: (filterLocation: SEARCH_LOCATIONS,updatedMaxDaysOld?: number) => void;
    queue: Event[] | null;
    loading: boolean;
    fetchInProgress: boolean;
    error: Error | null;
}

const EventQueueContext = createContext<EventQueueContextType | undefined>(
    undefined,
);

interface EventQueueProviderProps {
    children: React.ReactNode;
}
export const preloadImage = (url: string | null): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!url) {
            resolve();
            return null;
        }
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject();
        img.src = url;
    });
};
export const EventQueueProvider: React.FC<EventQueueProviderProps> = ({
    children,
}) => {
    const { searchLocation, saveSearchLocation } = useEventFilter();
    const { maxDaysOld } = useMaxDaysOld();
    const [queue, setQueue] = useState<Event[]>([]);
    const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [fetchInProgress, setFetchInProgress] = useState(false);
    const minThreshold = 15;

    const [triggerBatchFetch] = useLazyGetBatchEventsWithFilterQuery();
    const [triggerRandomFetch] = useLazyGetRandomEventWithFilterQuery();
    const [triggerGetEventById] = useLazyGetEventByIdQuery();

    const preloadNextFiveImages = async () => {
        await preloadImage(queue[0]?.imagedata?.selectedImg ?? queue[0]?.imageUrl);
        await preloadImage(queue[1]?.imagedata?.selectedImg ?? queue[1]?.imageUrl);
        await preloadImage(queue[2]?.imagedata?.selectedImg ?? queue[2]?.imageUrl);
        await preloadImage(queue[3]?.imagedata?.selectedImg ?? queue[3]?.imageUrl);
    };

    // Define fetchBatch first since it's used by resetQueue
    const fetchBatch = useCallback(
        async ({ reset = null, location = null, updatedMaxDaysOld = null }: { reset: boolean | null, location: SEARCH_LOCATIONS | null, updatedMaxDaysOld?: number | null }) => {
            if (fetchInProgress) return;
            !queue.length && setFetchInProgress(true);
            try {
                const result = await triggerBatchFetch({
                    limit: 25,
                    location: location ?? searchLocation,
                    maxDaysOld: updatedMaxDaysOld ?? maxDaysOld
                }).unwrap();

                if (Array.isArray(result)) {
                    if (result.length === 0) {
                        setCurrentEvent(null);
                        return;
                    }
                    const firstEvent = result[0];
                    if (reset) {
                        setCurrentEvent(firstEvent);
                        setQueue((prevQueue) => [...prevQueue, ...result.filter(event => event.id !== firstEvent?.id)]);
                    } else {
                        setQueue((prevQueue) => [...prevQueue, ...result.filter(event => event.id !== currentEvent?.id)]);
                    };
                };
            } catch (err) {
                console.error("Error fetching event batch:", err);
                setError(err as Error);
            } finally {
                setFetchInProgress(false);
                setLoading(false);
            }
        },
        [fetchInProgress, triggerBatchFetch, queue.length, searchLocation, maxDaysOld],
    );

    // Define resetQueue next since it's used by fetchRandomEvent and fetchEventById
    const resetQueue = (location: SEARCH_LOCATIONS,updatedMaxDaysOld?: number) => {
        setCurrentEvent(null);
        setQueue([]);
        fetchBatch({ reset: true, location,updatedMaxDaysOld });
    };

    // Now define the functions that depend on resetQueue
    const fetchEventById = useCallback(async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            const event = await triggerGetEventById({ id }).unwrap();
            return event;

        } catch (err) {
            console.error("Error fetching event by ID:", err);
            setError(err as Error);
        } finally {
            setLoading(false);
            resetQueue(searchLocation);
        }
    }, [searchLocation, resetQueue, triggerGetEventById]);

    const fetchRandomEvent = useCallback(async () => {
        setLoading(true);
        setError(null);
        resetQueue(searchLocation);
    }, [searchLocation, resetQueue]);

    const nextEvent = useCallback(async (): Promise<Event | null> => {
        try {
            if (queue.length < minThreshold) {
                setLoading(true)
                fetchBatch({ reset: null, location: null });
            }
            const nextEvent = queue[0];
            setCurrentEvent(nextEvent);
            setQueue(prev => prev.filter(queueEvent => nextEvent?.id !== queueEvent.id));
            return nextEvent;
        } catch (err) {
            console.error("Error getting next event:", err);
            setError(err as Error);
            return null;
        } finally {
            setLoading(false);
        }
    }, [queue, fetchBatch, triggerRandomFetch, maxDaysOld, minThreshold]);

    const setFilter = (filterLocation: SEARCH_LOCATIONS) => {
        setLoading(true);
        saveSearchLocation(filterLocation);
        setCurrentEvent(null)
        resetQueue(filterLocation);
    };

    const setPreviousEvent = useCallback((event: Event) => {
        setCurrentEvent(event);
    }, []);

    const value = {
        queue,
        currentEvent,
        nextEvent,
        setPreviousEvent,
        loading,
        fetchInProgress,
        fetchBatch,
        fetchEventById,
        fetchRandomEvent,
        setFilter,
        resetQueue,
        preloadNextFiveImages,
        error
    };

    return (
        <EventQueueContext.Provider value={value}>
            {children}
        </EventQueueContext.Provider>
    );
};

export const useEventQueue = () => {
    const context = useContext(EventQueueContext);
    if (context === undefined) {
        throw new Error(
            "useEventQueue must be used within a EventQueueProvider",
        );
    }
    return context;
};

