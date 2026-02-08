import { createFileRoute } from "@tanstack/react-router"
import { TwitterIcon, PlusIcon } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"

const TwitterPage = () => {
  return (
    <EmptyState
      icon={<TwitterIcon className="size-8" />}
      title="Twitter / X"
      description="Manage your Twitter/X posts and engagement. Connect your account to start scheduling tweets."
      action={
        <Button>
          <PlusIcon className="size-4" />
          Connect Twitter
        </Button>
      }
    />
  )
}

export const Route = createFileRoute("/platforms/twitter")({
  component: TwitterPage,
})
