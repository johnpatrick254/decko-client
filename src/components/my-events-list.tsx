'use client'
import { useState } from "react";
import {
  CalendarIcon,
  CalendarDaysIcon,
  MusicIcon,
  UsersIcon,
  UtensilsIcon,
  TagIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import EventCard, { EventCardProps } from "./event-card";

interface MyEventsListProps {
  events: EventCardProps[];
  className?: string;
}

export default function MyEventsList({
  events,
  className,
}: MyEventsListProps) {
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const filters = [
    {
      name: "All",
      icon: <TagIcon className="h-3 w-3" />,
    },
    {
      name: "This Weekend",
      icon: <CalendarIcon className="h-3 w-3" />,
    },
    {
      name: "Next Week",
      icon: <CalendarDaysIcon className="h-3 w-3" />,
    },
    {
      name: "Music",
      icon: <MusicIcon className="h-3 w-3" />,
    },
    {
      name: "Family",
      icon: <UsersIcon className="h-3 w-3" />,
    },
    {
      name: "Food",
      icon: <UtensilsIcon className="h-3 w-3" />,
    },
  ];

  const filterColors = {
    All: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    "This Weekend":
      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    "Next Week":
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    Music: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    Family:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    Food: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  };

  const filteredEvents =
    selectedFilter && selectedFilter !== "All"
      ? events.filter((event) => {
          if (
            (selectedFilter === "This Weekend" && event.date.includes("Sat")) ||
            event.date.includes("Sun")
          ) {
            return true;
          }
          if (
            selectedFilter === "Next Week" &&
            !event.date.includes("Sat") &&
            !event.date.includes("Sun")
          ) {
            return true;
          }
          if (event.tags?.includes(selectedFilter)) {
            return true;
          }
          return false;
        })
      : events;

  const handleFilterClick = (filter: string) => {
    setSelectedFilter(filter === selectedFilter ? null : filter);
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">My Events</h2>
      </div>

      <div className="flex flex-wrap gap-2 pb-3">
        {filters.map((filter) => {
          const isSelected = selectedFilter === filter.name;
          const colorClass =
            filterColors[filter.name as keyof typeof filterColors] || "";
          return (
            <Badge
              key={filter.name}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer flex items-center gap-1",
                isSelected && colorClass
              )}
              onClick={() => handleFilterClick(filter.name)}
            >
              {filter.icon}
              {filter.name}
            </Badge>
          );
        })}
      </div>

      <div className="space-y-4">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="cursor-pointer transition-transform hover:scale-[0.99]"
            >
              <EventCard {...event} />
            </div>
          ))
        ) : (
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <p className="text-center text-gray-500">
              No events found. Try adjusting your filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
