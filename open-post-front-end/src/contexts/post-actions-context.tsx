"use client"

import * as React from "react"
import type { Post } from "@/types/post"

type ActionMode = "view" | "edit" | "reschedule" | "delete" | null

interface PostActionsContextValue {
  selectedPost: Post | null
  actionMode: ActionMode
  openPost: (post: Post) => void
  editPost: (post: Post) => void
  reschedulePost: (post: Post) => void
  deletePost: (post: Post) => void
  closePost: () => void
  setActionMode: (mode: ActionMode) => void
}

const PostActionsContext = React.createContext<PostActionsContextValue | null>(null)

export function PostActionsProvider({ children }: { children: React.ReactNode }) {
  const [selectedPost, setSelectedPost] = React.useState<Post | null>(null)
  const [actionMode, setActionMode] = React.useState<ActionMode>(null)

  const openPost = React.useCallback((post: Post) => {
    setSelectedPost(post)
    setActionMode("view")
  }, [])

  const editPost = React.useCallback((post: Post) => {
    setSelectedPost(post)
    setActionMode("edit")
  }, [])

  const reschedulePost = React.useCallback((post: Post) => {
    setSelectedPost(post)
    setActionMode("reschedule")
  }, [])

  const deletePost = React.useCallback((post: Post) => {
    setSelectedPost(post)
    setActionMode("delete")
  }, [])

  const closePost = React.useCallback(() => {
    setSelectedPost(null)
    setActionMode(null)
  }, [])

  return (
    <PostActionsContext.Provider
      value={{
        selectedPost,
        actionMode,
        openPost,
        editPost,
        reschedulePost,
        deletePost,
        closePost,
        setActionMode,
      }}
    >
      {children}
    </PostActionsContext.Provider>
  )
}

export function usePostActions() {
  const context = React.useContext(PostActionsContext)
  if (!context) {
    throw new Error("usePostActions must be used within a PostActionsProvider")
  }
  return context
}
