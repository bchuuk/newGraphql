// src/resolvers/post/subscriptions.js
import { withFilter } from "graphql-subscriptions"
import { PubSub } from "graphql-subscriptions"

const pubsub = new PubSub()

const postSubscriptions = {
  // Тодорхой post дээр шинэ comment
  newComment: {
    subscribe: withFilter(
      () => pubsub.asyncIterableIterator(["NEW_COMMENT"]),
      (payload, variables) => {
        return payload.newComment.postId === variables.postId
      }
    ),
  },

  // Post дээр like/unlike
  postLiked: {
    subscribe: withFilter(
      () => pubsub.asyncIterableIterator(["POST_LIKED"]),
      (payload, variables) => {
        return payload.postLiked.postId === variables.postId
      }
    ),
  },
}

export default postSubscriptions
