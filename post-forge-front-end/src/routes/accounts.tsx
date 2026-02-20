import { createFileRoute } from "@tanstack/react-router"
import { UsersIcon, PlusIcon } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"

const AccountsPage = () => {
  return (
    <EmptyState
      icon={<UsersIcon className="size-8" />}
      title="Connected Accounts"
      description="Manage your connected social media accounts. Add new accounts to start scheduling and publishing posts."
      action={
        <Button>
          <PlusIcon className="size-4" />
          Connect Account
        </Button>
      }
    />
  )
}

export const Route = createFileRoute("/accounts")({
  component: AccountsPage,
})
