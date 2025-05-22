
import { api } from "../api";

type Category = "Corporate" | "Sports" | "Music" | "Arts & Entertainment" | "Food & Drink"| "Festival" | "Family" | "Other"
export type Event = {
  id: number;
  eventname: string;
  eventvenuename: string;
  eventdescription: string;
  eventstartdatetime: string;
  imageUrl: string;
  geolocation:string[];
  imagedata: { selectedImg: string, alts: { choice: number, imgUrl: string }[] };
  metadata: { eventTags: { Categories: Category[]}, url: string, eventLongDescription: string, google_calendar_url: string, soldOut: boolean, address: string, price: string | null };
  createdat: string;
  attending?: boolean;
  saved?: boolean;
}

type GetEventsResponse = {
  events: Event[];
  pagination: {
    page: number,
    pageSize: number,
    totalEvents: number,
    totalPages: number,
    hasMore: boolean
  },
  appliedFilters?: {
    categories: Category[],
    invalidFilters: string[]
  }
}

// Location type that includes both display name and coordinates
export interface LocationData {
  displayName: string;
  coordinates: [number, number]; // [longitude, latitude]
}

// Type for backward compatibility
export type SEARCH_LOCATIONS = string | LocationData;

// Default locations with approximate coordinates
export const DEFAULT_LOCATIONS: Record<string, LocationData> = {
  FORT_LAUDERDALE: { displayName: "Fort Lauderdale", coordinates: [-80.1373174, 26.1224386] },
  NAIROBI: { displayName: "Nairobi", coordinates: [36.8219462, -1.2920659] },
  PARK_CITY: { displayName: "Park City", coordinates: [-111.4979729, 40.6460622] },
  WEST_PALM_BEACH: { displayName: "West Palm Beach", coordinates: [-80.0533746, 26.7153424] },
  DENVER: { displayName: "Denver", coordinates: [-104.9903, 39.7392] },
  MIAMI_BEACH: { displayName: "Miami Beach", coordinates: [-80.1300455, 25.790654] },
  SAN_FRANCISCO: { displayName: "San Francisco", coordinates: [-122.4194155, 37.7749295] },
  NEW_YORK: { displayName: "New York", coordinates: [-74.0059728, 40.7127753] }
}
export type getBatchEventsResponse = Event[];
export const eventApi = api.enhanceEndpoints({ addTagTypes: ['EVENTS'] }).injectEndpoints({
  endpoints: (builder) => ({
    getUnreadEventCount: builder.query<{ count: number }, { location: SEARCH_LOCATIONS, maxDaysOld?: number }>({
      query: ({ location, maxDaysOld }) => {
        // Handle both string and LocationData
        const locationParam = typeof location === 'string'
          ? location
          : `${location.coordinates[0]},${location.coordinates[1]}`;

        let url = `/events/unread-count?location=${locationParam}`;
        if (maxDaysOld !== undefined) {
          url += `&maxDaysOld=${maxDaysOld}`;
        }

        return url;
      },
    }),

    saveEvent: builder.mutation<Event, { id: number, event?: Event }>({
      query: ({ id }) => ({
        url: 'events/save',
        method: 'POST',
        body: { id },
      }),
      async onQueryStarted({ id, event }, { dispatch, queryFulfilled, getState }) {
        // Get the current state to find all active getSavedEvents queries
        const state = getState() as { api: { queries: Record<string, any> } };
        const savedEventsPatches: { undo: () => void }[] = [];

        // If we have the event data, we can optimistically add it to the saved events queries
        if (event) {
          // Update all active getSavedEvents queries
          Object.entries(state.api.queries).forEach(([queryKey, queryData]) => {
            if (queryKey.startsWith('getSavedEvents')) {
              const patch = dispatch(
                eventApi.util.updateQueryData(
                  'getSavedEvents',
                  queryData.originalArgs,
                  (draft) => {
                    // Check if the event is already in the list
                    const eventExists = draft.events.some(e => e.id === id);

                    // Only add the event if it doesn't already exist
                    if (!eventExists) {
                      // Add the event to the beginning of the list
                      draft.events.unshift({
                        ...event,
                        // Make sure it's marked as saved
                        saved: true
                      });
                    }
                  }
                )
              );
              savedEventsPatches.push(patch);
            }
          });
        }

        try {
          // Wait for the actual API call to complete
          await queryFulfilled;
        } catch {
          // If the API call fails, undo all optimistic updates
          savedEventsPatches.forEach(patch => patch.undo());
        }
      },
      invalidatesTags: ['EVENTS']
    }),

    getEventById: builder.query<Event, { id: number }>({
      query: ({ id }) => `/event/${id}`,
    }),

    getBatchEventsWithFilter: builder.query<Event[], { limit: number, location: SEARCH_LOCATIONS, maxDaysOld?: number }>({
      query: ({ limit, location, maxDaysOld }) => {
        // Handle both string and LocationData
        const locationParam = typeof location === 'string'
          ? location
          : location.coordinates.join(',');

        const params: { limit: number, location: string, maxDaysOld?: number } = {
          limit,
          location: locationParam
        };

        if (maxDaysOld !== undefined) {
          params.maxDaysOld = maxDaysOld;
        }

        return {
          url: 'events/batch',
          params,
        };
      }
    }),

    getRandomEventWithFilter: builder.query<Event, { location: SEARCH_LOCATIONS, maxDaysOld?: number }>({
      query: ({ location, maxDaysOld }) => {
        // Handle both string and LocationData
        const locationParam = typeof location === 'string'
          ? location
          : location.coordinates.join(',');

        const params: { location: string, maxDaysOld?: number } = { location: locationParam };

        if (maxDaysOld !== undefined) {
          params.maxDaysOld = maxDaysOld;
        }

        return {
          url: 'events/random',
          params,
        };
      }
    }),
    getUserEvents: builder.query<GetEventsResponse, { page: string }>({
      query: ({ page }) => ({
        url: 'events/archived',
        params: {
          page
        },
      }),
      providesTags: ['EVENTS']
    }),

    getHistoryEvents: builder.query<GetEventsResponse, {
      page: string,
      pageSize?: string,
      categories?: Category[],
      filter?: Category | Category[], // Single category or array for flexibility
    }>({
      query: ({ page, pageSize = '20', categories, filter }) => {
        const params: Record<string, string | string[]> = {
          page,
          pageSize
        };

        const allCategories: Category[] = [];

        if (categories && categories.length > 0) {
          allCategories.push(...categories);
        }

        if (filter) {
          if (Array.isArray(filter)) {
            allCategories.push(...filter);
          } else {
            allCategories.push(filter);
          }
        }

        const uniqueCategories = [...new Set(allCategories)];

        if (uniqueCategories.length > 0) {
          params.category = uniqueCategories;
        }


        return {
          url: 'events/history',
          params,
        };
      },
      providesTags: ['EVENTS']
    }),

    getSavedEvents: builder.query<GetEventsResponse & { timeframe: { start: string, end: string, weekOffset: number }, filter: string }, { page: string, weekOffset?: number, filter?: string, pageSize?: number, timeframe?: string }>({
      query: ({ page, weekOffset = 0, filter = 'all', pageSize = 20, timeframe = 'this-week' }) => {
        // Calculate the appropriate weekOffset based on timeframe if provided
        let calculatedWeekOffset = weekOffset;
        let calculatedPageSize = pageSize;

        if (timeframe) {
          switch (timeframe) {
            case 'today':
              calculatedWeekOffset = 0;
              calculatedPageSize = 10;
              break;
            case 'this-week':
              calculatedWeekOffset = 0;
              calculatedPageSize = 20;
              break;
            case 'next-week':
              calculatedWeekOffset = 1;
              calculatedPageSize = 20;
              break;
            case 'this-month':
              // For month view, the weekOffset is handled in the component
              // by making multiple queries with different offsets
              calculatedPageSize = 20;
              break;
            default:
              calculatedWeekOffset = 0;
              calculatedPageSize = 20;
          }
        }

        return ({
          url: 'events/saved',
          params: {
            page,
            weekOffset: calculatedWeekOffset,
            filter,
            pageSize: calculatedPageSize,
            timeframe
          },
        });
      },
      providesTags: ['EVENTS']
    }),

    attendEvent: builder.mutation<{ success: boolean, attending: boolean }, { id: number }>({
      query: ({ id }) => ({
        url: `events/attending/${id}`,
        method: 'POST',
      }),
      async onQueryStarted({ id }, { dispatch, queryFulfilled, getState }) {
        const patchResult = dispatch(
          eventApi.util.updateQueryData('getAttendingStatus', { id }, (draft) => {
            if (draft) {
              draft.attending = !draft.attending;
            }
          })
        );

        const eventPatchResult = dispatch(
          eventApi.util.updateQueryData('getEventById', { id }, (draft) => {
            if (draft) {
              draft.attending = !draft.attending;
            }
          })
        );

        const state = getState() as { api: { queries: Record<string, any> } };
        const savedEventsPatches: { undo: () => void }[] = [];

        Object.entries(state.api.queries).forEach(([queryKey, queryData]) => {
          if (queryKey.startsWith('getSavedEvents')) {
            const patch = dispatch(
              eventApi.util.updateQueryData(
                'getSavedEvents',
                queryData.originalArgs,
                (draft) => {
                  const eventToUpdate = draft.events.find(event => event.id === id);
                  if (eventToUpdate) {
                    eventToUpdate.attending = !eventToUpdate.attending;
                  }
                }
              )
            );
            savedEventsPatches.push(patch);
          }
        });

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
          eventPatchResult.undo();
          savedEventsPatches.forEach(patch => patch.undo());
        }
      },
      invalidatesTags: ['EVENTS']
    }),

    getAttendingStatus: builder.query<{ success: boolean, attending: boolean }, { id: number }>({
      query: ({ id }) => `events/attending/${id}`,
      providesTags: ['EVENTS']
    }),

    shareEvent: builder.mutation<{ success: boolean }, { id: number }>({
      query: ({ id }) => ({
        url: `events/share`,
        method: 'POST',
        body: { id }
      }),
    }),
    registerEventOpen: builder.mutation<{ success: boolean }, { id: number }>({
      query: ({ id }) => ({
        url: `events/opened`,
        method: 'POST',
        body: { id }
      }),
    }),
  })
});

export const {
  useGetUnreadEventCountQuery,
  useGetUserEventsQuery,
  useGetSavedEventsQuery,
  useGetHistoryEventsQuery,
  useSaveEventMutation,
  useGetEventByIdQuery,
  useLazyGetBatchEventsWithFilterQuery,
  useLazyGetRandomEventWithFilterQuery,
  useLazyGetEventByIdQuery,
  useAttendEventMutation,
  useGetAttendingStatusQuery,
  useLazyGetAttendingStatusQuery,
  useShareEventMutation,
  useRegisterEventOpenMutation
} = eventApi;
