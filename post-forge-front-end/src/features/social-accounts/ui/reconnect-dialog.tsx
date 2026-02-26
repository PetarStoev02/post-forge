import * as React from "react"
import { useQuery } from "@apollo/client/react"
import { AlertTriangleIcon } from "lucide-react"

import type { Platform } from "@/entities/post/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog"
import { GET_SOCIAL_ACCOUNTS } from "@/entities/social-account/api/social-accounts"
import { platformLabels } from "@/entities/social-account/lib/platforms"
import { BACKEND_ORIGIN } from "@/shared/lib/config"

type SocialAccount = {
  id: string
  platform: Platform
  needsReconnect?: boolean
  metadata?: { name?: string; username?: string } | null
}

const platformOAuthPath: Partial<Record<Platform, string>> = {
  TWITTER: "/auth/x/redirect",
  LINKEDIN: "/auth/linkedin-openid/redirect",
  THREADS: "/auth/threads/redirect",
}

export const ReconnectDialog = () => {
  const { data } = useQuery<{ socialAccounts: Array<SocialAccount> }>(GET_SOCIAL_ACCOUNTS, {
    pollInterval: 5 * 60 * 1000, // re-check every 5 minutes
  })

  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set())

  const expiredAccount = React.useMemo(() => {
    const accounts = data?.socialAccounts ?? []
    return accounts.find((a) => a.needsReconnect && !dismissed.has(a.id)) ?? null
  }, [data, dismissed])

  const handleDismiss = () => {
    if (expiredAccount) {
      setDismissed((prev) => new Set(prev).add(expiredAccount.id))
    }
  }

  const handleReconnect = () => {
    if (!expiredAccount) return
    const path = platformOAuthPath[expiredAccount.platform]
    if (path) {
      window.location.href = `${BACKEND_ORIGIN}${path}`
    }
  }

  if (!expiredAccount) return null

  const label = platformLabels[expiredAccount.platform] ?? expiredAccount.platform
  const displayName = expiredAccount.metadata?.username
    ? `@${expiredAccount.metadata.username}`
    : expiredAccount.metadata?.name ?? label

  return (
    <AlertDialog open onOpenChange={(open) => { if (!open) handleDismiss() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="size-5 text-destructive" />
            <AlertDialogTitle>{label} Connection Expired</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Your {label} account ({displayName}) has expired and needs to be reconnected.
            Reconnect now to continue viewing posts and publishing.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDismiss}>Later</AlertDialogCancel>
          <AlertDialogAction onClick={handleReconnect}>Reconnect Now</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
