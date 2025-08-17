import { z } from 'zod'
import type { InstalledPlugin, PluginManifest } from '~/types/plugin'

const paramsSchema = z.object({
  id: z.string().min(1, 'Plugin ID is required')
})

const bodySchema = z.object({
  userId: z.string().cuid('Invalid user ID'),
  workspaceId: z.string().cuid('Invalid workspace ID').optional()
})

// Mock installed plugins storage - in production this would be in database
const installedPlugins = new Map<string, InstalledPlugin>()

export default defineEventHandler(async (event) => {
  try {
    const params = getRouterParams(event)
    const body = await readBody(event)
    
    const validatedParams = paramsSchema.parse(params)
    const validatedBody = bodySchema.parse(body)
    
    // Check if plugin exists in registry
    const { plugins } = await $fetch('/api/plugins')
    const plugin = plugins.find((p: PluginManifest) => p.id === validatedParams.id)
    
    if (!plugin) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Plugin not found'
      })
    }
    
    // Check if already installed
    const installKey = `${validatedBody.userId}:${validatedParams.id}`
    if (installedPlugins.has(installKey)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Plugin already installed'
      })
    }
    
    // Install plugin
    const installedPlugin: InstalledPlugin = {
      id: plugin.id,
      manifest: plugin,
      enabled: true,
      installedAt: new Date(),
      version: plugin.version,
      settings: {}
    }
    
    installedPlugins.set(installKey, installedPlugin)
    
    console.log(`🧩 Plugin installed: ${plugin.name} for user ${validatedBody.userId}`)
    
    return {
      success: true,
      plugin: installedPlugin,
      message: `${plugin.name} has been installed successfully`
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid input',
        data: error.errors
      })
    }
    
    throw error
  }
})