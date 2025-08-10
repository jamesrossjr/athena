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
    
    const query = getQuery(event)
    const type = query.type as string | undefined
    
    const where: any = { userId }
    if (type) {
      where.type = type
    }
    
    const documents = await prisma.document.findMany({
      where,
      select: {
        id: true,
        title: true,
        type: true,
        fileName: true,
        fileSize: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return {
      success: true,
      documents
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to retrieve documents'
    })
  }
})