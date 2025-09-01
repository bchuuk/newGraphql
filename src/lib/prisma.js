// src/lib/prisma.js
import pkg from "@prisma/client"
const { PrismaClient } = pkg

export const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
})
