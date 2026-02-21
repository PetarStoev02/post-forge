import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { GRAPHQL_URL } from '@/lib/config';

const httpLink = new HttpLink({
  uri: GRAPHQL_URL,
  credentials: 'include',
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          posts: {
            merge(_existing = [], incoming) {
              return incoming;
            },
          },
          calendarPosts: {
            merge(_existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});
