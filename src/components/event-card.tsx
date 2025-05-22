import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import  Link  from "next/link";

export interface EventCardProps {
  id: string;
  title: string;
  date: string;
  location: string;
  imageUrl: string;
  price?: string;
  distance?: string;
  tags?: string[];
  className?: string;
  style?: React.CSSProperties;
  isPreview?: boolean;
  isSwipeMode?: boolean;
}

export default function EventCard({
  id,
  title,
  date,
  location,
  imageUrl,
  price,
  distance,
  tags = [],
  className,
  style,
  isPreview = false,
  isSwipeMode = false
}: EventCardProps) {
  const cardContent = (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl shadow-lg transition-transform",
        isPreview ? "h-full w-full" : "h-[200px] w-full", // Reduced height for more horizontal banner look
        className
      )}
      style={style}
    >
      {isSwipeMode ? (
        // Full-bleed image with top meta for swipe mode
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80 z-10" />
      ) : (
        // Standard gradient for list view
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30 z-10" />
      )}

      <img
        src={imageUrl}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {isSwipeMode ? (
        // Top meta layout for swipe mode
        <div className="absolute inset-x-0 top-0 z-20 p-4 text-white">
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium bg-black/40 px-2 py-1 rounded-md">
              {date}
            </span>
            <div className="flex gap-2">
              {price && (
                <Badge
                  variant="outline"
                  className="bg-black/50 text-white border-white/20"
                >
                  {price}
                </Badge>
              )}
              {distance && (
                <Badge
                  variant="outline"
                  className="bg-black/50 text-white border-white/20"
                >
                  {distance}
                </Badge>
              )}
            </div>
          </div>

          <h3 className="text-2xl font-bold leading-tight mt-auto absolute bottom-16 left-4 right-4">
            <Link href={`/event/${id}`} className="block">
              {title}
            </Link>
          </h3>
          <p className="text-sm opacity-90 absolute bottom-8 left-4 right-4">
            {location}
          </p>

          <div className="flex flex-wrap gap-2 absolute bottom-4 left-4 right-4">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="bg-black/50 text-white border-white/20"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      ) : (
        // Standard layout for list view
        <div className="absolute inset-x-0 bottom-0 z-20 p-4 text-white">
          <h3 className="text-xl font-bold leading-tight">{title}</h3>
          <p className="mt-1 text-sm opacity-90">{date}</p>
          <p className="text-sm opacity-90">{location}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {price && (
              <Badge
                variant="outline"
                className="bg-black/50 text-white border-white/20"
              >
                {price}
              </Badge>
            )}

            {distance && (
              <Badge
                variant="outline"
                className="bg-black/50 text-white border-white/20"
              >
                {distance}
              </Badge>
            )}

            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="bg-black/50 text-white border-white/20"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
  
  if (isPreview) {
    return cardContent;
  }
  
  return (
    <Link href={`/event/${id}`} className="block">
      {cardContent}
    </Link>
  )
}
