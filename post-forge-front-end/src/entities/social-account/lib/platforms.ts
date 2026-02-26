import {
  LinkedinIcon,
  MessageCircle,
  TwitterIcon,
} from "lucide-react"
import type { Platform } from "@/entities/social-account/types"

export const platformIcons: Record<Platform, React.ComponentType<{ className?: string }>> = {
  TWITTER: TwitterIcon,
  LINKEDIN: LinkedinIcon,
  THREADS: MessageCircle,
}

export const platformColors: Record<Platform, string> = {
  TWITTER: "text-[#000000]",
  LINKEDIN: "text-[#0A66C2]",
  THREADS: "text-[#000000]",
}

export const platformLabels: Record<Platform, string> = {
  TWITTER: "Twitter / X",
  LINKEDIN: "LinkedIn",
  THREADS: "Threads",
}
