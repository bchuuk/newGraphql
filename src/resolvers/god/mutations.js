// src/resolvers/god/mutations.js
import { prisma } from "../../lib/prisma.js"
import { requireRole } from "../../middleware/auth.js"
import { PubSub } from "graphql-subscriptions"
import bcrypt from "bcryptjs"

const pubsub = new PubSub()

const godMutations = {
  // Admin нэмэх
  godCreateAdmin: requireRole(
    ["GOD"],
    async (parent, { email, username, password, role = "ADMIN" }, context) => {
      const { user: god } = context

      // Check if user exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      })

      if (existingUser) {
        throw new Error("User with this email or username already exists")
      }

      const hashedPassword = await bcrypt.hash(password, 10)

      const newAdmin = await prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          role,
          status: "ACTIVE",
          emailVerified: true,
        },
      })

      // Log хадгалах
      await prisma.systemLog.create({
        data: {
          type: "ADMIN_CREATED",
          action: `New admin created: ${username}`,
          userId: god.id,
          targetUserId: newAdmin.id,
          metadata: { role, email },
        },
      })

      return {
        success: true,
        message: "Admin created successfully",
        user: newAdmin,
      }
    }
  ),

  // Admin-ын эрх өөрчлөх
  godUpdateAdminRole: requireRole(
    ["GOD"],
    async (parent, { adminId, newRole }, context) => {
      const { user: god } = context

      const admin = await prisma.user.update({
        where: { id: adminId },
        data: { role: newRole },
      })

      await prisma.systemLog.create({
        data: {
          type: "ADMIN_ROLE_CHANGED",
          action: `Admin role changed to ${newRole}`,
          userId: god.id,
          targetUserId: adminId,
          metadata: { newRole },
        },
      })

      return {
        success: true,
        message: "Admin role updated successfully",
        user: admin,
      }
    }
  ),

  // System maintenance mode
  godSetMaintenanceMode: requireRole(
    ["GOD"],
    async (parent, { enabled, message }, context) => {
      const { user: god } = context

      // Redis эсвэл cache-д хадгалах
      await prisma.systemSetting.upsert({
        where: { key: "maintenance_mode" },
        create: {
          key: "maintenance_mode",
          value: JSON.stringify({
            enabled,
            message,
            setBy: god.id,
            setAt: new Date(),
          }),
        },
        update: {
          value: JSON.stringify({
            enabled,
            message,
            setBy: god.id,
            setAt: new Date(),
          }),
        },
      })

      // Бүх хэрэглэгчдэд notification
      pubsub.publish("SYSTEM_MAINTENANCE", {
        systemMaintenance: {
          enabled,
          message,
          timestamp: new Date(),
        },
      })

      return {
        success: true,
        message: `Maintenance mode ${enabled ? "enabled" : "disabled"}`,
      }
    }
  ),

  // Database cleanup/optimization
  godOptimizeDatabase: requireRole(["GOD"], async (parent, args, context) => {
    const { user: god } = context

    // Cleanup old logs, deleted posts, etc.
    const [deletedLogs, deletedPosts] = await Promise.all([
      prisma.systemLog.deleteMany({
        where: {
          createdAt: {
            lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 өдрийн өмнө
          },
        },
      }),
      prisma.post.deleteMany({
        where: {
          status: "DELETED",
          deletedAt: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 өдрийн өмнө
          },
        },
      }),
    ])

    await prisma.systemLog.create({
      data: {
        type: "DATABASE_OPTIMIZED",
        action: `Database optimized. Deleted ${deletedLogs.count} logs, ${deletedPosts.count} posts`,
        userId: god.id,
      },
    })

    return {
      success: true,
      message: `Database optimized. Cleaned ${
        deletedLogs.count + deletedPosts.count
      } records`,
      stats: {
        deletedLogs: deletedLogs.count,
        deletedPosts: deletedPosts.count,
      },
    }
  }),
}

export default godMutations
