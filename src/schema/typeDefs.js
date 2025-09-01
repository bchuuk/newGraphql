// src/schema/typeDefs.js - SIMPLIFIED & WORKING VERSION
import { gql } from "graphql-tag"

export const typeDefs = gql`
  # Scalars
  scalar DateTime
  scalar Upload
  scalar JSON

  # Enums
  enum UserRole {
    USER
    ADMIN
    SUPER_ADMIN
    GOD
  }

  enum UserStatus {
    ACTIVE
    BLOCKED
    DELETED
    PENDING
  }

  enum PostStatus {
    DRAFT
    PUBLISHED
    DELETED
    REPORTED
  }

  enum PostVisibility {
    PUBLIC
    PRIVATE
    FOLLOWERS_ONLY
  }

  enum CommentStatus {
    ACTIVE
    DELETED
    REPORTED
  }

  enum ReportStatus {
    PENDING
    RESOLVED
    DISMISSED
  }

  enum NotificationType {
    NEW_FOLLOWER
    POST_LIKED
    POST_COMMENTED
    NEW_POST
    MENTIONED
    ADMIN_MESSAGE
    POST_DELETED
    ACCOUNT_WARNING
  }

  # Main Types
  type User {
    id: ID!
    email: String!
    username: String!
    displayName: String
    avatar: String
    bio: String
    role: UserRole!
    status: UserStatus!
    emailVerified: Boolean!
    lastActive: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
    postCount: Int!
    followerCount: Int!
    followingCount: Int!
  }

  type Post {
    id: ID!
    title: String
    content: String!
    images: [String!]!
    status: PostStatus!
    visibility: PostVisibility!
    createdAt: DateTime!
    updatedAt: DateTime!
    publishedAt: DateTime
    author: User!
    likeCount: Int!
    commentCount: Int!
    isLiked: Boolean
  }

  type Comment {
    id: ID!
    content: String!
    status: CommentStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
    author: User!
    post: Post!
    likeCount: Int!
    isLiked: Boolean
  }

  type Notification {
    id: ID!
    type: NotificationType!
    message: String!
    isRead: Boolean!
    metadata: JSON
    createdAt: DateTime!
    user: User!
    fromUser: User
    post: Post
  }

  type Report {
    id: ID!
    reason: String!
    description: String
    status: ReportStatus!
    createdAt: DateTime!
    resolvedAt: DateTime
    adminNote: String
    action: String
    reporter: User!
    reported: User
    post: Post
  }

  # Input Types
  input RegisterInput {
    email: String!
    username: String!
    password: String!
    displayName: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UpdateProfileInput {
    displayName: String
    bio: String
    avatar: String
  }

  input CreatePostInput {
    title: String
    content: String!
    images: [String!]
    visibility: PostVisibility = PUBLIC
  }

  input UpdatePostInput {
    title: String
    content: String
    images: [String!]
    visibility: PostVisibility
  }

  # Response Types
  type AuthPayload {
    success: Boolean!
    message: String!
    token: String
    user: User
  }

  type MutationResponse {
    success: Boolean!
    message: String!
  }

  type UserMutationResponse {
    success: Boolean!
    message: String!
    user: User
  }

  type PostMutationResponse {
    success: Boolean!
    message: String!
    post: Post
  }

  type CommentMutationResponse {
    success: Boolean!
    message: String!
    comment: Comment
  }

  # Admin Types
  type AdminStats {
    userCount: Int!
    postCount: Int!
    activeUsers: Int!
    reportCount: Int!
    timestamp: DateTime!
  }

  # Root Types
  type Query {
    # Basic queries
    me: User

    # User queries
    user(id: ID, username: String): User
    searchUsers(query: String!): [User!]!

    # Post queries
    post(id: ID!): Post
    feed(page: Int, limit: Int): [Post!]!
    explorePosts(page: Int, limit: Int): [Post!]!
    searchPosts(query: String!): [Post!]!

    # Notification queries
    myNotifications(page: Int, limit: Int): [Notification!]!
    unreadNotificationCount: Int!

    # Admin queries
    adminStats: AdminStats
    adminUsers(page: Int, limit: Int, search: String): [User!]!
    adminReports(status: ReportStatus): [Report!]!

    # God queries
    godSystemInfo: JSON
    godAdmins: [User!]!
  }

  type Mutation {
    # Authentication
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: MutationResponse!

    # Social auth
    googleSignIn(idToken: String!): AuthPayload!
    appleSignIn(idToken: String!): AuthPayload!

    # Password management
    forgotPassword(email: String!): MutationResponse!
    resetPassword(token: String!, newPassword: String!): MutationResponse!
    changePassword(
      currentPassword: String!
      newPassword: String!
    ): MutationResponse!

    # Profile management
    updateProfile(input: UpdateProfileInput!): UserMutationResponse!

    # Social features
    followUser(userId: ID!): MutationResponse!
    unfollowUser(userId: ID!): MutationResponse!

    # Posts
    createPost(input: CreatePostInput!): PostMutationResponse!
    updatePost(id: ID!, input: UpdatePostInput!): PostMutationResponse!
    deletePost(id: ID!): MutationResponse!

    # Interactions
    likePost(postId: ID!): MutationResponse!
    commentOnPost(postId: ID!, content: String!): CommentMutationResponse!

    # Reports
    reportPost(
      postId: ID!
      reason: String!
      description: String
    ): MutationResponse!

    # Notifications
    markNotificationAsRead(notificationId: ID!): MutationResponse!
    markAllNotificationsAsRead: MutationResponse!

    # Admin mutations
    adminBlockUser(
      userId: ID!
      reason: String!
      duration: Int
    ): UserMutationResponse!
    adminUnblockUser(userId: ID!): UserMutationResponse!
    adminDeletePost(postId: ID!, reason: String!): MutationResponse!
    adminResolveReport(
      reportId: ID!
      action: String!
      note: String
    ): MutationResponse!

    # God mutations
    godCreateAdmin(
      email: String!
      username: String!
      password: String!
      role: UserRole
    ): UserMutationResponse!
    godUpdateAdminRole(adminId: ID!, newRole: UserRole!): UserMutationResponse!
    godSetMaintenanceMode(enabled: Boolean!, message: String): MutationResponse!
    godOptimizeDatabase: MutationResponse!
  }

  type Subscription {
    # User subscriptions
    newNotification(userId: ID!): Notification!

    # Post subscriptions
    newComment(postId: ID!): Comment!
    postLiked(postId: ID!): JSON!

    # Admin subscriptions
    newReport: Report!
    userStatusChanged: JSON!

    # System subscriptions
    systemAlert: JSON!
  }
`
