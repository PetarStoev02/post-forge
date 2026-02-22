import { PostCardSkeleton } from "./post-card-skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const PlatformPageSkeleton = () => (
  <div className="flex h-full flex-col">
    {/* Header */}
    <div className="flex items-center justify-between border-b px-6 py-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-lg" />
        <Skeleton className="h-8 w-28" />
      </div>
      <Skeleton className="h-9 w-32 rounded-md" />
    </div>

    <div className="min-h-0 flex-1 overflow-y-auto p-6">
      <div className="space-y-6">
        {/* Account Card */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardHeader>
        </Card>

        {/* Posts count */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Post Cards Grid */}
        <div className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  </div>
)

export { PlatformPageSkeleton }
