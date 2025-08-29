// src/middleware/auth.js
import jwt from "jsonwebtoken"
import { prisma } from "../lib/prisma.js"

// Basic authentication middleware
export const requireAuth = (resolver) => {
  return async (parent, args, context, info) => {
    const { user } = context

    if (!user) {
      throw new Error("Authentication required")
    }

    if (user.status === "BLOCKED") {
      throw new Error("Your account has been blocked")
    }

    return resolver(parent, args, context, info)
  }
}

// Role-based authentication middleware
export const requireRole = (roles, resolver) => {
  return async (parent, args, context, info) => {
    const { user } = context

    if (!user) {
      throw new Error("Authentication required")
    }

    if (user.status === "BLOCKED") {
      throw new Error("Your account has been blocked")
    }

    if (!roles.includes(user.role)) {
      throw new Error("Insufficient permissions")
    }

    return resolver(parent, args, context, info)
  }
}

// JWT token verification helper
export const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      throw new Error("User not found")
    }

    return user
  } catch (error) {
    throw new Error("Invalid token")
  }
}

// Context helper to extract user from request
export const getUser = async (req) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) return null

    const token = authHeader.replace("Bearer ", "")
    if (!token) return null

    return await verifyToken(token)
  } catch (error) {
    return null
  }
}
