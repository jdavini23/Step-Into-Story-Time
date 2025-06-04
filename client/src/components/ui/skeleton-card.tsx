import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonCard() {
  return (
    <div className="border border-gray-200 rounded-lg p-6 space-y-4 animate-pulse">
      {/* Story image skeleton */}
      <Skeleton className="h-48 w-full rounded-md bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />

      {/* Title skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4 bg-gray-300" />
        <Skeleton className="h-4 w-1/2 bg-gray-200" />
      </div>

      {/* Description skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-full bg-gray-200" />
        <Skeleton className="h-3 w-5/6 bg-gray-200" />
        <Skeleton className="h-3 w-2/3 bg-gray-200" />
      </div>

      {/* Action buttons skeleton */}
      <div className="flex justify-between items-center pt-4">
        <Skeleton className="h-8 w-20 bg-gray-300" />
        <Skeleton className="h-8 w-8 rounded-full bg-gray-300" />
      </div>
    </div>
  );
}

export function SkeletonQuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-lg border p-4 space-y-3 animate-pulse"
        >
          <Skeleton className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-200 to-blue-200" />
          <Skeleton className="h-4 w-3/4 bg-gray-300" />
          <Skeleton className="h-6 w-1/2 bg-gray-200" />
        </div>
      ))}
    </div>
  );
}
