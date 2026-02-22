"use client"

import * as React from "react"
import { Link } from "@tanstack/react-router"
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react"
import { toast } from "sonner"
import {
  ChevronDownIcon,
  ExternalLinkIcon,
  EyeIcon,
  FileTextIcon,
  HeartIcon,
  LoaderIcon,
  MessageCircleIcon,
  PencilIcon,
  PlusIcon,
  QuoteIcon,
  RepeatIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react"

import type { GetPostsResponse, GetThreadsPostInsightsResponse, GetThreadsPostsResponse, Platform, PlatformPost, Post } from "@/types/post"
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { EmptyState } from "@/components/empty-state"
import { platformColors, platformIcons, platformLabels } from "@/lib/platforms"
import { cn } from "@/lib/utils"
import { useCreatePost } from "@/contexts/create-post-context"
import { usePostActions } from "@/contexts/post-actions-context"
import { DELETE_POST, DELETE_THREADS_POST, GET_POSTS, GET_THREADS_POST_INSIGHTS, GET_THREADS_POSTS, PUBLISH_POST } from "@/graphql/operations/posts"
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

type UnifiedPost =
  | { kind: "live"; post: PlatformPost }
  | { kind: "local"; post: Post }

type PlatformPageProps = {
  platform: Platform
}

export const PlatformPage = ({ platform }: PlatformPageProps) => {
  const { openSheet } = useCreatePost()
  const { editPost } = usePostActions()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [postToDelete, setPostToDelete] = React.useState<Post | null>(null)
  const [livePostToDelete, setLivePostToDelete] = React.useState<PlatformPost | null>(null)

  const Icon = platformIcons[platform]
  const label = platformLabels[platform]
  const color = platformColors[platform]

  const { data: postsData, loading: postsLoading } = useQuery<GetPostsResponse>(GET_POSTS, {
    variables: { platform },
    fetchPolicy: "cache-and-network",
  })

  const { data: accountsData, loading: accountsLoading } = useQuery<{ socialAccounts: Array<SocialAccount> }>(GET_SOCIAL_ACCOUNTS)

  // Threads live posts
  const [threadsPosts, setThreadsPosts] = React.useState<Array<PlatformPost>>([])
  const [threadsNextCursor, setThreadsNextCursor] = React.useState<string | null>(null)
  const [threadsHasNextPage, setThreadsHasNextPage] = React.useState(false)
  const [threadsLoading, setThreadsLoading] = React.useState(false)

  const [fetchThreadsPosts] = useLazyQuery<GetThreadsPostsResponse>(GET_THREADS_POSTS, {
    fetchPolicy: "network-only",
  })

  const loadThreadsPosts = React.useCallback(async (after?: string | null) => {
    setThreadsLoading(true)
    try {
      const { data } = await fetchThreadsPosts({
        variables: { limit: 25, ...(after ? { after } : {}) },
      })
      if (data) {
        const result = data.threadsPosts
        setThreadsPosts((prev) => after ? [...prev, ...result.posts] : result.posts)
        setThreadsNextCursor(result.nextCursor)
        setThreadsHasNextPage(result.hasNextPage)
      }
    } finally {
      setThreadsLoading(false)
    }
  }, [fetchThreadsPosts])

  const connectedAccount = React.useMemo(() => {
    return accountsData?.socialAccounts?.find((a) => a.platform === platform) ?? null
  }, [accountsData, platform])

  const isThreads = platform === "THREADS"
  const hasConnectedThreads = isThreads && connectedAccount !== null && !connectedAccount.needsReconnect

  React.useEffect(() => {
    if (hasConnectedThreads) {
      loadThreadsPosts()
    }
  }, [hasConnectedThreads, loadThreadsPosts])

  const handleLoadMoreThreads = () => {
    if (threadsNextCursor) {
      loadThreadsPosts(threadsNextCursor)
    }
  }

  // Refetch live posts after mutations
  const refetchThreadsPosts = React.useCallback(() => {
    if (hasConnectedThreads) {
      loadThreadsPosts()
    }
  }, [hasConnectedThreads, loadThreadsPosts])

  const [deletePost, { loading: deleteLoading }] = useMutation(DELETE_POST, {
    refetchQueries: "active",
    onCompleted: () => {
      setDeleteDialogOpen(false)
      setPostToDelete(null)
      refetchThreadsPosts()
    },
  })

  const [deleteThreadsPost, { loading: deleteThreadsLoading }] = useMutation(DELETE_THREADS_POST, {
    onCompleted: () => {
      setDeleteDialogOpen(false)
      setLivePostToDelete(null)
      refetchThreadsPosts()
    },
  })

  const [publishPost] = useMutation(PUBLISH_POST, {
    refetchQueries: "active",
    onCompleted: () => {
      refetchThreadsPosts()
    },
  })

  const [publishingPostId, setPublishingPostId] = React.useState<string | null>(null)

  const handlePublish = async (post: Post) => {
    setPublishingPostId(post.id)
    try {
      await publishPost({ variables: { id: post.id } })
    } finally {
      setPublishingPostId(null)
    }
  }

  const posts = postsData?.posts ?? []

  // Build unified list for Threads: live posts + non-published local posts
  const unifiedPosts = React.useMemo((): Array<UnifiedPost> => {
    if (!hasConnectedThreads) return []

    const items: Array<UnifiedPost> = []

    // Add non-published local posts (drafts, scheduled, etc.)
    for (const post of posts) {
      if (post.status !== "PUBLISHED") {
        items.push({ kind: "local", post })
      }
    }

    // Add all live Threads posts
    for (const tp of threadsPosts) {
      items.push({ kind: "live", post: tp })
    }

    return items
  }, [hasConnectedThreads, posts, threadsPosts])

  const handleDeleteClick = (post: Post) => {
    setLivePostToDelete(null)
    setPostToDelete(post)
    setDeleteDialogOpen(true)
  }

  const handleDeleteLiveClick = (post: PlatformPost) => {
    setPostToDelete(null)
    setLivePostToDelete(post)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    try {
      if (postToDelete) {
        await deletePost({ variables: { id: postToDelete.id } })
      } else if (livePostToDelete) {
        await deleteThreadsPost({ variables: { platformPostId: livePostToDelete.platformPostId } })
      }
    } catch {
      toast.error("Failed to delete post. Please try again.")
      setDeleteDialogOpen(false)
      setPostToDelete(null)
      setLivePostToDelete(null)
    }
  }

  const isLoading = postsLoading && !postsData

  // For Threads with connected account, use unified list; otherwise use local posts
  const showUnifiedList = hasConnectedThreads
  const hasAnyContent = showUnifiedList
    ? unifiedPosts.length > 0 || threadsLoading
    : posts.length > 0

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
        <Button onClick={() => openSheet({ platforms: [platform], locked: true })}>
          <PlusIcon className="size-4" />
          Create Post
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
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
            <div className="flex items-center justify-center py-20">
              <p className="text-sm text-muted-foreground">Loading posts...</p>
            </div>
          ) : !hasAnyContent ? (
            <EmptyState
              icon={<FileTextIcon className="size-8" />}
              title={`No ${label} posts yet`}
              description={`Create your first post for ${label} to see it here.`}
              action={
                <Button onClick={() => openSheet({ platforms: [platform], locked: true })}>
                  <PlusIcon className="size-4" />
                  Create Post
                </Button>
              }
            />
          ) : showUnifiedList ? (
            /* Unified Threads list: local drafts + live posts */
            <div className="space-y-3">
              {threadsLoading && unifiedPosts.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {unifiedPosts.map((item) =>
                    item.kind === "local" ? (
                      <LocalPostRow
                        key={item.post.id}
                        post={item.post}
                        publishingPostId={publishingPostId}
                        onPublish={handlePublish}
                        onEdit={editPost}
                        onDelete={handleDeleteClick}
                      />
                    ) : (
                      <LivePostRow key={item.post.platformPostId} post={item.post} onDelete={handleDeleteLiveClick} />
                    )
                  )}
                  {threadsHasNextPage && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLoadMoreThreads}
                        disabled={threadsLoading}
                      >
                        {threadsLoading ? (
                          <>
                            <LoaderIcon className="size-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          "Load More"
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Standard local posts list (non-Threads platforms) */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground">
                  {posts.length} {posts.length === 1 ? "post" : "posts"}
                </h2>
              </div>
              {posts.map((post) => (
                <LocalPostRow
                  key={post.id}
                  post={post}
                  publishingPostId={publishingPostId}
                  onPublish={handlePublish}
                  onEdit={editPost}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          )}
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
              disabled={deleteLoading || deleteThreadsLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading || deleteThreadsLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ── Row components ── */

const LivePostRow = ({ post, onDelete }: { post: PlatformPost; onDelete: (post: PlatformPost) => void }) => {
  const [open, setOpen] = React.useState(false)
  const [hasFetched, setHasFetched] = React.useState(false)

  const [fetchInsights, { data: insightsData, loading: insightsLoading }] = useLazyQuery<GetThreadsPostInsightsResponse>(
    GET_THREADS_POST_INSIGHTS,
    { fetchPolicy: "network-only" }
  )

  const handleToggle = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && !hasFetched) {
      setHasFetched(true)
      fetchInsights({ variables: { platformPostId: post.platformPostId } })
    }
  }

  const insights = insightsData?.threadsPostInsights

  return (
    <Collapsible open={open} onOpenChange={handleToggle}>
      <div className="rounded-lg border transition-colors hover:bg-muted/50">
        <div className="flex items-center gap-3 p-4">
          <CollapsibleTrigger asChild>
            <button type="button" className="flex shrink-0 items-center justify-center size-6 rounded hover:bg-muted">
              <ChevronDownIcon className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleTrigger asChild>
            <div className="min-w-0 flex-1 cursor-pointer">
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="outline" className="border text-[10px] bg-green-100 text-green-700 border-green-200">
                  Published
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatScheduledTime(post.timestamp)}
                </span>
              </div>
              <p className="line-clamp-2 text-sm">{post.text ?? ""}</p>
            </div>
          </CollapsibleTrigger>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon className="size-4" />
                <span className="sr-only">View on Threads</span>
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(post)}
            >
              <Trash2Icon className="size-4" />
              <span className="sr-only">Delete post</span>
            </Button>
          </div>
        </div>
        <CollapsibleContent>
          <div className="border-t px-4 py-3">
            {insightsLoading ? (
              <div className="flex items-center justify-center py-3">
                <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : insights ? (
              <div className="grid grid-cols-5 gap-4">
                <InsightMetric icon={<EyeIcon className="size-3.5" />} label="Views" value={insights.views} />
                <InsightMetric icon={<HeartIcon className="size-3.5" />} label="Likes" value={insights.likes} />
                <InsightMetric icon={<MessageCircleIcon className="size-3.5" />} label="Replies" value={insights.replies} />
                <InsightMetric icon={<RepeatIcon className="size-3.5" />} label="Reposts" value={insights.reposts} />
                <InsightMetric icon={<QuoteIcon className="size-3.5" />} label="Quotes" value={insights.quotes} />
              </div>
            ) : (
              <p className="text-center text-xs text-muted-foreground py-2">Unable to load insights</p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

const InsightMetric = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="flex flex-col items-center gap-1 text-center">
    <div className="text-muted-foreground">{icon}</div>
    <span className="text-sm font-semibold">{value.toLocaleString()}</span>
    <span className="text-[10px] text-muted-foreground">{label}</span>
  </div>
)

const LocalPostRow = ({
  post,
  publishingPostId,
  onPublish,
  onEdit,
  onDelete,
}: {
  post: Post
  publishingPostId: string | null
  onPublish: (post: Post) => void
  onEdit: (post: Post) => void
  onDelete: (post: Post) => void
}) => {
  const statusStyle = statusStyles[post.status] ?? statusStyles.DRAFT
  return (
    <div className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
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
      <div className="flex shrink-0 items-center gap-1">
        {(post.status === "DRAFT" || post.status === "SCHEDULED") && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={publishingPostId === post.id}
            onClick={() => onPublish(post)}
          >
            {publishingPostId === post.id ? (
              <LoaderIcon className="size-4 animate-spin" />
            ) : (
              <SendIcon className="size-4" />
            )}
            <span className="sr-only">Publish post</span>
          </Button>
        )}
        <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(post)}>
          <PencilIcon className="size-4" />
          <span className="sr-only">Edit post</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(post)}
        >
          <Trash2Icon className="size-4" />
          <span className="sr-only">Delete post</span>
        </Button>
      </div>
    </div>
  )
}
