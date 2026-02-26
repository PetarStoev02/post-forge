import { createFileRoute } from "@tanstack/react-router"
import { ContentCalendar } from "@/features/content-calendar/ui/content-calendar"

const CalendarPage = () => {
  return (
    <div className="flex h-full flex-1 flex-col">
      <ContentCalendar />
    </div>
  )
}

export const Route = createFileRoute("/")({ component: CalendarPage })
