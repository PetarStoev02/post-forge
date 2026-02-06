import { createFileRoute } from "@tanstack/react-router"
import { LayoutDashboardIcon } from "lucide-react"
import { EmptyState } from "@/components/empty-state"

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <EmptyState
      icon={<LayoutDashboardIcon className="size-8" />}
      title="Dashboard"
      description="Your dashboard overview will appear here. Track your social media performance at a glance."
    />
  )
}
