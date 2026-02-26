import { createFileRoute } from "@tanstack/react-router"
import { PlatformPage } from "@/pages/platforms/ui/platform-page"

const LinkedinPage = () => <PlatformPage platform="LINKEDIN" />

export const Route = createFileRoute("/platforms/linkedin")({
  component: LinkedinPage,
})
