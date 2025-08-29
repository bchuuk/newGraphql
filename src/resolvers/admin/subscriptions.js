// src/resolvers/admin/sbscriptions.js
import { withFilter } from "graphql-subscriptions"
import { PubSub } from "graphql-subscriptions"
import { requireRole } from "../../middleware/auth.js"

const pubsub = new PubSub()

const adminSubscriptions = {
  // Шинэ тайлан ирэх үед
  newReport: {
    subscribe: requireRole(
      ["ADMIN"],
      withFilter(
        () => pubsub.asyncIterator(["NEW_REPORT"]),
        (payload, variables, context) => {
          return true // Бүх admin-д илгээх
        }
      )
    ),
  },

  // Хэрэглэгчийн статус өөрчлөгдөх үед
  userStatusChanged: {
    subscribe: requireRole(
      ["ADMIN"],
      withFilter(
        () => pubsub.asyncIterator(["USER_STATUS_CHANGED"]),
        (payload, variables, context) => {
          return true
        }
      )
    ),
  },

  // Системийн alert-ууд
  systemAlert: {
    subscribe: requireRole(
      ["ADMIN"],
      withFilter(
        () => pubsub.asyncIterator(["SYSTEM_ALERT"]),
        (payload, variables, context) => {
          return true
        }
      )
    ),
  },
}

export default adminSubscriptions
