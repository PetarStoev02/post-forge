import type { PostStatus } from "@/entities/post/types"

export const statusStyles: Record<PostStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200" },
  SCHEDULED: { label: "Scheduled", className: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200" },
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200" },
  PUBLISHED: { label: "Published", className: "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-500 hover:bg-gray-200 border-gray-200" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200" },
}
