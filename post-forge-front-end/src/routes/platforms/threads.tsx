import { createFileRoute } from "@tanstack/react-router"
import { PlatformPage } from "@/components/platform-page"

const ThreadsPage = () => <PlatformPage platform="THREADS" />

export const Route = createFileRoute("/platforms/threads")({
  component: ThreadsPage,
})
