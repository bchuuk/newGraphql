// src/lib/googleAuth.js
import { OAuth2Client } from "google-auth-library"

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    return ticket.getPayload()
  } catch (error) {
    throw new Error("Invalid Google ID token")
  }
}
