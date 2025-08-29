// src/resolvers/god/index.js
import godQueries from "./queries.js"
import godMutations from "./mutations.js"
import godSubscriptions from "./subscriptions.js"

const godResolvers = {
  Query: {
    ...godQueries,
  },
  Mutation: {
    ...godMutations,
  },
  Subscription: {
    ...godSubscriptions,
  },
}

export default godResolvers
