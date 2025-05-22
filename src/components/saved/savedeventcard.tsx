import { Badge } from "@/components/ui/badge";
import { cn, extractDateFromISOWithFallback, formatDateParts, formatTimeWithTimezone } from "@/lib/utils";
import Link from "next/link";
import fallbackImage from "../../../public/Image-folder.jpg"

export interface EventCardProps {
    id: number;
    title: string;
    date: string;
    location: string;
    imageUrl: string;
    price?: string;
    distance?: string | null;
    tags?: string[];
    className?: string;
    style?: React.CSSProperties;
}

export default function SavedEventCard({
    id,
    title,
    date,
    location,
    imageUrl,
    price,
    distance,
    tags = []
}: EventCardProps) {
    const placeHolder = 'https://placehold.co/600x400/png?text=Image+Processing+Failed';
    const day = extractDateFromISOWithFallback(date)
    const cardContent = (
        <div
            className={cn(
                "relative overflow-hidden rounded-xl shadow-lg transition-transform h-[200px] w-full bg-amber-800",
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30 z-10" />
            <img
                src={imageUrl == placeHolder ?fallbackImage.src :imageUrl }
                alt={title}
                className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute space-y-1.5 inset-x-0 bottom-0 z-20 p-4 text-white">
                <h3 className="text-xl font-bold leading-tight">{title}</h3>
                <p className="mt-1 text-sm opacity-90">{day} { formatTimeWithTimezone(date)}</p>
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
                    {tags.map((tag) => {
                        return <Badge
                            key={tag}
                            variant="outline"
                            className="bg-black/50 text-white border-white/20"
                        >
                            {tag}
                        </Badge>
})}
                </div>
            </div>
        </div>
    );

    return (
        <Link href={`/event/${id}`} className="w-full">
            {cardContent}
        </Link>
    );
}
