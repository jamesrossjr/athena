interface OAuthClient {
  id: string
  name: string
  description: string
  redirectUris: string[]
  scopes: string[]
  clientType: 'public' | 'confidential'
  logoUrl?: string
  websiteUrl?: string
  privacyPolicyUrl?: string
  termsOfServiceUrl?: string
  createdAt: Date
  isActive: boolean
}

interface AuthorizationRequest {
  clientId: string
  redirectUri: string
  scope: string
  state?: string
  responseType: 'code'
  codeChallenge?: string
  codeChallengeMethod?: 'S256'
}

// Mock OAuth clients database
const oauthClients: Record<string, OAuthClient> = {
  'zapier-integration': {
    id: 'zapier-integration',
    name: 'Zapier',
    description: 'Connect Athena with 5,000+ apps through Zapier automation',
    redirectUris: ['https://zapier.com/dashboard/auth/oauth/return/'],
    scopes: ['documents:read', 'documents:write', 'workspaces:read'],
    clientType: 'confidential',
    logoUrl: 'https://cdn.zapier.com/storage/photos/9999bc50d087bffd82bb2df2f6726467.png',
    websiteUrl: 'https://zapier.com',
    privacyPolicyUrl: 'https://zapier.com/privacy',
    termsOfServiceUrl: 'https://zapier.com/terms',
    createdAt: new Date('2024-01-01'),
    isActive: true
  },
  'notion-sync': {
    id: 'notion-sync',
    name: 'Notion Sync',
    description: 'Bidirectional sync between Athena and Notion workspaces',
    redirectUris: ['https://notion.so/oauth/callback'],
    scopes: ['documents:read', 'documents:write', 'knowledge-graph:read'],
    clientType: 'confidential',
    logoUrl: 'https://notion.so/images/favicon.ico',
    websiteUrl: 'https://notion.so',
    createdAt: new Date('2024-01-15'),
    isActive: true
  },
  'obsidian-plugin': {
    id: 'obsidian-plugin',
    name: 'Obsidian Plugin',
    description: 'Connect your Obsidian vault with Athena knowledge graph',
    redirectUris: ['obsidian://oauth-callback'],
    scopes: ['knowledge-graph:read', 'knowledge-graph:write', 'documents:read'],
    clientType: 'public',
    logoUrl: 'https://obsidian.md/images/favicon.ico',
    websiteUrl: 'https://obsidian.md',
    createdAt: new Date('2024-02-01'),
    isActive: true
  },
  'slack-bot': {
    id: 'slack-bot',
    name: 'Athena Slack Bot',
    description: 'Access and create Athena content directly from Slack',
    redirectUris: ['https://slack.com/oauth/v2/authorize'],
    scopes: ['documents:read', 'documents:write', 'ai:query'],
    clientType: 'confidential',
    logoUrl: 'https://slack.com/favicon.ico',
    websiteUrl: 'https://slack.com',
    createdAt: new Date('2024-02-15'),
    isActive: true
  }
}

const availableScopes = {
  'documents:read': {
    name: 'Read Documents',
    description: 'View your documents and their content'
  },
  'documents:write': {
    name: 'Write Documents',
    description: 'Create, edit, and delete documents'
  },
  'workspaces:read': {
    name: 'Read Workspaces',
    description: 'View workspace information and membership'
  },
  'workspaces:write': {
    name: 'Manage Workspaces',
    description: 'Create and manage workspaces'
  },
  'knowledge-graph:read': {
    name: 'Read Knowledge Graph',
    description: 'Access your knowledge graph and connections'
  },
  'knowledge-graph:write': {
    name: 'Write Knowledge Graph',
    description: 'Create and modify knowledge graph connections'
  },
  'ai:query': {
    name: 'AI Assistant',
    description: 'Query the AI assistant and get suggestions'
  },
  'analytics:read': {
    name: 'Read Analytics',
    description: 'View usage analytics and insights'
  },
  'sharing:manage': {
    name: 'Manage Sharing',
    description: 'Share documents and manage permissions'
  },
  'profile:read': {
    name: 'Read Profile',
    description: 'Access basic profile information'
  }
}

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event) as unknown as AuthorizationRequest
    const { 
      client_id: clientId, 
      redirect_uri: redirectUri, 
      scope, 
      state, 
      response_type: responseType,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod
    } = query

    // Validate required parameters
    if (!clientId || !redirectUri || !scope || !responseType) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required OAuth parameters'
      })
    }

    // Validate response type
    if (responseType !== 'code') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Only authorization code flow is supported'
      })
    }

    // Validate client
    const client = oauthClients[clientId]
    if (!client || !client.isActive) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid or inactive client'
      })
    }

    // Validate redirect URI
    if (!client.redirectUris.includes(redirectUri)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid redirect URI'
      })
    }

    // Validate scopes
    const requestedScopes = scope.split(' ')
    const invalidScopes = requestedScopes.filter(s => !availableScopes[s])
    if (invalidScopes.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Invalid scopes: ${invalidScopes.join(', ')}`
      })
    }

    // Validate client scopes
    const unauthorizedScopes = requestedScopes.filter(s => !client.scopes.includes(s))
    if (unauthorizedScopes.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Client not authorized for scopes: ${unauthorizedScopes.join(', ')}`
      })
    }

    // Get current user (check authentication)
    const userId = getCookie(event, 'user-id')
    if (!userId) {
      // Redirect to login with return URL
      const loginUrl = `/auth/login?return_to=${encodeURIComponent(event.node.req.url!)}`
      await sendRedirect(event, loginUrl)
      return
    }

    // Check for existing authorization
    const existingAuth = await checkExistingAuthorization(userId, clientId, requestedScopes)
    if (existingAuth) {
      // User has already authorized these scopes, generate code directly
      const authCode = await generateAuthorizationCode(userId, clientId, requestedScopes, codeChallenge, codeChallengeMethod)
      const redirectUrl = new URL(redirectUri)
      redirectUrl.searchParams.set('code', authCode)
      if (state) redirectUrl.searchParams.set('state', state)
      
      await sendRedirect(event, redirectUrl.toString())
      return
    }

    // Return authorization page data
    return {
      client: {
        id: client.id,
        name: client.name,
        description: client.description,
        logoUrl: client.logoUrl,
        websiteUrl: client.websiteUrl,
        privacyPolicyUrl: client.privacyPolicyUrl,
        termsOfServiceUrl: client.termsOfServiceUrl
      },
      requestedScopes: requestedScopes.map(scopeId => ({
        id: scopeId,
        ...availableScopes[scopeId]
      })),
      authorizationUrl: event.node.req.url,
      csrfToken: await generateCSRFToken(event)
    }
  } catch (error) {
    console.error('OAuth authorization error:', error)
    
    // If we have a redirect URI and it's valid, redirect with error
    const query = getQuery(event)
    if (query.redirect_uri && query.client_id && oauthClients[query.client_id as string]) {
      const errorUrl = new URL(query.redirect_uri as string)
      errorUrl.searchParams.set('error', 'server_error')
      errorUrl.searchParams.set('error_description', 'Authorization server error')
      if (query.state) errorUrl.searchParams.set('state', query.state as string)
      
      await sendRedirect(event, errorUrl.toString())
      return
    }
    
    throw error
  }
})

// Helper functions
async function checkExistingAuthorization(userId: string, clientId: string, scopes: string[]): Promise<boolean> {
  // In a real implementation, check database for existing authorization
  // For now, return false to always show authorization page
  return false
}

async function generateAuthorizationCode(
  userId: string, 
  clientId: string, 
  scopes: string[], 
  codeChallenge?: string,
  codeChallengeMethod?: string
): Promise<string> {
  const code = generateRandomString(32)
  
  // Store authorization code in database/cache with expiration (10 minutes)
  const authData = {
    userId,
    clientId,
    scopes,
    codeChallenge,
    codeChallengeMethod,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  }
  
  // In a real implementation, store in Redis/database
  console.log('Generated auth code:', code, authData)
  
  return code
}

async function generateCSRFToken(event: any): Promise<string> {
  const token = generateRandomString(32)
  // Store CSRF token in session
  setCookie(event, 'oauth_csrf_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 3600 // 1 hour
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