import { createFileRoute } from "@tanstack/react-router"
import { PlatformPage } from "@/components/platform-page"

const InstagramPage = () => <PlatformPage platform="INSTAGRAM" />

export const Route = createFileRoute("/platforms/instagram")({
  component: InstagramPage,
})
