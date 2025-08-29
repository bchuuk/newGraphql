// src/resolvers/user/mutations.js
import { prisma } from "../../lib/prisma.js"
import { requireAuth } from "../../middleware/auth.js"
import bcrypt from "bcryptjs"
import { PubSub } from "graphql-subscriptions"

const pubsub = new PubSub()

const userMutations = {
  // Профайл засах
  updateProfile: requireAuth(async (parent, { input }, context) => {
    const { user } = context

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...input,
        updatedAt: new Date(),
      },
    })

    return {
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    }
  }),

  // Нууц үг өөрчлөх
  changePassword: requireAuth(
    async (parent, { currentPassword, newPassword }, context) => {
      const { user } = context

      // Одоогийн нууц үг шалгах
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
      })

      const isValidPassword = await bcrypt.compare(
        currentPassword,
        userData.password
      )
      if (!isValidPassword) {
        throw new Error("Current password is incorrect")
      }

      // Шинэ нууц үг hash хийх
      const hashedNewPassword = await bcrypt.hash(newPassword, 10)

      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword },
      })

      return {
        success: true,
        message: "Password changed successfully",
      }
    }
  ),

  // Follow хийх
  followUser: requireAuth(async (parent, { userId }, context) => {
    const { user } = context

    if (user.id === userId) {
      throw new Error("Cannot follow yourself")
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: userId,
        },
      },
    })

    if (existingFollow) {
      throw new Error("Already following this user")
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId: user.id,
        followingId: userId,
      },
    })

    // Create notification
    await prisma.notification.create({
      data: {
        type: "NEW_FOLLOWER",
        userId: userId,
        fromUserId: user.id,
        message: `${user.username} started following you`,
      },
    })

    // Real-time notification
    pubsub.publish("NEW_NOTIFICATION", {
      newNotification: {
        userId: userId,
        type: "NEW_FOLLOWER",
        fromUser: user,
        timestamp: new Date(),
      },
    })

    return {
      success: true,
      message: "Successfully followed user",
    }
  }),

  // Unfollow хийх
  unfollowUser: requireAuth(async (parent, { userId }, context) => {
    const { user } = context

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: userId,
        },
      },
    })

    return {
      success: true,
      message: "Successfully unfollowed user",
    }
  }),

  // Notification-г read хийх
  markNotificationAsRead: requireAuth(
    async (parent, { notificationId }, context) => {
      const { user } = context

      await prisma.notification.update({
        where: {
          id: notificationId,
          userId: user.id, // Security check
        },
        data: { isRead: true },
      })

      return {
        success: true,
        message: "Notification marked as read",
      }
    }
  ),

  // Бүх notification-г read хийх
  markAllNotificationsAsRead: requireAuth(async (parent, args, context) => {
    const { user } = context

    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    })

    return {
      success: true,
      message: "All notifications marked as read",
    }
  }),
}

export default userMutations
