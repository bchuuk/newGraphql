// src/resolvers/post/queries.js
import { prisma } from "../../lib/prisma.js"
import { requireAuth } from "../../middleware/auth.js"

const postQueries = {
  // Feed авах
  feed: requireAuth(async (parent, { page = 1, limit = 20 }, context) => {
    const { user } = context
    const skip = (page - 1) * limit

    // Get following user IDs
    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      select: { followingId: true },
    })

    const followingIds = following.map((f) => f.followingId)
    followingIds.push(user.id) // Include own posts

    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: followingIds },
        status: "PUBLISHED",
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        author: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: {
          where: { userId: user.id },
          select: { id: true },
        },
      },
    })

    return posts.map((post) => ({
      ...post,
      isLiked: post.likes.length > 0,
    }))
  }),

  // Public posts (explore)
  explorePosts: async (parent, { page = 1, limit = 20 }, context) => {
    const skip = (page - 1) * limit

    return await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        visibility: "PUBLIC",
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        author: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    })
  },

  // Single post
  post: async (parent, { id }, context) => {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
        comments: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          include: {
            author: true,
            _count: {
              select: { likes: true },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: { where: { status: "ACTIVE" } },
          },
        },
        likes: context.user
          ? {
              where: { userId: context.user.id },
              select: { id: true },
            }
          : false,
      },
    })

    if (!post) {
      throw new Error("Post not found")
    }

    return {
      ...post,
      isLiked: context.user ? post.likes.length > 0 : false,
    }
  },

  // Search posts
  searchPosts: async (parent, { query, page = 1, limit = 20 }, context) => {
    const skip = (page - 1) * limit

    return await prisma.post.findMany({
      where: {
        OR: [
          { content: { contains: query, mode: "insensitive" } },
          { title: { contains: query, mode: "insensitive" } },
        ],
        status: "PUBLISHED",
        visibility: "PUBLIC",
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        author: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    })
  },
}

export default postQueries
