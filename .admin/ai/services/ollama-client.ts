#!/usr/bin/env node

/**
 * Ollama AI Service Client
 * 
 * Handles communication with local Ollama instances
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'

// Load configuration
const configPath = join(__dirname, '../../config/settings.json')
const config = JSON.parse(readFileSync(configPath, 'utf-8'))

export interface OllamaConfig {
  endpoint: string
  model: string
  timeout?: number
  temperature?: number
}

export interface OllamaResponse {
  response: string
  done: boolean
  model: string
  created_at: string
}

export class OllamaClient {
  private config: OllamaConfig
  
  constructor(config?: Partial<OllamaConfig>) {
    const ollamaService = config?.ai?.services?.find(s => s.type === 'ollama' && s.enabled)
    
    this.config = {
      endpoint: config?.endpoint || ollamaService?.endpoint || 'http://localhost:11434',
      model: config?.model || ollamaService?.model || 'codellama:latest',
      timeout: config?.timeout || 30000,
      temperature: config?.temperature || 0.2
    }
  }

  /**
   * Generate text using Ollama
   */
  async generate(prompt: string, options?: Partial<OllamaConfig>): Promise<string> {
    const requestConfig = { ...this.config, ...options }
    
    try {
      const response = await fetch(`${requestConfig.endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: requestConfig.model,
          prompt,
          stream: false,
          options: {
            temperature: requestConfig.temperature
          }
        }),
        signal: AbortSignal.timeout(requestConfig.timeout)
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
      }

      const data: OllamaResponse = await response.json()
      return data.response

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Ollama request timeout after ${requestConfig.timeout}ms`)
      }
      throw new Error(`Ollama generation failed: ${error.message}`)
    }
  }

  /**
   * Stream text generation from Ollama
   */
  async *generateStream(prompt: string, options?: Partial<OllamaConfig>): AsyncGenerator<string> {
    const requestConfig = { ...this.config, ...options }
    
    try {
      const response = await fetch(`${requestConfig.endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: requestConfig.model,
          prompt,
          stream: true,
          options: {
            temperature: requestConfig.temperature
          }
        }),
        signal: AbortSignal.timeout(requestConfig.timeout)
      })

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())
        
        for (const line of lines) {
          try {
            const data: OllamaResponse = JSON.parse(line)
            if (data.response) {
              yield data.response
            }
            if (data.done) return
          } catch {
            // Skip invalid JSON lines
          }
        }
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Ollama request timeout after ${requestConfig.timeout}ms`)
      }
      throw new Error(`Ollama stream failed: ${error.message}`)
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.endpoint}/api/tags`)
      
      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.statusText}`)
      }

      const data = await response.json()
      return data.models?.map(m => m.name) || []
      
    } catch (error) {
      throw new Error(`Failed to list Ollama models: ${error.message}`)
    }
  }

  /**
   * Check if Ollama is running
   */
  async isRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.endpoint}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Pull a model
   */
  async pullModel(modelName: string): Promise<void> {
    console.log(chalk.blue(`Pulling model: ${modelName}...`))
    
    try {
      const response = await fetch(`${this.config.endpoint}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: modelName
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.statusText}`)
      }

      // Stream the pull progress
      const reader = response.body?.getReader()
      if (reader) {
        const decoder = new TextDecoder()
        
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim())
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line)
              if (data.status) {
                process.stdout.write(`\r${data.status}`)
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      console.log(chalk.green(`\n✅ Model ${modelName} pulled successfully`))
      
    } catch (error) {
      throw new Error(`Failed to pull model ${modelName}: ${error.message}`)
    }
  }

  /**
   * Generate code with specialized prompt
   */
  async generateCode(
    codeType: 'component' | 'function' | 'test' | 'documentation',
    specification: string,
    context?: string
  ): Promise<string> {
    const prompts = {
      component: `Create a Vue 3 component with TypeScript based on this specification:\n\n${specification}\n\n${context ? `Context:\n${context}\n\n` : ''}Return only the Vue component code without explanations.`,
      
      function: `Write a TypeScript function based on this specification:\n\n${specification}\n\n${context ? `Context:\n${context}\n\n` : ''}Return only the function code with proper typing.`,
      
      test: `Write comprehensive tests for this code:\n\n${specification}\n\n${context ? `Context:\n${context}\n\n` : ''}Use appropriate testing framework and include edge cases.`,
      
      documentation: `Write clear documentation for this code:\n\n${specification}\n\n${context ? `Context:\n${context}\n\n` : ''}Include usage examples and parameter descriptions.`
    }

    return this.generate(prompts[codeType])
  }
}

// Export singleton instance
export const ollama = new OllamaClient()
export default ollama