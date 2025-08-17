export interface Permission {
  /** The resource the permission applies to, e.g., "document", "workspace" */
  resource: string
  /** The action allowed on the resource, e.g., "read", "write", "delete" */
  action: string
  /** Optional conditions that further constrain the permission (e.g., ownerOnly: true) */
  conditions?: Record<string, unknown>
}

/**
 * JWT payload representing the authenticated user.
 * Additional standard JWT fields (iat, exp, etc.) can be added as needed.
 */
export interface JWTAuthToken {
  /** Unique identifier of the user */
  userId: string
  /** IDs of workspaces the user belongs to */
  workspaceIds: string[]
  /** List of permissions granted to the user */
  permissions: Permission[]
  /** Issued at timestamp (seconds since epoch) */
  iat?: number
  /** Expiration timestamp (seconds since epoch) */
  exp?: number
}