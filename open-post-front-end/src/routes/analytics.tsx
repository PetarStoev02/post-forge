import { createFileRoute } from "@tanstack/react-router"
import { BarChart3Icon } from "lucide-react"
import { EmptyState } from "@/components/empty-state"

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
})

function AnalyticsPage() {
  return (
    <EmptyState
      icon={<BarChart3Icon className="size-8" />}
      title="Analytics"
      description="View detailed analytics and insights about your social media performance. Connect your accounts to start tracking."
    />
  )
}
