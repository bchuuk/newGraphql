// src/lib/appleAuth.js
import pkg from "verify-apple-id-token"
const { verifyIdToken } = pkg

export const verifyAppleToken = async (idToken) => {
  try {
    const jwtClaims = await verifyIdToken({
      idToken,
      clientId: process.env.APPLE_CLIENT_ID,
    })

    return jwtClaims
  } catch (error) {
    throw new Error("Invalid Apple ID token")
  }
}
