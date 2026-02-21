export const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || "https://post-forge-back-end.test/graphql"

export const BACKEND_ORIGIN = GRAPHQL_URL.replace(/\/graphql\/?$/, "") || "https://post-forge-back-end.test"
