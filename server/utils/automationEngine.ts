import { prisma } from '~/server/utils/db'
import type { AutomationRule, AutomationAction, AutomationActionResult } from '~/types/automation'


export class AutomationEngine {
  static async triggerDocumentEvent(
    eventType: 'created' | 'updated' | 'tagged',
    documentData: any,
    userId: string,
    workspaceId: string
  ) {
    try {
      // Find matching automation rules
      const rules = await prisma.automationRule.findMany({
        where: {
          enabled: true,
          OR: [
            { userId },
            { workspaceId }
          ],
          trigger: {
            path: ['type'],
            equals: `document_${eventType}`
          }
        }
      })

      console.log(`🤖 Found ${rules.length} automation rules for document_${eventType}`)

      // Execute each matching rule
      for (const rule of rules) {
        await this.executeRule(rule, {
          eventType: `document_${eventType}`,
          document: documentData,
          userId,
          workspaceId,
          timestamp: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Automation trigger error:', error)
    }
  }

  static async executeRule(rule: any, triggerData: any) {
    const execution = await prisma.automationExecution.create({
      data: {
        ruleId: rule.id,
        status: 'RUNNING',
        triggerData
      }
    })

    try {
      console.log(`🚀 Executing automation rule: ${rule.name}`)

      // Check conditions
      if (rule.conditions && !this.evaluateConditions(rule.conditions, triggerData)) {
        await prisma.automationExecution.update({
          where: { id: execution.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            results: [{ 
              actionType: 'condition_check', 
              success: false, 
              data: 'Conditions not met',
              executionTimeMs: 0
            }]
          }
        })
        return
      }

      // Execute actions
      const results: AutomationActionResult[] = []
      const actions = Array.isArray(rule.actions) ? rule.actions : []

      for (const action of actions.sort((a: any, b: any) => a.order - b.order)) {
        const startTime = Date.now()
        
        try {
          const result = await this.executeAction(action, triggerData, rule)
          results.push({
            actionType: action.type,
            success: true,
            data: result,
            executionTimeMs: Date.now() - startTime
          })
        } catch (error) {
          results.push({
            actionType: action.type,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            executionTimeMs: Date.now() - startTime
          })
        }
      }

      // Update execution record
      await prisma.automationExecution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          results
        }
      })

      // Update rule execution count
      await prisma.automationRule.update({
        where: { id: rule.id },
        data: {
          executionCount: { increment: 1 },
          lastExecutedAt: new Date()
        }
      })

      console.log(`✅ Automation rule completed: ${rule.name}`)
    } catch (error) {
      console.error(`❌ Automation rule failed: ${rule.name}`, error)
      
      await prisma.automationExecution.update({
        where: { id: execution.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
    }
  }

  static evaluateConditions(conditions: any[], triggerData: any): boolean {
    return conditions.every(condition => {
      const value = this.getValueFromPath(triggerData, condition.field)
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value
        case 'contains':
          return String(value).includes(String(condition.value))
        case 'starts_with':
          return String(value).startsWith(String(condition.value))
        case 'greater_than':
          return Number(value) > Number(condition.value)
        case 'in_list':
          return Array.isArray(condition.value) && condition.value.includes(value)
        default:
          return false
      }
    })
  }

  static async executeAction(action: any, triggerData: any, rule: any): Promise<any> {
    switch (action.type) {
      case 'ai_summarize':
        return this.executeSummarizeAction(action, triggerData)
      
      case 'ai_extract_tasks':
        return this.executeExtractTasksAction(action, triggerData)
      
      case 'create_document':
        return this.executeCreateDocumentAction(action, triggerData, rule)
      
      case 'add_tag':
        return this.executeAddTagAction(action, triggerData)
      
      case 'send_notification':
        return this.executeSendNotificationAction(action, triggerData, rule)
      
      default:
        throw new Error(`Unknown action type: ${action.type}`)
    }
  }

  static async executeSummarizeAction(action: any, triggerData: any) {
    if (!triggerData.document?.content) {
      throw new Error('No document content to summarize')
    }

    // Mock AI summarization (in production, this would call the AI API)
    const content = typeof triggerData.document.content === 'string' 
      ? triggerData.document.content 
      : JSON.stringify(triggerData.document.content)

    return {
      summary: `AI Summary: ${content.substring(0, 100)}...`,
      wordCount: content.split(' ').length,
      keyPoints: ['Key point 1', 'Key point 2', 'Key point 3']
    }
  }

  static async executeExtractTasksAction(action: any, triggerData: any) {
    // Mock task extraction
    return {
      tasks: [
        { text: 'Review the document', assigned: null, priority: 'medium' },
        { text: 'Follow up on action items', assigned: null, priority: 'high' }
      ],
      count: 2
    }
  }

  static async executeCreateDocumentAction(action: any, triggerData: any, rule: any) {
    const title = action.config.title || `Generated from ${triggerData.document.title}`
    const content = action.config.content || 'Auto-generated document'

    const document = await prisma.document.create({
      data: {
        title,
        type: action.config.type || 'PAGE',
        content,
        workspaceId: rule.workspaceId
      }
    })

    return { documentId: document.id, title }
  }

  static async executeAddTagAction(action: any, triggerData: any) {
    // Mock tag addition (would integrate with document tagging system)
    return {
      tag: action.config.tag,
      documentId: triggerData.document.id
    }
  }

  static async executeSendNotificationAction(action: any, triggerData: any, rule: any) {
    // Mock notification (would integrate with notification system)
    return {
      recipient: rule.userId,
      message: action.config.message || 'Automation rule executed',
      channel: action.config.channel || 'in-app'
    }
  }

  static getValueFromPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
}