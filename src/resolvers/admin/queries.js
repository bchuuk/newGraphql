// src/resolvers/admin/queries.js
import { prisma } from "../../lib/prisma.js"
import { requireRole } from "../../middleware/auth.js"

const adminQueries = {
  // Admin панелийн статистик
  adminStats: requireRole(["ADMIN"], async (parent, args, context) => {
    const { user } = context

    const [userCount, postCount, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.user.count({
        where: {
          lastActive: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ])

    return {
      userCount,
      postCount,
      activeUsers,
      timestamp: new Date(),
    }
  }),

  // Бүх хэрэглэгчдийг харах
  adminUsers: requireRole(
    ["ADMIN"],
    async (parent, { page = 1, limit = 20, search }, context) => {
      const skip = (page - 1) * limit

      const where = search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { username: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            _count: {
              select: { posts: true, followers: true },
            },
          },
        }),
        prisma.user.count({ where }),
      ])

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          hasMore: skip + limit < total,
        },
      }
    }
  ),

  // Тайлангууд
  adminReports: requireRole(
    ["ADMIN"],
    async (parent, { status = "PENDING" }, context) => {
      return await prisma.report.findMany({
        where: { status },
        include: {
          reporter: true,
          reported: true,
          post: true,
        },
        orderBy: { createdAt: "desc" },
      })
    }
  ),

  // Системийн логууд
  adminLogs: requireRole(
    ["ADMIN"],
    async (parent, { type, page = 1, limit = 50 }, context) => {
      const skip = (page - 1) * limit
      const where = type ? { type } : {}

      return await prisma.systemLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: true },
      })
    }
  ),
}

export default adminQueries
