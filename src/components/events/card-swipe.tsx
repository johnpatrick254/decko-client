import { useState, useRef } from "react";
import { motion, PanInfo, useAnimation } from "framer-motion";
import { CheckIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import EventCard, { EventCardProps } from "../event-card";

interface CardSwipeProps {
  events: EventCardProps[];
  onComplete: () => void;
  onSave: (event: EventCardProps) => void;
  onSkip: (event: EventCardProps) => void;
  className?: string;
}

export default function CardSwipe({
  events,
  onComplete,
  onSave,
  onSkip,
  className,
}: CardSwipeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(
    null
  );
  const controls = useAnimation();
  const constraintsRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = async (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    const threshold = 100;

    if (info.offset.x > threshold) {
      // Swiped right - save
      setExitDirection("right");
      await controls.start({ x: "100%", opacity: 0, rotate: 5 });
      handleSave();
    } else if (info.offset.x < -threshold) {
      // Swiped left - skip
      setExitDirection("left");
      await controls.start({ x: "-100%", opacity: 0, rotate: -5 });
      handleSkip();
    } else {
      // Return to center if not swiped far enough
      controls.start({ x: 0, opacity: 1, rotate: 0 });
    }
  };

  const handleSave = () => {
    if (currentIndex < events.length) {
      onSave(events[currentIndex]);
      nextCard();
    }
  };

  const handleSkip = () => {
    if (currentIndex < events.length) {
      onSkip(events[currentIndex]);
      nextCard();
    }
  };

  const nextCard = () => {
    if (currentIndex === events.length - 1) {
      onComplete();
    } else {
      setCurrentIndex(currentIndex + 1);
      setExitDirection(null);
      controls.set({ x: 0, opacity: 1, rotate: 0 });
    }
  };

  // If no events or all events have been swiped
  if (events.length === 0 || currentIndex >= events.length) {
    return (
      <div className={cn("flex h-full items-center justify-center", className)}>
        <p className="text-center text-lg font-medium text-gray-500 dark:text-gray-400">
          No more events to show
        </p>
      </div>
    );
  }

  const currentEvent = events[currentIndex];
  const nextEvent =
    currentIndex + 1 < events.length ? events[currentIndex + 1] : null;

  return (
    <div
      className={cn("relative w-28 aspect-[7/9] overflow-hidden", className)}
      ref={constraintsRef}
    >
      {/* Next card (shown behind current) */}
      {nextEvent && (
        <div
          className="absolute inset-0 scale-[0.95] opacity-70"
          style={{ zIndex: 1 }}
        >
          <EventCard {...nextEvent} isSwipeMode={true} isPreview={true} />
        </div>
      )}

      {/* Current card (swipeable) */}
      <motion.div
        drag="x"
        dragConstraints={constraintsRef}
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={{ x: 0, opacity: 1, rotate: 0 }}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ zIndex: 10 }}
      >
        <EventCard {...currentEvent} isSwipeMode={true} isPreview={true} />

        {/* Save indicator */}
        <motion.div
          className="absolute right-6 top-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: exitDirection === "right" ? 1 : 0,
            scale: exitDirection === "right" ? 1 : 0.8,
          }}
        >
          <CheckIcon className="h-8 w-8" />
        </motion.div>

        {/* Skip indicator */}
        <motion.div
          className="absolute left-6 top-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: exitDirection === "left" ? 1 : 0,
            scale: exitDirection === "left" ? 1 : 0.8,
          }}
        >
          <XIcon className="h-8 w-8" />
        </motion.div>
      </motion.div>

      {/* Progress indicator */}
      <div className="absolute bottom-24 left-0 right-0 z-20 flex justify-center">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium text-white">
            {currentIndex + 1} of {events.length}
          </span>
        </div>
      </div>
    </div>
  );
}
