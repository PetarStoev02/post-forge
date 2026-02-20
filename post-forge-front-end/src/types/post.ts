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
  platforms: Array<Platform>
  status: PostStatus
  scheduledAt?: string | null
  mediaUrls: Array<string>
  hashtags: Array<string>
  mentions: Array<string>
  linkPreview?: LinkPreview | null
  createdAt: string
  updatedAt: string
}

export type CreatePostInput = {
  content: string
  platforms: Array<Platform>
  status?: PostStatus
  scheduledAt?: string
  mediaUrls?: Array<string>
  hashtags?: Array<string>
  mentions?: Array<string>
  linkPreview?: {
    url: string
    title?: string
    description?: string
    image?: string
  }
}

export type UpdatePostInput = {
  content?: string
  platforms?: Array<Platform>
  status?: PostStatus
  scheduledAt?: string
  mediaUrls?: Array<string>
  hashtags?: Array<string>
  mentions?: Array<string>
  linkPreview?: {
    url: string
    title?: string
    description?: string
    image?: string
  }
}

// Query response types
export type GetCalendarPostsResponse = {
  calendarPosts: Array<Post>
}

export type GetPostsResponse = {
  posts: Array<Post>
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
  upcomingPosts: Array<Post>
  scheduledDates: Array<string>
  postDates: Array<string>
}

export type GetDashboardStatsResponse = {
  dashboardStats: DashboardStats
}

export type GetPostsForDateResponse = {
  postsForDate: Array<Post>
}
