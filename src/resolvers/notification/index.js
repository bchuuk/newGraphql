// src/resolvers/notification/index.js
import notificationQueries from "./queries.js"
import notificationMutations from "./mutations.js"
import notificationSubscriptions from "./subscriptions.js"

const notificationResolvers = {
  Query: {
    ...notificationQueries,
  },
  Mutation: {
    ...notificationMutations,
  },
  Subscription: {
    ...notificationSubscriptions,
  },
}

export default notificationResolvers
