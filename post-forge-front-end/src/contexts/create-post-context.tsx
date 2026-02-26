"use client"

import * as React from "react"
import type { Platform } from "@/entities/post/types"

type OpenSheetOptions = {
  date?: Date
  platforms?: Array<Platform>
  locked?: boolean
}

type CreatePostContextType = {
  isOpen: boolean
  openSheet: (options?: OpenSheetOptions) => void
  closeSheet: () => void
  preselectedDate?: Date
  preselectedPlatforms?: Array<Platform>
  platformLocked: boolean
}

const CreatePostContext = React.createContext<CreatePostContextType | undefined>(undefined)

export const CreatePostProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [preselectedDate, setPreselectedDate] = React.useState<Date | undefined>()
  const [preselectedPlatforms, setPreselectedPlatforms] = React.useState<Array<Platform> | undefined>()
  const [platformLocked, setPlatformLocked] = React.useState(false)

  const openSheet = React.useCallback((options?: OpenSheetOptions) => {
    setPreselectedDate(options?.date)
    setPreselectedPlatforms(options?.platforms)
    setPlatformLocked(options?.locked ?? false)
    setIsOpen(true)
  }, [])

  const closeSheet = React.useCallback(() => {
    setIsOpen(false)
    setPreselectedDate(undefined)
    setPreselectedPlatforms(undefined)
    setPlatformLocked(false)
  }, [])

  return (
    <CreatePostContext.Provider value={{ isOpen, openSheet, closeSheet, preselectedDate, preselectedPlatforms, platformLocked }}>
      {children}
    </CreatePostContext.Provider>
  )
}

export const useCreatePost = () => {
  const context = React.useContext(CreatePostContext)
  if (!context) {
    throw new Error("useCreatePost must be used within CreatePostProvider")
  }
  return context
}
