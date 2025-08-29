import { gql } from "graphql-tag"

export default gql`
  type User {
    id: ID!
    email: String!
    username: String!
    createdAt: DateTime!
  }

  extend type Query {
    me: User
    users: [User!]!
  }

  extend type Mutation {
    updateUser(username: String!): User!
  }
`
