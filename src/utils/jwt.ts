import jwt from 'jsonwebtoken'

export interface JwtPayload {
  uuid: string
  username: string
  email?: string | null
  phone_no?: string | null
  role_id?: string | null
  session_token: string
  session_id: string
}

export interface JwtToken {
  access: string
  refresh: string
}

export const generateJWT = (
  payload: JwtPayload,
  secretKey: string
): JwtToken => {
  const tokenPayload = {
    ...payload,
    sub: payload.uuid,
    id: payload.uuid,
  }

  const accessToken = jwt.sign(tokenPayload, secretKey, {
    algorithm: 'HS256',
    expiresIn: '1d',
  })

  const refreshToken = jwt.sign(
    {
      ...tokenPayload,
      type: 'refresh',
    },
    secretKey,
    {
      algorithm: 'HS256',
      expiresIn: '14d',
    }
  )

  const decoded = jwt.decode(accessToken) as { exp?: number } | null

  if (decoded?.exp) {
    console.log(
      'Access token expiry:',
      new Date(decoded.exp * 1000).toLocaleString()
    )
  }

  return {
    access: accessToken,
    refresh: refreshToken,
  }
}