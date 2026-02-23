"use client"

import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@apollo/client/react"
import {
  FileTextIcon,
  GridIcon,
  ImageIcon,
  LibraryIcon,
  ListIcon,
  PlusIcon,
  VideoIcon,
} from "lucide-react"

import type { GetPostsResponse, Post, PostStatus } from "@/types/post"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/empty-state"
import { useCreatePost } from "@/contexts/create-post-context"
import { usePostActions } from "@/contexts/post-actions-context"
import { GET_POSTS } from "@/graphql/operations/posts"
import { platformIcons, platformLabels } from "@/lib/platforms"
import { cn } from "@/lib/utils"

const statusStyles: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-700 border-slate-200" },
  SCHEDULED: { label: "Scheduled", className: "bg-blue-100 text-blue-700 border-blue-200" },
  PUBLISHED: { label: "Published", className: "bg-green-100 text-green-700 border-green-200" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-700 border-red-200" },
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-500 border-gray-200" },
}

const statusFilterOptions: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "All Statuses" },
  { value: "DRAFT", label: "Drafts" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "PUBLISHED", label: "Published" },
  { value: "FAILED", label: "Failed" },
]

const formatDate = (dateString: string): string => {
  const normalizedDate = dateString.replace(" ", "T")
  const date = new Date(normalizedDate)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// ─── Posts Tab ───────────────────────────────────────────────

type PostsTabProps = {
  statusFilter: string
  onStatusFilterChange: (value: string) => void
}

const PostsTab = ({ statusFilter, onStatusFilterChange }: PostsTabProps) => {
  const { openSheet } = useCreatePost()
  const { editPost } = usePostActions()

  const queryVariables = statusFilter === "ALL"
    ? {}
    : { status: statusFilter as PostStatus }

  const { data, loading } = useQuery<GetPostsResponse>(GET_POSTS, {
    variables: queryVariables,
    fetchPolicy: "cache-and-network",
  })

  const posts = data?.posts ?? []

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusFilterOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => openSheet()}>
          <PlusIcon className="size-4" />
          New Post
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading && !data ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-muted-foreground">Loading posts...</div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileTextIcon className="mb-3 size-10 text-muted-foreground" />
            <p className="text-sm font-medium">No posts found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {statusFilter === "DRAFT"
                ? "Create a post and save it as a draft to see it here."
                : "No posts match the selected filter."}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => openSheet()}>
              <PlusIcon className="size-4" />
              Create Post
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="mb-3 text-sm text-muted-foreground">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
            </p>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onClick={() => editPost(post)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

type PostCardProps = {
  post: Post
  onClick: () => void
}

const PostCard = ({ post, onClick }: PostCardProps) => {
  const style = statusStyles[post.status] ?? statusStyles.DRAFT

  return (
    <button
      type="button"
      className="flex w-full items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-[10px]", style.className)}>
            {style.label}
          </Badge>
          <div className="flex items-center gap-1">
            {post.platforms.map((platform) => {
              const Icon = platformIcons[platform]
              return (
                <span key={platform} className="text-muted-foreground" title={platformLabels[platform]}>
                  <Icon className="size-3.5" />
                </span>
              )
            })}
          </div>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm">{post.content}</p>
        {post.mediaUrls.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
            <ImageIcon className="size-3" />
            {post.mediaUrls.length} {post.mediaUrls.length === 1 ? "attachment" : "attachments"}
          </div>
        )}
      </div>
      <div className="shrink-0 text-xs text-muted-foreground">
        {formatDate(post.scheduledAt ?? post.createdAt)}
      </div>
    </button>
  )
}

// ─── Media Tab ───────────────────────────────────────────────

type MediaItem = {
  url: string
  type: "image" | "video"
  postContent: string
  date: string
}

const isVideo = (url: string) => /\.(mp4|mov)(\?|$)/i.test(url)

const MediaTab = () => {
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid")
  const [typeFilter, setTypeFilter] = React.useState<"all" | "image" | "video">("all")
  const [previewItem, setPreviewItem] = React.useState<MediaItem | null>(null)

  const { data, loading } = useQuery<GetPostsResponse>(GET_POSTS, {
    fetchPolicy: "cache-and-network",
  })

  const mediaItems = React.useMemo((): Array<MediaItem> => {
    if (!data?.posts) return []
    const items: Array<MediaItem> = []
    for (const post of data.posts) {
      for (const url of post.mediaUrls) {
        items.push({
          url,
          type: isVideo(url) ? "video" : "image",
          postContent: post.content,
          date: post.createdAt,
        })
      }
    }
    return items
  }, [data])

  const filteredItems = React.useMemo(() => {
    if (typeFilter === "all") return mediaItems
    return mediaItems.filter((item) => item.type === typeFilter)
  }, [mediaItems, typeFilter])

  if (loading && !data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading media...</div>
      </div>
    )
  }

  if (mediaItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <LibraryIcon className="mb-3 size-10 text-muted-foreground" />
        <p className="text-sm font-medium">No media found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Upload images or videos when creating posts and they&apos;ll appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3">
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as "all" | "image" | "video")}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
          </SelectContent>
        </Select>
        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(v) => v && setViewMode(v as "grid" | "list")}
          className="rounded-lg border"
        >
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <GridIcon className="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view">
            <ListIcon className="size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <p className="mb-4 text-sm text-muted-foreground">
          {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
        </p>

        {viewMode === "grid" ? (
          <div className="columns-2 gap-4 space-y-4 sm:columns-3 lg:columns-4">
            {filteredItems.map((item) => (
              <button
                key={item.url}
                type="button"
                className="group relative block w-full break-inside-avoid overflow-hidden rounded-lg border bg-muted transition-shadow hover:shadow-md"
                onClick={() => setPreviewItem(item)}
              >
                {item.type === "video" ? (
                  <video src={item.url} className="w-full object-cover" muted />
                ) : (
                  <img src={item.url} alt="" className="w-full object-cover" loading="lazy" />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex items-center gap-1 text-[10px] text-white">
                    {item.type === "video" ? <VideoIcon className="size-3" /> : <ImageIcon className="size-3" />}
                    {item.type === "video" ? "Video" : "Image"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Preview</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source Post</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow
                  key={item.url}
                  className="cursor-pointer"
                  onClick={() => setPreviewItem(item)}
                >
                  <TableCell>
                    <div className="size-12 overflow-hidden rounded border bg-muted">
                      {item.type === "video" ? (
                        <video src={item.url} className="size-full object-cover" muted />
                      ) : (
                        <img src={item.url} alt="" className="size-full object-cover" loading="lazy" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs">
                      {item.type === "video" ? <VideoIcon className="size-3" /> : <ImageIcon className="size-3" />}
                      {item.type === "video" ? "Video" : "Image"}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-xs">{item.postContent}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(item.date.replace(" ", "T")).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewItem !== null} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogTitle className="sr-only">Media Preview</DialogTitle>
          <DialogDescription className="sr-only">Preview of selected media item</DialogDescription>
          {previewItem && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-lg bg-muted">
                {previewItem.type === "video" ? (
                  <video src={previewItem.url} className="max-h-[60vh] w-full" controls />
                ) : (
                  <img src={previewItem.url} alt="" className="max-h-[60vh] w-full object-contain" />
                )}
              </div>
              <p className="line-clamp-2 text-sm text-muted-foreground">{previewItem.postContent}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────

const ContentLibraryPage = () => {
  const [statusFilter, setStatusFilter] = React.useState("DRAFT")

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">Content Library</h1>
      </div>

      <Tabs defaultValue="posts" className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b px-6">
          <TabsList variant="line">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="posts" className="flex flex-1 flex-col overflow-hidden mt-0">
          <PostsTab statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} />
        </TabsContent>
        <TabsContent value="media" className="flex flex-1 flex-col overflow-hidden mt-0">
          <MediaTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export const Route = createFileRoute("/content-library")({
  component: ContentLibraryPage,
})
