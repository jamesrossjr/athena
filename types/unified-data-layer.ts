/**
 * Unified Data Layer Types
 * 
 * This file defines the TypeScript interfaces for the core entities
 * in the Unified Data Layer architecture - the foundation for universal linking
 * and the interconnected knowledge graph.
 */

// Core Enums
export enum PageType {
  DOCUMENT = 'DOCUMENT',
  DATABASE = 'DATABASE', 
  TABLE = 'TABLE',
  WHITEBOARD = 'WHITEBOARD',
  IDE = 'IDE',
  KANBAN = 'KANBAN',
  CALENDAR = 'CALENDAR'
}

export enum BlockType {
  // Text Content
  TEXT = 'TEXT',
  HEADING = 'HEADING',
  LIST_ITEM = 'LIST_ITEM',
  QUOTE = 'QUOTE',
  CODE = 'CODE',
  
  // Media
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FILE = 'FILE',
  
  // Database
  DATABASE_ROW = 'DATABASE_ROW',
  DATABASE_COLUMN = 'DATABASE_COLUMN',
  DATABASE_CELL = 'DATABASE_CELL',
  
  // Interactive
  CHECKBOX = 'CHECKBOX',
  TOGGLE = 'TOGGLE',
  CALLOUT = 'CALLOUT',
  
  // Whiteboard
  SHAPE = 'SHAPE',
  STICKY_NOTE = 'STICKY_NOTE',
  CONNECTOR = 'CONNECTOR',
  
  // Advanced
  EMBED = 'EMBED',
  EQUATION = 'EQUATION',
  DIVIDER = 'DIVIDER',
  TEMPLATE = 'TEMPLATE'
}

export enum LinkType {
  REFERENCE = 'REFERENCE',
  EMBED = 'EMBED',
  MENTION = 'MENTION',
  ALIAS = 'ALIAS'
}

export enum ContentType {
  PAGE = 'PAGE',
  BLOCK = 'BLOCK'
}

// Core Interfaces

export interface Workspace {
  id: string
  userId: string
  name: string
  icon?: string
  color?: string
  settings?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface Page {
  id: string
  workspaceId: string
  title: string
  type: PageType
  properties?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface Block {
  id: string
  pageId: string
  parentId?: string
  type: BlockType
  content: Record<string, any>
  position: number
  createdAt: Date
  updatedAt: Date
}

// Universal linking interface - connects any content to any other content
export interface Link {
  id: string
  sourceType: ContentType
  sourcePageId?: string
  sourceBlockId?: string
  targetType: ContentType  
  targetPageId?: string
  targetBlockId?: string
  linkType: LinkType
  metadata?: Record<string, any>
  createdAt: Date
}

// Legacy alias for backward compatibility
export type BlockLink = Link

// Extended interfaces with relations

export interface WorkspaceWithRelations extends Workspace {
  pages?: Page[]
  user?: { 
    id: string
    email: string
    firstName?: string
    lastName?: string
  }
}

export interface PageWithRelations extends Page {
  workspace?: Workspace
  blocks?: Block[]
  sourceLinks?: Link[]
  targetLinks?: Link[]
}

export interface BlockWithRelations extends Block {
  page?: Page
  parent?: Block
  children?: Block[]
  sourceLinks?: Link[]
  targetLinks?: Link[]
}

// Content type definitions for different block types

export interface TextBlockContent {
  text: string
  formatting?: {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    strikethrough?: boolean
    code?: boolean
    color?: string
    backgroundColor?: string
  }
}

export interface HeadingBlockContent {
  text: string
  level: 1 | 2 | 3 | 4 | 5 | 6
  formatting?: TextBlockContent['formatting']
}

export interface ListItemBlockContent {
  text: string
  listType: 'bulleted' | 'numbered' | 'todo'
  checked?: boolean
  formatting?: TextBlockContent['formatting']
}

export interface ImageBlockContent {
  url: string
  alt?: string
  caption?: string
  width?: number
  height?: number
}

export interface DatabaseRowContent {
  cells: Record<string, any> // columnId -> value
}

export interface DatabaseColumnContent {
  name: string
  type: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect' | 'relation'
  options?: any[] // For select/multiselect types
}

export interface WhiteboardShapeContent {
  type: 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow'
  x: number
  y: number
  width: number
  height: number
  style: {
    fill?: string
    stroke?: string
    strokeWidth?: number
    opacity?: number
  }
}

// API Request/Response types

export interface CreateWorkspaceRequest {
  name: string
  icon?: string
  color?: string
  settings?: Record<string, any>
}

export interface UpdateWorkspaceRequest {
  name?: string
  icon?: string
  color?: string
  settings?: Record<string, any>
}

export interface CreatePageRequest {
  workspaceId: string
  title: string
  type: PageType
  properties?: Record<string, any>
}

export interface UpdatePageRequest {
  title?: string
  type?: PageType
  properties?: Record<string, any>
}

export interface CreateBlockRequest {
  pageId: string
  parentId?: string
  type: BlockType
  content: Record<string, any>
  position?: number
}

export interface UpdateBlockRequest {
  parentId?: string
  type?: BlockType
  content?: Record<string, any>
  position?: number
}

export interface CreateBlockLinkRequest {
  sourceBlockId: string
  targetBlockId: string
  sourcePageId?: string
  targetPageId?: string
  linkType?: LinkType
  metadata?: Record<string, any>
}

// Query interfaces

export interface WorkspaceQuery {
  userId?: string
  include?: {
    pages?: boolean
    user?: boolean
  }
}

export interface PageQuery {
  workspaceId?: string
  type?: PageType
  include?: {
    workspace?: boolean
    blocks?: boolean
    links?: boolean
  }
}

export interface BlockQuery {
  pageId?: string
  parentId?: string
  type?: BlockType
  include?: {
    page?: boolean
    parent?: boolean
    children?: boolean
    links?: boolean
  }
}

// Search and filter types

export interface SearchQuery {
  query: string
  workspaceId?: string
  pageTypes?: PageType[]
  blockTypes?: BlockType[]
  limit?: number
  offset?: number
}

export interface SearchResult {
  type: 'workspace' | 'page' | 'block'
  id: string
  title: string
  content?: string
  highlight?: string
  score: number
  context?: {
    workspaceId?: string
    pageId?: string
    parentId?: string
  }
}

// Real-time event types

export interface RealtimeEvent {
  type: 'created' | 'updated' | 'deleted' | 'linked' | 'unlinked'
  entity: 'workspace' | 'page' | 'block' | 'link'
  id: string
  data?: any
  userId: string
  timestamp: Date
}

// Error types

export interface DataLayerError {
  code: string
  message: string
  details?: Record<string, any>
}

// Utility types

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type WithId<T> = T & { id: string }
export type WithTimestamps<T> = T & { 
  createdAt: Date
  updatedAt: Date 
}

// Collection response type
export interface CollectionResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}