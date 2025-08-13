/**
 * {{titleCase name}} Command
 * 
 * {{description}}
 * 
 * @category {{category}}
 * @shortcut {{shortcut}}
 */

import type { Command } from '~/types/command-palette'

// Command definition
export const {{camelCase name}}Command: Command = {
  id: '{{kebabCase name}}',
  label: '{{title}}',
  description: '{{description}}',
  icon: '{{icon}}',
  category: '{{category}}',
  action: () => execute{{pascalCase name}}(),
  shortcut: '{{shortcut}}',
  keywords: [{{#each keywords}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}],
  contexts: [{{#each contexts}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}],
  priority: {{priority}}
}

/**
 * Execute the {{name}} command
 */
async function execute{{pascalCase name}}(): Promise<void> {
  // Add visual feedback delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  try {
    // Start loading state
    console.log('Executing {{name}}...')
    
    {{#if requiresAuth}}
    // Check authentication
    const { sessionState } = useSessionMode()
    if (sessionState.value.mode !== 'LOGGED_IN') {
      throw new Error('This command requires authentication')
    }
    {{/if}}
    
    {{#if requiresWorkspace}}
    // Check workspace context
    const { currentWorkspace } = useWorkspace()
    if (!currentWorkspace.value) {
      throw new Error('This command requires an active workspace')
    }
    {{/if}}
    
    {{#if requiresPage}}
    // Get current page context
    const route = useRoute()
    const pageId = route.params.id as string
    if (!pageId) {
      throw new Error('This command requires an active page')
    }
    {{/if}}
    
    // Main command logic
    {{#if isAsync}}
    const result = await performAction()
    {{else}}
    const result = performAction()
    {{/if}}
    
    // Handle result
    if (result.success) {
      // Success feedback
      console.log('{{name}} completed successfully:', result)
      {{#if showNotification}}
      showNotification({
        type: 'success',
        title: '{{successTitle}}',
        message: '{{successMessage}}'
      })
      {{/if}}
      
      {{#if refreshPage}}
      // Refresh the page to show changes
      if (process.client) {
        window.location.reload()
      }
      {{/if}}
    } else {
      throw new Error(result.error || 'Command failed')
    }
    
  } catch (error) {
    // Error handling
    console.error('{{name}} failed:', error)
    {{#if showNotification}}
    showNotification({
      type: 'error',
      title: 'Command Failed',
      message: error.message || 'An unexpected error occurred'
    })
    {{else}}
    alert(`Error: ${error.message}`)
    {{/if}}
  }
}

/**
 * Perform the main action for {{name}}
 */
{{#if isAsync}}async {{/if}}function performAction() {
  {{#if customLogic}}
  {{customLogic}}
  {{else}}
  // TODO: Implement the main logic for {{name}}
  
  // Example implementation:
  {{#if apiCall}}
  const response = await $fetch('{{apiEndpoint}}', {
    method: '{{apiMethod}}',
    body: {
      // Add request body
    }
  })
  
  return response
  {{else}}
  // Perform local action
  return {
    success: true,
    data: {
      message: '{{name}} executed successfully'
    }
  }
  {{/if}}
  {{/if}}
}

{{#if hasHelpers}}
// Helper functions
{{#each helpers}}
/**
 * {{description}}
 */
function {{name}}({{params}}) {
  {{body}}
}

{{/each}}
{{/if}}

{{#if hasTypes}}
// Type definitions
{{#each types}}
interface {{name}} {
  {{#each properties}}
  {{name}}{{#if optional}}?{{/if}}: {{type}}
  {{/each}}
}

{{/each}}
{{/if}}

// Export for registration
export default {{camelCase name}}Command