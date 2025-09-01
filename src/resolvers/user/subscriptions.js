// src/resolvers/user/subscriptions.js
import { withFilter } from "graphql-subscriptions"
import { PubSub } from "graphql-subscriptions"
import { requireAuth } from "../../middleware/auth.js"

const pubsub = new PubSub()

const userSubscriptions = {
  // Шинэ notification
  newNotification: {
    subscribe: requireAuth(
      withFilter(
        () => pubsub.asyncIterableIterator(["NEW_NOTIFICATION"]),
        (payload, variables, context) => {
          return payload.newNotification.userId === context.user.id
        }
      )
    ),
  },

  // Following хэрэглэгчдийн шинэ post
  newPostFromFollowing: {
    subscribe: requireAuth(
      withFilter(
        () => pubsub.asyncIterableIterator(["NEW_POST"]),
        async (payload, variables, context) => {
          const { user } = context
          const { post } = payload.newPostFromFollowing

          // Check if user follows the post author
          const follows = await prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: user.id,
                followingId: post.authorId,
              },
            },
          })

          return !!follows
        }
      )
    ),
  },
}

export default userSubscriptions
