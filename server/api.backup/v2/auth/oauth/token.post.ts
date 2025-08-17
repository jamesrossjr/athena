import { createHash } from 'crypto'
import jwt from 'jsonwebtoken'

interface TokenRequest {
  grant_type: 'authorization_code' | 'refresh_token'
  code?: string
  refresh_token?: string
  client_id: string
  client_secret?: string
  redirect_uri?: string
  code_verifier?: string
}

interface AccessToken {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token: string
  scope: string
}

// Mock stored authorization codes and tokens
const authorizationCodes = new Map<string, {
  userId: string
  clientId: string
  scopes: string[]
  codeChallenge?: string
  codeChallengeMethod?: string
  expiresAt: Date
  used: boolean
}>()

const refreshTokens = new Map<string, {
  userId: string
  clientId: string
  scopes: string[]
  expiresAt: Date
  revoked: boolean
}>()

// Client credentials (in production, store securely)
const clientCredentials = {
  'zapier-integration': 'zapier_secret_key_12345',
  'notion-sync': 'notion_secret_key_67890',
  'slack-bot': 'slack_secret_key_abcdef'
  // Public clients like Obsidian plugin don't have secrets
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<TokenRequest>(event)
    const { 
      grant_type: grantType, 
      code, 
      refresh_token: refreshToken,
      client_id: clientId, 
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    } = body

    // Validate required parameters
    if (!grantType || !clientId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required parameters'
      })
    }

    // Validate grant type
    if (!['authorization_code', 'refresh_token'].includes(grantType)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Unsupported grant type'
      })
    }

    // Validate client (if confidential client, check secret)
    if (clientCredentials[clientId]) {
      if (!clientSecret || clientCredentials[clientId] !== clientSecret) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Invalid client credentials'
        })
      }
    }

    if (grantType === 'authorization_code') {
      return await handleAuthorizationCodeGrant(code!, clientId, redirectUri, codeVerifier)
    } else {
      return await handleRefreshTokenGrant(refreshToken!, clientId)
    }
  } catch (error) {
    console.error('OAuth token error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})

async function handleAuthorizationCodeGrant(
  code: string, 
  clientId: string, 
  redirectUri?: string,
  codeVerifier?: string
): Promise<AccessToken> {
  // Validate authorization code
  const authData = authorizationCodes.get(code)
  if (!authData) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid authorization code'
    })
  }

  // Check if code is expired
  if (new Date() > authData.expiresAt) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Authorization code expired'
    })
  }

  // Check if code was already used
  if (authData.used) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Authorization code already used'
    })
  }

  // Validate client ID
  if (authData.clientId !== clientId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Client ID mismatch'
    })
  }

  // Validate PKCE if present
  if (authData.codeChallenge) {
    if (!codeVerifier) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Code verifier required'
      })
    }

    const expectedChallenge = authData.codeChallengeMethod === 'S256'
      ? createHash('sha256').update(codeVerifier).digest('base64url')
      : codeVerifier

    if (expectedChallenge !== authData.codeChallenge) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid code verifier'
      })
    }
  }

  // Mark code as used
  authData.used = true

  // Generate tokens
  const accessToken = await generateAccessToken(authData.userId, clientId, authData.scopes)
  const newRefreshToken = await generateRefreshToken(authData.userId, clientId, authData.scopes)

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600, // 1 hour
    refresh_token: newRefreshToken,
    scope: authData.scopes.join(' ')
  }
}

async function handleRefreshTokenGrant(refreshToken: string, clientId: string): Promise<AccessToken> {
  // Validate refresh token
  const tokenData = refreshTokens.get(refreshToken)
  if (!tokenData) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid refresh token'
    })
  }

  // Check if token is expired
  if (new Date() > tokenData.expiresAt) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Refresh token expired'
    })
  }

  // Check if token is revoked
  if (tokenData.revoked) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Refresh token revoked'
    })
  }

  // Validate client ID
  if (tokenData.clientId !== clientId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Client ID mismatch'
    })
  }

  // Generate new tokens
  const accessToken = await generateAccessToken(tokenData.userId, clientId, tokenData.scopes)
  const newRefreshToken = await generateRefreshToken(tokenData.userId, clientId, tokenData.scopes)

  // Revoke old refresh token
  tokenData.revoked = true

  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600, // 1 hour
    refresh_token: newRefreshToken,
    scope: tokenData.scopes.join(' ')
  }
}

async function generateAccessToken(userId: string, clientId: string, scopes: string[]): Promise<string> {
  const config = useRuntimeConfig()
  
  const payload = {
    sub: userId,
    aud: clientId,
    scope: scopes.join(' '),
    iss: 'athena-api',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    jti: generateRandomString(16) // Unique token ID
  }

  return jwt.sign(payload, config.jwtSecret || 'fallback-secret', {
    algorithm: 'HS256'
  })
}

async function generateRefreshToken(userId: string, clientId: string, scopes: string[]): Promise<string> {
  const token = generateRandomString(64)
  
  // Store refresh token
  refreshTokens.set(token, {
    userId,
    clientId,
    scopes,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    revoked: false
  })
  
  return token
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}