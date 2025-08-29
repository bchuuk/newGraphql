// src/resolvers/user/queries.js
import { prisma } from "../../lib/prisma.js"
import { requireAuth } from "../../middleware/auth.js"

const userQueries = {
  // Хувийн мэдээлэл авах
  me: requireAuth(async (parent, args, context) => {
    const { user } = context

    return await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    })
  }),

  // Хэрэглэгчийн профайл
  userProfile: async (parent, { username }, context) => {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        posts: {
          where: { status: "PUBLISHED" },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            posts: { where: { status: "PUBLISHED" } },
            followers: true,
            following: true,
          },
        },
      },
    })

    if (!user) {
      throw new Error("User not found")
    }

    return user
  },

  // Notifications авах
  myNotifications: requireAuth(
    async (parent, { page = 1, limit = 20 }, context) => {
      const { user } = context
      const skip = (page - 1) * limit

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { userId: user.id },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            fromUser: true,
            post: true,
          },
        }),
        prisma.notification.count({ where: { userId: user.id } }),
      ])

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          hasMore: skip + limit < total,
        },
      }
    }
  ),

  // Search хэрэглэгчид
  searchUsers: async (parent, { query, page = 1, limit = 20 }, context) => {
    const skip = (page - 1) * limit

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { displayName: { contains: query, mode: "insensitive" } },
        ],
        status: "ACTIVE",
      },
      skip,
      take: limit,
      include: {
        _count: {
          select: { followers: true },
        },
      },
    })

    return users
  },
}

export default userQueries
