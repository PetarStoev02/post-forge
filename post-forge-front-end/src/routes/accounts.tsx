import { useCallback, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "@apollo/client/react"
import { ChevronDownIcon, ChevronRightIcon, Facebook, InstagramIcon, LinkedinIcon, MessageCircle, PlusIcon, RefreshCwIcon, Settings2Icon, Trash2Icon, UsersIcon, XIcon } from "lucide-react"
import type { Platform } from "@/types/post"
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
import {
  DISCONNECT_SOCIAL_ACCOUNT,
  GET_OAUTH_CREDENTIALS,
  GET_SOCIAL_ACCOUNTS,
  SET_OAUTH_CREDENTIALS,
} from "@/graphql/operations/social-accounts"
import { BACKEND_ORIGIN } from "@/lib/config"
import { platformLabels } from "@/lib/platforms"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


const OAUTH_PROVIDERS = [
  { key: "facebook", label: "Facebook", icon: Facebook, path: "/auth/facebook/redirect" },
  { key: "instagram", label: "Instagram", icon: InstagramIcon, path: "/auth/instagram/redirect" },
  { key: "threads", label: "Threads", icon: MessageCircle, path: "/auth/threads/redirect" },
  { key: "x", label: "Twitter / X", icon: XIcon, path: "/auth/x/redirect" },
  { key: "linkedin-openid", label: "LinkedIn", icon: LinkedinIcon, path: "/auth/linkedin-openid/redirect" },
] as const

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  FACEBOOK: Facebook,
  TWITTER: XIcon,
  LINKEDIN: LinkedinIcon,
  INSTAGRAM: InstagramIcon,
  THREADS: MessageCircle,
}

/** OAuth redirect path per platform. Only platforms with reconnect support are listed. */
const platformOAuthPath: Partial<Record<Platform, string>> = {
  FACEBOOK: "/auth/facebook/redirect",
  TWITTER: "/auth/x/redirect",
  LINKEDIN: "/auth/linkedin-openid/redirect",
  INSTAGRAM: "/auth/instagram/redirect",
  THREADS: "/auth/threads/redirect",
}

const OAUTH_CREDENTIAL_PROVIDERS = [
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "threads", label: "Threads" },
  { key: "linkedin-openid", label: "LinkedIn" },
  { key: "x", label: "Twitter / X" },
] as const

const AccountsPage = () => {
  const { data, loading, error } = useQuery<{ socialAccounts: Array<unknown> }>(GET_SOCIAL_ACCOUNTS)
  const { data: oauthData } = useQuery<{
    oauthCredentials: Array<{
      provider: string
      clientIdSet: boolean
      clientIdMasked: string | null
      clientSecretSet: boolean
    }>
  }>(GET_OAUTH_CREDENTIALS)
  const [disconnectSocialAccount] = useMutation(DISCONNECT_SOCIAL_ACCOUNT, {
    refetchQueries: [{ query: GET_SOCIAL_ACCOUNTS }],
  })
  const [setOAuthCredentials] = useMutation(SET_OAUTH_CREDENTIALS, {
    refetchQueries: [{ query: GET_OAUTH_CREDENTIALS }],
  })
  const [disconnectId, setDisconnectId] = useState<string | null>(null)
  const [oauthOpen, setOauthOpen] = useState(false)
  const [credentialForm, setCredentialForm] = useState<Record<string, { clientId: string; clientSecret: string }>>({
    facebook: { clientId: "", clientSecret: "" },
    instagram: { clientId: "", clientSecret: "" },
    threads: { clientId: "", clientSecret: "" },
    "linkedin-openid": { clientId: "", clientSecret: "" },
    x: { clientId: "", clientSecret: "" },
  })

  const accounts = (data?.socialAccounts ?? []) as Array<{
    id: string
    platform: Platform
    platformUserId: string
    metadata?: { name?: string; username?: string } | null
    needsReconnect?: boolean
  }>
  const oauthCredentials = oauthData?.oauthCredentials ?? []

  const handleConnect = useCallback(
    (path: string) => {
      window.location.href = `${BACKEND_ORIGIN}${path}`
    },
    []
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

  const handleSaveOAuthCredentials = useCallback(
    async (provider: string) => {
      const form = credentialForm[provider]
      if (!form) return
      try {
        await setOAuthCredentials({
          variables: {
            provider,
            clientId: form.clientId,
            clientSecret: form.clientSecret,
          },
        })
        setCredentialForm((prev) => ({
          ...prev,
          [provider]: { clientId: "", clientSecret: "" },
        }))
      } catch {
        // Error handled by Apollo
      }
    },
    [credentialForm, setOAuthCredentials]
  )

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

  const oauthCredentialsSection = (
    <Collapsible open={oauthOpen} onOpenChange={setOauthOpen} className="w-full">
      <Card>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span className="flex items-center gap-2">
              <Settings2Icon className="size-4" />
              OAuth app credentials
            </span>
            {oauthOpen ? (
              <ChevronDownIcon className="size-4" />
            ) : (
              <ChevronRightIcon className="size-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="border-t pt-4">
            <p className="mb-4 text-sm text-muted-foreground">
              Set LinkedIn or Twitter app credentials here instead of .env. Get them from{" "}
              <a
                href="https://www.linkedin.com/developers/apps"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                LinkedIn
              </a>{" "}
              or{" "}
              <a
                href="https://developer.twitter.com/en/portal/dashboard"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Twitter
              </a>{" "}
              developer portals.
            </p>
            <div className="space-y-6">
              {OAUTH_CREDENTIAL_PROVIDERS.map(({ key, label }) => {
                const status = oauthCredentials.find((c: { provider: string }) => c.provider === key)
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">{label}</Label>
                      {status?.clientIdSet && (
                        <span className="text-xs text-muted-foreground">
                          ID: {status.clientIdMasked ?? "••••"} · Secret:{" "}
                          {status.clientSecretSet ? "set" : "not set"}
                        </span>
                      )}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        placeholder="Client ID"
                        value={credentialForm[key]?.clientId ?? ""}
                        onChange={(e) =>
                          setCredentialForm((prev) => ({
                            ...prev,
                            [key]: { ...prev[key], clientId: e.target.value },
                          }))
                        }
                      />
                      <Input
                        type="password"
                        placeholder="Client secret"
                        value={credentialForm[key]?.clientSecret ?? ""}
                        onChange={(e) =>
                          setCredentialForm((prev) => ({
                            ...prev,
                            [key]: { ...prev[key], clientSecret: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSaveOAuthCredentials(key)}
                      disabled={
                        !credentialForm[key]?.clientId?.trim() ||
                        !credentialForm[key]?.clientSecret?.trim()
                      }
                    >
                      Save {label} credentials
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )

  if (accounts.length === 0) {
    return (
      <>
        <div className="flex flex-1 flex-col gap-6 p-6">
          {oauthCredentialsSection}
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
        </div>
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

        {oauthCredentialsSection}

        <div className="flex flex-wrap gap-2">
          {OAUTH_PROVIDERS.map(({ key, label, path }) => (
            <Button key={key} variant="outline" size="sm" onClick={() => handleConnect(path)}>
              <PlusIcon className="size-4" />
              Connect {label}
            </Button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
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
