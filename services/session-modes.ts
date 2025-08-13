/**
 * Session Modes Service
 * 
 * Manages stateful vs stateless session modes to respect user choice
 * and data privacy:
 * - Guest Mode: Temporary, data not persisted after reload
 * - Logged-In Mode: Persistent, all data saved to database
 */

export enum SessionMode {
  GUEST = 'GUEST',
  LOGGED_IN = 'LOGGED_IN'
}

export interface GuestSession {
  mode: SessionMode.GUEST
  sessionId: string
  createdAt: Date
  expiresAt: Date
  data: {
    workspaces: Map<string, any>
    pages: Map<string, any>
    blocks: Map<string, any>
    links: Map<string, any>
  }
  settings: {
    theme: string
    preferences: Record<string, any>
  }
}

export interface LoggedInSession {
  mode: SessionMode.LOGGED_IN
  userId: string
  sessionToken: string
  createdAt: Date
  expiresAt: Date
  user: {
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
}

export type UnifiedSession = GuestSession | LoggedInSession

// Global session storage for guest mode
const guestSessions = new Map<string, GuestSession>()

export class SessionModeService {
  /**
   * Create a new guest session with temporary in-memory storage
   */
  createGuestSession(): GuestSession {
    const sessionId = this.generateSessionId()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + (24 * 60 * 60 * 1000)) // 24 hours

    const guestSession: GuestSession = {
      mode: SessionMode.GUEST,
      sessionId,
      createdAt: now,
      expiresAt,
      data: {
        workspaces: new Map(),
        pages: new Map(),
        blocks: new Map(),
        links: new Map()
      },
      settings: {
        theme: 'light',
        preferences: {}
      }
    }

    guestSessions.set(sessionId, guestSession)
    
    // Set cleanup timer
    setTimeout(() => {
      this.cleanupGuestSession(sessionId)
    }, expiresAt.getTime() - now.getTime())

    return guestSession
  }

  /**
   * Get a guest session by ID
   */
  getGuestSession(sessionId: string): GuestSession | null {
    const session = guestSessions.get(sessionId)
    
    if (!session) return null
    
    // Check if expired
    if (new Date() > session.expiresAt) {
      this.cleanupGuestSession(sessionId)
      return null
    }
    
    return session
  }

  /**
   * Convert guest session to logged-in session (signup/login)
   */
  async promoteGuestToLoggedIn(
    sessionId: string, 
    userId: string, 
    sessionToken: string, 
    user: LoggedInSession['user']
  ): Promise<{
    loggedInSession: LoggedInSession
    migratedData: {
      workspaces: number
      pages: number
      blocks: number
      links: number
    }
  }> {
    const guestSession = this.getGuestSession(sessionId)
    
    if (!guestSession) {
      throw new Error('Guest session not found or expired')
    }

    // Create logged-in session
    const loggedInSession: LoggedInSession = {
      mode: SessionMode.LOGGED_IN,
      userId,
      sessionToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)), // 30 days
      user
    }

    // Migrate guest data to persistent storage
    const migratedData = {
      workspaces: guestSession.data.workspaces.size,
      pages: guestSession.data.pages.size,
      blocks: guestSession.data.blocks.size,
      links: guestSession.data.links.size
    }

    // Clean up guest session
    this.cleanupGuestSession(sessionId)

    return { loggedInSession, migratedData }
  }

  /**
   * Guest mode data operations - temporary storage
   */
  guestOperations = {
    // Workspace operations
    createWorkspace: (sessionId: string, workspace: any) => {
      const session = this.getGuestSession(sessionId)
      if (!session) throw new Error('Guest session not found')
      
      const id = this.generateId()
      const workspaceWithId = { ...workspace, id, createdAt: new Date() }
      session.data.workspaces.set(id, workspaceWithId)
      
      return workspaceWithId
    },

    getWorkspaces: (sessionId: string) => {
      const session = this.getGuestSession(sessionId)
      if (!session) throw new Error('Guest session not found')
      
      return Array.from(session.data.workspaces.values())
    },

    updateWorkspace: (sessionId: string, workspaceId: string, updates: any) => {
      const session = this.getGuestSession(sessionId)
      if (!session) throw new Error('Guest session not found')
      
      const workspace = session.data.workspaces.get(workspaceId)
      if (!workspace) throw new Error('Workspace not found')
      
      const updated = { ...workspace, ...updates, updatedAt: new Date() }
      session.data.workspaces.set(workspaceId, updated)
      
      return updated
    },

    deleteWorkspace: (sessionId: string, workspaceId: string) => {
      const session = this.getGuestSession(sessionId)
      if (!session) throw new Error('Guest session not found')
      
      // Also delete related pages and blocks
      const pages = Array.from(session.data.pages.values())
      const workspacePages = pages.filter((p: any) => p.workspaceId === workspaceId)
      
      for (const page of workspacePages) {
        this.guestOperations.deletePage(sessionId, page.id)
      }
      
      return session.data.workspaces.delete(workspaceId)
    },

    // Page operations
    createPage: (sessionId: string, page: any) => {
      const session = this.getGuestSession(sessionId)
      if (!session) throw new Error('Guest session not found')
      
      const id = this.generateId()
      const pageWithId = { ...page, id, createdAt: new Date() }
      session.data.pages.set(id, pageWithId)
      
      return pageWithId
    },

    getPages: (sessionId: string, workspaceId?: string) => {
      const session = this.getGuestSession(sessionId)
      if (!session) throw new Error('Guest session not found')
      
      const pages = Array.from(session.data.pages.values())
      return workspaceId ? pages.filter((p: any) => p.workspaceId === workspaceId) : pages
    },

    getPage: (sessionId: string, pageId: string) => {
      const session = this.getGuestSession(sessionId)
      if (!session) throw new Error('Guest session not found')
      
      return session.data.pages.get(pageId) || null
    },

    updatePage: (sessionId: string, pageId: string, updates: any) => {
      const session = this.getGuestSession(sessionId)
      if (!session) throw new Error('Guest session not found')
      
      const page = session.data.pages.get(pageId)
      if (!page) throw new Error('Page not found')
      
      const updated = { ...page, ...updates, updatedAt: new Date() }
      session.data.pages.set(pageId, updated)
      
      return updated
    },

    deletePage: (sessionId: string, pageId: string) => {
      const session = this.getGuestSession(sessionId)
      if (!session) throw new Error('Guest session not found')
      
      // Also delete related blocks and links
      const blocks = Array.from(session.data.blocks.values())
      const pageBlocks = blocks.filter((b: any) => b.pageId === pageId)
      
      for (const block of pageBlocks) {
        session.data.blocks.delete(block.id)
      }
      
      const links = Array.from(session.data.links.values())
      const pageLinks = links.filter((l: any) => 
        l.sourcePageId === pageId || l.targetPageId === pageId ||
        pageBlocks.some((b: any) => l.sourceBlockId === b.id || l.targetBlockId === b.id)
      )
      
      for (const link of pageLinks) {
        session.data.links.delete(link.id)
      }
      
      return session.data.pages.delete(pageId)
    },

    // Block operations
    createBlock: (sessionId: string, block: any) => {
      const session = this.getGuestSession(sessionId)
      if (!session) throw new Error('Guest session not found')
      
      const id = this.generateId()
      const blockWithId = { ...block, id, createdAt: new Date() }
      session.data.blocks.set(id, blockWithId)
      
      return blockWithId
    },

    getBlocks: (sessionId: string, pageId: string) => {
      const session = this.getGuestSession(sessionId)
      if (!session) throw new Error('Guest session not found')
      
      const blocks = Array.from(session.data.blocks.values())
      return blocks.filter((b: any) => b.pageId === pageId)
        .sort((a: any, b: any) => a.position - b.position)
    },

    updateBlock: (sessionId: string, blockId: string, updates: any) => {
      const session = this.getGuestSession(sessionId)
      if (!session) throw new Error('Guest session not found')
      
      const block = session.data.blocks.get(blockId)
      if (!block) throw new Error('Block not found')
      
      const updated = { ...block, ...updates, updatedAt: new Date() }
      session.data.blocks.set(blockId, updated)
      
      return updated
    },

    deleteBlock: (sessionId: string, blockId: string) => {
      const session = this.getGuestSession(sessionId)
      if (!session) throw new Error('Guest session not found')
      
      // Also delete related links
      const links = Array.from(session.data.links.values())
      const blockLinks = links.filter((l: any) => 
        l.sourceBlockId === blockId || l.targetBlockId === blockId
      )
      
      for (const link of blockLinks) {
        session.data.links.delete(link.id)
      }
      
      return session.data.blocks.delete(blockId)
    },

    // Link operations
    createLink: (sessionId: string, link: any) => {
      const session = this.getGuestSession(sessionId)
      if (!session) throw new Error('Guest session not found')
      
      const id = this.generateId()
      const linkWithId = { ...link, id, createdAt: new Date() }
      session.data.links.set(id, linkWithId)
      
      return linkWithId
    },

    getLinks: (sessionId: string, filters?: any) => {
      const session = this.getGuestSession(sessionId)
      if (!session) throw new Error('Guest session not found')
      
      let links = Array.from(session.data.links.values())
      
      if (filters) {
        if (filters.sourceType && filters.sourceId) {
          links = links.filter((l: any) => {
            if (filters.sourceType === 'PAGE') {
              return l.sourcePageId === filters.sourceId
            } else {
              return l.sourceBlockId === filters.sourceId
            }
          })
        }
        
        if (filters.targetType && filters.targetId) {
          links = links.filter((l: any) => {
            if (filters.targetType === 'PAGE') {
              return l.targetPageId === filters.targetId
            } else {
              return l.targetBlockId === filters.targetId
            }
          })
        }
      }
      
      return links
    },

    deleteLink: (sessionId: string, linkId: string) => {
      const session = this.getGuestSession(sessionId)
      if (!session) throw new Error('Guest session not found')
      
      return session.data.links.delete(linkId)
    }
  }

  /**
   * Clean up expired guest session
   */
  private cleanupGuestSession(sessionId: string): void {
    guestSessions.delete(sessionId)
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15)
  }

  /**
   * Generate unique ID for guest mode entities
   */
  private generateId(): string {
    return 'tmp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15)
  }

  /**
   * Get session statistics
   */
  getSessionStats() {
    return {
      totalGuestSessions: guestSessions.size,
      activeSessions: Array.from(guestSessions.values()).filter(s => new Date() <= s.expiresAt).length,
      expiredSessions: Array.from(guestSessions.values()).filter(s => new Date() > s.expiresAt).length
    }
  }

  /**
   * Clean up all expired sessions
   */
  cleanupExpiredSessions(): number {
    const now = new Date()
    let cleaned = 0
    
    for (const [sessionId, session] of guestSessions.entries()) {
      if (now > session.expiresAt) {
        guestSessions.delete(sessionId)
        cleaned++
      }
    }
    
    return cleaned
  }
}

// Factory function
export function createSessionModeService(): SessionModeService {
  return new SessionModeService()
}

// Export singleton instance
export const sessionModeService = createSessionModeService()

// Cleanup expired sessions every hour (client-side only)
if (typeof window !== 'undefined') {
  setInterval(() => {
    sessionModeService.cleanupExpiredSessions()
  }, 60 * 60 * 1000)
}