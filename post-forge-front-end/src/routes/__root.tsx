import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ApolloProvider } from '@apollo/client/react'
import { AlertCircleIcon } from 'lucide-react'

import appCss from '../styles.css?url'
import { apolloClient } from '@/shared/lib/apollo-client'
import { AppSidebar } from '@/widgets/app-sidebar/ui/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/shared/ui/sidebar'
import { Toaster } from '@/shared/ui/sonner'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { CreatePostProvider } from '@/features/post-creation/model/create-post-context'
import { CreatePostSheet } from '@/features/post-creation/ui/create-post-sheet'
import { PostActionsProvider } from '@/features/post-management/model/post-actions-context'
import { PostDetailSheet } from '@/features/post-management/ui/post-detail-sheet'
import { CommandPalette } from '@/widgets/command-palette/ui/command-palette'
import { ReconnectDialog } from '@/features/social-accounts/ui/reconnect-dialog'
import { PageLoader } from '@/shared/ui/page-loader'
import { Button } from '@/shared/ui/button'


const RoutePendingComponent = () => (
  <div className="flex h-full flex-1">
    <PageLoader />
  </div>
)

const RouteErrorComponent = ({ error }: { error: Error }) => (
  <div className="flex h-full flex-1 flex-col items-center justify-center gap-4">
    <div className="flex items-center gap-2 text-destructive">
      <AlertCircleIcon className="size-6" />
      <h2 className="text-lg font-semibold">Something went wrong</h2>
    </div>
    <p className="text-sm text-muted-foreground max-w-md text-center">
      {error.message || "An unexpected error occurred"}
    </p>
    <Button variant="outline" onClick={() => window.location.reload()}>
      Try Again
    </Button>
  </div>
)

const RootLayout = () => {
  return (
    <ApolloProvider client={apolloClient}>
      <TooltipProvider>
        <CreatePostProvider>
          <PostActionsProvider>
            <SidebarProvider className="!min-h-0 h-svh">
              <AppSidebar />
              <SidebarInset className="min-h-0 overflow-hidden">
                <Outlet />
              </SidebarInset>
            </SidebarProvider>
            <CreatePostSheet />
            <PostDetailSheet />
            <CommandPalette />
            <ReconnectDialog />
            <Toaster />
          </PostActionsProvider>
        </CreatePostProvider>
      </TooltipProvider>
    </ApolloProvider>
  )
}

const RootDocument = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Post Forge',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  component: RootLayout,
  shellComponent: RootDocument,
  pendingComponent: RoutePendingComponent,
  errorComponent: RouteErrorComponent,
  pendingMinMs: 200,
})
