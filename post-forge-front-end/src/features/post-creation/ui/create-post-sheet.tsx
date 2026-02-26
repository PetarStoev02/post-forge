"use client"

import * as React from "react"
import { useMutation } from "@apollo/client/react"
import {
  CalendarIcon,
  XIcon,
} from "lucide-react"

import { toast } from "sonner"

import type { CreatePostInput, Platform } from "@/entities/post/types"
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
import { Textarea } from "@/shared/ui/textarea"
import { Calendar } from "@/shared/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { MediaUpload } from "@/features/media-upload/ui/media-upload"
import { useCreatePost } from "@/features/post-creation/model/create-post-context"
import { CREATE_POST } from "@/entities/post/api/posts"
import { platformIcons, platformLabels } from "@/entities/social-account/lib/platforms"
import { cn } from "@/shared/lib/utils"

const PLATFORM_MAX_CHARS: Record<Platform, number> = {
  TWITTER: 280,
  LINKEDIN: 3000,
  THREADS: 500,
}

const PLATFORM_OPTIONS = (Object.keys(platformIcons) as Array<Platform>).map((id) => ({
  id,
  label: platformLabels[id],
  icon: platformIcons[id],
  maxChars: PLATFORM_MAX_CHARS[id],
}))

export const CreatePostSheet = () => {
  const { isOpen, closeSheet, preselectedDate, preselectedPlatforms, platformLocked } = useCreatePost()

  // Form state
  const [content, setContent] = React.useState("")
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<Array<Platform>>([])
  const [scheduledDate, setScheduledDate] = React.useState<Date | undefined>(preselectedDate)
  const [scheduledTime, setScheduledTime] = React.useState("09:00")
  const [hashtags, setHashtags] = React.useState<Array<string>>([])
  const [hashtagInput, setHashtagInput] = React.useState("")
  const [mentions, setMentions] = React.useState<Array<string>>([])
  const [mentionInput, setMentionInput] = React.useState("")
  const [mediaUrls, setMediaUrls] = React.useState<Array<string>>([])
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [postMode, setPostMode] = React.useState<"schedule" | "now" | "draft">("schedule")

  // Apollo mutation
  const [createPost, { loading }] = useMutation(CREATE_POST, {
    refetchQueries: "active",
    onCompleted: () => {
      toast.success("Post created")
      closeSheet()
      resetForm()
    },
    onError: (error: Error) => {
      toast.error("Failed to create post")
      setErrors({ submit: error.message })
    },
  })

  // Reset form when sheet closes
  React.useEffect(() => {
    if (!isOpen) {
      resetForm()
    }
  }, [isOpen])

  // Set preselected date when provided
  React.useEffect(() => {
    if (preselectedDate) {
      setScheduledDate(preselectedDate)
    }
  }, [preselectedDate])

  // Set preselected platforms when provided
  React.useEffect(() => {
    if (preselectedPlatforms && preselectedPlatforms.length > 0) {
      setSelectedPlatforms(preselectedPlatforms)
    }
  }, [preselectedPlatforms])

  const resetForm = () => {
    setContent("")
    setSelectedPlatforms([])
    setScheduledDate(undefined)
    setScheduledTime("09:00")
    setHashtags([])
    setMentions([])
    setMediaUrls([])
    setErrors({})
    setHashtagInput("")
    setMentionInput("")
    setPostMode("schedule")
  }

  const togglePlatform = (platform: Platform) => {
    if (platformLocked) return
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  const getMinCharacterLimit = () => {
    if (selectedPlatforms.length === 0) return 280
    return Math.min(
      ...selectedPlatforms.map(
        (p) => PLATFORM_OPTIONS.find((opt) => opt.id === p)?.maxChars ?? 280
      )
    )
  }

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, "")
    if (tag && !hashtags.includes(tag)) {
      setHashtags([...hashtags, tag])
      setHashtagInput("")
    }
  }

  const removeHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag))
  }

  const addMention = () => {
    const mention = mentionInput.trim().replace(/^@/, "")
    if (mention && !mentions.includes(mention)) {
      setMentions([...mentions, mention])
      setMentionInput("")
    }
  }

  const removeMention = (mention: string) => {
    setMentions(mentions.filter((m) => m !== mention))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!content.trim()) {
      newErrors.content = "Content is required"
    }

    if (selectedPlatforms.length === 0) {
      newErrors.platforms = "Select at least one platform"
    }

    const charLimit = getMinCharacterLimit()
    if (content.length > charLimit) {
      newErrors.content = `Content exceeds ${charLimit} character limit`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (asDraft: boolean = false) => {
    if (!validateForm()) return

    const pad = (n: number) => n.toString().padStart(2, '0')
    let scheduledAt: string | undefined
    let status: CreatePostInput["status"] = "DRAFT"

    if (asDraft) {
      status = "DRAFT"
    } else if (postMode === "now") {
      // Set scheduled time to now for immediate publishing
      const now = new Date()
      scheduledAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:00`
      status = "SCHEDULED"
    } else if (scheduledDate) {
      const [hours, minutes] = scheduledTime.split(":").map(Number)
      const date = new Date(scheduledDate)
      date.setHours(hours, minutes, 0, 0)
      scheduledAt = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(hours)}:${pad(minutes)}:00`
      status = "SCHEDULED"
    }

    const input: CreatePostInput = {
      content: content.trim(),
      platforms: selectedPlatforms,
      status,
      scheduledAt,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      hashtags,
      mentions,
    }

    await createPost({ variables: { input } })
  }

  const charLimit = getMinCharacterLimit()
  const charCount = content.length
  const isOverLimit = charCount > charLimit

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeSheet()}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>
            {platformLocked && selectedPlatforms.length === 1
              ? `Create ${platformLabels[selectedPlatforms[0]]} Post`
              : "Create Post"}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-5 px-6 py-4">
            {/* Platform Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                {platformLocked ? "PLATFORM" : "PLATFORMS"}
              </Label>
              {platformLocked && selectedPlatforms.length === 1 ? (
                <div className="flex gap-2">
                  {(() => {
                    const p = PLATFORM_OPTIONS.find((opt) => opt.id === selectedPlatforms[0])
                    if (!p) return null
                    return (
                      <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
                        <p.icon className="size-3.5" />
                        {p.label}
                      </Badge>
                    )
                  })()}
                </div>
              ) : (
                <div className="flex gap-2">
                  {PLATFORM_OPTIONS.map((platform) => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => togglePlatform(platform.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                        selectedPlatforms.includes(platform.id)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input hover:bg-muted"
                      )}
                    >
                      <platform.icon className="size-3.5" />
                      <span>{platform.label}</span>
                    </button>
                  ))}
                </div>
              )}
              {errors.platforms && (
                <p className="text-xs text-destructive">{errors.platforms}</p>
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">CONTENT</Label>
              <Textarea
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className={cn("resize-none", isOverLimit && "border-destructive")}
              />
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {selectedPlatforms.length > 1 ? (
                  selectedPlatforms.map((p) => {
                    const max = PLATFORM_MAX_CHARS[p]
                    const over = charCount > max
                    return (
                      <span key={p} className={cn(over && "text-destructive")}>
                        {platformLabels[p]}: {charCount}/{max}
                      </span>
                    )
                  })
                ) : (
                  <span className={cn(isOverLimit && "text-destructive")}>
                    {charCount} / {charLimit}
                  </span>
                )}
              </div>
              {errors.content && (
                <p className="text-xs text-destructive">{errors.content}</p>
              )}
            </div>

            {/* Media */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">MEDIA</Label>
              <MediaUpload mediaUrls={mediaUrls} onChange={setMediaUrls} />
            </div>

            {/* Post Mode */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">WHEN TO POST</Label>
              <Tabs value={postMode} onValueChange={(v) => setPostMode(v as "schedule" | "now" | "draft")}>
                <TabsList className="w-full">
                  <TabsTrigger value="schedule" className="flex-1">Schedule</TabsTrigger>
                  <TabsTrigger value="now" className="flex-1">Post Now</TabsTrigger>
                  <TabsTrigger value="draft" className="flex-1">Save Draft</TabsTrigger>
                </TabsList>
                <TabsContent value="schedule">
                  <div className="flex gap-2 pt-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 justify-start gap-2 font-normal">
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
                          disabled={(date) => date < new Date()}
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
                </TabsContent>
                <TabsContent value="now">
                  <p className="pt-2 text-xs text-muted-foreground">
                    Your post will be published immediately after creation.
                  </p>
                </TabsContent>
                <TabsContent value="draft">
                  <p className="pt-2 text-xs text-muted-foreground">
                    Save as draft without scheduling. You can schedule it later.
                  </p>
                </TabsContent>
              </Tabs>
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
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeHashtag(tag)}
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
                    <Badge
                      key={mention}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      @{mention}
                      <button
                        type="button"
                        onClick={() => removeMention(mention)}
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
        </ScrollArea>

        <SheetFooter className="border-t px-6 py-4">
          {errors.submit && (
            <p className="mb-2 w-full text-sm text-destructive">{errors.submit}</p>
          )}
          <LoadingButton
            onClick={() => handleSubmit(postMode === "draft")}
            disabled={postMode === "schedule" && !scheduledDate}
            loading={loading}
            className="w-full"
          >
            {postMode === "schedule" ? "Schedule Post" : postMode === "now" ? "Publish Now" : "Save Draft"}
          </LoadingButton>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
