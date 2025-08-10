# TipTap Multi-Column System Usage Guide

## Overview
This implementation provides a complete multi-column layout system for TipTap with Vue.js, featuring drag-and-drop column reordering, responsive design, and intuitive keyboard shortcuts.

## Key Features

### ✅ **Nested Node Structure**
- `ColumnContainerNode`: Top-level wrapper (flexbox container)
- `ColumnNode`: Individual columns within the container
- Proper content definitions: `column+` and `block+`

### ✅ **Keyboard Shortcuts**
- `Shift+Tab`: Convert current block to 2-column layout
- `Cmd+Shift+Right`: Split current column
- `Cmd+Shift+Left`: Merge with next column

### ✅ **Drag & Drop**
- Hover-visible drag handles on each column
- Drag to reorder columns within container
- Visual feedback during drag operations

### ✅ **Responsive Design**
- Flexbox layout on desktop (`md:flex-row`)
- Stacks vertically on mobile (`max-md:flex-col`)
- Mobile-optimized controls and interactions

## Installation

1. **Add Extensions to your TipTap editor:**

```javascript
import { useEditor } from '@tiptap/vue-3'
import ColumnContainerNode from './extensions/ColumnContainerNode.js'
import ColumnNode from './extensions/ColumnNode.js'

const editor = useEditor({
  extensions: [
    StarterKit,
    ColumnContainerNode,
    ColumnNode,
    // ... other extensions
  ],
})
```

2. **Include CSS styles:**

```css
/* Import the column system styles */
@import './assets/css/tiptap-columns.css';
```

3. **Use the TipTapEditor component:**

```vue
<template>
  <TipTapEditor
    v-model:content="content"
    :editable="true"
  />
</template>
```

## Usage Examples

### Basic Column Creation

```javascript
// Create a 2-column layout from current selection
editor.commands.createColumnLayout()

// Programmatically add a column
editor.commands.addColumn()

// Remove a specific column
editor.commands.removeColumn(2) // Remove 3rd column (0-indexed)
```

### Advanced Column Operations

```javascript
// Split current column into two
editor.commands.splitColumn()

// Merge current column with next column
editor.commands.mergeWithNextColumn()

// Check if cursor is in a column
if (editorCommands.isInColumn(editor)) {
  console.log('Currently in a column')
}

// Check if cursor is in a column container
if (editorCommands.isInColumnContainer(editor)) {
  console.log('Currently in a column container')
}
```

### HTML Output Structure

The system generates clean, semantic HTML:

```html
<div class="column-container flex gap-4 md:flex-row max-md:flex-col" data-type="column-container" data-column-count="2">
  <div class="column flex-1 min-w-0 p-2" data-type="column">
    <p>Content for first column</p>
    <h2>Heading in first column</h2>
  </div>
  <div class="column flex-1 min-w-0 p-2" data-type="column">
    <p>Content for second column</p>
    <ul>
      <li>List item in second column</li>
    </ul>
  </div>
</div>
```

## User Interface Features

### Hover Controls
- **Column Controls**: Appear at the top of containers on hover
- **Add Column**: Plus button (up to 6 columns max)
- **Remove Column**: Minus button (minimum 1 column)
- **Convert to Blocks**: Trash button to flatten the layout

### Drag Handles
- **Visibility**: Only visible on hover for each column
- **Positioning**: Centered at the top of each column
- **Interaction**: Click and drag to reorder columns
- **Mobile**: Hidden on screens smaller than `md` breakpoint

### Visual Feedback
- **Drop Indicators**: Blue dashed borders during drag operations
- **Focus States**: Columns highlight when focused
- **Hover States**: Subtle border and background changes

## Responsive Behavior

### Desktop (≥768px)
- Columns displayed side-by-side in flexbox row
- Drag handles visible and functional
- Full toolbar controls available

### Mobile (<768px)
- Columns stack vertically in flexbox column
- Drag handles hidden (not practical on touch)
- Simplified interaction model

## Customization Options

### Styling
All styles use Tailwind CSS classes and can be customized:

```css
/* Custom column container */
.column-container {
  @apply bg-gray-50 dark:bg-gray-900 p-6 rounded-xl;
}

/* Custom column appearance */
.column {
  @apply bg-white dark:bg-gray-800 shadow-sm border;
}
```

### Attributes
Column containers support custom attributes:

```javascript
// Set custom column count
editor.commands.setColumnContainer({ columnCount: 3 })

// Set custom column width
editor.commands.setColumn({ width: '300px' })
```

## Integration with Existing Systems

### Block-based Editors
Works seamlessly with existing block systems:
- Paragraphs, headings, lists, images, etc. all work within columns
- Maintains existing keyboard shortcuts and commands
- Preserves block-level formatting and styles

### Content Management
- Clean HTML output suitable for storage
- Proper parsing from HTML back to editor state
- JSON serialization support for structured content

### Accessibility
- Proper semantic HTML structure
- Keyboard navigation support
- Screen reader friendly markup
- Focus management and ARIA labels

## Troubleshooting

### Common Issues

1. **Columns not appearing**: Ensure both extensions are registered
2. **Drag not working**: Check that the NodeView is properly set up
3. **Mobile layout issues**: Verify responsive CSS classes are applied
4. **Keyboard shortcuts conflicting**: Check for extension conflicts

### Browser Compatibility
- Chrome/Chromium: Full support
- Firefox: Full support
- Safari: Full support
- Edge: Full support
- Mobile browsers: Responsive layout only (no drag)

## Advanced Features

### Custom Commands
Extend the system with custom commands:

```javascript
// Add to your editor configuration
addCommands() {
  return {
    setColumnLayout: (columnCount) => ({ commands }) => {
      // Custom logic for setting specific column layouts
      return commands.createColumnLayout()
    }
  }
}
```

### Event Handling
Listen to column-related events:

```javascript
editor.on('transaction', ({ transaction }) => {
  // Check for column-related changes
  if (transaction.getMeta('columnChanged')) {
    console.log('Columns were modified')
  }
})
```

## Performance Considerations

- **Efficient Rendering**: NodeView optimization for large documents
- **Memory Management**: Proper cleanup of drag event listeners
- **Responsive Images**: Automatic image sizing within columns
- **Print Optimization**: Clean print layouts without controls

This multi-column system provides a professional, user-friendly way to create sophisticated layouts within your TipTap editor while maintaining clean code architecture and excellent performance.