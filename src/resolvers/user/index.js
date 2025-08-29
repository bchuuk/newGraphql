// src/resolvers/user/index.js
import userQueries from "./queries.js"
import userMutations from "./mutations.js"
import userSubscriptions from "./subscriptions.js"

const userResolvers = {
  Query: {
    ...userQueries,
  },
  Mutation: {
    ...userMutations,
  },
  Subscription: {
    ...userSubscriptions,
  },
}

export default userResolvers
