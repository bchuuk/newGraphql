// src/resolvers/admin/index.js
import adminQueries from "./queries.js"
import adminMutations from "./mutations.js"
import adminSubscriptions from "./subscriptions.js"

const adminResolvers = {
  Query: {
    ...adminQueries,
  },
  Mutation: {
    ...adminMutations,
  },
  Subscription: {
    ...adminSubscriptions,
  },
}

export default adminResolvers
