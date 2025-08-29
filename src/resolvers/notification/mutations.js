// src/resolvers/notification/mutations.js
import { prisma } from "../../lib/prisma.js"
import { requireAuth } from "../../middleware/auth.js"
import { Expo } from "expo-server-sdk"

const expo = new Expo()

const notificationMutations = {
  // Push notification token бүртгэх
  registerPushToken: requireAuth(
    async (parent, { token, platform }, context) => {
      const { user } = context

      // Validate Expo push token
      if (!Expo.isExpoPushToken(token)) {
        throw new Error("Invalid push token")
      }

      // Save or update push token
      await prisma.pushToken.upsert({
        where: {
          userId_token: {
            userId: user.id,
            token,
          },
        },
        create: {
          userId: user.id,
          token,
          platform,
          isActive: true,
        },
        update: {
          platform,
          isActive: true,
          updatedAt: new Date(),
        },
      })

      return {
        success: true,
        message: "Push token registered successfully",
      }
    }
  ),

  // Push notification settings засах
  updateNotificationSettings: requireAuth(
    async (parent, { input }, context) => {
      const { user } = context

      const settings = await prisma.notificationSetting.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          ...input,
        },
        update: input,
      })

      return {
        success: true,
        message: "Notification settings updated",
        settings,
      }
    }
  ),

  // Push notification илгээх (Admin/God only)
  sendPushNotification: requireAuth(
    async (parent, { userIds, title, body, data }, context) => {
      const { user } = context

      // Check permissions
      if (!["ADMIN", "SUPER_ADMIN", "GOD"].includes(user.role)) {
        throw new Error("Unauthorized")
      }

      // Get push tokens for target users
      const pushTokens = await prisma.pushToken.findMany({
        where: {
          userId: { in: userIds },
          isActive: true,
        },
        include: { user: true },
      })

      if (pushTokens.length === 0) {
        throw new Error("No active push tokens found")
      }

      // Create Expo messages
      const messages = pushTokens.map((tokenRecord) => ({
        to: tokenRecord.token,
        sound: "default",
        title,
        body,
        data: data || {},
      }))

      // Send push notifications
      const chunks = expo.chunkPushNotifications(messages)
      const results = []

      for (const chunk of chunks) {
        try {
          const receipts = await expo.sendPushNotificationsAsync(chunk)
          results.push(...receipts)
        } catch (error) {
          console.error("Error sending push notification:", error)
        }
      }

      // Save notifications to database
      const notifications = userIds.map((userId) => ({
        type: "ADMIN_MESSAGE",
        userId,
        fromUserId: user.id,
        message: body,
        metadata: { title, data },
      }))

      await prisma.notification.createMany({
        data: notifications,
      })

      return {
        success: true,
        message: `Push notifications sent to ${pushTokens.length} users`,
        sentCount: results.length,
      }
    }
  ),

  // Test push notification
  testPushNotification: requireAuth(async (parent, args, context) => {
    const { user } = context

    // Get user's push tokens
    const pushTokens = await prisma.pushToken.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
    })

    if (pushTokens.length === 0) {
      throw new Error("No active push tokens found")
    }

    // Create test messages
    const messages = pushTokens.map((tokenRecord) => ({
      to: tokenRecord.token,
      sound: "default",
      title: "Test Notification",
      body: "This is a test push notification!",
      data: { test: true },
    }))

    // Send notifications
    const chunks = expo.chunkPushNotifications(messages)
    let sentCount = 0

    for (const chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk)
        sentCount += chunk.length
      } catch (error) {
        console.error("Error sending test notification:", error)
      }
    }

    return {
      success: true,
      message: `Test notification sent to ${sentCount} devices`,
    }
  }),
}

export default notificationMutations
