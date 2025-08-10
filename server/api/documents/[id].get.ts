import { prisma } from '~/utils/database'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const documentId = getRouterParam(event, 'id')
  
  try {
    const token = getCookie(event, 'auth-token')
    
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }
    
    const decoded = jwt.verify(token, config.jwtSecret) as any
    const userId = decoded.userId
    
    if (!userId) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid authentication token'
      })
    }
    
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        userId
      }
    })
    
    if (!document) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Document not found'
      })
    }
    
    if (document.type === 'pdf' && document.fileData) {
      return {
        id: document.id,
        title: document.title,
        type: document.type,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        fileData: document.fileData.toString('base64'),
        metadata: document.metadata,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      }
    }
    
    return {
      id: document.id,
      title: document.title,
      type: document.type,
      content: document.content,
      fileName: document.fileName,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      metadata: document.metadata,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to retrieve document'
    })
  }
})