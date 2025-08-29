import { loadFiles } from "@graphql-tools/load-files"
import { mergeTypeDefs, mergeResolvers } from "@graphql-tools/merge"
import path from "path"
import { pathToFileURL } from "url"

export async function buildSchema() {
  // resolvers
  const resolversArray = await loadFiles(
    pathToFileURL(path.join(process.cwd(), "src/resolvers/**/index.js")).href,
    { extensions: ["js"], import: true }
  )

  // typeDefs
  const typeDefsArray = await loadFiles(
    pathToFileURL(path.join(process.cwd(), "src/resolvers/**/typeDefs.js"))
      .href,
    { extensions: ["js"], import: true }
  )

  const typeDefs = mergeTypeDefs(typeDefsArray)
  const resolvers = mergeResolvers(resolversArray)

  return { typeDefs, resolvers }
}
