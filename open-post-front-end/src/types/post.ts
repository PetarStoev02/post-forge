export type Platform = 'TWITTER' | 'INSTAGRAM' | 'LINKEDIN';
export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PENDING' | 'PUBLISHED' | 'CANCELLED' | 'FAILED';

export type LinkPreview = {
  url: string
  title?: string | null
  description?: string | null
  image?: string | null
}

export type Post = {
  id: string
  content: string
  platforms: Platform[]
  status: PostStatus
  scheduledAt?: string | null
  mediaUrls: string[]
  hashtags: string[]
  mentions: string[]
  linkPreview?: LinkPreview | null
  createdAt: string
  updatedAt: string
}

export type CreatePostInput = {
  content: string
  platforms: Platform[]
  status?: PostStatus
  scheduledAt?: string
  mediaUrls?: string[]
  hashtags?: string[]
  mentions?: string[]
  linkPreview?: {
    url: string
    title?: string
    description?: string
    image?: string
  }
}

export type UpdatePostInput = {
  content?: string
  platforms?: Platform[]
  status?: PostStatus
  scheduledAt?: string
  mediaUrls?: string[]
  hashtags?: string[]
  mentions?: string[]
  linkPreview?: {
    url: string
    title?: string
    description?: string
    image?: string
  }
}

// Query response types
export type GetCalendarPostsResponse = {
  calendarPosts: Post[]
}

export type GetPostsResponse = {
  posts: Post[]
}

export type GetPostResponse = {
  post: Post | null
}

// Dashboard types
export type DashboardStats = {
  totalPostsCount: number
  totalPostsThisMonth: number
  totalPostsLastMonth: number
  scheduledPostsCount: number
  publishedPostsCount: number
  draftPostsCount: number
  upcomingPosts: Post[]
  scheduledDates: string[]
  postDates: string[]
}

export type GetDashboardStatsResponse = {
  dashboardStats: DashboardStats
}

export type GetPostsForDateResponse = {
  postsForDate: Post[]
}
