#!/usr/bin/env node

/**
 * Cloud AI Service Client
 * 
 * Handles communication with cloud AI providers (OpenAI, Anthropic, etc.)
 */

import { readFileSync } from 'fs'
import { join } from 'path'

// Load configuration
const configPath = join(__dirname, '../../config/settings.json')
const config = JSON.parse(readFileSync(configPath, 'utf-8'))

export interface CloudAIConfig {
  provider: 'openai' | 'anthropic' | 'google'
  apiKey: string
  model: string
  endpoint?: string
  temperature?: number
  maxTokens?: number
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export class CloudAIClient {
  private config: CloudAIConfig

  constructor(config?: Partial<CloudAIConfig>) {
    const cloudService = config?.ai?.services?.find(s => s.type !== 'ollama' && s.enabled)
    
    this.config = {
      provider: config?.provider || cloudService?.type || 'openai',
      apiKey: config?.apiKey || cloudService?.apiKey || process.env.OPENAI_API_KEY || '',
      model: config?.model || cloudService?.model || 'gpt-4',
      endpoint: config?.endpoint || cloudService?.endpoint,
      temperature: config?.temperature || 0.2,
      maxTokens: config?.maxTokens || 2000
    }

    if (!this.config.apiKey) {
      throw new Error(`No API key provided for ${this.config.provider}`)
    }
  }

  /**
   * Generate text using cloud AI service
   */
  async generate(prompt: string, options?: Partial<CloudAIConfig>): Promise<string> {
    const requestConfig = { ...this.config, ...options }

    switch (requestConfig.provider) {
      case 'openai':
        return this.generateOpenAI(prompt, requestConfig)
      case 'anthropic':
        return this.generateAnthropic(prompt, requestConfig)
      case 'google':
        return this.generateGoogle(prompt, requestConfig)
      default:
        throw new Error(`Unsupported provider: ${requestConfig.provider}`)
    }
  }

  /**
   * Chat completion with message history
   */
  async chat(messages: ChatMessage[], options?: Partial<CloudAIConfig>): Promise<string> {
    const requestConfig = { ...this.config, ...options }

    switch (requestConfig.provider) {
      case 'openai':
        return this.chatOpenAI(messages, requestConfig)
      case 'anthropic':
        return this.chatAnthropic(messages, requestConfig)
      case 'google':
        return this.chatGoogle(messages, requestConfig)
      default:
        throw new Error(`Unsupported provider: ${requestConfig.provider}`)
    }
  }

  /**
   * OpenAI implementation
   */
  private async generateOpenAI(prompt: string, config: CloudAIConfig): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature,
        max_tokens: config.maxTokens
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  /**
   * OpenAI chat completion
   */
  private async chatOpenAI(messages: ChatMessage[], config: CloudAIConfig): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  /**
   * Anthropic implementation
   */
  private async generateAnthropic(prompt: string, config: CloudAIConfig): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.content[0].text
  }

  /**
   * Anthropic chat completion
   */
  private async chatAnthropic(messages: ChatMessage[], config: CloudAIConfig): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        messages: messages.filter(m => m.role !== 'system'),
        system: messages.find(m => m.role === 'system')?.content
      })
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.content[0].text
  }

  /**
   * Google AI implementation (placeholder)
   */
  private async generateGoogle(prompt: string, config: CloudAIConfig): Promise<string> {
    // Implement Google AI Platform integration
    throw new Error('Google AI integration not yet implemented')
  }

  /**
   * Google chat completion (placeholder)
   */
  private async chatGoogle(messages: ChatMessage[], config: CloudAIConfig): Promise<string> {
    // Implement Google AI Platform chat
    throw new Error('Google AI chat integration not yet implemented')
  }

  /**
   * Generate specialized code
   */
  async generateCode(
    codeType: 'component' | 'function' | 'test' | 'documentation',
    specification: string,
    context?: string
  ): Promise<string> {
    const systemPrompts = {
      component: 'You are an expert Vue 3 developer. Generate clean, type-safe Vue components using Composition API.',
      function: 'You are an expert TypeScript developer. Write well-typed, efficient functions with proper error handling.',
      test: 'You are an expert in testing. Write comprehensive, maintainable tests that cover edge cases.',
      documentation: 'You are a technical writer. Create clear, comprehensive documentation with examples.'
    }

    const userPrompt = `${specification}\n\n${context ? `Context:\n${context}` : ''}`

    return this.chat([
      { role: 'system', content: systemPrompts[codeType] },
      { role: 'user', content: userPrompt }
    ])
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.generate('Hello, respond with "OK" if you can hear me.')
      return true
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const cloudAI = new CloudAIClient()
export default cloudAI