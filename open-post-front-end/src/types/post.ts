export type Platform = 'TWITTER' | 'INSTAGRAM' | 'LINKEDIN';
export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PENDING' | 'PUBLISHED' | 'CANCELLED' | 'FAILED';

export interface LinkPreview {
  url: string;
  title?: string | null;
  description?: string | null;
  image?: string | null;
}

export interface Post {
  id: string;
  content: string;
  platforms: Platform[];
  status: PostStatus;
  scheduledAt?: string | null;
  mediaUrls: string[];
  hashtags: string[];
  mentions: string[];
  linkPreview?: LinkPreview | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostInput {
  content: string;
  platforms: Platform[];
  status?: PostStatus;
  scheduledAt?: string;
  mediaUrls?: string[];
  hashtags?: string[];
  mentions?: string[];
  linkPreview?: {
    url: string;
    title?: string;
    description?: string;
    image?: string;
  };
}

export interface UpdatePostInput {
  content?: string;
  platforms?: Platform[];
  status?: PostStatus;
  scheduledAt?: string;
  mediaUrls?: string[];
  hashtags?: string[];
  mentions?: string[];
  linkPreview?: {
    url: string;
    title?: string;
    description?: string;
    image?: string;
  };
}

// Query response types
export interface GetCalendarPostsResponse {
  calendarPosts: Post[];
}

export interface GetPostsResponse {
  posts: Post[];
}

export interface GetPostResponse {
  post: Post | null;
}
