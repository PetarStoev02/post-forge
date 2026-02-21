import { createFileRoute } from "@tanstack/react-router"
import { PlatformPage } from "@/components/platform-page"

const TwitterPage = () => <PlatformPage platform="TWITTER" />

export const Route = createFileRoute("/platforms/twitter")({
  component: TwitterPage,
})
