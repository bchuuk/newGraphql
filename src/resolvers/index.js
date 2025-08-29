// src/resolvers/index.js
import { mergeResolvers } from "@graphql-tools/merge"
import adminResolvers from "./admin/index.js"
import godResolvers from "./god/index.js"
import userResolvers from "./user/index.js"
import postResolvers from "./post/index.js"
import authResolvers from "./auth/index.js"
import notificationResolvers from "./notification/index.js"

const resolvers = mergeResolvers([
  adminResolvers,
  godResolvers,
  userResolvers,
  postResolvers,
  authResolvers,
  notificationResolvers,
])

export default resolvers
