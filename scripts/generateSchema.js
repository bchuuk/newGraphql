// scripts/generateSchema.js
import { makeExecutableSchema } from "@graphql-tools/schema"
import { printSchema } from "graphql"
import fs from "fs"
import path from "path"

// Import resolvers болон typeDefs
import resolvers from "../src/resolvers/index.js"
import { typeDefs } from "../src/schema/typeDefs.js"

async function generateSchema() {
  try {
    console.log("🔄 Generating GraphQL schema...")

    // Schema үүсгэх
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    })

    // Schema-г string болгох
    const schemaString = printSchema(schema)

    // schema.graphql файл үүсгэх
    const schemaPath = path.join(process.cwd(), "src/schema/schema.graphql")

    // Directory үүсгэх
    const schemaDir = path.dirname(schemaPath)
    if (!fs.existsSync(schemaDir)) {
      fs.mkdirSync(schemaDir, { recursive: true })
    }

    // Файл бичих
    fs.writeFileSync(schemaPath, schemaString, "utf8")

    console.log("✅ Schema generated successfully!")
    console.log(`📁 Location: ${schemaPath}`)

    // Статистик харуулах
    const lines = schemaString.split("\n").length
    const types = (schemaString.match(/type \w+/g) || []).length
    const queries =
      (schemaString.match(/type Query[\s\S]*?(?=type|\Z)/g) || [""])[0].match(
        /\w+\(/g
      )?.length || 0
    const mutations =
      (schemaString.match(/type Mutation[\s\S]*?(?=type|\Z)/g) || [
        "",
      ])[0].match(/\w+\(/g)?.length || 0

    console.log(`📊 Schema Stats:`)
    console.log(`   - Lines: ${lines}`)
    console.log(`   - Types: ${types}`)
    console.log(`   - Queries: ${queries}`)
    console.log(`   - Mutations: ${mutations}`)
  } catch (error) {
    console.error("❌ Error generating schema:", error)
    process.exit(1)
  }
}

// Run generator
generateSchema()
