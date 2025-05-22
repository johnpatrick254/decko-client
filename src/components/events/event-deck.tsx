import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export interface EventDeckProps {
  id: string;
  title: string;
  coverImage: string;
  isCompleted?: boolean;
  className?: string;
  onSelect?: (deckId: string) => void;
}

export default function EventDeck({
  id,
  title,
  coverImage,
  isCompleted = false,
  className,
}: EventDeckProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Navigation is handled by Link component

  const deckContent = (
    <div
      className={cn(
        "relative transition-all duration-300",
        isCompleted ? "opacity-60" : "hover:scale-105",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Card Stack */}
      <div className="relative w-28 aspect-[7/9]">
        {/* Background Cards (Stack Effect) */}
        {[...Array(3)].map((_, index) => (
          <div
            key={`card-bg-${index}`}
            className={cn(
              "absolute rounded-lg border border-gray-300 bg-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-800",
              isCompleted ? "grayscale" : ""
            )}
            style={{
              width: "100%",
              height: "100%",
              transform: `rotate(${(index - 1) * 2}deg) translateY(${index * 2}px)`,
              zIndex: 10 - index,
              transition: "transform 0.3s ease",
              opacity: 0.9 - index * 0.15,
            }}
          />
        ))}

        {/* Cover Card */}
        <div
          className={cn(
            "absolute inset-0 overflow-hidden rounded-lg shadow-md transition-transform",
            isHovered ? "translate-y-[-5px]" : "",
            isCompleted ? "grayscale" : ""
          )}
          style={{
            zIndex: 20,
            transform: `rotate(${isHovered ? 0 : -2}deg)`,
            transition: "all 0.3s ease",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30" />

          <img
            src={coverImage}
            alt={title}
            className="h-full w-full object-cover"
          />

          {/* Title on Card */}
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <p className="text-sm font-medium">{title}</p>
          </div>

          {/* Completed Indicator */}
          {isCompleted && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-900">
                Completed
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  return (
    <Link href={`/deck/${id}`} className="block">
      {deckContent}
    </Link>
  )
}
