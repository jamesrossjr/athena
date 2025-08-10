import { prisma } from '~/utils/database'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
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
    
    const body = await readBody(event)
    
    if (!body.title) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Title is required'
      })
    }
    
    if (!body.type) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Document type is required'
      })
    }
    
    const documentData: any = {
      userId,
      title: body.title,
      type: body.type
    }
    
    if (body.type === 'text') {
      documentData.content = body.content || ''
    }
    
    if (body.metadata) {
      documentData.metadata = body.metadata
    }
    
    const document = await prisma.document.create({
      data: documentData
    })
    
    return {
      success: true,
      document: {
        id: document.id,
        title: document.title,
        type: document.type,
        content: document.content,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to create document'
    })
  }
})