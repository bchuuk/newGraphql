// src/resolvers/notification/queries.js
import { prisma } from "../../lib/prisma.js"
import { requireAuth } from "../../middleware/auth.js"

const notificationQueries = {
  // Push notification settings авах
  notificationSettings: requireAuth(async (parent, args, context) => {
    const { user } = context

    let settings = await prisma.notificationSetting.findUnique({
      where: { userId: user.id },
    })

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.notificationSetting.create({
        data: {
          userId: user.id,
          pushEnabled: true,
          emailEnabled: true,
          newFollower: true,
          newPost: true,
          postLiked: true,
          postCommented: true,
          mentioned: true,
        },
      })
    }

    return settings
  }),

  // Unread notification count
  unreadNotificationCount: requireAuth(async (parent, args, context) => {
    const { user } = context

    return await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    })
  }),
}

export default notificationQueries
