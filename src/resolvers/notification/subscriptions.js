// src/resolvers/notification/subscriptions.js
import { withFilter } from "graphql-subscriptions"
import { PubSub } from "graphql-subscriptions"
import { requireAuth } from "../../middleware/auth.js"

const pubsub = new PubSub()

const notificationSubscriptions = {
  // Real-time push notification status
  pushNotificationStatus: {
    subscribe: requireAuth(
      withFilter(
        () => pubsub.asyncIterator(["PUSH_STATUS"]),
        (payload, variables, context) => {
          return payload.pushNotificationStatus.userId === context.user.id
        }
      )
    ),
  },
}

export default notificationSubscriptions
