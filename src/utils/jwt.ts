import { Context } from 'hono'
import jwt from 'jsonwebtoken'

export interface JwtPayload {
  uuid: string;
  username: string;
  email?: string | null;
  phone_no?: string | null;
  role_id?: string | null;
  session: string;
}

export interface JwtToken {
  access: string
  refresh: string
}

/**
 * Generate JWT tokens (access + refresh) for Hono
 */
export const generateJWT = (payload: JwtPayload, secretKey: string): JwtToken => {
  // 1️⃣ Generate access token (7 days)
  const accessToken = jwt.sign({ ...payload, type: 'access' }, secretKey, { expiresIn: '7d' })

  // 2️⃣ Generate refresh token (14 days)
  const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, secretKey, { expiresIn: '14d' })

  // 3️⃣ Log decoded expiry (optional)
  const decoded = jwt.decode(accessToken) as { exp: number } | null
  if (decoded?.exp) {
    console.log('Access token expiry:', new Date(decoded.exp * 1000).toLocaleString())
  }

  return {
    access: accessToken,
    refresh: refreshToken,
  }
}