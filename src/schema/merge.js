// src/schema/merge.js
import { loadFiles } from "@graphql-tools/load-files"
import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge"

export async function buildSchema() {
  // TypeDefs-г бүх folder-с ачаал
  const typeDefsArray = await loadFiles("src/resolvers/**/typeDefs.js", {
    extensions: ["js"],
    import: true, // dynamic import ашиглана
  })

  // Resolvers-г бүх folder-с ачаал
  const resolversArray = await loadFiles("src/resolvers/**/index.js", {
    extensions: ["js"],
    import: true,
  })

  console.log("typeDefsArray:", typeDefsArray)
  console.log("resolversArray:", resolversArray)

  const typeDefs = mergeTypeDefs(typeDefsArray)
  const resolvers = mergeResolvers(resolversArray)

  return { typeDefs, resolvers }
}
