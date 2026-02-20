"use client"

import * as React from "react"

type CreatePostContextType = {
  isOpen: boolean
  openSheet: (preselectedDate?: Date) => void
  closeSheet: () => void
  preselectedDate?: Date
}

const CreatePostContext = React.createContext<CreatePostContextType | undefined>(undefined)

export const CreatePostProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [preselectedDate, setPreselectedDate] = React.useState<Date | undefined>()

  const openSheet = React.useCallback((date?: Date) => {
    setPreselectedDate(date)
    setIsOpen(true)
  }, [])

  const closeSheet = React.useCallback(() => {
    setIsOpen(false)
    setPreselectedDate(undefined)
  }, [])

  return (
    <CreatePostContext.Provider value={{ isOpen, openSheet, closeSheet, preselectedDate }}>
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
