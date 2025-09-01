// src/lib/prisma.js
import pkg from "@prisma/client"
const { PrismaClient } = pkg

export const prisma = new PrismaClient({
  log: [
    // "query", // log all queries
    "info", // info
    "warn", // warn
    "error", // error
  ],
})
