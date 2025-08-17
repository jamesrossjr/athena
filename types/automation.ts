export interface AutomationRule {
  id: string
  name: string
  description: string
  enabled: boolean
  userId: string
  workspaceId: string
  
  // Trigger configuration
  trigger: AutomationTrigger
  
  // Conditions (optional)
  conditions?: AutomationCondition[]
  
  // Actions to execute
  actions: AutomationAction[]
  
  // Execution settings
  settings: {
    maxExecutions?: number
    cooldownMinutes?: number
    notifyOnSuccess?: boolean
    notifyOnError?: boolean
  }
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  lastExecutedAt?: Date
  executionCount: number
}

export interface AutomationTrigger {
  type: TriggerType
  config: Record<string, any>
}

export type TriggerType =
  | 'document_created'
  | 'document_updated' 
  | 'document_tagged'
  | 'document_shared'
  | 'schedule'
  | 'webhook'
  | 'user_action'
  | 'ai_detection'

export interface AutomationCondition {
  field: string
  operator: ConditionOperator
  value: any
  type: 'text' | 'number' | 'date' | 'boolean' | 'list'
}

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'in_list'
  | 'not_in_list'

export interface AutomationAction {
  type: ActionType
  config: Record<string, any>
  order: number
}

export type ActionType =
  | 'ai_summarize'
  | 'ai_extract_tasks'
  | 'ai_classify'
  | 'create_document'
  | 'update_document'
  | 'add_tag'
  | 'remove_tag'
  | 'move_document'
  | 'send_notification'
  | 'create_task'
  | 'webhook_call'
  | 'ai_generate_content'

export interface AutomationExecution {
  id: string
  ruleId: string
  triggeredAt: Date
  completedAt?: Date
  status: 'pending' | 'running' | 'completed' | 'failed'
  triggerData: Record<string, any>
  results: AutomationActionResult[]
  error?: string
}

export interface AutomationActionResult {
  actionType: ActionType
  success: boolean
  data?: any
  error?: string
  executionTimeMs: number
}

export interface SmartSuggestion {
  id: string
  userId: string
  type: SuggestionType
  title: string
  description: string
  confidence: number // 0-1
  data: Record<string, any>
  actions: SuggestionAction[]
  createdAt: Date
  dismissedAt?: Date
  acceptedAt?: Date
}

export type SuggestionType =
  | 'organize_documents'
  | 'create_workspace'
  | 'merge_duplicates'
  | 'schedule_review'
  | 'extract_tasks'
  | 'improve_content'
  | 'connect_documents'
  | 'template_suggestion'

export interface SuggestionAction {
  id: string
  label: string
  type: 'primary' | 'secondary' | 'dismiss'
  endpoint?: string
  payload?: Record<string, any>
}

export interface DailyBriefing {
  id: string
  userId: string
  date: Date
  sections: BriefingSection[]
  metrics: BriefingMetrics
  generatedAt: Date
}

export interface BriefingSection {
  type: BriefingSectionType
  title: string
  content: any
  priority: 'high' | 'medium' | 'low'
}

export type BriefingSectionType =
  | 'upcoming_tasks'
  | 'recent_activity'
  | 'suggested_reviews'
  | 'collaboration_updates'
  | 'ai_insights'
  | 'knowledge_connections'

export interface BriefingMetrics {
  documentsCreated: number
  documentsUpdated: number
  collaborationEvents: number
  tasksCompleted: number
  aiInteractions: number
}