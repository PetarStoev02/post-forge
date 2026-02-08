import { gql } from '@apollo/client';

export const POST_FRAGMENT = gql`
  fragment PostFields on Post {
    id
    content
    platforms
    status
    scheduledAt
    mediaUrls
    hashtags
    mentions
    linkPreview {
      url
      title
      description
      image
    }
    createdAt
    updatedAt
  }
`;

export const CREATE_POST = gql`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ...PostFields
    }
  }
  ${POST_FRAGMENT}
`;

export const UPDATE_POST = gql`
  mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
    updatePost(id: $id, input: $input) {
      ...PostFields
    }
  }
  ${POST_FRAGMENT}
`;

export const DELETE_POST = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`;

export const GET_POST = gql`
  query GetPost($id: ID!) {
    post(id: $id) {
      ...PostFields
    }
  }
  ${POST_FRAGMENT}
`;

export const GET_POSTS = gql`
  query GetPosts {
    posts {
      ...PostFields
    }
  }
  ${POST_FRAGMENT}
`;

export const GET_CALENDAR_POSTS = gql`
  query GetCalendarPosts($startDate: Date!, $endDate: Date!) {
    calendarPosts(startDate: $startDate, endDate: $endDate) {
      ...PostFields
    }
  }
  ${POST_FRAGMENT}
`;

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      totalPostsCount
      totalPostsThisMonth
      totalPostsLastMonth
      scheduledPostsCount
      publishedPostsCount
      draftPostsCount
      upcomingPosts {
        ...PostFields
      }
      scheduledDates
      postDates
    }
  }
  ${POST_FRAGMENT}
`;

export const GET_POSTS_FOR_DATE = gql`
  query GetPostsForDate($date: Date!) {
    postsForDate(date: $date) {
      ...PostFields
    }
  }
  ${POST_FRAGMENT}
`;
