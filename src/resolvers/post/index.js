// src/resolvers/post/index.js
import postQueries from "./queries.js"
import postMutations from "./mutations.js"
import postSubscriptions from "./subscriptions.js"

const postResolvers = {
  Query: {
    ...postQueries,
  },
  Mutation: {
    ...postMutations,
  },
  Subscription: {
    ...postSubscriptions,
  },
}

export default postResolvers
