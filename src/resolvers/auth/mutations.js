// src/resolvers/auth/mutations.js
import { prisma } from "../../lib/prisma.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { verifyAppleToken } from "../../lib/appleAuth.js"
import { verifyGoogleToken } from "../../lib/googleAuth.js"

const authMutations = {
  // Email/Password login
  login: async (parent, { email, password }, context) => {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      throw new Error("Invalid email or password")
    }

    if (user.status === "BLOCKED") {
      throw new Error("Your account has been blocked")
    }

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      throw new Error("Invalid email or password")
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    })

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    )

    return {
      success: true,
      message: "Login successful",
      token,
      user,
    }
  },

  // Register
  register: async (parent, { input }, context) => {
    const { email, username, password, displayName } = input

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      },
    })

    if (existingUser) {
      throw new Error("User with this email or username already exists")
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password: hashedPassword,
        displayName,
        role: "USER",
        status: "ACTIVE",
      },
    })

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    )

    return {
      success: true,
      message: "Registration successful",
      token,
      user,
    }
  },

  // Apple Sign In
  appleSignIn: async (parent, { idToken }, context) => {
    try {
      const appleUser = await verifyAppleToken(idToken)

      let user = await prisma.user.findUnique({
        where: { appleId: appleUser.sub },
      })

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            appleId: appleUser.sub,
            email: appleUser.email,
            displayName: appleUser.name || "Apple User",
            username: `apple_${appleUser.sub.slice(-8)}`,
            role: "USER",
            status: "ACTIVE",
            emailVerified: true, // Apple emails are pre-verified
          },
        })
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      )

      return {
        success: true,
        message: "Apple sign in successful",
        token,
        user,
      }
    } catch (error) {
      throw new Error("Invalid Apple ID token")
    }
  },

  // Google Sign In
  googleSignIn: async (parent, { idToken }, context) => {
    try {
      const googleUser = await verifyGoogleToken(idToken)

      let user = await prisma.user.findUnique({
        where: { googleId: googleUser.sub },
      })

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            googleId: googleUser.sub,
            email: googleUser.email,
            displayName: googleUser.name,
            username: `google_${googleUser.sub.slice(-8)}`,
            avatar: googleUser.picture,
            role: "USER",
            status: "ACTIVE",
            emailVerified: true, // Google emails are pre-verified
          },
        })
      }

      // Generate JWT
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      )

      return {
        success: true,
        message: "Google sign in successful",
        token,
        user,
      }
    } catch (error) {
      throw new Error("Invalid Google ID token")
    }
  },

  // Logout (optional - mainly for clearing tokens client-side)
  logout: async (parent, args, context) => {
    return {
      success: true,
      message: "Logged out successfully",
    }
  },

  // Forgot password
  forgotPassword: async (parent, { email }, context) => {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      // Don't reveal if email exists or not
      return {
        success: true,
        message:
          "If an account with this email exists, a reset link has been sent",
      }
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    )

    // Save reset token to database
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    })

    // TODO: Send email with reset link
    // await sendPasswordResetEmail(user.email, resetToken);

    return {
      success: true,
      message:
        "If an account with this email exists, a reset link has been sent",
    }
  },

  // Reset password
  resetPassword: async (parent, { token, newPassword }, context) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      if (decoded.type !== "password_reset") {
        throw new Error("Invalid token")
      }

      // Check if reset token exists and is not expired
      const resetRecord = await prisma.passwordReset.findFirst({
        where: {
          token,
          expiresAt: { gt: new Date() },
          used: false,
        },
      })

      if (!resetRecord) {
        throw new Error("Invalid or expired reset token")
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      // Update user password
      await prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword },
      })

      // Mark reset token as used
      await prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true },
      })

      return {
        success: true,
        message: "Password reset successfully",
      }
    } catch (error) {
      throw new Error("Invalid or expired reset token")
    }
  },
}

export default authMutations
