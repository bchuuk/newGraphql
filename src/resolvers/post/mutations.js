// src/resolvers/post/mutations.js
import { prisma } from "../../lib/prisma.js"
import { requireAuth } from "../../middleware/auth.js"
import { PubSub } from "graphql-subscriptions"

const pubsub = new PubSub()

const postMutations = {
  // Post үүсгэх
  createPost: requireAuth(async (parent, { input }, context) => {
    const { user } = context

    const post = await prisma.post.create({
      data: {
        ...input,
        authorId: user.id,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
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

    // Real-time notification to followers
    const followers = await prisma.follow.findMany({
      where: { followingId: user.id },
      include: { follower: true },
    })

    // Send notifications to followers
    if (followers.length > 0) {
      const notifications = followers.map((follow) => ({
        type: "NEW_POST",
        userId: follow.followerId,
        fromUserId: user.id,
        postId: post.id,
        message: `${user.displayName || user.username} shared a new post`,
      }))

      await prisma.notification.createMany({
        data: notifications,
      })
    }

    // Publish to subscription
    pubsub.publish("NEW_POST", {
      newPostFromFollowing: post,
    })

    return {
      success: true,
      message: "Post created successfully",
      post,
    }
  }),

  // Post засах
  updatePost: requireAuth(async (parent, { id, input }, context) => {
    const { user } = context

    // Check ownership
    const existingPost = await prisma.post.findUnique({
      where: { id },
    })

    if (!existingPost || existingPost.authorId !== user.id) {
      throw new Error("Post not found or unauthorized")
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...input,
        updatedAt: new Date(),
      },
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

    return {
      success: true,
      message: "Post updated successfully",
      post: updatedPost,
    }
  }),

  // Post устгах
  deletePost: requireAuth(async (parent, { id }, context) => {
    const { user } = context

    // Check ownership
    const existingPost = await prisma.post.findUnique({
      where: { id },
    })

    if (!existingPost || existingPost.authorId !== user.id) {
      throw new Error("Post not found or unauthorized")
    }

    await prisma.post.update({
      where: { id },
      data: {
        status: "DELETED",
        deletedAt: new Date(),
      },
    })

    return {
      success: true,
      message: "Post deleted successfully",
    }
  }),

  // Like хийх
  likePost: requireAuth(async (parent, { postId }, context) => {
    const { user } = context

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: user.id,
          postId: postId,
        },
      },
    })

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: { id: existingLike.id },
      })

      return {
        success: true,
        message: "Post unliked",
        isLiked: false,
      }
    } else {
      // Like
      await prisma.like.create({
        data: {
          userId: user.id,
          postId: postId,
        },
      })

      // Get post info for notification
      const post = await prisma.post.findUnique({
        where: { id: postId },
        include: { author: true },
      })

      // Create notification if not own post
      if (post && post.authorId !== user.id) {
        await prisma.notification.create({
          data: {
            type: "POST_LIKED",
            userId: post.authorId,
            fromUserId: user.id,
            postId: postId,
            message: `${user.displayName || user.username} liked your post`,
          },
        })

        // Real-time notification
        pubsub.publish("NEW_NOTIFICATION", {
          newNotification: {
            userId: post.authorId,
            type: "POST_LIKED",
            fromUser: user,
            post: post,
            timestamp: new Date(),
          },
        })
      }

      return {
        success: true,
        message: "Post liked",
        isLiked: true,
      }
    }
  }),

  // Comment хийх
  commentOnPost: requireAuth(async (parent, { postId, content }, context) => {
    const { user } = context

    const comment = await prisma.comment.create({
      data: {
        content,
        authorId: user.id,
        postId: postId,
        status: "ACTIVE",
      },
      include: {
        author: true,
        _count: {
          select: { likes: true },
        },
      },
    })

    // Get post info for notification
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: true },
    })

    // Create notification if not own post
    if (post && post.authorId !== user.id) {
      await prisma.notification.create({
        data: {
          type: "POST_COMMENTED",
          userId: post.authorId,
          fromUserId: user.id,
          postId: postId,
          message: `${
            user.displayName || user.username
          } commented on your post`,
        },
      })
    }

    // Publish to subscription
    pubsub.publish("NEW_COMMENT", {
      newComment: {
        postId: postId,
        comment: comment,
      },
    })

    return {
      success: true,
      message: "Comment added successfully",
      comment,
    }
  }),

  // Report post
  reportPost: requireAuth(
    async (parent, { postId, reason, description }, context) => {
      const { user } = context

      // Check if already reported
      const existingReport = await prisma.report.findFirst({
        where: {
          reporterId: user.id,
          postId: postId,
        },
      })

      if (existingReport) {
        throw new Error("You have already reported this post")
      }

      const report = await prisma.report.create({
        data: {
          reason,
          description,
          reporterId: user.id,
          postId: postId,
          status: "PENDING",
        },
        include: {
          reporter: true,
          post: {
            include: { author: true },
          },
        },
      })

      // Notify admins
      pubsub.publish("NEW_REPORT", {
        newReport: report,
      })

      return {
        success: true,
        message: "Post reported successfully",
      }
    }
  ),
}

export default postMutations
