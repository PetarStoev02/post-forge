import {
  Facebook,
  InstagramIcon,
  LinkedinIcon,
  MessageCircle,
  TwitterIcon,
} from "lucide-react"
import type { Platform } from "@/types/post"

export const platformIcons: Record<Platform, React.ComponentType<{ className?: string }>> = {
  FACEBOOK: Facebook,
  TWITTER: TwitterIcon,
  INSTAGRAM: InstagramIcon,
  LINKEDIN: LinkedinIcon,
  THREADS: MessageCircle,
}

export const platformColors: Record<Platform, string> = {
  FACEBOOK: "text-[#1877F2]",
  TWITTER: "text-[#000000]",
  INSTAGRAM: "text-[#E4405F]",
  LINKEDIN: "text-[#0A66C2]",
  THREADS: "text-[#000000]",
}

export const platformLabels: Record<Platform, string> = {
  FACEBOOK: "Facebook",
  TWITTER: "Twitter / X",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  THREADS: "Threads",
}
