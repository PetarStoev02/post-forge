"use client"

import * as React from "react"
import { useMutation, useQuery } from "@apollo/client/react"
import {
  DndContext,
  
  DragOverlay,
  
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from "@dnd-kit/core"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  InstagramIcon,
  LinkedinIcon,
  MoreHorizontalIcon,
  PlusIcon,
  TwitterIcon,
} from "lucide-react"
import type {DragEndEvent, DragStartEvent} from "@dnd-kit/core";

import type { Platform as APIPlatform, PostStatus as APIPostStatus, CreatePostInput, GetCalendarPostsResponse, Post } from "@/types/post"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { useCreatePost } from "@/contexts/create-post-context"
import { usePostActions } from "@/contexts/post-actions-context"
import { useCalendarStore } from "@/stores/calendar-store"
import { CREATE_POST, GET_CALENDAR_POSTS, UPDATE_POST } from "@/graphql/operations/posts"
import { LoadingIndicator } from "@/components/ui/loading-indicator"
import { CalendarSkeleton } from "@/components/skeletons"

type UpdatePostResponse = {
  updatePost: Post
}

type Platform = "twitter" | "instagram" | "linkedin"
type PostStatus = "draft" | "scheduled" | "pending" | "published" | "cancelled" | "failed"

type CalendarPost = {
  id: string
  platforms: Array<Platform>
  time: string
  content: string
  status: PostStatus
  fullPost: Post
}

type DayData = {
  date: Date
  dayNumber: number
  isToday: boolean
  isCurrentMonth: boolean
  posts: Array<CalendarPost>
}

type DroppableData = {
  date: Date
  type: "week" | "month"
}

type PostCardProps = {
  post: CalendarPost
  compact?: boolean
  onDuplicate?: () => void
  isDragOverlay?: boolean
}

type DraggablePostCardProps = {
  post: CalendarPost
  compact?: boolean
  onDuplicate?: () => void
  isHidden?: boolean
}

type WeekDayColumnProps = {
  day: DayData
  dayName: string
  onAddPost: (date: Date) => void
  onDuplicate: (post: Post) => void
  onMouseMove?: (e: React.MouseEvent) => void
  draggingPostId?: string | null
}

type MonthDayCellProps = {
  day: DayData
  onAddPost: (date: Date) => void
  onDuplicate: (post: Post) => void
  draggingPostId?: string | null
}

const platformIcons: Record<Platform, React.ComponentType<{ className?: string }>> = {
  twitter: TwitterIcon,
  instagram: InstagramIcon,
  linkedin: LinkedinIcon,
}

const platformColors: Record<Platform, string> = {
  twitter: "text-[#000000]",
  instagram: "text-[#E4405F]",
  linkedin: "text-[#0A66C2]",
}

const statusStyles: Record<PostStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-700 border-slate-200" },
  scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700 border-blue-200" },
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  published: { label: "Published", className: "bg-green-100 text-green-700 border-green-200" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-500 border-gray-200" },
  failed: { label: "Failed", className: "bg-red-100 text-red-700 border-red-200" },
}

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const timelineHours = Array.from({ length: 25 }, (_, i) => i)

const calculateScheduledAtFromDrop = (
  dropY: number,
  containerTop: number,
  containerHeight: number,
  targetDate: Date
): string => {
  const relativeY = dropY - containerTop
  const percentage = Math.max(0, Math.min(relativeY / containerHeight, 1))
  const totalMinutes = Math.round(percentage * 24 * 60)
  const roundedMinutes = Math.round(totalMinutes / 15) * 15
  const hours = Math.floor(roundedMinutes / 60)
  const minutes = roundedMinutes % 60

  const year = targetDate.getFullYear()
  const month = String(targetDate.getMonth() + 1).padStart(2, "0")
  const day = String(targetDate.getDate()).padStart(2, "0")
  const hourStr = String(Math.min(hours, 23)).padStart(2, "0")
  const minStr = String(minutes % 60).padStart(2, "0")

  return `${year}-${month}-${day} ${hourStr}:${minStr}:00`
}

const formatDateKey = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatTime = (dateString: string): string => {
  const normalizedDate = dateString.replace(" ", "T")
  const date = new Date(normalizedDate)
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${hours}:${minutes}`
}

const formatMonth = (date: Date): string => {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

const transformPlatform = (platform: APIPlatform): Platform => platform.toLowerCase() as Platform

const transformStatus = (status: APIPostStatus): PostStatus => status.toLowerCase() as PostStatus

const getHourFromTime = (timeString: string | null | undefined): number => {
  if (!timeString) return 8
  const normalizedDate = timeString.replace(" ", "T")
  const date = new Date(normalizedDate)
  return date.getHours() + date.getMinutes() / 60
}

const getWeekDays = (date: Date, postsMap: Record<string, Array<CalendarPost>>): Array<DayData> => {
  const today = new Date()
  const startOfWeek = new Date(date)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())

  return Array.from({ length: 7 }, (_, i) => {
    const currentDate = new Date(startOfWeek)
    currentDate.setDate(startOfWeek.getDate() + i)
    const dateKey = formatDateKey(currentDate)

    return {
      date: currentDate,
      dayNumber: currentDate.getDate(),
      isToday:
        currentDate.getDate() === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear(),
      isCurrentMonth: currentDate.getMonth() === date.getMonth(),
      posts: postsMap[dateKey] || [],
    }
  })
}

const getMonthDays = (date: Date, postsMap: Record<string, Array<CalendarPost>>): Array<DayData> => {
  const today = new Date()
  const year = date.getFullYear()
  const month = date.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  const endDate = new Date(lastDay)
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()))

  const days: Array<DayData> = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dateKey = formatDateKey(currentDate)

    days.push({
      date: new Date(currentDate),
      dayNumber: currentDate.getDate(),
      isToday:
        currentDate.getDate() === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear(),
      isCurrentMonth: currentDate.getMonth() === month,
      posts: postsMap[dateKey] || [],
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return days
}

const PostCard = ({ post, compact = false, onDuplicate, isDragOverlay = false }: PostCardProps) => {
  const { openPost, editPost, reschedulePost, deletePost } = usePostActions()
  const statusStyle = statusStyles[post.status]

  if (compact) {
    return (
      <div
        className={cn(
          "flex w-full flex-col gap-0.5 rounded border bg-card px-2 py-1.5 text-xs text-left transition-colors",
          !isDragOverlay && "hover:bg-muted/50"
        )}
      >
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            {post.platforms.map((platform) => {
              const Icon = platformIcons[platform]
              return <Icon key={platform} className={cn("size-3", platformColors[platform])} />
            })}
          </div>
          <span className="text-muted-foreground">{post.time}</span>
        </div>
        <span className="line-clamp-2 text-[11px] leading-tight">{post.content}</span>
      </div>
    )
  }

  return (
    <div className={cn("rounded-lg border bg-card p-2.5 shadow-sm", isDragOverlay && "shadow-lg")}>
      <div className="mb-1.5 flex items-start justify-between gap-1">
        <button
          onClick={() => !isDragOverlay && openPost(post.fullPost)}
          className="flex items-center gap-1.5 hover:opacity-70 transition-opacity min-w-0"
        >
          <div className="flex items-center gap-1 shrink-0">
            {post.platforms.map((platform) => {
              const Icon = platformIcons[platform]
              return <Icon key={platform} className={cn("size-3.5", platformColors[platform])} />
            })}
          </div>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap">{post.time}</span>
        </button>
        {!isDragOverlay && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-5 shrink-0">
                <MoreHorizontalIcon className="size-3" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => editPost(post.fullPost)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>Duplicate</DropdownMenuItem>
              <DropdownMenuItem onClick={() => reschedulePost(post.fullPost)}>Reschedule</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => deletePost(post.fullPost)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <button
        onClick={() => !isDragOverlay && openPost(post.fullPost)}
        className="mb-1.5 text-xs text-left w-full hover:opacity-70 transition-opacity break-words line-clamp-4"
      >
        {post.content}
      </button>
      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", statusStyle.className)}>
        {statusStyle.label}
      </Badge>
    </div>
  )
}

const DraggablePostCard = ({ post, compact = false, onDuplicate, isHidden = false }: DraggablePostCardProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: post.id,
    data: { post, sourceDate: post.fullPost.scheduledAt },
  })

  const shouldHide = isDragging || isHidden

  const style: React.CSSProperties = {
    transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
    opacity: shouldHide ? 0 : 1,
    zIndex: isDragging ? 50 : 10,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn("cursor-grab", isDragging && "cursor-grabbing")}
    >
      <PostCard post={post} compact={compact} onDuplicate={onDuplicate} />
    </div>
  )
}

const TimelineColumn = () => (
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
)

const WeekDayColumn = ({ day, dayName, onAddPost, onDuplicate, onMouseMove, draggingPostId }: WeekDayColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `week-day-${formatDateKey(day.date)}`,
    data: { date: day.date, type: "week" } as DroppableData,
  })

  return (
    <div className="group flex flex-1 flex-col border-r last:border-r-0 min-w-[140px]">
      <div
        className={cn(
          "flex h-14 flex-col items-center justify-center border-b px-2 py-1 sticky top-0 bg-background z-10",
          day.isToday && "bg-primary text-primary-foreground"
        )}
      >
        <span className="text-xs font-medium">{dayName}</span>
        <span className="text-lg font-semibold">{day.dayNumber}</span>
      </div>
      <div
        ref={setNodeRef}
        onMouseMove={onMouseMove}
        className={cn("relative min-h-[1200px] transition-colors", isOver && "bg-primary/5")}
      >
        {timelineHours.map((hour) => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-muted/30"
            style={{ top: `${(hour / 25) * 100}%` }}
          />
        ))}
        <div className="absolute left-0 right-0 border-t border-muted/30" style={{ top: "100%" }} />
        {isOver && (
          <div className="absolute inset-0 border-2 border-dashed border-primary/50 rounded-lg pointer-events-none z-30" />
        )}
        {day.posts.map((post) => {
          const hour = getHourFromTime(post.fullPost.scheduledAt)
          const topPercent = (hour / 25) * 100
          return (
            <div key={post.id} className="absolute left-1 right-1 z-10" style={{ top: `${topPercent}%` }}>
              <DraggablePostCard
                post={post}
                onDuplicate={() => onDuplicate(post.fullPost)}
                isHidden={post.id === draggingPostId}
              />
            </div>
          )
        })}
        <button
          onClick={() => onAddPost(day.date)}
          className={cn(
            "absolute bottom-2 left-1 right-1 flex h-10 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-transparent text-muted-foreground transition-all z-20",
            "opacity-0 group-hover:opacity-100 hover:border-muted-foreground/50 hover:bg-muted/50"
          )}
        >
          <PlusIcon className="size-4" />
          <span className="text-xs">Add post</span>
        </button>
      </div>
    </div>
  )
}

const MonthDayCell = ({ day, onAddPost, onDuplicate, draggingPostId }: MonthDayCellProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `month-day-${formatDateKey(day.date)}`,
    data: { date: day.date, type: "month" } as DroppableData,
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group flex flex-1 flex-col border-b border-r p-2 transition-colors",
        !day.isCurrentMonth && "bg-muted/30",
        isOver && "bg-primary/10"
      )}
    >
      <div
        className={cn(
          "mb-1 flex size-7 items-center justify-center rounded-full text-sm",
          day.isToday && "bg-primary text-primary-foreground font-semibold",
          !day.isCurrentMonth && "text-muted-foreground"
        )}
      >
        {day.dayNumber}
      </div>
      <div className="flex flex-1 flex-col gap-1">
        {day.posts.slice(0, 3).map((post) => (
          <DraggablePostCard
            key={post.id}
            post={post}
            compact
            onDuplicate={() => onDuplicate(post.fullPost)}
            isHidden={post.id === draggingPostId}
          />
        ))}
        {day.posts.length > 3 && (
          <span className="text-xs text-muted-foreground">+{day.posts.length - 3} more</span>
        )}
        <button
          onClick={() => onAddPost(day.date)}
          className="mt-auto flex items-center justify-center rounded py-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted/50"
        >
          <PlusIcon className="size-4" />
        </button>
      </div>
    </div>
  )
}

export const ContentCalendar = () => {
  const { view, setView, currentDate: currentDateStr, goToPrevious, goToNext } = useCalendarStore()
  const currentDate = React.useMemo(() => new Date(currentDateStr), [currentDateStr])
  const [activePost, setActivePost] = React.useState<CalendarPost | null>(null)
  const [dropPosition, setDropPosition] = React.useState<{ x: number; y: number } | null>(null)
  const { openSheet } = useCreatePost()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  )

  const dateRange = React.useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    if (view === "week") {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)
      return { startDate: formatDateKey(startOfWeek), endDate: formatDateKey(endOfWeek) }
    }

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    const endDate = new Date(lastDay)
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()))
    return { startDate: formatDateKey(startDate), endDate: formatDateKey(endDate) }
  }, [currentDate, view])

  const { data, loading, previousData } = useQuery<GetCalendarPostsResponse>(GET_CALENDAR_POSTS, {
    variables: dateRange,
    fetchPolicy: "cache-and-network",
  })

  const displayData = data || previousData
  const isInitialLoading = loading && !displayData

  const [updatePost] = useMutation<UpdatePostResponse>(UPDATE_POST, {
    update: (cache, { data: mutationData }) => {
      if (!mutationData?.updatePost) return

      const existingData = cache.readQuery<GetCalendarPostsResponse>({
        query: GET_CALENDAR_POSTS,
        variables: dateRange,
      })

      if (existingData) {
        const updatedPosts = existingData.calendarPosts.map((post) =>
          post.id === mutationData.updatePost.id ? mutationData.updatePost : post
        )
        cache.writeQuery({
          query: GET_CALENDAR_POSTS,
          variables: dateRange,
          data: { calendarPosts: updatedPosts },
        })
      }
    },
    onError: (error) => console.error("Failed to reschedule post:", error),
  })

  const [duplicatePostMutation] = useMutation(CREATE_POST, { refetchQueries: "active" })

  const handleDuplicate = React.useCallback(
    (post: Post) => {
      const input: CreatePostInput = {
        content: `Duplicate of: ${post.content}`,
        platforms: post.platforms,
        status: "DRAFT",
        scheduledAt: post.scheduledAt || undefined,
        hashtags: post.hashtags || [],
        mentions: post.mentions || [],
      }
      duplicatePostMutation({ variables: { input } })
    },
    [duplicatePostMutation]
  )

  const postsMap = React.useMemo(() => {
    const map: Record<string, Array<CalendarPost>> = {}

    if (displayData?.calendarPosts) {
      for (const post of displayData.calendarPosts) {
        if (!post.scheduledAt) continue

        const dateKey = post.scheduledAt.split(/[T ]/)[0]
        const calendarPost: CalendarPost = {
          id: post.id,
          platforms: post.platforms.map(transformPlatform),
          time: formatTime(post.scheduledAt),
          content: post.content,
          status: transformStatus(post.status),
          fullPost: post,
        }

        if (!map[dateKey]) map[dateKey] = []
        map[dateKey].push(calendarPost)
      }

      for (const dateKey of Object.keys(map)) {
        map[dateKey].sort((a, b) => {
          const timeA = a.fullPost.scheduledAt ? new Date(a.fullPost.scheduledAt.replace(" ", "T")).getTime() : 0
          const timeB = b.fullPost.scheduledAt ? new Date(b.fullPost.scheduledAt.replace(" ", "T")).getTime() : 0
          return timeA - timeB
        })
      }
    }

    return map
  }, [displayData])

  const weekDays = getWeekDays(currentDate, postsMap)
  const monthDays = getMonthDays(currentDate, postsMap)

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    const post = event.active.data.current?.post as CalendarPost | undefined
    if (post) setActivePost(post)
  }, [])

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (!over) {
        setActivePost(null)
        return
      }

      const draggedPost = active.data.current?.post as CalendarPost | undefined
      const targetData = over.data.current as DroppableData | undefined

      if (!draggedPost || !targetData) {
        setActivePost(null)
        return
      }

      let newScheduledAt: string

      if (targetData.type === "week" && dropPosition) {
        const containerRect = over.rect
        if (containerRect) {
          newScheduledAt = calculateScheduledAtFromDrop(
            dropPosition.y,
            containerRect.top,
            containerRect.height,
            targetData.date
          )
        } else {
          const originalTime = draggedPost.fullPost.scheduledAt?.split(/[T ]/)[1] || "09:00:00"
          newScheduledAt = `${formatDateKey(targetData.date)} ${originalTime}`
        }
      } else {
        const originalTime = draggedPost.fullPost.scheduledAt?.split(/[T ]/)[1] || "09:00:00"
        newScheduledAt = `${formatDateKey(targetData.date)} ${originalTime}`
      }

      if (newScheduledAt === draggedPost.fullPost.scheduledAt) {
        setActivePost(null)
        return
      }

      updatePost({
        variables: { id: draggedPost.fullPost.id, input: { scheduledAt: newScheduledAt } },
        optimisticResponse: { updatePost: { ...draggedPost.fullPost, scheduledAt: newScheduledAt } },
      })

      queueMicrotask(() => setActivePost(null))
      setDropPosition(null)
    },
    [updatePost, dropPosition]
  )

  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    setDropPosition({ x: e.clientX, y: e.clientY })
  }, [])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Content Calendar</h1>
          <div className="flex items-center gap-1 rounded-lg border bg-muted/50 px-2 py-1">
            <Button variant="ghost" size="icon" className="size-6" onClick={goToPrevious}>
              <ChevronLeftIcon className="size-4" />
              <span className="sr-only">Previous {view}</span>
            </Button>
            <span className="min-w-[140px] text-center text-sm font-medium">{formatMonth(currentDate)}</span>
            <Button variant="ghost" size="icon" className="size-6" onClick={goToNext}>
              <ChevronRightIcon className="size-4" />
              <span className="sr-only">Next {view}</span>
            </Button>
          </div>
          {loading && !isInitialLoading && <LoadingIndicator size="md" />}
        </div>
        <div className="flex items-center gap-3">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) => value && setView(value as "week" | "month")}
            className="rounded-lg border"
          >
            <ToggleGroupItem value="week" className="px-4">
              Week
            </ToggleGroupItem>
            <ToggleGroupItem value="month" className="px-4">
              Month
            </ToggleGroupItem>
          </ToggleGroup>
          <Button onClick={() => openSheet()}>
            <PlusIcon className="size-4" />
            Schedule Post
          </Button>
        </div>
      </div>

      {isInitialLoading ? (
        <div className="flex flex-1 flex-col overflow-auto">
          <CalendarSkeleton view={view} />
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex flex-1 flex-col overflow-auto">
            {view === "week" ? (
              <div className="flex min-w-[900px] flex-1 border-b">
                <TimelineColumn />
                {weekDays.map((day, index) => (
                  <WeekDayColumn
                    key={day.date.toISOString()}
                    day={day}
                    dayName={dayNames[index]}
                    onAddPost={(date) => openSheet(date)}
                    onDuplicate={handleDuplicate}
                    onMouseMove={handleMouseMove}
                    draggingPostId={activePost?.id}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-w-[900px] flex-1 flex-col">
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
                <div
                  className="grid flex-1 grid-cols-7"
                  style={{ gridTemplateRows: `repeat(${Math.ceil(monthDays.length / 7)}, minmax(0, 1fr))` }}
                >
                  {monthDays.map((day) => (
                    <MonthDayCell
                      key={day.date.toISOString()}
                      day={day}
                      onAddPost={(date) => openSheet(date)}
                      onDuplicate={handleDuplicate}
                      draggingPostId={activePost?.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <DragOverlay dropAnimation={null}>
            {activePost && (
              <div className="opacity-90 rotate-2">
                <PostCard post={activePost} compact={view === "month"} isDragOverlay />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  )
}
