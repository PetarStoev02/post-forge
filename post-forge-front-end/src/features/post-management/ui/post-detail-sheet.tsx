"use client"

import * as React from "react"
import { useMutation } from "@apollo/client/react"
import {
  AlertCircleIcon,
  AtSignIcon,
  CalendarClockIcon,
  CalendarIcon,
  CopyIcon,
  HashIcon,
  PencilIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import { toast } from "sonner"

import type { CreatePostInput, Platform, Post, UpdatePostInput } from "@/entities/post/types"
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert"
import { Button } from "@/shared/ui/button"
import { LoadingButton } from "@/shared/ui/loading-button"
import { Badge } from "@/shared/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu"
import { Calendar } from "@/shared/ui/calendar"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { Separator } from "@/shared/ui/separator"
import { MediaUpload } from "@/features/media-upload/ui/media-upload"
import { usePostActions } from "@/features/post-management/model/post-actions-context"
import { CREATE_POST, DELETE_POST, UPDATE_POST } from "@/entities/post/api/posts"
import { buildScheduledAt, formatDateForInput, formatDateTime } from "@/entities/post/lib/format-date"
import { platformColors, platformIcons, platformLabels } from "@/entities/social-account/lib/platforms"
import { statusStyles } from "@/entities/post/lib/post-status"
import { cn } from "@/shared/lib/utils"

const PLATFORM_MAX_CHARS: Record<Platform, number> = {
  TWITTER: 280,
  LINKEDIN: 3000,
  THREADS: 500,
}

const STATUS_DROPDOWN_OPTIONS = [
  { value: "DRAFT", label: "Draft", dotColor: "bg-slate-400" },
  { value: "SCHEDULED", label: "Scheduled", dotColor: "bg-blue-500" },
  { value: "PENDING", label: "Pending Review", dotColor: "bg-yellow-500" },
  { value: "PUBLISHED", label: "Published", dotColor: "bg-green-500" },
  { value: "CANCELLED", label: "Cancelled", dotColor: "bg-gray-400" },
  { value: "FAILED", label: "Failed", dotColor: "bg-red-500" },
] as const

const PLATFORM_OPTIONS = (Object.keys(platformIcons) as Array<Platform>).map((id) => ({
  id,
  label: platformLabels[id],
  icon: platformIcons[id],
}))

export const PostDetailSheet = () => {
  const { selectedPost, actionMode, closePost, setActionMode } = usePostActions()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  // Edit mode state
  const [editContent, setEditContent] = React.useState("")
  const [editPlatforms, setEditPlatforms] = React.useState<Array<Platform>>([])
  const [editHashtags, setEditHashtags] = React.useState<Array<string>>([])
  const [editMentions, setEditMentions] = React.useState<Array<string>>([])
  const [hashtagInput, setHashtagInput] = React.useState("")
  const [mentionInput, setMentionInput] = React.useState("")
  const [editMediaUrls, setEditMediaUrls] = React.useState<Array<string>>([])
  const [editDate, setEditDate] = React.useState<Date | undefined>()
  const [editTime, setEditTime] = React.useState("09:00")

  // Reschedule state
  const [rescheduleDate, setRescheduleDate] = React.useState<Date | undefined>()
  const [rescheduleTime, setRescheduleTime] = React.useState("09:00")

  // Mutations
  const [deletePost, { loading: deleteLoading }] = useMutation(DELETE_POST, {
    refetchQueries: "active",
    onCompleted: () => {
      toast.success("Post deleted")
      setDeleteDialogOpen(false)
      closePost()
    },
    onError: () => {
      toast.error("Failed to delete post")
    },
  })

  const [updatePost, { loading: updateLoading }] = useMutation(UPDATE_POST, {
    refetchQueries: "active",
    onCompleted: () => {
      toast.success("Post updated")
      setActionMode("view")
    },
    onError: () => {
      toast.error("Failed to update post")
    },
  })

  const [duplicatePost, { loading: duplicateLoading }] = useMutation(CREATE_POST, {
    refetchQueries: "active",
    onCompleted: () => {
      toast.success("Post duplicated")
      closePost()
    },
    onError: () => {
      toast.error("Failed to duplicate post")
    },
  })

  // Initialize edit state when switching to edit mode
  React.useEffect(() => {
    if (selectedPost && actionMode === "edit") {
      setEditContent(selectedPost.content)
      setEditPlatforms(selectedPost.platforms)
      setEditHashtags(selectedPost.hashtags || [])
      setEditMentions(selectedPost.mentions || [])
      setEditMediaUrls(selectedPost.mediaUrls || [])
      if (selectedPost.scheduledAt) {
        const { date, time } = formatDateForInput(selectedPost.scheduledAt)
        setEditDate(date)
        setEditTime(time)
      } else {
        setEditDate(undefined)
        setEditTime("09:00")
      }
    }
  }, [selectedPost, actionMode])

  // Initialize reschedule state
  React.useEffect(() => {
    if (selectedPost?.scheduledAt && actionMode === "reschedule") {
      const { date, time } = formatDateForInput(selectedPost.scheduledAt)
      setRescheduleDate(date)
      setRescheduleTime(time)
    }
  }, [selectedPost, actionMode])

  const handleDelete = async () => {
    if (!selectedPost) return
    await deletePost({ variables: { id: selectedPost.id } })
  }

  const handleDuplicate = async () => {
    if (!selectedPost) return
    const input: CreatePostInput = {
      content: `Duplicate of: ${selectedPost.content}`,
      platforms: selectedPost.platforms,
      status: "DRAFT",
      scheduledAt: selectedPost.scheduledAt || undefined,
      hashtags: selectedPost.hashtags || [],
      mentions: selectedPost.mentions || [],
    }
    try {
      await duplicatePost({ variables: { input } })
    } catch (error) {
      console.error("Duplicate failed:", error)
    }
  }

  const handleSaveEdit = async () => {
    if (!selectedPost) return
    const input: UpdatePostInput = {
      content: editContent,
      platforms: editPlatforms,
      hashtags: editHashtags,
      mentions: editMentions,
      mediaUrls: editMediaUrls,
      scheduledAt: editDate ? buildScheduledAt(editDate, editTime) : undefined,
    }
    await updatePost({ variables: { id: selectedPost.id, input } })
  }

  const handleSaveReschedule = async () => {
    if (!selectedPost || !rescheduleDate) return
    const scheduledAt = buildScheduledAt(rescheduleDate, rescheduleTime)
    await updatePost({ variables: { id: selectedPost.id, input: { scheduledAt } } })
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedPost) return
    await updatePost({ variables: { id: selectedPost.id, input: { status: newStatus } } })
  }

  const togglePlatform = (platform: Platform) => {
    setEditPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, "")
    if (tag && !editHashtags.includes(tag)) {
      setEditHashtags([...editHashtags, tag])
      setHashtagInput("")
    }
  }

  const addMention = () => {
    const mention = mentionInput.trim().replace(/^@/, "")
    if (mention && !editMentions.includes(mention)) {
      setEditMentions([...editMentions, mention])
      setMentionInput("")
    }
  }

  // Handle delete mode - show only the dialog
  React.useEffect(() => {
    if (actionMode === "delete" && selectedPost) {
      setDeleteDialogOpen(true)
    }
  }, [actionMode, selectedPost])

  if (!selectedPost) return null

  const statusStyle = statusStyles[selectedPost.status] || statusStyles.DRAFT
  const isSheetOpen = actionMode !== null && actionMode !== "delete"

  return (
    <>
      <Sheet open={isSheetOpen} onOpenChange={(open) => !open && closePost()}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-lg">
          <SheetHeader className="border-b px-6 py-4">
            <div className="flex items-center gap-3">
              <SheetTitle>
                {actionMode === "edit" ? "Edit Post" : actionMode === "reschedule" ? "Reschedule Post" : "Post Details"}
              </SheetTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="cursor-pointer">
                    <Badge variant="outline" className={cn("cursor-pointer border", statusStyle.className)}>
                      {statusStyle.label}
                    </Badge>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {STATUS_DROPDOWN_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleStatusChange(option.value)}
                      className={selectedPost.status === option.value ? "bg-muted" : ""}
                      disabled={option.value === "SCHEDULED" && !selectedPost.scheduledAt}
                    >
                      <span className={cn("mr-2 size-2 rounded-full", option.dotColor)} />
                      {option.label}
                      {option.value === "SCHEDULED" && !selectedPost.scheduledAt && (
                        <span className="ml-2 text-xs text-muted-foreground">(needs date)</span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-6 py-4">
              {actionMode === "view" && (
                <ViewMode post={selectedPost} />
              )}

              {actionMode === "edit" && (
                <EditMode
                  content={editContent}
                  setContent={setEditContent}
                  platforms={editPlatforms}
                  togglePlatform={togglePlatform}
                  scheduledDate={editDate}
                  setScheduledDate={setEditDate}
                  scheduledTime={editTime}
                  setScheduledTime={setEditTime}
                  hashtags={editHashtags}
                  setHashtags={setEditHashtags}
                  hashtagInput={hashtagInput}
                  setHashtagInput={setHashtagInput}
                  addHashtag={addHashtag}
                  mentions={editMentions}
                  setMentions={setEditMentions}
                  mentionInput={mentionInput}
                  setMentionInput={setMentionInput}
                  addMention={addMention}
                  mediaUrls={editMediaUrls}
                  setMediaUrls={setEditMediaUrls}
                />
              )}

              {actionMode === "reschedule" && (
                <RescheduleMode
                  date={rescheduleDate}
                  setDate={setRescheduleDate}
                  time={rescheduleTime}
                  setTime={setRescheduleTime}
                />
              )}
            </div>
          </ScrollArea>

          <SheetFooter className="border-t px-6 py-4">
            {actionMode === "view" && (
              <div className="flex w-full gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setActionMode("edit")}
                >
                  <PencilIcon className="mr-2 size-4" />
                  Edit
                </Button>
                <LoadingButton
                  variant="outline"
                  className="flex-1"
                  onClick={handleDuplicate}
                  loading={duplicateLoading}
                >
                  <CopyIcon className="mr-2 size-4" />
                  Duplicate
                </LoadingButton>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setActionMode("reschedule")}
                >
                  <CalendarClockIcon className="mr-2 size-4" />
                  Reschedule
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            )}

            {actionMode === "edit" && (
              <div className="flex w-full gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setActionMode("view")}
                >
                  Cancel
                </Button>
                <LoadingButton
                  className="flex-1"
                  onClick={handleSaveEdit}
                  loading={updateLoading}
                >
                  Save Changes
                </LoadingButton>
              </div>
            )}

            {actionMode === "reschedule" && (
              <div className="flex w-full gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setActionMode("view")}
                >
                  Cancel
                </Button>
                <LoadingButton
                  className="flex-1"
                  onClick={handleSaveReschedule}
                  disabled={!rescheduleDate}
                  loading={updateLoading}
                >
                  Save New Schedule
                </LoadingButton>
              </div>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open)
        if (!open && actionMode === "delete") {
          closePost()
        }
      }}>
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
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

const ViewMode = ({ post }: { post: Post }) => {
  return (
    <div className="space-y-6">
      {/* Platforms */}
      <div>
        <Label className="text-xs font-medium text-muted-foreground">PLATFORMS</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {post.platforms.map((platform) => {
            const Icon = platformIcons[platform]
            return (
              <div
                key={platform}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1.5"
              >
                <Icon className={cn("size-4", platformColors[platform])} />
                <span className="text-sm">{platformLabels[platform]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div>
        <Label className="text-xs font-medium text-muted-foreground">CONTENT</Label>
        <p className="mt-2 whitespace-pre-wrap text-sm">{post.content}</p>
      </div>

      {/* Media */}
      {post.mediaUrls && post.mediaUrls.length > 0 && (
        <div>
          <Label className="text-xs font-medium text-muted-foreground">MEDIA</Label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {post.mediaUrls.map((url) => (
              <div key={url} className="overflow-hidden rounded-md border bg-muted">
                {url.match(/\.(mp4|mov)(\?|$)/i) ? (
                  <video src={url} className="aspect-square w-full object-cover" muted controls />
                ) : (
                  <img src={url} alt="" className="aspect-square w-full object-cover" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule */}
      {post.scheduledAt && (
        <div>
          <Label className="text-xs font-medium text-muted-foreground">SCHEDULED FOR</Label>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <CalendarIcon className="size-4 text-muted-foreground" />
            <span>{formatDateTime(post.scheduledAt)}</span>
          </div>
        </div>
      )}

      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div>
          <Label className="text-xs font-medium text-muted-foreground">HASHTAGS</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.hashtags.map((tag) => (
              <Badge key={tag} variant="secondary">
                <HashIcon className="mr-1 size-3" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Mentions */}
      {post.mentions && post.mentions.length > 0 && (
        <div>
          <Label className="text-xs font-medium text-muted-foreground">MENTIONS</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.mentions.map((mention) => (
              <Badge key={mention} variant="secondary">
                <AtSignIcon className="mr-1 size-3" />
                {mention}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {post.status === "FAILED" && post.errorMessage && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertTitle>Publishing Failed</AlertTitle>
          <AlertDescription>{post.errorMessage}</AlertDescription>
        </Alert>
      )}

      <Separator />

      {/* Metadata */}
      <div className="space-y-2 text-xs text-muted-foreground">
        <div>Created: {formatDateTime(post.createdAt)}</div>
        <div>Updated: {formatDateTime(post.updatedAt)}</div>
      </div>
    </div>
  )
}

type EditModeProps = {
  content: string
  setContent: (content: string) => void
  platforms: Array<Platform>
  togglePlatform: (platform: Platform) => void
  scheduledDate: Date | undefined
  setScheduledDate: (date: Date | undefined) => void
  scheduledTime: string
  setScheduledTime: (time: string) => void
  hashtags: Array<string>
  setHashtags: (hashtags: Array<string>) => void
  hashtagInput: string
  setHashtagInput: (input: string) => void
  addHashtag: () => void
  mentions: Array<string>
  setMentions: (mentions: Array<string>) => void
  mentionInput: string
  setMentionInput: (input: string) => void
  addMention: () => void
  mediaUrls: Array<string>
  setMediaUrls: (urls: Array<string>) => void
}

const EditMode = ({
  content,
  setContent,
  platforms,
  togglePlatform,
  scheduledDate,
  setScheduledDate,
  scheduledTime,
  setScheduledTime,
  hashtags,
  setHashtags,
  hashtagInput,
  setHashtagInput,
  addHashtag,
  mentions,
  setMentions,
  mentionInput,
  setMentionInput,
  addMention,
  mediaUrls,
  setMediaUrls,
}: EditModeProps) => {
  return (
    <div className="space-y-5">
      {/* Platform Selection */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">PLATFORMS</Label>
        <div className="flex gap-2">
          {PLATFORM_OPTIONS.map((platform) => (
            <button
              key={platform.id}
              type="button"
              onClick={() => togglePlatform(platform.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                platforms.includes(platform.id)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input hover:bg-muted"
              )}
            >
              <platform.icon className="size-3.5" />
              <span>{platform.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">CONTENT</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className={cn(
            "resize-none",
            platforms.some((p) => content.length > (PLATFORM_MAX_CHARS[p] ?? 280)) && "border-destructive"
          )}
        />
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {platforms.map((p) => {
            const max = PLATFORM_MAX_CHARS[p] ?? 280
            const over = content.length > max
            return (
              <span key={p} className={cn(over && "text-destructive")}>
                {platformLabels[p]}: {content.length}/{max}
              </span>
            )
          })}
        </div>
      </div>

      {/* Media */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">MEDIA</Label>
        <MediaUpload mediaUrls={mediaUrls} onChange={setMediaUrls} />
      </div>

      {/* Schedule */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">SCHEDULE</Label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 justify-start gap-2 font-normal">
                <CalendarIcon className="size-4 text-muted-foreground" />
                {scheduledDate
                  ? scheduledDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={scheduledDate}
                onSelect={setScheduledDate}
              />
            </PopoverContent>
          </Popover>
          <Input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="w-28"
          />
        </div>
      </div>

      {/* Hashtags */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">HASHTAGS</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Enter hashtag"
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addHashtag()
              }
            }}
            className="h-9"
          />
          <Button type="button" variant="outline" size="sm" onClick={addHashtag}>
            Add
          </Button>
        </div>
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {hashtags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                #{tag}
                <button
                  type="button"
                  onClick={() => setHashtags(hashtags.filter((t) => t !== tag))}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Mentions */}
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">MENTIONS</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Enter username"
            value={mentionInput}
            onChange={(e) => setMentionInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addMention()
              }
            }}
            className="h-9"
          />
          <Button type="button" variant="outline" size="sm" onClick={addMention}>
            Add
          </Button>
        </div>
        {mentions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {mentions.map((mention) => (
              <Badge key={mention} variant="secondary" className="gap-1 pr-1">
                @{mention}
                <button
                  type="button"
                  onClick={() => setMentions(mentions.filter((m) => m !== mention))}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

type RescheduleModeProps = {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  time: string
  setTime: (time: string) => void
}

const RescheduleMode = ({ date, setDate, time, setTime }: RescheduleModeProps) => {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground">NEW DATE & TIME</Label>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 justify-start gap-2 font-normal">
                <CalendarIcon className="size-4 text-muted-foreground" />
                {date
                  ? date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(d) => d < new Date()}
              />
            </PopoverContent>
          </Popover>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-28"
          />
        </div>
      </div>
    </div>
  )
}
