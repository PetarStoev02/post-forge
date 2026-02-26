"use client"

import * as React from "react"
import { Link } from "@tanstack/react-router"
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react"
import { toast } from "sonner"
import {
  ExternalLinkIcon,
  EyeIcon,
  FileTextIcon,
  HeartIcon,
  ImageIcon,
  LoaderIcon,
  MessageCircleIcon,
  PencilIcon,
  PlusIcon,
  QuoteIcon,
  RepeatIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react"

import type { GetPostsResponse, GetThreadsPostInsightsResponse, GetThreadsPostsResponse, Platform, PlatformPost, Post, PostStatus } from "@/types/post"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { EmptyState } from "@/components/empty-state"
import { PostCardSkeleton } from "@/components/skeletons"
import { useCreatePost } from "@/contexts/create-post-context"
import { usePostActions } from "@/contexts/post-actions-context"
import { DELETE_POST, DELETE_THREADS_POST, GET_POSTS, GET_THREADS_POSTS, GET_THREADS_POST_INSIGHTS, PUBLISH_POST } from "@/graphql/operations/posts"
import { formatScheduledTime } from "@/lib/format-date"
import { platformColors, platformIcons, platformLabels } from "@/lib/platforms"
import { statusStyles } from "@/lib/post-status"
import { cn } from "@/lib/utils"
import { GET_SOCIAL_ACCOUNTS } from "@/graphql/operations/social-accounts"

type SocialAccount = {
  id: string
  platform: Platform
  platformUserId: string
  metadata?: { name?: string; username?: string; avatar?: string } | null
  needsReconnect?: boolean
}

type UnifiedPost =
  | { kind: "live"; post: PlatformPost }
  | { kind: "local"; post: Post }

type PlatformPageProps = {
  platform: Platform
}

export const PlatformPage = ({ platform }: PlatformPageProps) => {
  const { openSheet } = useCreatePost()
  const { openPost, editPost } = usePostActions()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [postToDelete, setPostToDelete] = React.useState<Post | null>(null)
  const [livePostToDelete, setLivePostToDelete] = React.useState<PlatformPost | null>(null)
  const [statusFilter, setStatusFilter] = React.useState<PostStatus | "ALL">("ALL")
  const [bulkMode, setBulkMode] = React.useState(false)
  const [selectedPostIds, setSelectedPostIds] = React.useState<Set<string>>(new Set())

  const Icon = platformIcons[platform]
  const label = platformLabels[platform]
  const color = platformColors[platform]

  const { data: postsData, loading: postsLoading } = useQuery<GetPostsResponse>(GET_POSTS, {
    variables: { platform },
    fetchPolicy: "cache-and-network",
  })

  const { data: accountsData, loading: accountsLoading } = useQuery<{ socialAccounts: Array<SocialAccount> }>(GET_SOCIAL_ACCOUNTS)

  // Threads live posts with pagination
  const [threadsPosts, setThreadsPosts] = React.useState<Array<PlatformPost>>([])
  const [threadsHasNextPage, setThreadsHasNextPage] = React.useState(false)
  const [threadsLoading, setThreadsLoading] = React.useState(false)
  const [threadsPage, setThreadsPage] = React.useState(1)
  const [threadsCursors, setThreadsCursors] = React.useState<Array<string | null>>([null])

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
        setThreadsPosts(result.posts)
        setThreadsHasNextPage(result.hasNextPage)
        if (result.nextCursor) {
          setThreadsCursors((prev) => {
            const next = [...prev]
            next[threadsPage] = result.nextCursor
            return next
          })
        }
      }
    } finally {
      setThreadsLoading(false)
    }
  }, [fetchThreadsPosts, threadsPage])

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

  const handleThreadsNextPage = () => {
    const cursor = threadsCursors[threadsPage]
    if (cursor) {
      setThreadsPage((p) => p + 1)
      loadThreadsPosts(cursor)
    }
  }

  const handleThreadsPrevPage = () => {
    if (threadsPage > 1) {
      const prevPage = threadsPage - 1
      setThreadsPage(prevPage)
      const cursor = prevPage === 1 ? null : threadsCursors[prevPage - 1]
      loadThreadsPosts(cursor)
    }
  }

  // Refetch live posts after mutations
  const refetchThreadsPosts = React.useCallback(() => {
    if (hasConnectedThreads) {
      setThreadsPage(1)
      setThreadsCursors([null])
      loadThreadsPosts()
    }
  }, [hasConnectedThreads, loadThreadsPosts])

  const [deletePost, { loading: deleteLoading }] = useMutation(DELETE_POST, {
    refetchQueries: "active",
    onCompleted: () => {
      toast.success("Post deleted")
      setDeleteDialogOpen(false)
      setPostToDelete(null)
      refetchThreadsPosts()
    },
  })

  const [deleteThreadsPost, { loading: deleteThreadsLoading }] = useMutation(DELETE_THREADS_POST, {
    onCompleted: () => {
      toast.success("Post deleted")
      setDeleteDialogOpen(false)
      setLivePostToDelete(null)
      refetchThreadsPosts()
    },
  })

  const [publishPost] = useMutation(PUBLISH_POST, {
    refetchQueries: "active",
    onCompleted: () => {
      toast.success("Post published")
      refetchThreadsPosts()
    },
    onError: () => {
      toast.error("Failed to publish post")
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

  const togglePostSelection = (postId: string) => {
    setSelectedPostIds((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) {
        next.delete(postId)
      } else {
        next.add(postId)
      }
      return next
    })
  }

  const handleBulkDelete = async () => {
    for (const id of selectedPostIds) {
      await deletePost({ variables: { id } })
    }
    setSelectedPostIds(new Set())
    setBulkMode(false)
  }

  const cancelBulkMode = () => {
    setBulkMode(false)
    setSelectedPostIds(new Set())
  }

  // Track whether we've done the initial threads fetch
  const [threadsInitialFetchDone, setThreadsInitialFetchDone] = React.useState(false)

  React.useEffect(() => {
    if (!hasConnectedThreads) {
      setThreadsInitialFetchDone(false)
    }
  }, [hasConnectedThreads])

  React.useEffect(() => {
    if (!threadsLoading && threadsPosts.length > 0) {
      setThreadsInitialFetchDone(true)
    }
  }, [threadsLoading, threadsPosts.length])

  const isLoading = (postsLoading && !postsData) || accountsLoading

  // Apply status filter
  const filteredPosts = statusFilter === "ALL" ? posts : posts.filter((p) => p.status === statusFilter)

  const filteredUnifiedPosts = React.useMemo((): Array<UnifiedPost> => {
    if (statusFilter === "ALL") return unifiedPosts
    return unifiedPosts.filter((item) => {
      if (item.kind === "live") return statusFilter === "PUBLISHED"
      return item.post.status === statusFilter
    })
  }, [unifiedPosts, statusFilter])

  // For Threads with connected account, use unified list; otherwise use local posts
  const showUnifiedList = hasConnectedThreads
  const hasAnyContent = showUnifiedList
    ? filteredUnifiedPosts.length > 0 || threadsLoading || !threadsInitialFetchDone
    : filteredPosts.length > 0

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b bg-background px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={cn("flex size-8 items-center justify-center rounded-lg bg-muted", color)}>
            <Icon className="size-5" />
          </div>
          <h1 className="text-2xl font-semibold">{label}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as PostStatus | "ALL")}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={bulkMode ? "secondary" : "outline"}
            size="sm"
            onClick={() => bulkMode ? cancelBulkMode() : setBulkMode(true)}
          >
            {bulkMode ? "Cancel" : "Select"}
          </Button>
          <Button onClick={() => openSheet({ platforms: [platform], locked: true })}>
            <PlusIcon className="size-4" />
            Create Post
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {/* Connected Account Card */}
          {!accountsLoading && (
            connectedAccount ? (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                    <Avatar className="size-10">
                      <AvatarImage src={connectedAccount.metadata?.avatar ?? undefined} alt={connectedAccount.metadata?.name ?? label} />
                      <AvatarFallback className={cn("bg-muted", color)}>
                        <Icon className="size-5" />
                      </AvatarFallback>
                    </Avatar>
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
                {connectedAccount.needsReconnect && (
                  <Alert variant="destructive">
                    <AlertTitle>Token Expired</AlertTitle>
                    <AlertDescription className="flex items-center justify-between">
                      <span>Your {label} connection has expired. Reconnect to continue publishing.</span>
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/accounts">Reconnect</Link>
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </>
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
            <div className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <PostCardSkeleton key={i} />
              ))}
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
            <div>
              {threadsLoading && filteredUnifiedPosts.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3">
                    {filteredUnifiedPosts.map((item) =>
                      item.kind === "local" ? (
                        <LocalPostCard
                          key={item.post.id}
                          post={item.post}
                          publishingPostId={publishingPostId}
                          onPublish={handlePublish}
                          onOpen={openPost}
                          onEdit={editPost}
                          onDelete={handleDeleteClick}
                          bulkMode={bulkMode}
                          selected={selectedPostIds.has(item.post.id)}
                          onToggleSelect={togglePostSelection}
                        />
                      ) : (
                        <LivePostCard key={item.post.platformPostId} post={item.post} onDelete={handleDeleteLiveClick} />
                      )
                    )}
                  </div>
                  {(threadsPage > 1 || threadsHasNextPage) && (
                    <Pagination className="pt-4">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={handleThreadsPrevPage}
                            className={cn(threadsPage <= 1 && "pointer-events-none opacity-50")}
                          />
                        </PaginationItem>
                        <PaginationItem>
                          <span className="px-3 text-sm text-muted-foreground">Page {threadsPage}</span>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext
                            onClick={handleThreadsNextPage}
                            className={cn(!threadsHasNextPage && "pointer-events-none opacity-50")}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Standard local posts grid (non-Threads platforms) */
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground">
                  {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"}
                </h2>
              </div>
              <div className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3">
                {filteredPosts.map((post) => (
                  <LocalPostCard
                    key={post.id}
                    post={post}
                    publishingPostId={publishingPostId}
                    onPublish={handlePublish}
                    onOpen={openPost}
                    onEdit={editPost}
                    onDelete={handleDeleteClick}
                    bulkMode={bulkMode}
                    selected={selectedPostIds.has(post.id)}
                    onToggleSelect={togglePostSelection}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {bulkMode && selectedPostIds.size > 0 && (
        <div className="sticky bottom-0 z-10 flex items-center justify-between border-t bg-background px-6 py-3">
          <span className="text-sm font-medium">{selectedPostIds.size} selected</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={cancelBulkMode}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2Icon className="size-4" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

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

/* ── Card components ── */

const LivePostCard = ({ post, onDelete }: { post: PlatformPost; onDelete: (post: PlatformPost) => void }) => {
  const { data: insightsData, loading: insightsLoading } = useQuery<GetThreadsPostInsightsResponse>(
    GET_THREADS_POST_INSIGHTS,
    { variables: { platformPostId: post.platformPostId }, fetchPolicy: "cache-and-network" }
  )

  const insights = insightsData?.threadsPostInsights
  const mediaThumb = post.thumbnailUrl ?? post.mediaUrl
  const hasMedia = post.mediaType && post.mediaType !== "TEXT" && mediaThumb

  return (
    <Card className="flex break-inside-avoid flex-col overflow-hidden transition-colors hover:bg-muted/50">
      {/* Media thumbnail */}
      {hasMedia && (
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <img
            src={mediaThumb}
            alt=""
            className="size-full object-cover"
          />
          {post.mediaType === "VIDEO" && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
              Video
            </div>
          )}
        </div>
      )}
      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border text-[10px] bg-green-100 text-green-700 border-green-200">
            Published
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatScheduledTime(post.timestamp)}
          </span>
        </div>
        <p className="line-clamp-3 flex-1 text-sm">{post.text ?? ""}</p>
        <div className="border-t pt-3">
          {insightsLoading && !insights ? (
            <div className="flex items-center justify-center py-2">
              <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : insights ? (
            <div className="grid grid-cols-5 gap-2">
              <InsightMetric icon={<EyeIcon className="size-3" />} label="Views" value={insights.views} />
              <InsightMetric icon={<HeartIcon className="size-3" />} label="Likes" value={insights.likes} />
              <InsightMetric icon={<MessageCircleIcon className="size-3" />} label="Replies" value={insights.replies} />
              <InsightMetric icon={<RepeatIcon className="size-3" />} label="Reposts" value={insights.reposts} />
              <InsightMetric icon={<QuoteIcon className="size-3" />} label="Quotes" value={insights.quotes} />
            </div>
          ) : (
            <p className="text-center text-xs text-muted-foreground">Unable to load insights</p>
          )}
        </div>
      </CardContent>
      <div className="flex items-center justify-end gap-1 border-t px-3 py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <a href={post.permalink} target="_blank" rel="noopener noreferrer">
                <ExternalLinkIcon className="size-4" />
                <span className="sr-only">View on Threads</span>
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>View on Threads</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(post)}
            >
              <Trash2Icon className="size-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>
    </Card>
  )
}

const InsightMetric = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <div className="flex flex-col items-center gap-0.5 text-center">
    <div className="text-muted-foreground">{icon}</div>
    <span className="text-xs font-semibold">{value.toLocaleString()}</span>
    <span className="text-[10px] text-muted-foreground">{label}</span>
  </div>
)

const LocalPostCard = ({
  post,
  publishingPostId,
  onPublish,
  onOpen,
  onEdit,
  onDelete,
  bulkMode = false,
  selected = false,
  onToggleSelect,
}: {
  post: Post
  publishingPostId: string | null
  onPublish: (post: Post) => void
  onOpen: (post: Post) => void
  onEdit: (post: Post) => void
  onDelete: (post: Post) => void
  bulkMode?: boolean
  selected?: boolean
  onToggleSelect?: (postId: string) => void
}) => {
  const statusStyle = statusStyles[post.status] ?? statusStyles.DRAFT
  const hasMedia = post.mediaUrls.length > 0

  return (
    <Card className={cn("flex break-inside-avoid flex-col overflow-hidden transition-colors hover:bg-muted/50", selected && "ring-2 ring-primary")}>
      {/* Media thumbnail */}
      {hasMedia && (
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <img
            src={post.mediaUrls[0]}
            alt=""
            className="size-full object-cover"
          />
          {post.mediaUrls.length > 1 && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
              <ImageIcon className="size-3" />
              {post.mediaUrls.length}
            </div>
          )}
        </div>
      )}
      <CardContent
        className="flex flex-1 cursor-pointer flex-col gap-3 p-4"
        onClick={() => bulkMode ? onToggleSelect?.(post.id) : onOpen(post)}
      >
        <div className="flex flex-wrap items-center gap-2">
          {bulkMode && (
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect?.(post.id)}
              onClick={(e) => e.stopPropagation()}
            />
          )}
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
        <p className="line-clamp-3 flex-1 text-sm">{post.content}</p>
      </CardContent>
      <div className="flex items-center justify-end gap-1 border-t px-3 py-2">
        {(post.status === "DRAFT" || post.status === "SCHEDULED" || post.status === "FAILED") && (
          <Tooltip>
            <TooltipTrigger asChild>
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
                <span className="sr-only">Publish</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Publish</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(post)}>
              <PencilIcon className="size-4" />
              <span className="sr-only">Edit</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Edit</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(post)}
            >
              <Trash2Icon className="size-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete</TooltipContent>
        </Tooltip>
      </div>
    </Card>
  )
}
