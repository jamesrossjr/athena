import { readFile } from 'fs/promises'
import { join } from 'path'
import formidable from 'formidable'
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
    
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB max file size
      keepExtensions: true,
      uploadDir: join(process.cwd(), 'uploads')
    })
    
    const [fields, files] = await form.parse(event.node.req)
    
    const file = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf
    
    if (!file) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No PDF file provided'
      })
    }
    
    if (file.mimetype !== 'application/pdf') {
      throw createError({
        statusCode: 400,
        statusMessage: 'File must be a PDF'
      })
    }
    
    const fileData = await readFile(file.filepath)
    
    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title || file.originalFilename || 'Untitled PDF'
    
    const document = await prisma.document.create({
      data: {
        userId,
        title,
        type: 'pdf',
        filePath: file.filepath,
        fileData: fileData,
        fileName: file.originalFilename || undefined,
        fileSize: file.size || undefined,
        mimeType: file.mimetype || undefined,
        metadata: {
          uploadedAt: new Date().toISOString()
        }
      }
    })
    
    return {
      success: true,
      document: {
        id: document.id,
        title: document.title,
        type: document.type,
        fileName: document.fileName,
        fileSize: document.fileSize,
        createdAt: document.createdAt
      }
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to import PDF'
    })
  }
})