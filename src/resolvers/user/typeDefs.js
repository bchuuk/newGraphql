// src/resolvers/user/typeDefs.js
import { gql } from "graphql-tag"

export default gql`
  type User {
    id: ID!
    username: String!
    displayName: String
    email: String
    password: String
    status: String
    createdAt: String
    updatedAt: String
    _count: UserCount
  }

  type UserCount {
    posts: Int
    followers: Int
    following: Int
  }

  type Post {
    id: ID!
    title: String!
    content: String
    status: String
    authorId: ID!
    createdAt: String
    updatedAt: String
  }

  type Notification {
    id: ID!
    type: String!
    userId: ID!
    fromUser: User
    post: Post
    message: String
    isRead: Boolean
    createdAt: String
  }

  type Pagination {
    page: Int
    limit: Int
    total: Int
    hasMore: Boolean
  }

  type NotificationsResponse {
    notifications: [Notification]
    pagination: Pagination
  }

  input UpdateProfileInput {
    username: String
    displayName: String
    email: String
  }

  type SuccessMessage {
    success: Boolean!
    message: String!
    user: User
  }

  type Mutation {
    updateProfile(input: UpdateProfileInput!): SuccessMessage!
    changePassword(
      currentPassword: String!
      newPassword: String!
    ): SuccessMessage!
    followUser(userId: ID!): SuccessMessage!
    unfollowUser(userId: ID!): SuccessMessage!
    markNotificationAsRead(notificationId: ID!): SuccessMessage!
    markAllNotificationsAsRead: SuccessMessage!
  }

  type Query {
    me: User
    userProfile(username: String!): User
    myNotifications(page: Int, limit: Int): NotificationsResponse
    searchUsers(query: String!, page: Int, limit: Int): [User]
  }

  type Subscription {
    newNotification: Notification
    newPostFromFollowing: Post
  }
`
