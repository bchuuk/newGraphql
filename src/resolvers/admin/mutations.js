// src/resolvers/admin/mutations.js
import { prisma } from "../../lib/prisma.js"
import { requireRole } from "../../middleware/auth.js"
import { PubSub } from "graphql-subscriptions"

const pubsub = new PubSub()

const adminMutations = {
  // Хэрэглэгч block хийх
  adminBlockUser: requireRole(
    ["ADMIN", "SUPER_ADMIN", "GOD"],
    async (parent, { userId, reason, duration }, context) => {
      const { user: admin } = context

      const blockedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          status: "BLOCKED",
          blockedAt: new Date(),
          blockedReason: reason,
          blockedBy: admin.id,
          blockedUntil: duration
            ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
            : null,
        },
      })

      // Лог хадгалах
      await prisma.systemLog.create({
        data: {
          type: "USER_BLOCKED",
          action: `User ${blockedUser.username} blocked by admin`,
          userId: admin.id,
          targetUserId: userId,
          metadata: { reason, duration },
        },
      })

      // Real-time notification
      pubsub.publish("USER_STATUS_CHANGED", {
        userStatusChanged: {
          userId,
          status: "BLOCKED",
          reason,
          timestamp: new Date(),
        },
      })

      return {
        success: true,
        message: "User successfully blocked",
        user: blockedUser,
      }
    }
  ),

  // Пост устгах
  adminDeletePost: requireRole(
    ["ADMIN", "SUPER_ADMIN", "GOD"],
    async (parent, { postId, reason }, context) => {
      const { user: admin } = context

      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: { author: true },
      })

      if (!post) {
        throw new Error("Post not found")
      }

      await prisma.post.update({
        where: { id: postId },
        data: {
          status: "DELETED",
          deletedBy: admin.id,
          deletedReason: reason,
          deletedAt: new Date(),
        },
      })

      // Notification илгээх
      await prisma.notification.create({
        data: {
          type: "POST_DELETED",
          userId: post.authorId,
          message: `Your post has been removed by admin. Reason: ${reason}`,
          metadata: { postId, reason },
        },
      })

      return {
        success: true,
        message: "Post successfully deleted",
      }
    }
  ),

  // Тайлан шийдвэрлэх
  adminResolveReport: requireRole(
    ["ADMIN", "SUPER_ADMIN", "GOD"],
    async (parent, { reportId, action, note }, context) => {
      const { user: admin } = context

      const report = await prisma.report.update({
        where: { id: reportId },
        data: {
          status: "RESOLVED",
          action,
          adminNote: note,
          resolvedBy: admin.id,
          resolvedAt: new Date(),
        },
        include: {
          reporter: true,
          reported: true,
        },
      })

      // Хэрэв action нь BLOCK бол хэрэглэгчийг block хийх
      if (action === "BLOCK_USER" && report.reportedId) {
        await prisma.user.update({
          where: { id: report.reportedId },
          data: {
            status: "BLOCKED",
            blockedAt: new Date(),
            blockedReason: `Reported: ${report.reason}`,
            blockedBy: admin.id,
          },
        })
      }

      return {
        success: true,
        message: "Report resolved successfully",
        report,
      }
    }
  ),

  // Хэрэглэгч unblock хийх
  adminUnblockUser: requireRole(
    ["ADMIN", "SUPER_ADMIN", "GOD"],
    async (parent, { userId }, context) => {
      const { user: admin } = context

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          status: "ACTIVE",
          blockedAt: null,
          blockedReason: null,
          blockedBy: null,
          blockedUntil: null,
        },
      })

      // Log
      await prisma.systemLog.create({
        data: {
          type: "USER_UNBLOCKED",
          action: `User ${user.username} unblocked by admin`,
          userId: admin.id,
          targetUserId: userId,
        },
      })

      return {
        success: true,
        message: "User successfully unblocked",
        user,
      }
    }
  ),
}

export default adminMutations
