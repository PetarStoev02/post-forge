import { Link, createFileRoute } from "@tanstack/react-router"
import { MessageCircle, PlusIcon } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"

const ThreadsPage = () => {
  return (
    <EmptyState
      icon={<MessageCircle className="size-8" />}
      title="Threads"
      description="Manage your Threads posts. Connect your account in Accounts to start scheduling content."
      action={
        <Button asChild>
          <Link to="/accounts">
            <PlusIcon className="size-4" />
            Connect in Accounts
          </Link>
        </Button>
      }
    />
  )
}

export const Route = createFileRoute("/platforms/threads")({
  component: ThreadsPage,
})
