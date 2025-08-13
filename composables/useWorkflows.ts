/**
 * Custom Workflows Composable
 * Manages user-defined command sequences and workflow execution
 */

import type { CustomWorkflow, WorkflowExecution, WorkflowStep, WorkflowTemplate } from '~/types/workflows'

// Global state for workflows
const customWorkflows = ref<CustomWorkflow[]>([])
const workflowTemplates = ref<WorkflowTemplate[]>([])
const activeExecution = ref<WorkflowExecution | null>(null)

export const useWorkflows = () => {
  // Load workflows from storage
  const loadWorkflows = async () => {
    try {
      const response = await $fetch('/api/workflows')
      if (response.success) {
        customWorkflows.value = response.data
      }
    } catch (error) {
      console.error('Failed to load workflows:', error)
    }
  }

  // Load built-in workflow templates
  const loadWorkflowTemplates = async () => {
    try {
      const response = await $fetch('/api/workflows/templates')
      if (response.success) {
        workflowTemplates.value = response.data
      }
    } catch (error) {
      console.error('Failed to load workflow templates:', error)
    }
  }

  // Create a new custom workflow
  const createWorkflow = async (workflow: Omit<CustomWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
    try {
      const response = await $fetch('/api/workflows', {
        method: 'POST',
        body: workflow
      })
      
      if (response.success) {
        customWorkflows.value.unshift(response.data)
        return response.data
      }
      throw new Error('Failed to create workflow')
    } catch (error) {
      console.error('Error creating workflow:', error)
      throw error
    }
  }

  // Update existing workflow
  const updateWorkflow = async (id: string, updates: Partial<CustomWorkflow>) => {
    try {
      const response = await $fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        body: updates
      })
      
      if (response.success) {
        const index = customWorkflows.value.findIndex(w => w.id === id)
        if (index !== -1) {
          customWorkflows.value[index] = response.data
        }
        return response.data
      }
      throw new Error('Failed to update workflow')
    } catch (error) {
      console.error('Error updating workflow:', error)
      throw error
    }
  }

  // Delete workflow
  const deleteWorkflow = async (id: string) => {
    try {
      await $fetch(`/api/workflows/${id}`, { method: 'DELETE' })
      customWorkflows.value = customWorkflows.value.filter(w => w.id !== id)
    } catch (error) {
      console.error('Error deleting workflow:', error)
      throw error
    }
  }

  // Find workflow by trigger
  const findWorkflowByTrigger = (trigger: string): CustomWorkflow | null => {
    return customWorkflows.value.find(w => 
      w.isActive && w.trigger === trigger
    ) || null
  }

  // Execute a workflow
  const executeWorkflow = async (workflow: CustomWorkflow): Promise<WorkflowExecution> => {
    const execution: WorkflowExecution = {
      id: generateId(),
      workflowId: workflow.id,
      status: 'pending',
      startedAt: new Date().toISOString(),
      currentStep: 0,
      totalSteps: workflow.steps.length,
      results: []
    }

    activeExecution.value = execution
    execution.status = 'running'

    try {
      for (let i = 0; i < workflow.steps.length; i++) {
        const step = workflow.steps[i]
        execution.currentStep = i + 1

        try {
          // Add delay if specified
          if (step.delay && step.delay > 0) {
            await new Promise(resolve => setTimeout(resolve, step.delay))
          }

          // Check condition if specified
          if (step.condition && !evaluateCondition(step.condition)) {
            execution.results.push({
              stepIndex: i,
              commandId: step.commandId,
              status: 'skipped',
              executedAt: new Date().toISOString()
            })
            continue
          }

          // Execute the command
          const result = await executeWorkflowStep(step)
          
          execution.results.push({
            stepIndex: i,
            commandId: step.commandId,
            status: 'success',
            result,
            executedAt: new Date().toISOString()
          })

        } catch (stepError) {
          execution.results.push({
            stepIndex: i,
            commandId: step.commandId,
            status: 'failed',
            error: stepError instanceof Error ? stepError.message : String(stepError),
            executedAt: new Date().toISOString()
          })
          
          // Stop execution on error
          execution.status = 'failed'
          execution.error = `Step ${i + 1} failed: ${stepError}`
          break
        }
      }

      if (execution.status === 'running') {
        execution.status = 'completed'
      }

    } catch (error) {
      execution.status = 'failed'
      execution.error = error instanceof Error ? error.message : String(error)
    }

    execution.completedAt = new Date().toISOString()
    activeExecution.value = null

    // Update workflow usage statistics
    await updateWorkflowUsage(workflow.id)

    return execution
  }

  // Execute individual workflow step
  const executeWorkflowStep = async (step: WorkflowStep) => {
    // This would integrate with the command palette's command execution system
    const { executeCommand } = useCommandPalette() // Assuming this composable exists
    return await executeCommand(step.commandId, step.args)
  }

  // Simple condition evaluator (can be enhanced)
  const evaluateCondition = (condition: string): boolean => {
    // For now, just basic conditions like "hasSelection", "pageType=document", etc.
    // Could be expanded to support more complex expressions
    switch (condition) {
      case 'hasSelection':
        return !!getTextSelection()?.text
      case 'noSelection':
        return !getTextSelection()?.text
      default:
        return true
    }
  }

  // Update workflow usage statistics
  const updateWorkflowUsage = async (workflowId: string) => {
    try {
      await $fetch(`/api/workflows/${workflowId}/usage`, {
        method: 'POST'
      })
      
      // Update local state
      const workflow = customWorkflows.value.find(w => w.id === workflowId)
      if (workflow) {
        workflow.usageCount += 1
        workflow.lastUsed = new Date().toISOString()
      }
    } catch (error) {
      console.error('Failed to update workflow usage:', error)
    }
  }

  // Built-in workflow templates
  const getBuiltInTemplates = (): WorkflowTemplate[] => [
    {
      id: 'weekly-review',
      name: 'Weekly Review',
      description: 'Creates a structured weekly review page',
      category: 'Productivity',
      isBuiltIn: true,
      steps: [
        { commandId: 'new-page', description: 'Create weekly review page' },
        { commandId: 'heading', description: 'Add "Weekly Review" heading' },
        { commandId: 'heading', description: 'Add "Accomplishments" section' },
        { commandId: 'bullet-list', description: 'Add accomplishments list' },
        { commandId: 'heading', description: 'Add "Next Week Goals" section' },
        { commandId: 'todo', description: 'Add goals todo list' }
      ]
    },
    {
      id: 'meeting-notes',
      name: 'Meeting Notes',
      description: 'Creates a structured meeting notes template',
      category: 'Meetings',
      isBuiltIn: true,
      steps: [
        { commandId: 'new-page', description: 'Create meeting notes page' },
        { commandId: 'heading', description: 'Add meeting title' },
        { commandId: 'heading', description: 'Add "Attendees" section' },
        { commandId: 'bullet-list', description: 'Add attendees list' },
        { commandId: 'heading', description: 'Add "Agenda" section' },
        { commandId: 'heading', description: 'Add "Action Items" section' },
        { commandId: 'todo', description: 'Add action items checklist' }
      ]
    },
    {
      id: 'project-setup',
      name: 'Project Setup',
      description: 'Creates a complete project workspace structure',
      category: 'Project Management',
      isBuiltIn: true,
      steps: [
        { commandId: 'new-workspace', description: 'Create project workspace' },
        { commandId: 'new-page', description: 'Create project overview page' },
        { commandId: 'new-page', description: 'Create tasks database' },
        { commandId: 'new-page', description: 'Create meeting notes section' },
        { commandId: 'new-page', description: 'Create resources page' }
      ]
    }
  ]

  // Utility function to generate unique IDs
  const generateId = (): string => {
    return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  return {
    // State
    customWorkflows: readonly(customWorkflows),
    workflowTemplates: readonly(workflowTemplates),
    activeExecution: readonly(activeExecution),

    // Methods
    loadWorkflows,
    loadWorkflowTemplates,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    findWorkflowByTrigger,
    executeWorkflow,
    getBuiltInTemplates
  }
}