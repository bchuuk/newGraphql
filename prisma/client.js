import { PrismaClient } from "@prisma/client"

if (!global.prisma) {
  global.prisma = new PrismaClient()
}

const client = global.prisma

export default client
