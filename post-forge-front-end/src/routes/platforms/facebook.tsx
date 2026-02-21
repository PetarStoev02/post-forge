import { createFileRoute } from "@tanstack/react-router"
import { PlatformPage } from "@/components/platform-page"

const FacebookPage = () => <PlatformPage platform="FACEBOOK" />

export const Route = createFileRoute("/platforms/facebook")({
  component: FacebookPage,
})
