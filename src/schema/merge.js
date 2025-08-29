// src/schema/merge.js
import { loadFiles } from "@graphql-tools/load-files"
import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge"
import { globby } from "globby"
import path from "path"

export async function buildSchema() {
  // Use globby to find files
  const typeDefsFiles = await globby("src/resolvers/**/typeDefs.js")
  const resolversFiles = await globby("src/resolvers/**/index.js")

  const typeDefsArray = await Promise.all(
    typeDefsFiles.map(async (file) => {
      const normalizedPath = new URL(
        `file://${path.resolve(file).replace(/\\/g, "/")}`
      ).href
      return (await import(normalizedPath)).default
    })
  )

  const resolversArray = await Promise.all(
    resolversFiles.map(async (file) => {
      const normalizedPath = new URL(
        `file://${path.resolve(file).replace(/\\/g, "/")}`
      ).href
      return (await import(normalizedPath)).default
    })
  )

  console.log("typeDefsArray:", typeDefsArray)
  console.log("resolversArray:", resolversArray)

  const typeDefs = mergeTypeDefs(typeDefsArray)
  const resolvers = mergeResolvers(resolversArray)

  return { typeDefs, resolvers }
}
