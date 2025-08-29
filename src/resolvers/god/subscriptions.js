// src/resolvers/god/subscriptions.js
import { withFilter } from "graphql-subscriptions"
import { PubSub } from "graphql-subscriptions"
import { requireRole } from "../../middleware/auth.js"

const pubsub = new PubSub()

const godSubscriptions = {
  // Системийн бүх үйл ажиллагаа
  systemActivity: {
    subscribe: requireRole(
      ["GOD"],
      withFilter(
        () => pubsub.asyncIterator(["SYSTEM_ACTIVITY"]),
        (payload, variables, context) => {
          return true // GOD бүгдийг хардаг
        }
      )
    ),
  },

  // Admin-уудын үйл ажиллагаа
  adminActivity: {
    subscribe: requireRole(
      ["GOD"],
      withFilter(
        () => pubsub.asyncIterator(["ADMIN_ACTIVITY"]),
        (payload, variables, context) => {
          return true
        }
      )
    ),
  },

  // Critical system alerts
  criticalAlert: {
    subscribe: requireRole(
      ["GOD"],
      withFilter(
        () => pubsub.asyncIterator(["CRITICAL_ALERT"]),
        (payload, variables, context) => {
          return true
        }
      )
    ),
  },
}

export default godSubscriptions
