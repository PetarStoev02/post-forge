"use client"

import * as React from "react"
import { Link, useLocation } from "@tanstack/react-router"
import {
  LayoutDashboardIcon,
  CalendarIcon,
  LibraryIcon,
  BarChart3Icon,
  UsersIcon,
  TwitterIcon,
  InstagramIcon,
  LinkedinIcon,
  PlusIcon,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import { useCreatePost } from "@/contexts/create-post-context"
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
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
}

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

const platformItems = [
  {
    title: "Twitter / X",
    url: "/platforms/twitter",
    icon: TwitterIcon,
  },
  {
    title: "Instagram",
    url: "/platforms/instagram",
    icon: InstagramIcon,
  },
  {
    title: "LinkedIn",
    url: "/platforms/linkedin",
    icon: LinkedinIcon,
  },
]

export const AppSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  const location = useLocation()
  const { openSheet } = useCreatePost()

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-16 border-b border-sidebar-border">
        <NavUser user={data.user} />
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
              {platformItems.map((item) => (
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
