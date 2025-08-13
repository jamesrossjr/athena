/**
 * Custom Workflow System Types
 * Defines the structure for user-created command sequences
 */

export interface WorkflowStep {
  commandId: string
  description: string
  args?: string[]
  delay?: number // milliseconds to wait before executing
  condition?: string // optional condition to check before executing
}

export interface CustomWorkflow {
  id: string
  trigger: string // e.g., "/weekly_review"
  name: string
  description: string
  steps: WorkflowStep[]
  category: string
  icon?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  usageCount: number
  lastUsed?: string
  tags: string[]
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: string
  completedAt?: string
  currentStep: number
  totalSteps: number
  results: WorkflowStepResult[]
  error?: string
}

export interface WorkflowStepResult {
  stepIndex: number
  commandId: string
  status: 'success' | 'failed' | 'skipped'
  result?: any
  error?: string
  executedAt: string
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  steps: Omit<WorkflowStep, 'args'>[] // Templates don't include specific args
  isBuiltIn: boolean
}