"use client"

import * as React from "react"
import { useMutation } from "@apollo/client/react"
import {
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  CalendarIcon,
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
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreatePost } from "@/contexts/create-post-context"
import { CREATE_POST } from "@/graphql/operations/posts"
import type { Platform, CreatePostInput } from "@/types/post"
import { cn } from "@/lib/utils"

const PLATFORM_OPTIONS = [
  { id: "TWITTER" as Platform, label: "Twitter", icon: TwitterIcon, maxChars: 280 },
  { id: "INSTAGRAM" as Platform, label: "Instagram", icon: InstagramIcon, maxChars: 2200 },
  { id: "LINKEDIN" as Platform, label: "LinkedIn", icon: LinkedinIcon, maxChars: 3000 },
]

export function CreatePostSheet() {
  const { isOpen, closeSheet, preselectedDate } = useCreatePost()

  // Form state
  const [content, setContent] = React.useState("")
  const [selectedPlatforms, setSelectedPlatforms] = React.useState<Platform[]>([])
  const [scheduledDate, setScheduledDate] = React.useState<Date | undefined>(preselectedDate)
  const [scheduledTime, setScheduledTime] = React.useState("09:00")
  const [hashtags, setHashtags] = React.useState<string[]>([])
  const [hashtagInput, setHashtagInput] = React.useState("")
  const [mentions, setMentions] = React.useState<string[]>([])
  const [mentionInput, setMentionInput] = React.useState("")
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Apollo mutation
  const [createPost, { loading }] = useMutation(CREATE_POST, {
    refetchQueries: "active",
    onCompleted: () => {
      closeSheet()
      resetForm()
    },
    onError: (error: Error) => {
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

  const resetForm = () => {
    setContent("")
    setSelectedPlatforms([])
    setScheduledDate(undefined)
    setScheduledTime("09:00")
    setHashtags([])
    setMentions([])
    setErrors({})
    setHashtagInput("")
    setMentionInput("")
  }

  const togglePlatform = (platform: Platform) => {
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

    let scheduledAt: string | undefined
    if (!asDraft && scheduledDate) {
      const [hours, minutes] = scheduledTime.split(":").map(Number)
      const date = new Date(scheduledDate)
      date.setHours(hours, minutes, 0, 0)
      // Format as Y-m-d H:i:s for Lighthouse DateTime scalar
      const pad = (n: number) => n.toString().padStart(2, '0')
      scheduledAt = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(hours)}:${pad(minutes)}:00`
    }

    const input: CreatePostInput = {
      content: content.trim(),
      platforms: selectedPlatforms,
      status: asDraft ? "DRAFT" : "SCHEDULED",
      scheduledAt,
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
          <SheetTitle>Create Post</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
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
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className={cn(isOverLimit && "text-destructive")}>
                  {charCount} / {charLimit}
                </span>
                {selectedPlatforms.length > 1 && (
                  <span>Limit for smallest platform</span>
                )}
              </div>
              {errors.content && (
                <p className="text-xs text-destructive">{errors.content}</p>
              )}
            </div>

            {/* Schedule */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">SCHEDULE</Label>
              <div className="flex gap-2">
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
        </div>

        <SheetFooter className="border-t px-6 py-4">
          {errors.submit && (
            <p className="mb-2 w-full text-sm text-destructive">{errors.submit}</p>
          )}
          <div className="flex w-full gap-2">
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
              disabled={loading}
              className="flex-1"
            >
              Save Draft
            </Button>
            <Button
              onClick={() => handleSubmit(false)}
              disabled={loading || !scheduledDate}
              className="flex-1"
            >
              {loading ? "Scheduling..." : "Schedule"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
