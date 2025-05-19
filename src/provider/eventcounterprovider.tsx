"use client";

import { getUserId } from "@/lib/getuserid";
import { baseApiURL } from "@/store/api";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useEventFilter } from "./eventfilterprovider";
import { useSaveEventMutation } from "@/store/services/events.api";
import { useMaxDaysOld } from "./maxDaysOldProvider";

type EventsCounterContext = {
  count: number;
  archiveAndUpdateCount: (id: number) => void;
  saveAndUpdateCount: (id: number) => void;
};

const EventsCounterContext = createContext<EventsCounterContext>({
  count: 0,
  archiveAndUpdateCount: (id) => null,
  saveAndUpdateCount: (id) => null,
});

export const EventsCounterProvider = ({ children }: { children: ReactNode }) => {
  const [count, setCount] = useState(1);
  const { searchLocation } = useEventFilter();
  const { maxDaysOld } = useMaxDaysOld();
  const [saveEvent] = useSaveEventMutation();

  const fetchCount = async () => {
    try {
      const locationParam = typeof searchLocation === 'string'
        ? searchLocation
        : `${searchLocation.coordinates[0]},${searchLocation.coordinates[1]}`;

      const response = await fetch(
        `${baseApiURL}/events/unread-count?location=${locationParam}&maxDaysOld=${maxDaysOld}`,
        {
          headers: { "x-user-id": getUserId() },
        },
      );
      const data = (await response.json()) as { count: number };
      setCount(data.count);
    } catch (e) {
      console.log(e);
    }
  };
  useEffect(() => {
    fetchCount();
  }, [searchLocation, maxDaysOld]);

  useEffect(() => {
    if (count == 0) {
      fetchCount();
    }
  }, [count])

  const archiveAndUpdateCount = (id: number) => {
    const updateWithServer = async (id: number) => {
      try {

        await fetch(baseApiURL + "/events/archive", {
          headers: {
            "Content-Type": "application/json",
            "x-user-id": getUserId(),
          },
          body: JSON.stringify({ id }),
          method: "POST",
        });
        // setCount(data.count);
      } catch (e) {
        console.log(e);
      }
    };
    updateWithServer(id);
  };

  const saveAndUpdateCount = (id: number) => {
    if (count > 0) {
      setCount((prev) => prev - 1);
    };

    // Get the current event from the queue if available
    const activeEvent = document.querySelector('.event-card')?.getAttribute('data-event');
    let eventData;

    try {
      if (activeEvent) {
        eventData = JSON.parse(activeEvent);
      }
    } catch (e) {
      console.error('Failed to parse event data:', e);
    }

    // Use the RTK Query mutation instead of direct fetch
    saveEvent({
      id,
      event: eventData // Pass the event data for optimistic updates
    }).catch(e => {
      console.error('Failed to save event:', e);
    });

    // Still fetch the count in the background
    const updateCount = async () => {
      try {
        const locationParam = typeof searchLocation === 'string'
          ? searchLocation
          : `${searchLocation.coordinates[0]},${searchLocation.coordinates[1]}`;

        const countResponse = await fetch(
          `${baseApiURL}/events/unread-count?location=${locationParam}&maxDaysOld=${maxDaysOld}`,
          {
            headers: { "x-user-id": getUserId() },
          },
        );
        // We don't need to use the data here as we're just refreshing the count in the background
        await countResponse.json();
      } catch (e) {
        console.log(e);
      }
    };
    updateCount();
  };


  return (
    <EventsCounterContext.Provider
      value={{ count, archiveAndUpdateCount, saveAndUpdateCount }}
    >
      {children}
    </EventsCounterContext.Provider>
  );
};

export const useEventsCounterContext = () => {
  const context = useContext(EventsCounterContext);
  if (context === undefined) {
    throw new Error("useEventsCounterContext must be used within a CounterProvider");
  }
  return context;
};
