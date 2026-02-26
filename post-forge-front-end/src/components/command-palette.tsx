"use client"

import * as React from "react"
import { useNavigate } from "@tanstack/react-router"
import {
  BarChart3Icon,
  CalendarIcon,
  LayoutDashboardIcon,
  LibraryIcon,
  LinkedinIcon,
  MessageCircle,
  PlusIcon,
  SettingsIcon,
  TwitterIcon,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/shared/ui/command"
import { useCreatePost } from "@/features/post-creation/model/create-post-context"

export const CommandPalette = () => {
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()
  const { openSheet } = useCreatePost()

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(() => openSheet())}>
            <PlusIcon />
            <span>Create Post</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/dashboard" }))}>
            <LayoutDashboardIcon />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/content-calendar" }))}>
            <CalendarIcon />
            <span>Content Calendar</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/content-library" }))}>
            <LibraryIcon />
            <span>Content Library</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/analytics" }))}>
            <BarChart3Icon />
            <span>Analytics</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/accounts" }))}>
            <SettingsIcon />
            <span>Accounts</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Platforms">
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/platforms/threads" }))}>
            <MessageCircle />
            <span>Threads</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/platforms/twitter" }))}>
            <TwitterIcon />
            <span>Twitter / X</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/platforms/linkedin" }))}>
            <LinkedinIcon />
            <span>LinkedIn</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
