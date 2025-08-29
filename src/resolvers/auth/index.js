// src/resolvers/auth/index.js
import authMutations from "./mutations.js"

const authResolvers = {
  Mutation: {
    ...authMutations,
  },
}

export default authResolvers
