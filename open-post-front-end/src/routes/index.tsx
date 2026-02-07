import { createFileRoute } from "@tanstack/react-router";
import { ContentCalendar } from "@/components/content-calendar";

export const Route = createFileRoute("/")({ component: CalendarPage });

function CalendarPage() {
  return (
    <div className="flex h-full flex-1 flex-col">
      <ContentCalendar />
    </div>
  );
}