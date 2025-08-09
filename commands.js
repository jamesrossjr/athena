// Comprehensive Command Registry for Digital Paper
export const availableCommands = [
  // Content Blocks
  {
    id: 'h1',
    label: 'Heading 1',
    description: 'Large heading (H1)',
    category: 'Content Blocks',
    emoji: '📝',
    aliases: ['header1', 'heading1', 'header'],
    defaultContent: '',
    defaultStyles: {
      fontSize: '48px',
      fontWeight: 'bold',
      color: '#1a1a1a',
      padding: '8px',
      lineHeight: '1.2'
    }
  },
  {
    id: 'h2',
    label: 'Heading 2', 
    description: 'Medium heading (H2)',
    category: 'Content Blocks',
    emoji: '📄',
    aliases: ['header2', 'heading2'],
    defaultContent: '',
    defaultStyles: {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#1a1a1a',
      padding: '8px',
      lineHeight: '1.3'
    }
  },
  {
    id: 'h3',
    label: 'Heading 3',
    description: 'Small heading (H3)',
    category: 'Content Blocks', 
    emoji: '📃',
    aliases: ['header3', 'heading3'],
    defaultContent: '',
    defaultStyles: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#1a1a1a',
      padding: '8px',
      lineHeight: '1.4'
    }
  },
  {
    id: 'h4',
    label: 'Heading 4',
    description: 'Smaller heading (H4)',
    category: 'Content Blocks',
    emoji: '📄',
    aliases: ['header4', 'heading4'],
    defaultContent: '',
    defaultStyles: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1a1a1a',
      padding: '8px',
      lineHeight: '1.4'
    }
  },
  {
    id: 'h5',
    label: 'Heading 5',
    description: 'Smallest heading (H5)',
    category: 'Content Blocks',
    emoji: '📰',
    aliases: ['header5', 'heading5'],
    defaultContent: '',
    defaultStyles: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#1a1a1a',
      padding: '8px',
      lineHeight: '1.5'
    }
  },
  {
    id: 'text',
    label: 'Text',
    description: 'Regular text paragraph',
    category: 'Content Blocks',
    emoji: '📝',
    aliases: ['p', 'paragraph'],
    defaultContent: '',
    defaultStyles: {
      fontSize: '16px',
      color: '#333333',
      padding: '8px',
      lineHeight: '1.6'
    }
  },
  {
    id: 'bullet',
    label: 'Bulleted List',
    description: 'Bulleted list item',
    category: 'Content Blocks',
    emoji: '•',
    aliases: ['ul', 'list'],
    defaultContent: '',
    defaultStyles: {
      fontSize: '16px',
      fontWeight: 'normal',
      color: '#333333',
      padding: '4px 8px',
      paddingLeft: '24px',
      lineHeight: '1.6',
      position: 'relative'
    }
  },
  {
    id: 'number',
    label: 'Numbered List',
    description: 'Numbered list item',
    category: 'Content Blocks',
    emoji: '1️⃣',
    aliases: ['ol', 'ordered'],
    defaultContent: '',
    defaultStyles: {
      fontSize: '16px',
      fontWeight: 'normal',
      color: '#333333',
      padding: '4px 8px',
      paddingLeft: '24px',
      lineHeight: '1.6'
    }
  },
  {
    id: 'toggle',
    label: 'Toggle List',
    description: 'Collapsible toggle item',
    category: 'Content Blocks',
    emoji: '🔽',
    aliases: ['collapse'],
    defaultContent: '',
    defaultStyles: {
      fontSize: '16px',
      color: '#374151',
      padding: '8px',
      paddingLeft: '32px',
      lineHeight: '1.6',
      cursor: 'pointer'
    }
  },
  {
    id: 'quote',
    label: 'Quote Block',
    description: 'Highlighted quote or callout',
    category: 'Content Blocks',
    emoji: '💬',
    aliases: ['blockquote'],
    defaultContent: '',
    defaultStyles: {
      fontSize: '18px',
      fontWeight: 'normal',
      color: '#4b5563',
      backgroundColor: '#f9fafb',
      padding: '16px',
      borderLeft: '4px solid #3b82f6',
      fontStyle: 'italic',
      lineHeight: '1.6'
    }
  },
  {
    id: 'code',
    label: 'Code Block',
    description: 'Syntax highlighted code',
    category: 'Content Blocks',
    emoji: '💻',
    aliases: ['codeblock'],
    defaultContent: '',
    defaultStyles: {
      fontSize: '14px',
      fontFamily: 'Monaco, "Lucida Console", monospace',
      color: '#e5e7eb',
      backgroundColor: '#1f2937',
      padding: '16px',
      borderRadius: '8px',
      lineHeight: '1.5',
      whiteSpace: 'pre-wrap'
    }
  },

  // Structured Data
  {
    id: 'table',
    label: 'Table - Inline',
    description: 'Insert an inline table',
    category: 'Structured Data',
    emoji: '📊',
    aliases: ['grid'],
    defaultContent: 'Header 1 | Header 2\n--- | ---\nCell 1 | Cell 2',
    defaultStyles: {
      fontSize: '14px',
      color: '#374151',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      padding: '12px',
      backgroundColor: '#ffffff'
    }
  },
  {
    id: 'database',
    label: 'Database - Full Page',
    description: 'Create a full-page database view',
    category: 'Structured Data',
    emoji: '🗄️',
    aliases: ['db'],
    defaultContent: 'Database View',
    defaultStyles: {
      fontSize: '16px',
      color: '#374151',
      width: '100%',
      minHeight: '400px',
      border: '1px solid #d1d5db',
      borderRadius: '12px',
      padding: '24px',
      backgroundColor: '#f9fafb'
    }
  },
  {
    id: 'kanban',
    label: 'Kanban Board',
    description: 'Project board with columns',
    category: 'Structured Data',
    emoji: '📋',
    aliases: ['board'],
    defaultContent: 'Kanban Board',
    defaultStyles: {
      fontSize: '16px',
      color: '#374151',
      width: '100%',
      minHeight: '300px',
      border: '1px solid #d1d5db',
      borderRadius: '12px',
      padding: '20px',
      backgroundColor: '#ffffff'
    }
  },
  {
    id: 'calendar',
    label: 'Calendar View',
    description: 'Calendar layout view',
    category: 'Structured Data',
    emoji: '📅',
    aliases: ['cal'],
    defaultContent: 'Calendar View',
    defaultStyles: {
      fontSize: '16px',
      color: '#374151',
      width: '100%',
      minHeight: '400px',
      border: '1px solid #d1d5db',
      borderRadius: '12px',
      padding: '20px',
      backgroundColor: '#ffffff'
    }
  },
  {
    id: 'timeline',
    label: 'Timeline View',
    description: 'Timeline layout view',
    category: 'Structured Data',
    emoji: '📈',
    aliases: ['time'],
    defaultContent: 'Timeline View',
    defaultStyles: {
      fontSize: '16px',
      color: '#374151',
      width: '100%',
      minHeight: '350px',
      border: '1px solid #d1d5db',
      borderRadius: '12px',
      padding: '20px',
      backgroundColor: '#ffffff'
    }
  },

  // AI Actions
  {
    id: 'summarize',
    label: 'AI Summarize',
    description: 'Summarize selected content',
    category: 'AI Actions',
    emoji: '🤖',
    aliases: ['summary'],
    defaultContent: 'AI Summary will appear here...',
    defaultStyles: {
      fontSize: '16px',
      color: '#1f2937',
      backgroundColor: '#ecfdf5',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #10b981'
    }
  },
  {
    id: 'ask',
    label: 'Ask AI',
    description: 'Ask AI a question in context',
    category: 'AI Actions',
    emoji: '❓',
    aliases: ['question'],
    defaultContent: 'What would you like to know?',
    defaultStyles: {
      fontSize: '16px',
      color: '#1f2937',
      backgroundColor: '#eff6ff',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #3b82f6'
    }
  },
  {
    id: 'link',
    label: 'Link Related',
    description: 'Find & link related notes',
    category: 'AI Actions',
    emoji: '🔗',
    aliases: ['connect'],
    defaultContent: 'Linking related content...',
    defaultStyles: {
      fontSize: '16px',
      color: '#1f2937',
      backgroundColor: '#f3e8ff',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #8b5cf6'
    }
  },
  {
    id: 'brainstorm',
    label: 'AI Brainstorm',
    description: 'Generate ideas based on current selection',
    category: 'AI Actions',
    emoji: '💡',
    aliases: ['ideas'],
    defaultContent: 'AI brainstorming ideas...',
    defaultStyles: {
      fontSize: '16px',
      color: '#1f2937',
      backgroundColor: '#fef3c7',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #f59e0b'
    }
  },
  {
    id: 'translate',
    label: 'Translate',
    description: 'Translate selected text',
    category: 'AI Actions',
    emoji: '🌍',
    aliases: ['trans'],
    defaultContent: 'Translation will appear here...',
    defaultStyles: {
      fontSize: '16px',
      color: '#1f2937',
      backgroundColor: '#fef2f2',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #ef4444'
    }
  },
  {
    id: 'improve',
    label: 'Improve Writing',
    description: 'Rewrite selected content for clarity/tone',
    category: 'AI Actions',
    emoji: '✨',
    aliases: ['rewrite'],
    defaultContent: 'Improved content will appear here...',
    defaultStyles: {
      fontSize: '16px',
      color: '#1f2937',
      backgroundColor: '#f0f9ff',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #0ea5e9'
    }
  },
  {
    id: 'brief',
    label: 'Create Brief',
    description: 'Create a briefing from related notes',
    category: 'AI Actions',
    emoji: '📋',
    aliases: ['briefing'],
    defaultContent: 'Brief will be generated here...',
    defaultStyles: {
      fontSize: '16px',
      color: '#1f2937',
      backgroundColor: '#f7fee7',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #65a30d'
    }
  },

  // Media & Embeds
  {
    id: 'image',
    label: 'Image',
    description: 'Upload or embed image',
    category: 'Media & Embeds',
    emoji: '🖼️',
    aliases: ['img', 'picture'],
    defaultContent: 'Image placeholder',
    defaultStyles: {
      fontSize: '14px',
      color: '#6b7280',
      backgroundColor: '#f9fafb',
      padding: '40px',
      borderRadius: '8px',
      border: '2px dashed #d1d5db',
      textAlign: 'center',
      minHeight: '200px'
    }
  },
  {
    id: 'video',
    label: 'Video Embed',
    description: 'Embed video content',
    category: 'Media & Embeds',
    emoji: '🎥',
    aliases: ['vid'],
    defaultContent: 'Video embed placeholder',
    defaultStyles: {
      fontSize: '14px',
      color: '#6b7280',
      backgroundColor: '#000000',
      padding: '60px',
      borderRadius: '8px',
      textAlign: 'center',
      minHeight: '300px',
      color: '#ffffff'
    }
  },
  {
    id: 'pdf',
    label: 'PDF Embed',
    description: 'Embed PDF document',
    category: 'Media & Embeds',
    emoji: '📄',
    aliases: ['document'],
    defaultContent: 'PDF document will appear here',
    defaultStyles: {
      fontSize: '14px',
      color: '#6b7280',
      backgroundColor: '#f3f4f6',
      padding: '40px',
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      textAlign: 'center',
      minHeight: '400px'
    }
  },
  {
    id: 'file',
    label: 'File Upload',
    description: 'Upload any file',
    category: 'Media & Embeds',
    emoji: '📎',
    aliases: ['attachment'],
    defaultContent: 'File attachment placeholder',
    defaultStyles: {
      fontSize: '14px',
      color: '#6b7280',
      backgroundColor: '#f9fafb',
      padding: '20px',
      borderRadius: '8px',
      border: '1px dashed #d1d5db',
      textAlign: 'center'
    }
  },

  // Project Management
  {
    id: 'task',
    label: 'Task Item',
    description: 'Create a task with checkbox',
    category: 'Project Management',
    emoji: '☐',
    aliases: ['todo', 'checkbox'],
    defaultContent: '',
    defaultStyles: {
      fontSize: '16px',
      color: '#374151',
      padding: '8px',
      paddingLeft: '32px',
      lineHeight: '1.6',
      position: 'relative'
    }
  },
  {
    id: 'project',
    label: 'Project Board',
    description: 'Create a project management board',
    category: 'Project Management',
    emoji: '🎯',
    aliases: ['proj'],
    defaultContent: 'Project Board',
    defaultStyles: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#1f2937',
      backgroundColor: '#f3f4f6',
      padding: '20px',
      borderRadius: '12px',
      border: '2px solid #6366f1'
    }
  },
  {
    id: 'assign',
    label: 'Assign Task',
    description: 'Assign task to user (team mode)',
    category: 'Project Management',
    emoji: '👤',
    aliases: ['user'],
    defaultContent: 'Assigned to: User',
    defaultStyles: {
      fontSize: '14px',
      color: '#1f2937',
      backgroundColor: '#e0f2fe',
      padding: '12px',
      borderRadius: '6px',
      border: '1px solid #0288d1'
    }
  },

  // Other Utilities
  {
    id: 'date',
    label: 'Date Picker',
    description: 'Insert date picker',
    category: 'Other Utilities',
    emoji: '📅',
    aliases: ['calendar'],
    defaultContent: new Date().toLocaleDateString(),
    defaultStyles: {
      fontSize: '16px',
      color: '#374151',
      backgroundColor: '#f3f4f6',
      padding: '8px 12px',
      borderRadius: '6px',
      border: '1px solid #d1d5db'
    }
  },
  {
    id: 'divider',
    label: 'Divider',
    description: 'Horizontal line separator',
    category: 'Other Utilities',
    emoji: '➖',
    aliases: ['hr', 'line'],
    defaultContent: '',
    defaultStyles: {
      width: '100%',
      height: '1px',
      backgroundColor: '#d1d5db',
      margin: '20px 0',
      border: 'none'
    }
  },
  {
    id: 'callout',
    label: 'Callout Box',
    description: 'Highlighted information box',
    category: 'Other Utilities',
    emoji: '📢',
    aliases: ['info', 'alert'],
    defaultContent: '',
    defaultStyles: {
      fontSize: '16px',
      color: '#1f2937',
      backgroundColor: '#dbeafe',
      padding: '16px',
      borderRadius: '8px',
      border: '1px solid #3b82f6',
      lineHeight: '1.6'
    }
  },

  // Legacy commands for backward compatibility
  {
    id: 'button',
    label: 'Button',
    description: 'Interactive button element',
    category: 'Other Utilities',
    emoji: '🔘',
    defaultContent: 'Click me',
    defaultStyles: {
      padding: '12px 24px',
      backgroundColor: '#3b82f6',
      color: 'white',
      borderRadius: '8px',
      fontWeight: '500',
      cursor: 'pointer'
    }
  },
  {
    id: 'card',
    label: 'Card',
    description: 'Content card container',
    category: 'Other Utilities',
    emoji: '🃏',
    defaultContent: 'Card content...',
    defaultStyles: {
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '12px',
      minWidth: '300px',
      minHeight: '200px',
      border: '1px solid #e5e7eb'
    }
  }
];