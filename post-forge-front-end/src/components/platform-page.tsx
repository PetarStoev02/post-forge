"use client"

import * as React from "react"
import { Link } from "@tanstack/react-router"
import { useMutation, useQuery } from "@apollo/client/react"
import {
  FileTextIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

import type { Platform, Post, GetPostsResponse } from "@/types/post"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { EmptyState } from "@/components/empty-state"
import { platformColors, platformIcons, platformLabels } from "@/lib/platforms"
import { cn } from "@/lib/utils"
import { useCreatePost } from "@/contexts/create-post-context"
import { usePostActions } from "@/contexts/post-actions-context"
import { DELETE_POST, GET_POSTS } from "@/graphql/operations/posts"
import { GET_SOCIAL_ACCOUNTS } from "@/graphql/operations/social-accounts"

type SocialAccount = {
  id: string
  platform: Platform
  platformUserId: string
  metadata?: { name?: string; username?: string } | null
  needsReconnect?: boolean
}

const statusStyles: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-700 border-slate-200" },
  SCHEDULED: { label: "Scheduled", className: "bg-blue-100 text-blue-700 border-blue-200" },
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  PUBLISHED: { label: "Published", className: "bg-green-100 text-green-700 border-green-200" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-500 border-gray-200" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-700 border-red-200" },
}

const formatScheduledTime = (scheduledAt: string | null | undefined): string => {
  if (!scheduledAt) return "No date"
  const normalizedDate = scheduledAt.replace(" ", "T")
  const date = new Date(normalizedDate)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

type PlatformPageProps = {
  platform: Platform
}

export const PlatformPage = ({ platform }: PlatformPageProps) => {
  const { openSheet } = useCreatePost()
  const { editPost } = usePostActions()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [postToDelete, setPostToDelete] = React.useState<Post | null>(null)

  const Icon = platformIcons[platform]
  const label = platformLabels[platform]
  const color = platformColors[platform]

  const { data: postsData, loading: postsLoading } = useQuery<GetPostsResponse>(GET_POSTS, {
    variables: { platform },
    fetchPolicy: "cache-and-network",
  })

  const { data: accountsData, loading: accountsLoading } = useQuery<{ socialAccounts: SocialAccount[] }>(GET_SOCIAL_ACCOUNTS)

  const [deletePost, { loading: deleteLoading }] = useMutation(DELETE_POST, {
    refetchQueries: "active",
    onCompleted: () => {
      setDeleteDialogOpen(false)
      setPostToDelete(null)
    },
  })

  const connectedAccount = React.useMemo(() => {
    return accountsData?.socialAccounts?.find((a) => a.platform === platform) ?? null
  }, [accountsData, platform])

  const posts = postsData?.posts ?? []

  const handleDeleteClick = (post: Post) => {
    setPostToDelete(post)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!postToDelete) return
    await deletePost({ variables: { id: postToDelete.id } })
  }

  const isLoading = postsLoading && !postsData

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={cn("flex size-8 items-center justify-center rounded-lg bg-muted", color)}>
            <Icon className="size-5" />
          </div>
          <h1 className="text-2xl font-semibold">{label}</h1>
        </div>
        <Button onClick={() => openSheet({ platforms: [platform] })}>
          <PlusIcon className="size-4" />
          Create Post
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
        {/* Connected Account Card */}
        {!accountsLoading && (
          connectedAccount ? (
            <Card>
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                <div className={cn("flex size-10 items-center justify-center rounded-full bg-muted", color)}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {connectedAccount.metadata?.name ?? (connectedAccount.metadata?.username ? `@${connectedAccount.metadata.username}` : label)}
                  </CardTitle>
                  <CardDescription>
                    {connectedAccount.metadata?.name && connectedAccount.metadata?.username
                      ? `@${connectedAccount.metadata.username}`
                      : "Connected account"}
                  </CardDescription>
                </div>
                {connectedAccount.needsReconnect && (
                  <Badge variant="destructive" className="ml-auto">Needs Reconnect</Badge>
                )}
              </CardHeader>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">No {label} account connected</p>
                    <p className="text-xs text-muted-foreground">Connect your account to publish posts</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/accounts">
                    <PlusIcon className="size-4" />
                    Connect in Accounts
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        )}

        {/* Posts List */}
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<FileTextIcon className="size-8" />}
            title={`No ${label} posts yet`}
            description={`Create your first post for ${label} to see it here.`}
            action={
              <Button onClick={() => openSheet({ platforms: [platform] })}>
                <PlusIcon className="size-4" />
                Create Post
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground">
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </h2>
            </div>
            {posts.map((post) => {
              const statusStyle = statusStyles[post.status] ?? statusStyles.DRAFT
              return (
                <div
                  key={post.id}
                  className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-[10px] border", statusStyle.className)}>
                        {statusStyle.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatScheduledTime(post.scheduledAt)}
                      </span>
                      {post.platforms.length > 1 && (
                        <Badge variant="secondary" className="text-[10px]">
                          +{post.platforms.length - 1} more
                        </Badge>
                      )}
                    </div>
                    <p className="line-clamp-2 text-sm">{post.content}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => editPost(post)}>
                      <PencilIcon className="size-4" />
                      <span className="sr-only">Edit post</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(post)}
                    >
                      <Trash2Icon className="size-4" />
                      <span className="sr-only">Delete post</span>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
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
