import { createFileRoute } from "@tanstack/react-router"
import { LibraryIcon, PlusIcon } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"

const ContentLibraryPage = () => {
  return (
    <EmptyState
      icon={<LibraryIcon className="size-8" />}
      title="Content Library"
      description="Store and organize your content assets. Upload images, videos, and templates to use in your posts."
      action={
        <Button>
          <PlusIcon className="size-4" />
          Upload Content
        </Button>
      }
    />
  )
}

export const Route = createFileRoute("/content-library")({
  component: ContentLibraryPage,
})
