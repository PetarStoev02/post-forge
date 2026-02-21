import { gql } from '@apollo/client';

export const SOCIAL_ACCOUNT_FRAGMENT = gql`
  fragment SocialAccountFields on SocialAccount {
    id
    workspaceId
    platform
    platformUserId
    metadata
    needsReconnect
    createdAt
    updatedAt
  }
`;

export const GET_SOCIAL_ACCOUNTS = gql`
  query GetSocialAccounts {
    socialAccounts {
      ...SocialAccountFields
    }
  }
  ${SOCIAL_ACCOUNT_FRAGMENT}
`;

export const DISCONNECT_SOCIAL_ACCOUNT = gql`
  mutation DisconnectSocialAccount($id: ID!) {
    disconnectSocialAccount(id: $id)
  }
`;

export const GET_OAUTH_CREDENTIALS = gql`
  query GetOAuthCredentials {
    oauthCredentials {
      provider
      clientIdSet
      clientIdMasked
      clientSecretSet
    }
  }
`;

export const SET_OAUTH_CREDENTIALS = gql`
  mutation SetOAuthCredentials($provider: String!, $clientId: String!, $clientSecret: String!) {
    setOAuthCredentials(provider: $provider, clientId: $clientId, clientSecret: $clientSecret)
  }
`;
