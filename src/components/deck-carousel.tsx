import { useRef } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EventDeckProps } from "./event-deck";
import EventDeck from "./events/event-deck";

interface DeckCarouselProps {
  decks: EventDeckProps[];
  className?: string;
  onSelectDeck?: (deckId: string) => void;
}

export default function DeckCarousel({
  decks,
  className,
  onSelectDeck,
}: DeckCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -136, // card width (112px) + gap (24px)
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 136, // card width (112px) + gap (24px)
        behavior: "smooth",
      });
    }
  };

  // Sort decks to show completed ones at the end
  const sortedDecks = [...decks].sort((a, b) => {
    if (a.isCompleted === b.isCompleted) return 0;
    return a.isCompleted ? 1 : -1;
  });

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="z-50 absolute left-0 h-8 w-8 rounded-full bg-white/80 shadow-md dark:bg-gray-900/80"
          onClick={scrollLeft}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>

        <div
          ref={scrollContainerRef}
          className="px-4 md:px-6 flex w-full gap-6 overflow-x-auto pb-4 pt-2 scrollbar-hide"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {sortedDecks.map((deck) => (
            <EventDeck
              key={deck.id}
              {...deck}
              onSelect={onSelectDeck}
              className="flex-shrink-0"
            />
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="z-50 absolute right-0 h-8 w-8 rounded-full bg-white/80 shadow-md dark:bg-gray-900/80"
          onClick={scrollRight}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
