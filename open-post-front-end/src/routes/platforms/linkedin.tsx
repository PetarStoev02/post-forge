import { createFileRoute } from "@tanstack/react-router"
import { LinkedinIcon, PlusIcon } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"

export const Route = createFileRoute("/platforms/linkedin")({
  component: LinkedinPage,
})

function LinkedinPage() {
  return (
    <EmptyState
      icon={<LinkedinIcon className="size-8" />}
      title="LinkedIn"
      description="Manage your LinkedIn posts and professional content. Connect your account to start scheduling updates."
      action={
        <Button>
          <PlusIcon className="size-4" />
          Connect LinkedIn
        </Button>
      }
    />
  )
}
