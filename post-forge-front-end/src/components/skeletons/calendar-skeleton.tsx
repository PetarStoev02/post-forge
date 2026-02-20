import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

type CalendarSkeletonProps = {
  view: "week" | "month"
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const timelineHours = Array.from({ length: 25 }, (_, i) => i)

// Generate random skeleton cards for each day
const getRandomCardCount = (seed: number): number => {
  // Pseudo-random based on seed to keep it consistent
  return ((seed * 7) % 4) + 1
}

const WeekViewSkeleton = () => {
  return (
    <div className="flex min-w-[900px] flex-1 border-b">
      {/* Timeline Column */}
      <div className="flex flex-col w-20 border-r bg-muted/20 shrink-0">
        <div className="h-14 border-b sticky top-0 bg-muted/20 z-10" />
        <div className="relative min-h-[1200px]">
          {timelineHours.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 flex items-start justify-end pr-3 -translate-y-2"
              style={{ top: `${(hour / 25) * 100}%` }}
            >
              <span className="text-xs text-muted-foreground font-medium">
                {hour.toString().padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Day Columns */}
      {dayNames.map((dayName, index) => {
        const cardCount = getRandomCardCount(index)
        const cardPositions = Array.from({ length: cardCount }, (_, i) => ({
          top: ((index * 3 + i * 5) % 20) + 2,
        }))

        return (
          <div key={dayName} className="group flex flex-1 flex-col border-r last:border-r-0 min-w-[140px]">
            <div className="flex h-14 flex-col items-center justify-center border-b px-2 py-1 sticky top-0 bg-background z-10">
              <span className="text-xs font-medium">{dayName}</span>
              <Skeleton className="h-6 w-6 mt-0.5" />
            </div>
            <div className="relative min-h-[1200px]">
              {timelineHours.map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t border-muted/30"
                  style={{ top: `${(hour / 25) * 100}%` }}
                />
              ))}
              {cardPositions.map((pos, cardIndex) => (
                <div
                  key={cardIndex}
                  className="absolute left-1 right-1 z-10"
                  style={{ top: `${(pos.top / 25) * 100}%` }}
                >
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const MonthViewSkeleton = () => {
  // 5 weeks × 7 days = 35 cells
  const weeks = 5
  const days = Array.from({ length: weeks * 7 }, (_, i) => i)

  return (
    <div className="flex min-w-[900px] flex-1 flex-col">
      {/* Header */}
      <div className="grid grid-cols-7 border-b">
        {dayNames.map((name) => (
          <div
            key={name}
            className="border-r px-2 py-3 text-center text-sm font-medium text-muted-foreground last:border-r-0"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        className="grid flex-1 grid-cols-7"
        style={{ gridTemplateRows: `repeat(${weeks}, minmax(0, 1fr))` }}
      >
        {days.map((dayIndex) => {
          const cardCount = getRandomCardCount(dayIndex)
          const showCards = dayIndex % 3 !== 2 // Skip some cells for variety

          return (
            <div
              key={dayIndex}
              className={cn(
                "group flex flex-1 flex-col border-b border-r p-2",
                dayIndex % 7 === 6 && "border-r-0"
              )}
            >
              <Skeleton className="mb-1 size-7 rounded-full" />
              <div className="flex flex-1 flex-col gap-1">
                {showCards &&
                  Array.from({ length: Math.min(cardCount, 3) }).map((_, cardIndex) => (
                    <Skeleton key={cardIndex} className="h-10 w-full rounded" />
                  ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const CalendarSkeleton = ({ view }: CalendarSkeletonProps) => {
  if (view === "week") {
    return <WeekViewSkeleton />
  }
  return <MonthViewSkeleton />
}

export { CalendarSkeleton }
