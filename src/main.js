// src/main.js - WITH @as-integrations/express5
import { ApolloServer } from "@apollo/server"
import { expressMiddleware } from "@as-integrations/express5"
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer"
import { makeExecutableSchema } from "@graphql-tools/schema"
import express from "express"
import http from "http"
import cors from "cors"

import { useServer } from "graphql-ws/use/ws"
import { WebSocketServer } from "ws"

import cookieParser from "cookie-parser"
import fileUpload from "express-fileupload"
import dotenv from "dotenv"
import fs from "fs"

// Import resolvers and schema
import { typeDefs } from "./schema/typeDefs.js"
import resolvers from "./resolvers/index.js"
import { getUser } from "./middleware/auth.js"
import { prisma } from "./lib/prisma.js"

// Load environment variables
dotenv.config()

async function startServer() {
  try {
    console.log("🚀 Starting GraphQL server...")

    // Create GraphQL schema
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    })

    // Express app setup
    const app = express()
    const httpServer = http.createServer(app)

    // WebSocket server for subscriptions
    const wsServer = new WebSocketServer({
      server: httpServer,
      path: "/graphql",
    })

    // GraphQL subscription server
    const serverCleanup = useServer(
      {
        schema,
        context: async (ctx, msg, args) => {
          try {
            // Extract token from connection params
            const token =
              ctx.connectionParams?.authorization?.replace("Bearer ", "") ||
              ctx.connectionParams?.Authorization?.replace("Bearer ", "")

            const user = token
              ? await getUser({ headers: { authorization: `Bearer ${token}` } })
              : null

            return {
              user,
              prisma,
            }
          } catch (error) {
            console.error("Subscription context error:", error)
            return { user: null, prisma }
          }
        },
      },
      wsServer
    )

    // Apollo Server setup
    const server = new ApolloServer({
      schema,
      introspection: process.env.NODE_ENV !== "production",
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await serverCleanup.dispose()
              },
            }
          },
        },
      ],
    })

    // Start Apollo Server
    await server.start()
    console.log("✅ Apollo Server started")

    // Middleware setup
    const allowedOrigins = process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
      : ["http://localhost:3000", "http://localhost:3001"]

    app.use(
      cors({
        origin: allowedOrigins,
        credentials: true,
      })
    )

    app.use(express.json({ limit: "10mb" }))
    app.use(express.urlencoded({ extended: true }))
    app.use(cookieParser())

    // File upload middleware
    app.use(
      fileUpload({
        limits: {
          fileSize: 50 * 1024 * 1024, // 50MB
          files: 10, // Max 10 files
        },
        abortOnLimit: true,
        responseOnLimit: "File size limit exceeded",
      })
    )

    // Health check endpoint
    app.get("/health", (req, res) => {
      res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      })
    })

    // GraphQL endpoint using express middleware
    app.use(
      "/graphql",
      expressMiddleware(server, {
        context: async ({ req, res }) => {
          // Get user from request
          const user = await getUser(req)

          // Create context
          return {
            user,
            prisma,
            req,
            res,
          }
        },
      })
    )

    // File upload endpoint
    app.post("/upload", async (req, res) => {
      try {
        // Check authentication
        const user = await getUser(req)
        if (!user) {
          return res.status(401).json({ error: "Authentication required" })
        }

        if (!req.files || Object.keys(req.files).length === 0) {
          return res.status(400).json({ error: "No files uploaded" })
        }

        const files = Array.isArray(req.files.files)
          ? req.files.files
          : [req.files.files]
        const uploadedFiles = []

        for (const file of files) {
          // Save file logic here
          const filename = `${Date.now()}_${file.name}`
          const filepath = `uploads/${filename}`

          // Create uploads directory if it doesn't exist
          if (!fs.existsSync("public")) {
            fs.mkdirSync("public")
          }
          if (!fs.existsSync("public/uploads")) {
            fs.mkdirSync("public/uploads")
          }

          await file.mv(`public/${filepath}`)
          uploadedFiles.push({
            filename,
            url: `/${filepath}`,
            size: file.size,
            mimetype: file.mimetype,
          })
        }

        res.json({
          success: true,
          files: uploadedFiles,
        })
      } catch (error) {
        console.error("File upload error:", error)
        res.status(500).json({ error: "Upload failed" })
      }
    })

    // Serve static files
    app.use("/uploads", express.static("public/uploads"))

    // 404 handler
    app.use((req, res, next) => {
      res.status(404).json({
        error: "Route not found",
        availableEndpoints: ["/graphql", "/health", "/upload"],
      })
    })

    // Error handler
    app.use((error, req, res, next) => {
      console.error("Express error:", error)
      res.status(500).json({
        error: "Internal server error",
        message:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Something went wrong",
      })
    })

    // Start HTTP server
    const PORT = process.env.PORT || 4000

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`)
      console.log(`🔗 WebSocket ready at ws://localhost:${PORT}/graphql`)
      console.log(`📁 File upload at http://localhost:${PORT}/upload`)
      console.log(`💓 Health check at http://localhost:${PORT}/health`)
    })

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`🛑 ${signal} received, shutting down gracefully`)
      try {
        await server.stop()
        await serverCleanup.dispose()
        await prisma.$disconnect()
        httpServer.close(() => {
          console.log("✅ Server closed")
          process.exit(0)
        })
      } catch (error) {
        console.error("Error during shutdown:", error)
        process.exit(1)
      }
    }

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))
    process.on("SIGINT", () => gracefulShutdown("SIGINT"))
  } catch (error) {
    console.error("❌ Error starting server:", error)
    process.exit(1)
  }
}

// Database connection test
async function testDatabaseConnection() {
  try {
    await prisma.$connect()
    console.log("✅ Database connected successfully")

    // Test query
    const userCount = await prisma.user.count().catch(() => 0)
    console.log(`📊 Database stats: ${userCount} users`)
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    console.error("Please check your DATABASE_URL in .env file")

    // Continue without database for development
    if (process.env.NODE_ENV === "development") {
      console.log("⚠️  Continuing without database connection...")
    } else {
      process.exit(1)
    }
  }
}

// Start everything
async function main() {
  console.log("🔧 Environment:", process.env.NODE_ENV || "development")

  await testDatabaseConnection()
  await startServer()
}

main().catch((error) => {
  console.error("💥 Fatal error:", error)
  process.exit(1)
})

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error)
  process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason)
  process.exit(1)
})
