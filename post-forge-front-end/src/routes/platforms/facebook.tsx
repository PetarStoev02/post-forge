import { Link, createFileRoute } from "@tanstack/react-router"
import { Facebook, PlusIcon } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"

const FacebookPage = () => {
  return (
    <EmptyState
      icon={<Facebook className="size-8" />}
      title="Facebook"
      description="Manage your Facebook posts and pages. Connect your account in Accounts to start scheduling content."
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

export const Route = createFileRoute("/platforms/facebook")({
  component: FacebookPage,
})
