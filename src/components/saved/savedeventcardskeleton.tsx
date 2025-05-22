export const SavedEventCardSkeleton = () => (
    <div className="relative overflow-hidden rounded-xl shadow-lg h-[200px] w-full bg-amber-800 animate-pulse">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30 z-10" />

        {/* Image placeholder */}
        <div className="absolute inset-0 h-full w-full bg-gray-300" />

        {/* Content at bottom */}
        <div className="absolute inset-x-0 bottom-0 z-20 p-4">
            {/* Title skeleton */}
            <div className="h-6 bg-gray-400/60 rounded w-3/4 mb-2"></div>

            {/* Date skeleton */}
            <div className="h-4 bg-gray-400/60 rounded w-1/3 mb-1"></div>

            {/* Location skeleton */}
            <div className="h-4 bg-gray-400/60 rounded w-1/2 mb-3"></div>

            {/* Badges skeleton */}
            <div className="flex flex-wrap gap-2">
                <div className="h-6 bg-gray-400/60 rounded-full w-16"></div>
                <div className="h-6 bg-gray-400/60 rounded-full w-12"></div>
                <div className="h-6 bg-gray-400/60 rounded-full w-20"></div>
            </div>
        </div>
    </div>
  ); 