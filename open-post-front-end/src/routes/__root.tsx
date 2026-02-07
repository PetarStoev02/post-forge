import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ApolloProvider } from '@apollo/client/react'

import { apolloClient } from '@/lib/apollo-client'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { CreatePostProvider } from '@/contexts/create-post-context'
import { CreatePostSheet } from '@/components/create-post-sheet'

import appCss from '../styles.css?url'

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
        title: 'Open Post',
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
})

function RootLayout() {
  return (
    <ApolloProvider client={apolloClient}>
      <CreatePostProvider>
        <SidebarProvider className="h-full">
          <AppSidebar />
          <SidebarInset className="h-full">
            <Outlet />
          </SidebarInset>
        </SidebarProvider>
        <CreatePostSheet />
      </CreatePostProvider>
    </ApolloProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
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
