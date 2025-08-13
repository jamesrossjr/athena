# Command Palette Command Generation Prompt

## Context
You are creating a new command for the Athena Command Palette - the central nervous system of the application. The Command Palette:
- Is the primary interface for ALL user actions
- Uses Vue 3 Composition API
- Supports natural language processing
- Integrates with session modes (guest/logged-in)
- Can chain multiple commands into workflows

## Task
Generate a complete command implementation with the following specifications:

### Input Parameters
- **Command Name**: {{COMMAND_NAME}}
- **Description**: {{DESCRIPTION}}
- **Category**: {{CATEGORY}}
- **Shortcut**: {{KEYBOARD_SHORTCUT}}
- **Context**: {{REQUIRED_CONTEXT}}
- **Parameters**: {{PARAMETERS}}

## Requirements

### 1. Command Structure
Create a command that includes:
```typescript
{
  id: string              // Unique identifier
  label: string           // Display name
  description: string     // Help text
  icon: string           // Heroicons class
  category: string       // Grouping category
  action: Function       // Async execution function
  shortcut?: string      // Keyboard shortcut
  keywords: string[]     // Search terms
  contexts: string[]     // Where command is available
  priority: number       // Sort order (1-10)
}
```

### 2. Implementation Requirements
- **Async execution**: All actions should be async
- **Error handling**: Graceful failure with user feedback
- **Progress indication**: Show loading state for long operations
- **Undo support**: Implement reversible actions where possible
- **Session aware**: Respect guest vs logged-in capabilities

### 3. User Experience
- Clear, actionable labels
- Descriptive help text
- Intuitive keyboard shortcuts
- Smart context awareness
- Confirmation for destructive actions

## Output Format

### 1. Command Definition
```typescript
{
  id: '{{COMMAND_ID}}',
  label: '{{COMMAND_LABEL}}',
  description: '{{COMMAND_DESCRIPTION}}',
  icon: 'i-heroicons-{{ICON}}',
  category: '{{CATEGORY}}',
  action: async () => {
    // Implementation
  },
  shortcut: '{{SHORTCUT}}',
  keywords: [{{KEYWORDS}}],
  contexts: [{{CONTEXTS}}],
  priority: {{PRIORITY}}
}
```

### 2. Action Implementation
```typescript
const {{COMMAND_FUNCTION}} = async () => {
  // Show loading state
  isExecuting.value = true
  
  try {
    // Validate context
    // Execute action
    // Update UI
    // Show success feedback
  } catch (error) {
    // Handle errors gracefully
    // Show error message to user
    // Log for debugging
  } finally {
    isExecuting.value = false
  }
}
```

### 3. Integration Instructions
- Where to add in CommandPalette.vue
- Required imports
- Any new dependencies

## Categories

Available categories:
- **Workspace**: Workspace management
- **Content**: Creating/editing content
- **Navigation**: Moving between pages
- **Transform**: Page type transformations
- **Session**: Session mode management
- **AI & Tools**: AI assistance and utilities
- **Settings**: Configuration and preferences
- **Workflows**: Multi-step operations

## Context Types

Commands can be available in these contexts:
- `all`: Always available
- `workspace-selected`: When workspace is active
- `page`: When viewing a page
- `text-selected`: When text is selected
- `guest-mode`: Only in guest mode
- `logged-in`: Only when authenticated
- `no-session`: When no session active

## Integration Points

Consider integration with:
1. **Database**: Via Prisma for persistent operations
2. **Universal Linking**: For content connections
3. **Polymorphic Engine**: For page transformations
4. **Session Service**: For mode-aware operations
5. **AI Service**: For intelligent features

## Examples

### Simple Command
```typescript
{
  id: 'toggle-theme',
  label: 'Toggle Theme',
  description: 'Switch between light and dark mode',
  icon: 'i-heroicons-sun',
  category: 'Settings',
  action: async () => {
    const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
    await setTheme(newTheme)
  },
  shortcut: 'Ctrl+Shift+T',
  keywords: ['theme', 'dark', 'light', 'mode'],
  contexts: ['all'],
  priority: 5
}
```

### Complex Command with Parameters
```typescript
{
  id: 'create-linked-page',
  label: 'Create Linked Page',
  description: 'Create a new page linked to current',
  icon: 'i-heroicons-link',
  category: 'Content',
  action: async () => {
    const title = await promptUser('Enter page title:')
    if (!title) return
    
    const page = await createPage({ title })
    await createLink({
      sourceType: 'PAGE',
      sourceId: currentPage.id,
      targetType: 'PAGE',
      targetId: page.id
    })
    
    await navigateTo(page.id)
  },
  contexts: ['page'],
  priority: 8
}
```

## Validation Checklist

- [ ] Command has unique ID
- [ ] Action is async and handles errors
- [ ] Respects session mode capabilities
- [ ] Provides user feedback
- [ ] Integrates with existing systems
- [ ] Has appropriate keyboard shortcut
- [ ] Keywords cover common search terms
- [ ] Context restrictions make sense

Generate a production-ready command that enhances the Athena command palette.