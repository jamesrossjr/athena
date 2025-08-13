# Block Component Generation Prompt

## Context
You are an expert Vue 3 and TipTap developer creating a new block component for the Athena knowledge management system. The system uses:
- Vue 3 Composition API with TypeScript
- TipTap 2 for rich text editing
- Tailwind CSS for styling
- Block-based architecture where each piece of content is a database record

## Task
Generate a complete TipTap block component with the following specifications:

### Input Parameters
- **Block Name**: {{BLOCK_NAME}}
- **Block Type**: {{BLOCK_TYPE}} (node/mark/extension)
- **Description**: {{DESCRIPTION}}
- **Properties**: {{PROPERTIES}}
- **Interactive**: {{IS_INTERACTIVE}}

## Requirements

### 1. Component Structure
Create a Vue component that:
- Extends appropriate TipTap base (Node, Mark, or Extension)
- Implements proper TypeScript typing
- Uses Composition API
- Handles both display and edit modes
- Integrates with the block database schema

### 2. Database Integration
The block must:
- Store its state in the `blocks` table
- Use the `content` JSON field for block-specific data
- Maintain proper `type` identification
- Support universal linking capabilities

### 3. User Experience
- Smooth transitions between view/edit modes
- Keyboard shortcuts if applicable
- Proper focus management
- Accessibility considerations (ARIA labels, keyboard navigation)

### 4. Code Style
- Follow existing project patterns
- Use descriptive variable names
- Include helpful comments for complex logic
- Implement proper error handling

## Output Format

Generate the following files:

### 1. Block Component ({{BLOCK_NAME}}Block.vue)
```vue
<template>
  <!-- Block template here -->
</template>

<script setup lang="ts">
// Implementation
</script>

<style scoped>
/* Styles if needed */
</style>
```

### 2. TipTap Extension ({{BLOCK_NAME}}.ts)
```typescript
import { Node/Mark/Extension } from '@tiptap/core'
// Extension definition
```

### 3. Type Definitions (types/blocks/{{BLOCK_NAME}}.ts)
```typescript
export interface {{BLOCK_NAME}}BlockData {
  // Type definitions
}
```

### 4. Usage Example
```typescript
// How to use this block in the editor
```

## Special Considerations

- **Performance**: Use lazy loading for heavy components
- **Persistence**: Ensure all state changes are saved to database
- **Collaboration**: Consider multi-user editing scenarios
- **Polymorphism**: Block should work across different page types
- **Mobile**: Ensure touch-friendly interactions

## Examples of Existing Blocks

Reference these patterns from existing blocks:
- HeadingBlock: Simple text with levels
- TodoBlock: Interactive checkbox state
- CodeBlock: Syntax highlighting with language selection
- ImageBlock: File upload and display
- TableBlock: Complex nested structure

## Validation Checklist

Ensure the generated block:
- [ ] Compiles without TypeScript errors
- [ ] Saves/loads from database correctly
- [ ] Handles edge cases (empty state, errors)
- [ ] Follows accessibility guidelines
- [ ] Integrates with undo/redo
- [ ] Supports copy/paste
- [ ] Works with universal linking system

Generate a production-ready block component that seamlessly integrates with the Athena system.