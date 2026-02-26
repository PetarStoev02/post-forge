"use client"

import * as React from "react"
import { Link, useLocation } from "@tanstack/react-router"
import { useQuery } from "@apollo/client/react"
import {
  BarChart3Icon,
  CalendarIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  LinkedinIcon,
  MessageCircle,
  PlusIcon,
  TwitterIcon,
  UsersIcon,
} from "lucide-react"

import type { Platform } from "@/entities/post/types"
import { AccountSwitcher } from "@/features/social-accounts/ui/account-switcher"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import { useCreatePost } from "@/features/post-creation/model/create-post-context"
import { GET_SOCIAL_ACCOUNTS } from "@/entities/social-account/api/social-accounts"
import { platformLabels } from "@/entities/social-account/lib/platforms"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
} from "@/shared/ui/sidebar"

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Calendar",
    url: "/",
    icon: CalendarIcon,
  },
  {
    title: "Content Library",
    url: "/content-library",
    icon: LibraryIcon,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3Icon,
  },
  {
    title: "Accounts",
    url: "/accounts",
    icon: UsersIcon,
  },
]

type PlatformDef = {
  platform: Platform
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

const platformDefs: Array<PlatformDef> = [
  { platform: "THREADS", title: "Threads", url: "/platforms/threads", icon: MessageCircle },
  { platform: "TWITTER", title: "Twitter / X", url: "/platforms/twitter", icon: TwitterIcon },
  { platform: "LINKEDIN", title: "LinkedIn", url: "/platforms/linkedin", icon: LinkedinIcon },
]

type SocialAccountData = {
  socialAccounts: Array<{
    id: string
    platform: string
    metadata?: { name?: string; username?: string; avatar?: string } | null
  }>
}

export const AppSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const location = useLocation()
  const { openSheet } = useCreatePost()
  const { data: accountsData } = useQuery<SocialAccountData>(GET_SOCIAL_ACCOUNTS)

  const accounts = accountsData?.socialAccounts ?? []

  const getAccountForPlatform = (platform: Platform) =>
    accounts.find((a) => a.platform === platform) ?? null

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-16 border-b border-sidebar-border">
        <AccountSwitcher accounts={accounts} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator className="mx-0" />
        <SidebarGroup>
          <SidebarGroupLabel>Platforms</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {platformDefs.map((def) => {
                const account = getAccountForPlatform(def.platform)
                return (
                  <SidebarMenuItem key={def.platform}>
                    <SidebarMenuButton
                      asChild
                      isActive={location.pathname === def.url}
                    >
                      <Link to={def.url} className="flex items-center gap-2">
                        {account?.metadata?.avatar ? (
                          <Avatar className="size-4">
                            <AvatarImage src={account.metadata.avatar} alt={def.title} />
                            <AvatarFallback className="text-[8px]">
                              <def.icon className="size-3" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <def.icon className="size-4" />
                        )}
                        <span>
                          {account?.metadata?.name ?? account?.metadata?.username ?? def.title}
                        </span>
                        {!account && (
                          <span className="ml-auto text-[10px] text-muted-foreground">
                            not connected
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => openSheet()}>
              <PlusIcon />
              <span>New Post</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarTrigger className="h-8 w-full justify-start px-2" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
