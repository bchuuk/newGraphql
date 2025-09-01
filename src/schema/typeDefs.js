// src/schema/typeDefs.js - CORRECTED VERSION
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
    _count: CommentCount!
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

  type NotificationPagination {
    notifications: [Notification!]!
    pagination: Pagination!
  }

  type Pagination {
    page: Int!
    limit: Int!
    total: Int!
    hasMore: Boolean!
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

  # User Types
  type UsergodDatabaseStats {
    userCount: Int!
    postCount: Int!
    activeUsers: Int!
    timestamp: DateTime!
  }

  # Admin Types
  type AdminStats {
    userCount: Int!
    postCount: Int!
    activeUsers: Int!
    reportCount: Int!
    timestamp: DateTime!
  }
  type AdminLog {
    id: ID!
    type: String!
    message: String!
    createdAt: DateTime!
    user: User
  }

  # God Types
  type TableStat {
    schemaname: String
    tablename: String
    attname: String
    n_distinct: Float
    correlation: Float
  }

  type GodDatabaseStats {
    tableStats: [TableStat!]!
    timestamp: DateTime!
  }

  type GodPerformanceMetrics {
    memoryUsage: JSON!
    uptime: Float!
    nodeVersion: String!
    timestamp: DateTime!
  }

  # Notification Types
  type NotificationSetting {
    id: ID!
    userId: ID!
    pushEnabled: Boolean!
    emailEnabled: Boolean!
    newFollower: Boolean!
    newPost: Boolean!
    postLiked: Boolean!
    postCommented: Boolean!
    mentioned: Boolean!
  }

  type UserCount {
    posts: Int!
    followers: Int!
    following: Int!
  }

  type PostCount {
    likes: Int!
    comments: Int!
  }

  type Like {
    id: ID!
    userId: ID!
    postId: ID!
  }

  type CommentCount {
    likes: Int!
  }

  type NotificationConnection {
    notifications: [Notification!]!
    pagination: Pagination!
  }

  type AdminUserConnection {
    users: [User!]!
    pagination: Pagination!
  }

  type SystemLog {
    id: ID!
    type: String!
    message: String!
    createdAt: String!
    user: User
  }

  type GodSystemInfo {
    userCount: Int!
    adminCount: Int!
    postCount: Int!
    reportCount: Int!
    systemHealth: String!
    timestamp: String!
  }

  # Root Types
  type Query {
    # User
    me: User!
    userProfile(username: String!): User!
    myNotifications(page: Int, limit: Int): NotificationConnection!
    searchUsers(query: String!, page: Int, limit: Int): [User!]!

    # Post
    feed(page: Int, limit: Int): [Post!]!
    explorePosts(page: Int, limit: Int): [Post!]!
    post(id: ID!): Post!
    searchPosts(query: String!, page: Int, limit: Int): [Post!]!

    # Notification
    notificationSettings: NotificationSetting!
    unreadNotificationCount: Int!

    # Admin
    adminStats: AdminStats!
    adminUsers(page: Int, limit: Int, search: String): AdminUserConnection!
    adminReports(status: String): [Report!]!
    adminLogs(type: String, page: Int, limit: Int): [SystemLog!]!

    # God
    godSystemInfo: GodSystemInfo!
    godAdmins: [User!]!
    godDatabaseStats: GodDatabaseStats!
    godPerformanceMetrics: GodPerformanceMetrics!
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
    registerPushToken(token: String!, platform: String!): MutationResponse!
    updateNotificationSettings(
      pushEnabled: Boolean!
      emailEnabled: Boolean!
      newFollower: Boolean!
      newPost: Boolean!
      postLiked: Boolean!
      postCommented: Boolean!
      mentioned: Boolean!
    ): MutationResponse!
    sendPushNotification(
      userIds: [ID!]!
      title: String!
      body: String!
      data: JSON
    ): MutationResponse!
    testPushNotification: MutationResponse!

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
    godUpdateAdminRole(adminId: ID!, newRole: UserRole!): UserMutationResponse!
    godOptimizeDatabase: MutationResponse!
    godCreateAdmin(
      email: String!
      username: String!
      password: String!
    ): UserMutationResponse!
    godDeleteUser(userId: ID!): MutationResponse!
    godUpdateUserRole(userId: ID!, role: UserRole!): UserMutationResponse!
    godSetMaintenanceMode(enabled: Boolean!, message: String): MutationResponse!

    # Admin
    adminUpdates: JSON!

    # God
    godSystemMonitoring: JSON!
  }

  type Subscription {
    # User subscriptions
    newNotification(userId: ID!): Notification!
    pushNotificationStatus: JSON!

    # Post subscriptions
    newComment(postId: ID!): Comment!
    postLiked(postId: ID!): JSON!
    newPostFromFollowing(userId: ID!): Post!

    # Admin subscriptions
    newReport: Report!
    userStatusChanged: JSON!
    adminActivity: JSON!

    # System subscriptions
    systemAlert: JSON!
    systemActivity: JSON!

    criticalAlert: JSON!
  }
`
