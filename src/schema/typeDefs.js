// src/schema/typeDefs.js
import { gql } from "graphql-tag"

export const typeDefs = gql`
  # Import GraphQL scalars
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

    # Computed fields
    postCount: Int!
    followerCount: Int!
    followingCount: Int!

    # Relations (optional loading)
    posts(limit: Int, offset: Int): [Post!]
    followers(limit: Int, offset: Int): [Follow!]
    following(limit: Int, offset: Int): [Follow!]
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

    # Relations
    author: User!
    comments(limit: Int, offset: Int): [Comment!]

    # Computed fields
    likeCount: Int!
    commentCount: Int!
    isLiked: Boolean # Only available when user is authenticated
    # Admin fields (only for admins)
    reportCount: Int
    deletedReason: String
  }

  type Comment {
    id: ID!
    content: String!
    status: CommentStatus!
    createdAt: DateTime!
    updatedAt: DateTime!

    # Relations
    author: User!
    post: Post!

    # Computed fields
    likeCount: Int!
    isLiked: Boolean # Only available when user is authenticated
  }

  type Follow {
    id: ID!
    createdAt: DateTime!
    follower: User!
    following: User!
  }

  type Like {
    id: ID!
    createdAt: DateTime!
    user: User!
    post: Post!
  }

  type Notification {
    id: ID!
    type: NotificationType!
    message: String!
    isRead: Boolean!
    metadata: JSON
    createdAt: DateTime!

    # Relations
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

    # Relations
    reporter: User!
    reported: User
    post: Post
    resolvedBy: User
  }

  # Connection types for pagination
  type UserConnection {
    nodes: [User!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PostConnection {
    nodes: [Post!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type NotificationConnection {
    nodes: [Notification!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # Input types
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

  input NotificationSettingsInput {
    pushEnabled: Boolean
    emailEnabled: Boolean
    newFollower: Boolean
    newPost: Boolean
    postLiked: Boolean
    postCommented: Boolean
    mentioned: Boolean
  }

  # Response types
  interface MutationResponse {
    success: Boolean!
    message: String!
  }

  type AuthPayload implements MutationResponse {
    success: Boolean!
    message: String!
    token: String
    user: User
  }

  type GenericMutationResponse implements MutationResponse {
    success: Boolean!
    message: String!
  }

  type UserMutationResponse implements MutationResponse {
    success: Boolean!
    message: String!
    user: User
  }

  type PostMutationResponse implements MutationResponse {
    success: Boolean!
    message: String!
    post: Post
  }

  # Admin types
  type AdminStats {
    userCount: Int!
    postCount: Int!
    activeUsers: Int!
    reportCount: Int!
    timestamp: DateTime!
  }

  type SystemInfo {
    userCount: Int!
    adminCount: Int!
    postCount: Int!
    reportCount: Int!
    systemHealth: String!
    uptime: Float!
    timestamp: DateTime!
  }

  # Root types
  type Query {
    # Authentication
    me: User

    # Users
    user(id: ID, username: String): User
    users(first: Int, after: String, search: String): UserConnection!
    searchUsers(query: String!, first: Int, after: String): UserConnection!

    # Posts
    post(id: ID!): Post
    posts(first: Int, after: String): PostConnection!
    feed(first: Int, after: String): PostConnection! # Requires auth
    explorePosts(first: Int, after: String): PostConnection!
    searchPosts(query: String!, first: Int, after: String): PostConnection!

    # Notifications (requires auth)
    notifications(first: Int, after: String): NotificationConnection!
    unreadNotificationCount: Int!

    # Admin queries (requires admin role)
    adminStats: AdminStats
    adminUsers(first: Int, after: String, search: String): UserConnection!
    adminReports(status: ReportStatus, first: Int, after: String): [Report!]!

    # God queries (requires god role)
    systemInfo: SystemInfo
    systemLogs(first: Int, after: String): [JSON!]!
  }

  type Mutation {
    # Authentication
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: GenericMutationResponse!

    # Social auth
    googleSignIn(token: String!): AuthPayload!
    appleSignIn(token: String!): AuthPayload!

    # Password management
    forgotPassword(email: String!): GenericMutationResponse!
    resetPassword(
      token: String!
      newPassword: String!
    ): GenericMutationResponse!
    changePassword(
      currentPassword: String!
      newPassword: String!
    ): GenericMutationResponse!

    # Profile management
    updateProfile(input: UpdateProfileInput!): UserMutationResponse!
    deleteAccount: GenericMutationResponse!

    # Social features
    followUser(userId: ID!): GenericMutationResponse!
    unfollowUser(userId: ID!): GenericMutationResponse!

    # Posts
    createPost(input: CreatePostInput!): PostMutationResponse!
    updatePost(id: ID!, input: UpdatePostInput!): PostMutationResponse!
    deletePost(id: ID!): GenericMutationResponse!

    # Interactions
    likePost(postId: ID!): GenericMutationResponse!
    unlikePost(postId: ID!): GenericMutationResponse!
    commentOnPost(postId: ID!, content: String!): GenericMutationResponse!
    deleteComment(commentId: ID!): GenericMutationResponse!

    # Reports
    reportUser(
      userId: ID!
      reason: String!
      description: String
    ): GenericMutationResponse!
    reportPost(
      postId: ID!
      reason: String!
      description: String
    ): GenericMutationResponse!

    # Notifications
    markNotificationAsRead(id: ID!): GenericMutationResponse!
    markAllNotificationsAsRead: GenericMutationResponse!
    updateNotificationSettings(
      input: NotificationSettingsInput!
    ): GenericMutationResponse!

    # File upload
    uploadFile(file: Upload!): String! # Returns file URL
    # Admin mutations (requires admin role)
    adminBlockUser(
      userId: ID!
      reason: String!
      duration: Int
    ): UserMutationResponse!
    adminUnblockUser(userId: ID!): UserMutationResponse!
    adminDeletePost(postId: ID!, reason: String!): GenericMutationResponse!
    adminResolveReport(
      reportId: ID!
      action: String!
      note: String
    ): GenericMutationResponse!

    # God mutations (requires god role)
    godCreateAdmin(
      input: RegisterInput!
      role: UserRole!
    ): UserMutationResponse!
    godUpdateUserRole(userId: ID!, role: UserRole!): UserMutationResponse!
    godSystemMaintenance(
      enabled: Boolean!
      message: String
    ): GenericMutationResponse!
  }

  type Subscription {
    # Real-time notifications
    notificationAdded(userId: ID!): Notification!

    # Post interactions
    postLiked(postId: ID!): Like!
    commentAdded(postId: ID!): Comment!

    # Admin subscriptions
    reportAdded: Report! # For admins
    userStatusChanged: User! # For admins
    # System subscriptions
    systemAlert: JSON! # For gods
  }
`
