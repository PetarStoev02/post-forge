"use client"

import { useCallback, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "@apollo/client/react"
import { LinkedinIcon, PlusIcon, RefreshCwIcon, Trash2Icon, UsersIcon, XIcon } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DISCONNECT_SOCIAL_ACCOUNT, GET_SOCIAL_ACCOUNTS } from "@/graphql/operations/social-accounts"
import { cn } from "@/lib/utils"

function getBackendOrigin(): string {
  const url = import.meta.env.VITE_GRAPHQL_URL || "http://localhost:8000/graphql"
  return url.replace(/\/graphql\/?$/, "") || "http://localhost:8000"
}

const OAUTH_PROVIDERS = [
  { key: "x", label: "Twitter / X", icon: XIcon, path: "/auth/x/redirect" },
  { key: "linkedin-openid", label: "LinkedIn", icon: LinkedinIcon, path: "/auth/linkedin-openid/redirect" },
] as const

type Platform = "TWITTER" | "LINKEDIN" | "INSTAGRAM"

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  TWITTER: XIcon,
  LINKEDIN: LinkedinIcon,
  INSTAGRAM: XIcon,
}

const platformLabels: Record<string, string> = {
  TWITTER: "Twitter / X",
  LINKEDIN: "LinkedIn",
  INSTAGRAM: "Instagram",
}

/** OAuth redirect path per platform. Only platforms with reconnect support are listed. */
const platformOAuthPath: Partial<Record<Platform, string>> = {
  TWITTER: "/auth/x/redirect",
  LINKEDIN: "/auth/linkedin-openid/redirect",
}

const AccountsPage = () => {
  const backendOrigin = getBackendOrigin()
  const { data, loading, error } = useQuery(GET_SOCIAL_ACCOUNTS)
  const [disconnectSocialAccount] = useMutation(DISCONNECT_SOCIAL_ACCOUNT, {
    refetchQueries: [{ query: GET_SOCIAL_ACCOUNTS }],
  })
  const [disconnectId, setDisconnectId] = useState<string | null>(null)

  const accounts = data?.socialAccounts ?? []

  const handleConnect = useCallback(
    (path: string) => {
      window.location.href = `${backendOrigin}${path}`
    },
    [backendOrigin]
  )

  const handleDisconnectConfirm = useCallback(async () => {
    if (!disconnectId) return
    try {
      await disconnectSocialAccount({ variables: { id: disconnectId } })
      setDisconnectId(null)
    } catch {
      // Error handled by Apollo
    }
  }, [disconnectId, disconnectSocialAccount])

  if (loading) {
    return (
      <div className="flex h-full flex-1 items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Loading accounts…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-destructive">Failed to load connected accounts.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <>
        <EmptyState
          icon={<UsersIcon className="size-8" />}
          title="Connected Accounts"
          description="Manage your connected social media accounts. Add new accounts to start scheduling and publishing posts."
          action={
            <div className="flex flex-wrap items-center justify-center gap-2">
              {OAUTH_PROVIDERS.map(({ key, label, icon: Icon, path }) => (
                <Button key={key} onClick={() => handleConnect(path)}>
                  <Icon className="size-4" />
                  Connect {label}
                </Button>
              ))}
            </div>
          }
        />
      </>
    )
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Connected Accounts</h1>
          <p className="text-sm text-muted-foreground">
            Manage your connected social media accounts. Add more or disconnect existing ones.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {OAUTH_PROVIDERS.map(({ key, label, icon: Icon, path }) => (
            <Button key={key} variant="outline" size="sm" onClick={() => handleConnect(path)}>
              <PlusIcon className="size-4" />
              Connect {label}
            </Button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account: { id: string; platform: Platform; platformUserId: string; metadata?: { name?: string; username?: string } | null; needsReconnect?: boolean }) => {
            const Icon = platformIcons[account.platform] ?? XIcon
            const label = platformLabels[account.platform] ?? account.platform
            const displayName = account.metadata?.name ?? account.metadata?.username ?? account.platformUserId
            return (
              <Card key={account.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="size-5" />
                    {label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-1">{displayName}</CardDescription>
                  <div className="flex flex-wrap gap-2">
                    {account.needsReconnect && platformOAuthPath[account.platform] ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleConnect(platformOAuthPath[account.platform]!)}
                      >
                        <RefreshCwIcon className="size-4" />
                        Reconnect
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(account.needsReconnect && "ml-auto")}
                      onClick={() => setDisconnectId(account.id)}
                    >
                      <Trash2Icon className="size-4" />
                      Disconnect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <AlertDialog open={!!disconnectId} onOpenChange={(open) => !open && setDisconnectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the connection. You can connect again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnectConfirm}>Disconnect</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export const Route = createFileRoute("/accounts")({
  component: AccountsPage,
})
