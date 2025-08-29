// src/resolvers/post/typeDefs.js
import { gql } from "graphql-tag"

export default gql`
  type Post {
    id: ID!
    title: String!
    content: String
    status: String
    visibility: String
    authorId: ID!
    createdAt: String
    updatedAt: String
    deletedAt: String
    author: User
    _count: PostCount
    isLiked: Boolean
  }

  type PostCount {
    likes: Int
    comments: Int
  }

  type Comment {
    id: ID!
    content: String!
    status: String
    postId: ID!
    authorId: ID!
    createdAt: String
    updatedAt: String
    author: User
    _count: CommentCount
  }

  type CommentCount {
    likes: Int
  }

  type SuccessMessage {
    success: Boolean!
    message: String!
    post: Post
    comment: Comment
    isLiked: Boolean
  }

  input CreatePostInput {
    title: String!
    content: String
    visibility: String
  }

  input UpdatePostInput {
    title: String
    content: String
    status: String
    visibility: String
  }

  type Query {
    feed(page: Int, limit: Int): [Post]
    explorePosts(page: Int, limit: Int): [Post]
    post(id: ID!): Post
    searchPosts(query: String!, page: Int, limit: Int): [Post]
  }

  type Mutation {
    createPost(input: CreatePostInput!): SuccessMessage!
    updatePost(id: ID!, input: UpdatePostInput!): SuccessMessage!
    deletePost(id: ID!): SuccessMessage!
    likePost(postId: ID!): SuccessMessage!
    commentOnPost(postId: ID!, content: String!): SuccessMessage!
    reportPost(
      postId: ID!
      reason: String!
      description: String
    ): SuccessMessage!
  }

  type Subscription {
    newComment(postId: ID!): Comment
    postLiked(postId: ID!): Post
  }
`
