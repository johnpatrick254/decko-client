'use client'
import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useGetHistoryEventsQuery } from '@/store/services/events.api';
import { Event } from '@/store/services/events.api';
import { Building2, Ellipsis, MusicIcon, RefreshCw, SparklesIcon, TagIcon, TheaterIcon, TrophyIcon, UsersIcon, UtensilsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SavedEventCard from './savedeventcard';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { calculateDistance } from '@/lib/geolocation';
import { SavedEventCardSkeleton } from './savedeventcardskeleton';

type Category = "Corporate" | "Sports" | "Music" | "Arts & Entertainment" | "Food & Drink" | "Festival" | "Family" | "Other";

const EmptyState = ({ selectedFilters }: { selectedFilters: Category[] }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center mx-auto">
    <h3 className="text-xl font-semibold mb-2">
      {selectedFilters.length === 0 ? "No history yet" : `No events found`}
    </h3>
    <p className="text-muted-foreground mb-6 max-w-md">
      {selectedFilters.length === 0
        ? "Start swiping through events to build your history. All events you've seen will appear here."
        : `Try selecting different categories or clear the filters to see all events.`
      }
    </p>
  </div>
);

export const SavePageContent = () => {
  const [page, setPage] = useState(1);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Category[]>([]);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  // Refs for infinite scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);

  // Build the query parameters based on selected filters
  const queryParams = {
    page: page.toString(),
    pageSize: '20',
    ...(selectedFilters.length > 0 && {
      categories: selectedFilters
    })
  };

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error
  } = useGetHistoryEventsQuery(queryParams);

  const filters = [
    {
      name: "All",
      icon: <Ellipsis className="h-3 w-3" />,
    },
    {
      name: "Corporate",
      icon: <Building2 className="h-3 w-3" />,
    },
    {
      name: "Music",
      icon: <MusicIcon className="h-3 w-3" />,
    },
    {
      name: "Sports",
      icon: <TrophyIcon className="h-3 w-3" />,
    },
    {
      name: "Arts & Entertainment",
      icon: <TheaterIcon className="h-3 w-3" />,
    },
    {
      name: "Food & Drink",
      icon: <UtensilsIcon className="h-3 w-3" />,
    },
    {
      name: "Festival",
      icon: <SparklesIcon className="h-3 w-3" />,
    },
    {
      name: "Family",
      icon: <UsersIcon className="h-3 w-3" />,
    },
    {
      name: "Other",
      icon: <TagIcon className="h-3 w-3" />,
    },
  ];

  // Handle new data from API
  useEffect(() => {
    if (data?.events) {

      if (page === 1) {
        // First page - replace all events
        setAllEvents(data.events);
      } else {
        // Subsequent pages - append new events
        setAllEvents(prev => {
          const existingIds = new Set(prev.map(event => event.id));
          const newEvents = data.events.filter(event => !existingIds.has(event.id));
          return [...prev, ...newEvents];
        });
      }

      // Check if we've reached the end
      setHasReachedEnd(!data.pagination.hasMore);
      setIsLoadingMore(false);
    }
  }, [data, page]);

  // Intersection Observer for infinite scroll
  const loadMoreCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (
        entry.isIntersecting &&
        !isFetching &&
        !isLoading &&
        !isLoadingMore &&
        !hasReachedEnd &&
        data?.pagination.hasMore
      ) {
        console.log('Loading more events...');
        setIsLoadingMore(true);
        setPage(prevPage => {
          const nextPage = prevPage + 1;
          console.log('Setting page to:', nextPage);
          return nextPage;
        });
      }
    },
    [isFetching, isLoading, isLoadingMore, data?.pagination.hasMore, hasReachedEnd, selectedFilters]
  );

  // Set up intersection observer
  useEffect(() => {
    // Clean up existing observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const observer = new IntersectionObserver(loadMoreCallback, {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
    });

    observerRef.current = observer;

    if (loadMoreTriggerRef.current) {
      observer.observe(loadMoreTriggerRef.current);
      console.log('Observer attached to trigger element');
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreCallback]);

  // Handle filter selection (toggle behavior)
  const handleFilterClick = (filterName: string) => {
    if (filterName === "All") {
      // Clear all filters
      if (selectedFilters.length > 0) {
        console.log('Clearing all filters');
        setSelectedFilters([]);
        resetPagination();
      }
    } else {
      const category = filterName as Category;
      setSelectedFilters(prev => {
        const isSelected = prev.includes(category);
        let newFilters: Category[];

        if (isSelected) {
          // Remove the filter
          newFilters = prev.filter(f => f !== category);
          console.log('Removing filter:', category);
        } else {
          // Add the filter
          newFilters = [...prev, category];
          console.log('Adding filter:', category);
        }

        console.log('New filters:', newFilters);
        resetPagination();
        return newFilters;
      });
    }
  };

  // Helper function to reset pagination
  const resetPagination = () => {
    setPage(1);
    setAllEvents([]);
    setHasReachedEnd(false);
    setIsLoadingMore(false);
  };

  // Reset function
  const resetToFirstPage = () => {
    resetPagination();
  };

  // Clear all filters function
  const clearAllFilters = () => {
    if (selectedFilters.length > 0) {
      setSelectedFilters([]);
      resetPagination();
    }
  };

  return (
    <div className="flex flex-col items-start space-y-4 justify-start w-full h-full">
      <div className="max-w-4xl px-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">My Events</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 pb-3 px-4">
        {/* "All" filter button */}
        <Badge
          variant={selectedFilters.length === 0 ? "default" : "outline"}
          className={cn(
            "cursor-pointer flex items-center gap-1 transition-colors hover:bg-primary/80",
            selectedFilters.length === 0 && "bg-primary text-primary-foreground"
          )}
          onClick={() => handleFilterClick("All")}
        >
          <TagIcon className="h-3 w-3" />
          All
        </Badge>

        {/* Category filter buttons */}
        {filters.slice(1).map((filter) => {
          const isSelected = selectedFilters.includes(filter.name as Category);
          return (
            <Badge
              key={filter.name}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer flex items-center gap-1 transition-colors hover:bg-primary/80 relative",
                isSelected && "bg-primary text-primary-foreground"
              )}
              onClick={() => handleFilterClick(filter.name)}
            >
              {filter.icon}
              {filter.name}
              {isSelected && (
                <span className="ml-1 text-xs opacity-75">✕</span>
              )}
            </Badge>
          );
        })}

        {/* Clear all filters button when filters are active */}
        {selectedFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 px-2 text-xs"
            disabled={isLoading}
          >
            Clear all ({selectedFilters.length})
          </Button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-col w-full gap-6 pb-8 px-2">
        {/* Show empty state if no events and not loading */}
        {!isLoading && !isFetching && allEvents.length === 0 ? (        
          <EmptyState selectedFilters={selectedFilters} />
        ) : (
          <>
            {/* Show skeleton while loading first page */}
              {(isLoading || isFetching) && page === 1 ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, index) => (
                  <SavedEventCardSkeleton key={`skeleton-${index}`} />
                ))}
                <div className="flex justify-center items-center py-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              </div>
            ) : (
              // Render actual events
              allEvents.map(event => {
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
                  <SavedEventCard
                    key={event.id}
                    id={event.id}
                    date={event.eventstartdatetime}
                    imageUrl={event.imageUrl}
                    location={event.eventvenuename}
                    title={event.eventname}
                    distance={distanceInMiles ? `${distanceInMiles} miles` : null}
                    tags={event.metadata.eventTags.Categories}
                  />
                );
              })
            )}

            {/* Loading indicator for infinite scroll */}
            {(isFetching || isLoadingMore) && page > 1 && (
              <div className="py-4 w-full flex justify-center">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Loading more {selectedFilters.length > 0 ? `${selectedFilters.join(', ')} ` : ''}events...
                  </span>
                </div>
              </div>
            )}

            {/* Error message */}
            {isError && (
              <div className="py-4 text-center">
                <div className="text-red-500 mb-2">
                  Error loading events. Please try again.
                  {process.env.NODE_ENV === 'development' && error && (
                    <details className="mt-2 text-xs">
                      <summary>Error details</summary>
                      <pre className="text-left mt-1">{JSON.stringify(error, null, 2)}</pre>
                    </details>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={resetToFirstPage}
                  className="text-sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            )}

            {/* Load more trigger element - positioned at the end of the list */}
            <div
              ref={loadMoreTriggerRef}
              className="h-10 w-full flex items-center justify-center"
              style={{ minHeight: '40px' }}
            >
              {/* Show "No more events" message when there are no more pages */}
              {hasReachedEnd && allEvents.length > 0 && !isLoading && (
                <p className="text-sm text-muted-foreground">
                  {selectedFilters.length === 0
                    ? "No more events to load"
                    : `No more events matching selected filters`
                  }
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const SavedEvents = () => {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center h-full">
          <div className="flex flex-col gap-4 items-center pb-36 px-4">
            {Array(5).fill(0).map((_, index) => (
              <SavedEventCardSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        </div>
      }
    >
      <SavePageContent />
    </Suspense>
  );
};