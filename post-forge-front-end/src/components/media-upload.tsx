"use client"

import * as React from "react"
import { ImagePlusIcon, Loader2Icon, XIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { uploadMedia } from "@/lib/upload-media"

type MediaUploadProps = {
  mediaUrls: Array<string>
  onChange: (urls: Array<string>) => void
}

const ACCEPTED_TYPES = "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"

export const MediaUpload = ({ mediaUrls, onChange }: MediaUploadProps) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)
  const [dragOver, setDragOver] = React.useState(false)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploading(true)
    const newUrls: Array<string> = []

    try {
      for (const file of Array.from(files)) {
        const url = await uploadMedia(file)
        newUrls.push(url)
      }
      onChange([...mediaUrls, ...newUrls])
    } catch {
      toast.error("Failed to upload one or more files.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleRemove = (index: number) => {
    onChange(mediaUrls.filter((_, i) => i !== index))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const isVideo = (url: string) =>
    url.match(/\.(mp4|mov)(\?|$)/i)

  return (
    <div className="space-y-3">
      {/* Preview thumbnails */}
      {mediaUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mediaUrls.map((url, i) => (
            <div key={url} className="group relative size-20 overflow-hidden rounded-md border bg-muted">
              {isVideo(url) ? (
                <video src={url} className="size-full object-cover" muted />
              ) : (
                <img src={url} alt="" className="size-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <XIcon className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed p-4 text-sm text-muted-foreground transition-colors",
          dragOver && "border-primary bg-primary/5",
        )}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click() } }}
      >
        {uploading ? (
          <>
            <Loader2Icon className="size-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <ImagePlusIcon className="size-4" />
            Drop files here or click to upload
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
