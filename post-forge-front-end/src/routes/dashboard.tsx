"use client"

import * as React from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "@apollo/client/react"
import {
  CalendarCheckIcon,
  ClockIcon,
  FileTextIcon,
  ImageIcon,
  PencilIcon,
  PlusIcon,
  SettingsIcon,
  SparklesIcon,
  Trash2Icon,
  TrendingDownIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react"

import { toast } from "sonner"

import type { GetDashboardStatsResponse, Post } from "@/entities/post/types"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"
import { platformColors, platformIcons } from "@/entities/social-account/lib/platforms"
import { cn } from "@/shared/lib/utils"
import { DashboardSkeleton } from "@/shared/ui-patterns/skeletons"
import { useCreatePost } from "@/contexts/create-post-context"
import { usePostActions } from "@/contexts/post-actions-context"
import { DELETE_POST, GET_DASHBOARD_STATS } from "@/entities/post/api/posts"

type StatCardProps = {
  title: string
  value: string | number
  icon: React.ReactNode
  change?: { value: number; type: "increase" | "decrease" }
  badge?: { text: string; variant: "default" | "secondary" | "destructive" | "outline" }
  subtitle?: string
  href?: string
}


const StatCard = ({ title, value, icon, change, badge, subtitle, href }: StatCardProps) => {
  const card = (
    <Card className={href ? "transition-colors hover:bg-muted/50" : undefined}>
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

  if (href) {
    return <Link to={href}>{card}</Link>
  }

  return card
}

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


const ScheduledQueueItem = ({ post, onEdit, onDelete }: ScheduledQueueItemProps) => {
  const primaryPlatform = post.platforms[0]
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
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" onClick={onEdit}>
              <PencilIcon className="size-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2Icon className="size-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>
    </div>
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
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
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

const DashboardPage = () => {
  const { openSheet } = useCreatePost()
  const { editPost } = usePostActions()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [postToDelete, setPostToDelete] = React.useState<Post | null>(null)

  const { data, loading } = useQuery<GetDashboardStatsResponse>(GET_DASHBOARD_STATS, {
    fetchPolicy: "cache-and-network",
  })

  const [deletePost, { loading: deleteLoading }] = useMutation(DELETE_POST, {
    refetchQueries: "active",
    onCompleted: () => {
      toast.success("Post deleted")
      setDeleteDialogOpen(false)
      setPostToDelete(null)
    },
    onError: () => {
      toast.error("Failed to delete post")
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

      <div className="flex flex-1 flex-col gap-6 overflow-hidden p-6">
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
            value={
              stats?.threadsEngagement?.engagementRate != null
                ? `${stats.threadsEngagement.engagementRate}%`
                : "N/A"
            }
            icon={<TrendingUpIcon className="size-4" />}
            subtitle={
              stats?.threadsEngagement
                ? `${stats.threadsEngagement.totalEngagements.toLocaleString()} engagements / ${stats.threadsEngagement.views.toLocaleString()} views`
                : "Connect Threads to see data"
            }
          />
          <StatCard
            title="Total Views (30d)"
            value={
              stats?.threadsEngagement
                ? stats.threadsEngagement.views.toLocaleString()
                : "N/A"
            }
            icon={<UsersIcon className="size-4" />}
            subtitle={
              stats?.threadsEngagement
                ? `${stats.threadsEngagement.likes.toLocaleString()} likes, ${stats.threadsEngagement.replies.toLocaleString()} replies`
                : "Connect Threads to see data"
            }
          />
          <StatCard
            title="Scheduled Posts"
            value={stats?.scheduledPostsCount ?? 0}
            icon={<CalendarCheckIcon className="size-4" />}
            subtitle={`${stats?.draftPostsCount ?? 0} drafts, ${stats?.publishedPostsCount ?? 0} published`}
            href="/content-library"
          />
        </div>

        {/* Main Content - 2 columns, fill height */}
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Scheduled Queue - fills height */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <ClockIcon className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Scheduled Queue</CardTitle>
              </div>
              {stats?.upcomingPosts && stats.upcomingPosts.length > 0 && (
                <Badge variant="secondary">{stats.upcomingPosts.length} upcoming</Badge>
              )}
            </CardHeader>
            <CardContent className="flex-1 space-y-3 overflow-y-auto">
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

          {/* Quick Actions - fills height */}
          <QuickActions />
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
