"use client"

import * as React from "react"
import { useMutation } from "@apollo/client/react"
import {
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  CalendarIcon,
  HashIcon,
  AtSignIcon,
  PencilIcon,
  CopyIcon,
  CalendarClockIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { usePostActions } from "@/contexts/post-actions-context"
import { DELETE_POST, UPDATE_POST, CREATE_POST } from "@/graphql/operations/posts"
import type { Platform, Post, UpdatePostInput, CreatePostInput } from "@/types/post"
import { cn } from "@/lib/utils"

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  TWITTER: TwitterIcon,
  INSTAGRAM: InstagramIcon,
  LINKEDIN: LinkedinIcon,
}

const platformColors: Record<string, string> = {
  TWITTER: "text-[#000000]",
  INSTAGRAM: "text-[#E4405F]",
  LINKEDIN: "text-[#0A66C2]",
}

const platformLabels: Record<string, string> = {
  TWITTER: "Twitter",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
}

const statusStyles: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  SCHEDULED: { label: "Scheduled", variant: "secondary" },
  DRAFT: { label: "Draft", variant: "outline" },
  PUBLISHED: { label: "Published", variant: "default" },
  FAILED: { label: "Failed", variant: "destructive" },
}

function formatDateTime(dateString: string): string {
  const normalizedDate = dateString.replace(" ", "T")
  const date = new Date(normalizedDate)
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function formatDateForInput(dateString: string): { date: Date; time: string } {
  const normalizedDate = dateString.replace(" ", "T")
  const date = new Date(normalizedDate)
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return { date, time: `${hours}:${minutes}` }
}

export function PostDetailSheet() {
  const { selectedPost, actionMode, closePost, setActionMode } = usePostActions()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  // Edit mode state
  const [editContent, setEditContent] = React.useState("")
  const [editPlatforms, setEditPlatforms] = React.useState<Platform[]>([])
  const [editHashtags, setEditHashtags] = React.useState<string[]>([])
  const [editMentions, setEditMentions] = React.useState<string[]>([])
  const [hashtagInput, setHashtagInput] = React.useState("")
  const [mentionInput, setMentionInput] = React.useState("")

  // Reschedule state
  const [rescheduleDate, setRescheduleDate] = React.useState<Date | undefined>()
  const [rescheduleTime, setRescheduleTime] = React.useState("09:00")

  // Mutations
  const [deletePost, { loading: deleteLoading }] = useMutation(DELETE_POST, {
    refetchQueries: "active",
    onCompleted: () => {
      setDeleteDialogOpen(false)
      closePost()
    },
  })

  const [updatePost, { loading: updateLoading }] = useMutation(UPDATE_POST, {
    refetchQueries: "active",
    onCompleted: () => {
      setActionMode("view")
    },
  })

  const [duplicatePost, { loading: duplicateLoading }] = useMutation(CREATE_POST, {
    refetchQueries: "active",
    onCompleted: () => {
      closePost()
    },
    onError: (error) => {
      console.error("Duplicate post error:", error)
    },
  })

  // Initialize edit state when switching to edit mode
  React.useEffect(() => {
    if (selectedPost && actionMode === "edit") {
      setEditContent(selectedPost.content)
      setEditPlatforms(selectedPost.platforms)
      setEditHashtags(selectedPost.hashtags || [])
      setEditMentions(selectedPost.mentions || [])
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
    }
    await updatePost({ variables: { id: selectedPost.id, input } })
  }

  const handleSaveReschedule = async () => {
    if (!selectedPost || !rescheduleDate) return
    const [hours, minutes] = rescheduleTime.split(":").map(Number)
    const date = new Date(rescheduleDate)
    date.setHours(hours, minutes, 0, 0)
    const pad = (n: number) => n.toString().padStart(2, "0")
    const scheduledAt = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(hours)}:${pad(minutes)}:00`

    await updatePost({ variables: { id: selectedPost.id, input: { scheduledAt } } })
  }

  const handleStatusChange = async (newStatus: "DRAFT" | "SCHEDULED") => {
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
                    <Badge variant={statusStyle.variant} className="cursor-pointer hover:opacity-80">
                      {statusStyle.label}
                    </Badge>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={() => handleStatusChange("DRAFT")}
                    className={selectedPost.status === "DRAFT" ? "bg-muted" : ""}
                  >
                    Draft
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusChange("SCHEDULED")}
                    className={selectedPost.status === "SCHEDULED" ? "bg-muted" : ""}
                    disabled={!selectedPost.scheduledAt}
                  >
                    Scheduled
                    {!selectedPost.scheduledAt && <span className="ml-2 text-xs text-muted-foreground">(needs date)</span>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {actionMode === "view" && (
              <ViewMode post={selectedPost} />
            )}

            {actionMode === "edit" && (
              <EditMode
                content={editContent}
                setContent={setEditContent}
                platforms={editPlatforms}
                togglePlatform={togglePlatform}
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
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDuplicate}
                  disabled={duplicateLoading}
                >
                  <CopyIcon className="mr-2 size-4" />
                  {duplicateLoading ? "Duplicating..." : "Duplicate"}
                </Button>
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
                <Button
                  className="flex-1"
                  onClick={handleSaveEdit}
                  disabled={updateLoading}
                >
                  {updateLoading ? "Saving..." : "Save Changes"}
                </Button>
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
                <Button
                  className="flex-1"
                  onClick={handleSaveReschedule}
                  disabled={updateLoading || !rescheduleDate}
                >
                  {updateLoading ? "Saving..." : "Save New Schedule"}
                </Button>
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

function ViewMode({ post }: { post: Post }) {
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

      <Separator />

      {/* Metadata */}
      <div className="space-y-2 text-xs text-muted-foreground">
        <div>Created: {formatDateTime(post.createdAt)}</div>
        <div>Updated: {formatDateTime(post.updatedAt)}</div>
      </div>
    </div>
  )
}

interface EditModeProps {
  content: string
  setContent: (content: string) => void
  platforms: Platform[]
  togglePlatform: (platform: Platform) => void
  hashtags: string[]
  setHashtags: (hashtags: string[]) => void
  hashtagInput: string
  setHashtagInput: (input: string) => void
  addHashtag: () => void
  mentions: string[]
  setMentions: (mentions: string[]) => void
  mentionInput: string
  setMentionInput: (input: string) => void
  addMention: () => void
}

function EditMode({
  content,
  setContent,
  platforms,
  togglePlatform,
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
}: EditModeProps) {
  const PLATFORM_OPTIONS: { id: Platform; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "TWITTER", label: "Twitter", icon: TwitterIcon },
    { id: "INSTAGRAM", label: "Instagram", icon: InstagramIcon },
    { id: "LINKEDIN", label: "LinkedIn", icon: LinkedinIcon },
  ]

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
          className="resize-none"
        />
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

interface RescheduleModeProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  time: string
  setTime: (time: string) => void
}

function RescheduleMode({ date, setDate, time, setTime }: RescheduleModeProps) {
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
