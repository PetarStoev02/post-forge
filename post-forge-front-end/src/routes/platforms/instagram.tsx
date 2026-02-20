import { createFileRoute } from "@tanstack/react-router"
import { InstagramIcon, PlusIcon } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"

const InstagramPage = () => {
  return (
    <EmptyState
      icon={<InstagramIcon className="size-8" />}
      title="Instagram"
      description="Manage your Instagram posts, stories, and reels. Connect your account to start scheduling content."
      action={
        <Button>
          <PlusIcon className="size-4" />
          Connect Instagram
        </Button>
      }
    />
  )
}

export const Route = createFileRoute("/platforms/instagram")({
  component: InstagramPage,
})
