"use client"

import * as React from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery, useMutation, useLazyQuery } from "@apollo/client/react"
import {
  PlusIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  Trash2Icon,
  SparklesIcon,
  ImageIcon,
  SettingsIcon,
  UsersIcon,
  CalendarCheckIcon,
  FileTextIcon,
  ClockIcon,
  CalendarDaysIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { DashboardSkeleton } from "@/components/skeletons"
import { useCreatePost } from "@/contexts/create-post-context"
import { usePostActions } from "@/contexts/post-actions-context"
import { GET_DASHBOARD_STATS, GET_POSTS_FOR_DATE, DELETE_POST } from "@/graphql/operations/posts"
import type { GetDashboardStatsResponse, GetPostsForDateResponse, Post, Platform } from "@/types/post"

type StatCardProps = {
  title: string
  value: string | number
  icon: React.ReactNode
  change?: { value: number; type: "increase" | "decrease" }
  badge?: { text: string; variant: "default" | "secondary" | "destructive" | "outline" }
  subtitle?: string
}

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  TWITTER: TwitterIcon,
  INSTAGRAM: InstagramIcon,
  LINKEDIN: LinkedinIcon,
}

const platformColors: Record<string, string> = {
  TWITTER: "text-black",
  INSTAGRAM: "text-[#E4405F]",
  LINKEDIN: "text-[#0A66C2]",
}

const statusStyles: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-700 border-slate-200" },
  SCHEDULED: { label: "Scheduled", className: "bg-blue-100 text-blue-700 border-blue-200" },
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  PUBLISHED: { label: "Published", className: "bg-green-100 text-green-700 border-green-200" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-500 border-gray-200" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-700 border-red-200" },
}

const StatCard = ({ title, value, icon, change, badge, subtitle }: StatCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className="text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}</span>
        {badge && (
          <Badge variant={badge.variant} className="text-[10px]">
            {badge.text}
          </Badge>
        )}
      </div>
      {change && (
        <div className={cn(
          "mt-1 flex items-center gap-1 text-xs",
          change.type === "increase" ? "text-green-600" : "text-red-600"
        )}>
          {change.type === "increase" ? (
            <TrendingUpIcon className="size-3" />
          ) : (
            <TrendingDownIcon className="size-3" />
          )}
          <span>{change.value}% from last month</span>
        </div>
      )}
      {subtitle && (
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </CardContent>
  </Card>
)

type ScheduledQueueItemProps = {
  post: Post
  onEdit: () => void
  onDelete: () => void
}

const formatScheduledTime = (scheduledAt: string | null | undefined): string => {
  if (!scheduledAt) return "No date"

  const normalizedDate = scheduledAt.replace(" ", "T")
  const date = new Date(normalizedDate)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const isToday = date.toDateString() === now.toDateString()
  const isTomorrow = date.toDateString() === tomorrow.toDateString()

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  if (isToday) return `Today, ${timeStr}`
  if (isTomorrow) return `Tomorrow, ${timeStr}`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

const formatTimeOnly = (scheduledAt: string | null | undefined): string => {
  if (!scheduledAt) return ""

  const normalizedDate = scheduledAt.replace(" ", "T")
  const date = new Date(normalizedDate)

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

const ScheduledQueueItem = ({ post, onEdit, onDelete }: ScheduledQueueItemProps) => {
  const primaryPlatform = post.platforms[0] as Platform
  const Icon = platformIcons[primaryPlatform] || FileTextIcon

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <div className={cn(
        "flex size-10 items-center justify-center rounded-full bg-muted",
        platformColors[primaryPlatform]
      )}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{formatScheduledTime(post.scheduledAt)}</span>
          {post.platforms.length > 1 && (
            <Badge variant="secondary" className="text-[10px]">
              +{post.platforms.length - 1} more
            </Badge>
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground">{post.content}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="size-8" onClick={onEdit}>
          <PencilIcon className="size-4" />
          <span className="sr-only">Edit post</span>
        </Button>
        <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2Icon className="size-4" />
          <span className="sr-only">Delete post</span>
        </Button>
      </div>
    </div>
  )
}

type DayPostItemProps = {
  post: Post
  onEdit: () => void
  onDelete: () => void
}

const DayPostItem = ({ post, onEdit, onDelete }: DayPostItemProps) => {
  const primaryPlatform = post.platforms[0] as Platform
  const Icon = platformIcons[primaryPlatform] || FileTextIcon
  const statusStyle = statusStyles[post.status] || statusStyles.DRAFT

  return (
    <div className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
      <div className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full bg-muted",
        platformColors[primaryPlatform]
      )}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-muted-foreground">{formatTimeOnly(post.scheduledAt)}</span>
          <Badge variant="outline" className={cn("text-[10px] border", statusStyle.className)}>
            {statusStyle.label}
          </Badge>
          {post.platforms.length > 1 && (
            <div className="flex items-center gap-0.5">
              {post.platforms.slice(1).map((platform) => {
                const PIcon = platformIcons[platform] || FileTextIcon
                return (
                  <PIcon key={platform} className={cn("size-3", platformColors[platform])} />
                )
              })}
            </div>
          )}
        </div>
        <p className="text-sm line-clamp-2">{post.content}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" className="size-7" onClick={onEdit}>
          <PencilIcon className="size-3.5" />
          <span className="sr-only">Edit post</span>
        </Button>
        <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={onDelete}>
          <Trash2Icon className="size-3.5" />
          <span className="sr-only">Delete post</span>
        </Button>
      </div>
    </div>
  )
}

type MiniCalendarProps = {
  postDates: string[]
  month: Date
  onMonthChange: (date: Date) => void
  selectedDate: Date | undefined
  onSelectDate: (date: Date | undefined) => void
}

const MiniCalendar = ({ postDates, month, onMonthChange, selectedDate, onSelectDate }: MiniCalendarProps) => {
  const postDatesSet = React.useMemo(
    () => new Set(postDates),
    [postDates]
  )

  const modifiers = React.useMemo(() => ({
    hasPost: (date: Date) => {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      return postDatesSet.has(dateStr)
    },
  }), [postDatesSet])

  const modifiersClassNames = {
    hasPost: "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400",
  }

  const goToPreviousMonth = () => {
    const newDate = new Date(month)
    newDate.setMonth(newDate.getMonth() - 1)
    onMonthChange(newDate)
  }

  const goToNextMonth = () => {
    const newDate = new Date(month)
    newDate.setMonth(newDate.getMonth() + 1)
    onMonthChange(newDate)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Calendar</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-7" onClick={goToPreviousMonth}>
              <ChevronLeftIcon className="size-4" />
              <span className="sr-only">Previous month</span>
            </Button>
            <Button variant="ghost" size="icon" className="size-7" onClick={goToNextMonth}>
              <ChevronRightIcon className="size-4" />
              <span className="sr-only">Next month</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Calendar
          mode="single"
          month={month}
          onMonthChange={onMonthChange}
          selected={selectedDate}
          onSelect={onSelectDate}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          className="p-0"
        />
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-full bg-primary" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded-full bg-orange-200 dark:bg-orange-900/50" />
            <span>Has posts</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

type SelectedDayPostsProps = {
  selectedDate: Date
  posts: Post[]
  loading: boolean
  onEdit: (post: Post) => void
  onDelete: (post: Post) => void
  onCreatePost: () => void
}

const SelectedDayPosts = ({ selectedDate, posts, loading, onEdit, onDelete, onCreatePost }: SelectedDayPostsProps) => {
  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="size-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">{formattedDate}</CardTitle>
        </div>
        {posts.length > 0 && (
          <Badge variant="secondary">{posts.length} post{posts.length !== 1 ? "s" : ""}</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <DayPostItem
              key={post.id}
              post={post}
              onEdit={() => onEdit(post)}
              onDelete={() => onDelete(post)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CalendarDaysIcon className="mb-2 size-6 text-muted-foreground" />
            <p className="text-sm font-medium">No posts for this day</p>
            <p className="text-xs text-muted-foreground mb-3">
              Schedule a post for {selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
            <Button variant="outline" size="sm" onClick={onCreatePost}>
              <PlusIcon className="size-4" />
              Create Post
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const QuickActions = () => {
  const actions = [
    {
      icon: SparklesIcon,
      label: "AI Content Generator",
      description: "Generate post ideas with AI",
      disabled: true,
    },
    {
      icon: ImageIcon,
      label: "Media Library",
      description: "Manage your media assets",
      disabled: true,
    },
    {
      icon: SettingsIcon,
      label: "Account Settings",
      description: "Configure your accounts",
      href: "/accounts",
      disabled: false,
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => {
          const content = (
            <div className={cn(
              "flex items-center gap-3 rounded-lg border p-3 transition-colors",
              action.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-muted/50"
            )}>
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <action.icon className="size-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
              {action.disabled && (
                <Badge variant="secondary" className="text-[10px]">
                  Coming Soon
                </Badge>
              )}
            </div>
          )

          if (action.href && !action.disabled) {
            return (
              <Link key={action.label} to={action.href}>
                {content}
              </Link>
            )
          }

          return <div key={action.label}>{content}</div>
        })}
      </CardContent>
    </Card>
  )
}

const formatDateForQuery = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const DashboardPage = () => {
  const { openSheet } = useCreatePost()
  const { editPost } = usePostActions()
  const [calendarMonth, setCalendarMonth] = React.useState(new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date())
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [postToDelete, setPostToDelete] = React.useState<Post | null>(null)

  const { data, loading } = useQuery<GetDashboardStatsResponse>(GET_DASHBOARD_STATS, {
    fetchPolicy: "cache-and-network",
  })

  const [fetchPostsForDate, { data: dayPostsData, loading: dayPostsLoading }] = useLazyQuery<GetPostsForDateResponse>(GET_POSTS_FOR_DATE, {
    fetchPolicy: "cache-and-network",
  })

  // Fetch posts when selected date changes
  React.useEffect(() => {
    if (selectedDate) {
      fetchPostsForDate({
        variables: { date: formatDateForQuery(selectedDate) },
      })
    }
  }, [selectedDate, fetchPostsForDate])

  const [deletePost, { loading: deleteLoading }] = useMutation(DELETE_POST, {
    refetchQueries: "active",
    onCompleted: () => {
      setDeleteDialogOpen(false)
      setPostToDelete(null)
    },
  })

  const handleDeleteClick = (post: Post) => {
    setPostToDelete(post)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!postToDelete) return
    await deletePost({ variables: { id: postToDelete.id } })
  }

  const handleCreatePostForDate = () => {
    if (selectedDate) {
      openSheet(selectedDate)
    } else {
      openSheet()
    }
  }

  if (loading && !data) {
    return (
      <div className="flex h-full flex-col p-6">
        <DashboardSkeleton />
      </div>
    )
  }

  const stats = data?.dashboardStats
  const totalPostsChange = stats && stats.totalPostsLastMonth > 0
    ? Math.round(((stats.totalPostsThisMonth - stats.totalPostsLastMonth) / stats.totalPostsLastMonth) * 100)
    : 0

  const dayPosts = dayPostsData?.postsForDate ?? []

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Button onClick={() => openSheet()}>
          <PlusIcon className="size-4" />
          Create Post
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Posts"
              value={stats?.totalPostsCount ?? 0}
              icon={<FileTextIcon className="size-4" />}
              change={totalPostsChange !== 0 ? {
                value: Math.abs(totalPostsChange),
                type: totalPostsChange > 0 ? "increase" : "decrease",
              } : undefined}
            />
            <StatCard
              title="Engagement Rate"
              value="4.2%"
              icon={<TrendingUpIcon className="size-4" />}
              subtitle="Placeholder - API integration pending"
              badge={{ text: "Demo", variant: "secondary" }}
            />
            <StatCard
              title="Total Followers"
              value="12.4K"
              icon={<UsersIcon className="size-4" />}
              subtitle="Placeholder - API integration pending"
              badge={{ text: "Demo", variant: "secondary" }}
            />
            <StatCard
              title="Scheduled Posts"
              value={stats?.scheduledPostsCount ?? 0}
              icon={<CalendarCheckIcon className="size-4" />}
              subtitle={`${stats?.draftPostsCount ?? 0} drafts, ${stats?.publishedPostsCount ?? 0} published`}
            />
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Scheduled Queue */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="size-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">Scheduled Queue</CardTitle>
                  </div>
                  {stats?.upcomingPosts && stats.upcomingPosts.length > 0 && (
                    <Badge variant="secondary">{stats.upcomingPosts.length} upcoming</Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats?.upcomingPosts && stats.upcomingPosts.length > 0 ? (
                    stats.upcomingPosts.map((post) => (
                      <ScheduledQueueItem
                        key={post.id}
                        post={post}
                        onEdit={() => editPost(post)}
                        onDelete={() => handleDeleteClick(post)}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <ClockIcon className="mb-2 size-8 text-muted-foreground" />
                      <p className="text-sm font-medium">No scheduled posts</p>
                      <p className="text-xs text-muted-foreground">
                        Create a post and schedule it to see it here
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => openSheet()}
                      >
                        <PlusIcon className="size-4" />
                        Schedule a Post
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <MiniCalendar
                postDates={stats?.postDates ?? []}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
              {selectedDate && (
                <SelectedDayPosts
                  selectedDate={selectedDate}
                  posts={dayPosts}
                  loading={dayPostsLoading}
                  onEdit={editPost}
                  onDelete={handleDeleteClick}
                  onCreatePost={handleCreatePostForDate}
                />
              )}
              <QuickActions />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
})
