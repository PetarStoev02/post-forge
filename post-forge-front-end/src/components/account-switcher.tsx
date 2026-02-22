"use client"

import { Link } from "@tanstack/react-router"
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react"

import type { Platform } from "@/types/post"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { platformIcons, platformLabels } from "@/lib/platforms"

type Account = {
  id: string
  platform: string
  metadata?: { name?: string; username?: string; avatar?: string } | null
}

const platformRouteMap: Record<string, string> = {
  THREADS: "/platforms/threads",
  TWITTER: "/platforms/twitter",
  LINKEDIN: "/platforms/linkedin",
}

type AccountSwitcherProps = {
  accounts: Array<Account>
}

export const AccountSwitcher = ({ accounts }: AccountSwitcherProps) => {
  const { isMobile } = useSidebar()

  const firstAccount = accounts[0] ?? null
  const displayName = firstAccount?.metadata?.name ?? firstAccount?.metadata?.username ?? "PostForge"
  const displaySub = firstAccount
    ? platformLabels[firstAccount.platform as Platform] ?? firstAccount.platform
    : "No accounts connected"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={firstAccount?.metadata?.avatar ?? undefined} alt={displayName} />
                <AvatarFallback className="rounded-lg text-xs">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">{displaySub}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Connected Accounts
            </DropdownMenuLabel>
            {accounts.map((account) => {
              const Icon = platformIcons[account.platform as Platform]
              const name = account.metadata?.name ?? account.metadata?.username ?? account.platform
              const route = platformRouteMap[account.platform]
              return (
                <DropdownMenuItem key={account.id} asChild>
                  <Link to={route ?? "/accounts"}>
                    <Avatar className="size-6">
                      <AvatarImage src={account.metadata?.avatar ?? undefined} alt={name} />
                      <AvatarFallback className="text-[10px]">
                        {Icon && <Icon className="size-3" />}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {platformLabels[account.platform as Platform] ?? account.platform}
                    </span>
                  </Link>
                </DropdownMenuItem>
              )
            })}
            {accounts.length === 0 && (
              <DropdownMenuItem disabled>
                <span className="text-muted-foreground">No accounts connected</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/accounts">
                <PlusIcon className="size-4" />
                <span>Add account</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
