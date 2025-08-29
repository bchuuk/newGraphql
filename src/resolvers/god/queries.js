// src/resolvers/god/queries.js
import { prisma } from "../../lib/prisma.js"
import { requireRole } from "../../middleware/auth.js"

const godQueries = {
  // Бүх системийн мэдээлэл
  godSystemInfo: requireRole(["GOD"], async (parent, args, context) => {
    const [userCount, adminCount, postCount, reportCount, systemHealth] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "ADMIN" } }),
        prisma.post.count(),
        prisma.report.count({ where: { status: "PENDING" } }),
        checkSystemHealth(), // Custom function
      ])

    return {
      userCount,
      adminCount,
      postCount,
      reportCount,
      systemHealth,
      timestamp: new Date(),
    }
  }),

  // Бүх admin-уудын жагсаалт
  godAdmins: requireRole(["GOD"], async (parent, args, context) => {
    return await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
      },
      include: {
        _count: {
          select: {
            systemLogs: true,
            blockedUsers: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }),

  // Database analytics
  godDatabaseStats: requireRole(["GOD"], async (parent, args, context) => {
    // Raw SQL хэрэглэж database-ын хэмжээ, table count гэх мэт
    const tableStats = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats
      WHERE schemaname = 'public'
      LIMIT 100
    `

    return {
      tableStats,
      timestamp: new Date(),
    }
  }),

  // System performance metrics
  godPerformanceMetrics: requireRole(["GOD"], async (parent, args, context) => {
    // Memory usage, CPU load гэх мэт system metrics
    const metrics = {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      timestamp: new Date(),
    }

    return metrics
  }),
}

// Helper function
async function checkSystemHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return "HEALTHY"
  } catch (error) {
    return "UNHEALTHY"
  }
}

export default godQueries
