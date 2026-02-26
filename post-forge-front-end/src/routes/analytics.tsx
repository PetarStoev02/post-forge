"use client"

import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@apollo/client/react"
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts"
import {
  BarChart3Icon,
  EyeIcon,
  HeartIcon,
  LoaderIcon,
  MessageCircleIcon,
  TrendingUpIcon,
} from "lucide-react"

import type { GetDashboardStatsResponse, GetThreadsPostInsightsResponse, GetThreadsPostsResponse, PlatformPost } from "@/entities/post/types"
import type { ChartConfig } from "@/shared/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"
import { EmptyState } from "@/shared/ui-patterns/empty-state"
import { GET_DASHBOARD_STATS, GET_THREADS_POSTS, GET_THREADS_POST_INSIGHTS } from "@/entities/post/api/posts"
import { GET_SOCIAL_ACCOUNTS } from "@/entities/social-account/api/social-accounts"

const statusChartConfig = {
  draft: { label: "Draft", color: "#94a3b8" },
  scheduled: { label: "Scheduled", color: "#3b82f6" },
  published: { label: "Published", color: "#22c55e" },
  pending: { label: "Pending", color: "#eab308" },
  failed: { label: "Failed", color: "#ef4444" },
  cancelled: { label: "Cancelled", color: "#6b7280" },
} satisfies ChartConfig

const monthChartConfig = {
  thisMonth: { label: "This Month", color: "hsl(var(--primary))" },
  lastMonth: { label: "Last Month", color: "hsl(var(--muted-foreground))" },
} satisfies ChartConfig

type EngagementCardProps = {
  title: string
  value: string | number
  icon: React.ReactNode
}

const EngagementCard = ({ title, value, icon }: EngagementCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className="text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent>
      <span className="text-2xl font-bold">{value}</span>
    </CardContent>
  </Card>
)

const PostInsightsRow = ({ post }: { post: PlatformPost }) => {
  const { data, loading } = useQuery<GetThreadsPostInsightsResponse>(
    GET_THREADS_POST_INSIGHTS,
    { variables: { platformPostId: post.platformPostId }, fetchPolicy: "cache-and-network" }
  )
  const insights = data?.threadsPostInsights

  return (
    <TableRow>
      <TableCell className="max-w-[300px] truncate">{post.text ?? ""}</TableCell>
      <TableCell>
        {new Date(post.timestamp.replace(" ", "T")).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </TableCell>
      {loading && !insights ? (
        <TableCell colSpan={4} className="text-center">
          <LoaderIcon className="inline size-4 animate-spin text-muted-foreground" />
        </TableCell>
      ) : insights ? (
        <>
          <TableCell className="text-right">{insights.views.toLocaleString()}</TableCell>
          <TableCell className="text-right">{insights.likes.toLocaleString()}</TableCell>
          <TableCell className="text-right">{insights.replies.toLocaleString()}</TableCell>
          <TableCell className="text-right">{insights.reposts.toLocaleString()}</TableCell>
        </>
      ) : (
        <TableCell colSpan={4} className="text-center text-muted-foreground">-</TableCell>
      )}
    </TableRow>
  )
}

const AnalyticsPage = () => {
  const { data: accountsData } = useQuery<{ socialAccounts: Array<{ platform: string }> }>(GET_SOCIAL_ACCOUNTS)
  const hasThreads = accountsData?.socialAccounts?.some((a) => a.platform === "THREADS") ?? false

  const { data: statsData, loading: statsLoading } = useQuery<GetDashboardStatsResponse>(GET_DASHBOARD_STATS, {
    fetchPolicy: "cache-and-network",
  })

  const { data: postsData, loading: postsLoading } = useQuery<GetThreadsPostsResponse>(GET_THREADS_POSTS, {
    variables: { limit: 25 },
    skip: !hasThreads,
    fetchPolicy: "cache-and-network",
  })

  if (!hasThreads && !statsLoading) {
    return (
      <EmptyState
        icon={<BarChart3Icon className="size-8" />}
        title="Analytics"
        description="Connect your Threads account to view detailed analytics and insights about your social media performance."
      />
    )
  }

  const stats = statsData?.dashboardStats
  const engagement = stats?.threadsEngagement
  const threadsPosts = postsData?.threadsPosts?.posts ?? []

  // Build pie chart data from post status counts
  const pieData = stats ? [
    { name: "Published", value: stats.publishedPostsCount, fill: statusChartConfig.published.color },
    { name: "Scheduled", value: stats.scheduledPostsCount, fill: statusChartConfig.scheduled.color },
    { name: "Draft", value: stats.draftPostsCount, fill: statusChartConfig.draft.color },
  ].filter((d) => d.value > 0) : []

  // Build bar chart data for this month vs last month
  const barData = stats ? [
    { name: "Posts", thisMonth: stats.totalPostsThisMonth, lastMonth: stats.totalPostsLastMonth },
  ] : []

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">Analytics</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Engagement cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <EngagementCard
                title="Views"
                value={engagement ? engagement.views.toLocaleString() : "N/A"}
                icon={<EyeIcon className="size-4" />}
              />
              <EngagementCard
                title="Likes"
                value={engagement ? engagement.likes.toLocaleString() : "N/A"}
                icon={<HeartIcon className="size-4" />}
              />
              <EngagementCard
                title="Replies"
                value={engagement ? engagement.replies.toLocaleString() : "N/A"}
                icon={<MessageCircleIcon className="size-4" />}
              />
              <EngagementCard
                title="Engagement Rate"
                value={engagement?.engagementRate != null ? `${engagement.engagementRate}%` : "N/A"}
                icon={<TrendingUpIcon className="size-4" />}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Post Status Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Post Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <ChartContainer config={statusChartConfig} className="mx-auto aspect-square max-h-[250px]">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">No post data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Monthly Comparison Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Monthly Post Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  {barData.length > 0 ? (
                    <ChartContainer config={monthChartConfig} className="max-h-[250px]">
                      <BarChart data={barData}>
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="thisMonth" fill="var(--color-thisMonth)" radius={4} />
                        <Bar dataKey="lastMonth" fill="var(--color-lastMonth)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <p className="py-8 text-center text-sm text-muted-foreground">No data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="posts">
            {postsLoading && threadsPosts.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <LoaderIcon className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : threadsPosts.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No Threads posts to show.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Likes</TableHead>
                    <TableHead className="text-right">Replies</TableHead>
                    <TableHead className="text-right">Reposts</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {threadsPosts.map((post) => (
                    <PostInsightsRow key={post.platformPostId} post={post} />
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
})
