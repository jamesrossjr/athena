import type { Command, CommandCategory } from '~/types/commands'

export const useCommands = () => {
  const commands: Command[] = [
    // File Commands
    {
      id: 'file-new',
      name: 'New Document',
      description: 'Create a new document',
      category: 'FILE' as CommandCategory,
      shortcut: 'Ctrl+N',
      icon: 'plus',
      action: () => console.log('New document'),
      searchTerms: ['new', 'create', 'document']
    },
    {
      id: 'file-open',
      name: 'Open',
      description: 'Open an existing document',
      category: 'FILE' as CommandCategory,
      shortcut: 'Ctrl+O',
      icon: 'folder-open',
      action: () => console.log('Open document'),
      searchTerms: ['open', 'load']
    },
    {
      id: 'file-save',
      name: 'Save',
      description: 'Save the current document',
      category: 'FILE' as CommandCategory,
      shortcut: 'Ctrl+S',
      icon: 'save',
      action: () => console.log('Save document'),
      searchTerms: ['save', 'store']
    },

    // Edit Commands
    {
      id: 'edit-undo',
      name: 'Undo',
      description: 'Undo the last action',
      category: 'EDIT' as CommandCategory,
      shortcut: 'Ctrl+Z',
      icon: 'undo',
      action: () => document.execCommand('undo'),
      searchTerms: ['undo', 'revert']
    },
    {
      id: 'edit-redo',
      name: 'Redo',
      description: 'Redo the last undone action',
      category: 'EDIT' as CommandCategory,
      shortcut: 'Ctrl+Y',
      icon: 'redo',
      action: () => document.execCommand('redo'),
      searchTerms: ['redo', 'repeat']
    },
    {
      id: 'edit-cut',
      name: 'Cut',
      description: 'Cut selected content',
      category: 'EDIT' as CommandCategory,
      shortcut: 'Ctrl+X',
      icon: 'scissors',
      action: () => document.execCommand('cut'),
      searchTerms: ['cut', 'remove']
    },
    {
      id: 'edit-copy',
      name: 'Copy',
      description: 'Copy selected content',
      category: 'EDIT' as CommandCategory,
      shortcut: 'Ctrl+C',
      icon: 'copy',
      action: () => document.execCommand('copy'),
      searchTerms: ['copy', 'duplicate']
    },
    {
      id: 'edit-paste',
      name: 'Paste',
      description: 'Paste content from clipboard',
      category: 'EDIT' as CommandCategory,
      shortcut: 'Ctrl+V',
      icon: 'clipboard',
      action: () => document.execCommand('paste'),
      searchTerms: ['paste', 'insert']
    },

    // Format Commands
    {
      id: 'format-bold',
      name: 'Bold',
      description: 'Make text bold',
      category: 'FORMAT' as CommandCategory,
      shortcut: 'Ctrl+B',
      icon: 'bold',
      action: () => document.execCommand('bold'),
      searchTerms: ['bold', 'strong', 'thick']
    },
    {
      id: 'format-italic',
      name: 'Italic',
      description: 'Make text italic',
      category: 'FORMAT' as CommandCategory,
      shortcut: 'Ctrl+I',
      icon: 'italic',
      action: () => document.execCommand('italic'),
      searchTerms: ['italic', 'slant']
    },
    {
      id: 'format-underline',
      name: 'Underline',
      description: 'Underline text',
      category: 'FORMAT' as CommandCategory,
      shortcut: 'Ctrl+U',
      icon: 'underline',
      action: () => document.execCommand('underline'),
      searchTerms: ['underline']
    },
    {
      id: 'format-strikethrough',
      name: 'Strikethrough',
      description: 'Strike through text',
      category: 'FORMAT' as CommandCategory,
      icon: 'strikethrough',
      action: () => document.execCommand('strikeThrough'),
      searchTerms: ['strikethrough', 'cross out']
    },

    // Insert Commands
    {
      id: 'insert-link',
      name: 'Insert Link',
      description: 'Insert a hyperlink',
      category: 'INSERT' as CommandCategory,
      shortcut: 'Ctrl+K',
      icon: 'link',
      action: () => {
        const url = prompt('Enter URL:')
        if (url) document.execCommand('createLink', false, url)
      },
      searchTerms: ['link', 'hyperlink', 'url']
    },
    {
      id: 'insert-image',
      name: 'Insert Image',
      description: 'Insert an image',
      category: 'INSERT' as CommandCategory,
      icon: 'image',
      action: () => {
        const url = prompt('Enter image URL:')
        if (url) document.execCommand('insertImage', false, url)
      },
      searchTerms: ['image', 'picture', 'photo']
    },
    {
      id: 'insert-table',
      name: 'Insert Table',
      description: 'Insert a table',
      category: 'INSERT' as CommandCategory,
      icon: 'table',
      action: () => console.log('Insert table'),
      searchTerms: ['table', 'grid']
    },
    {
      id: 'insert-bullet-list',
      name: 'Bullet List',
      description: 'Create a bullet point list',
      category: 'INSERT' as CommandCategory,
      icon: 'list-ul',
      action: () => document.execCommand('insertUnorderedList'),
      searchTerms: ['bullet', 'list', 'unordered']
    },
    {
      id: 'insert-numbered-list',
      name: 'Numbered List',
      description: 'Create a numbered list',
      category: 'INSERT' as CommandCategory,
      icon: 'list-ol',
      action: () => document.execCommand('insertOrderedList'),
      searchTerms: ['numbered', 'list', 'ordered']
    },

    // Layout Commands
    {
      id: 'layout-align-left',
      name: 'Align Left',
      description: 'Align text to the left',
      category: 'LAYOUT' as CommandCategory,
      icon: 'align-left',
      action: () => document.execCommand('justifyLeft'),
      searchTerms: ['align', 'left']
    },
    {
      id: 'layout-align-center',
      name: 'Align Center',
      description: 'Center align text',
      category: 'LAYOUT' as CommandCategory,
      icon: 'align-center',
      action: () => document.execCommand('justifyCenter'),
      searchTerms: ['align', 'center']
    },
    {
      id: 'layout-align-right',
      name: 'Align Right',
      description: 'Align text to the right',
      category: 'LAYOUT' as CommandCategory,
      icon: 'align-right',
      action: () => document.execCommand('justifyRight'),
      searchTerms: ['align', 'right']
    },
    {
      id: 'layout-justify',
      name: 'Justify',
      description: 'Justify text alignment',
      category: 'LAYOUT' as CommandCategory,
      icon: 'align-justify',
      action: () => document.execCommand('justifyFull'),
      searchTerms: ['justify', 'align']
    },

    // View Commands
    {
      id: 'view-zoom-in',
      name: 'Zoom In',
      description: 'Increase zoom level',
      category: 'VIEW' as CommandCategory,
      shortcut: 'Ctrl+=',
      icon: 'zoom-in',
      action: () => console.log('Zoom in'),
      searchTerms: ['zoom', 'in', 'magnify']
    },
    {
      id: 'view-zoom-out',
      name: 'Zoom Out',
      description: 'Decrease zoom level',
      category: 'VIEW' as CommandCategory,
      shortcut: 'Ctrl+-',
      icon: 'zoom-out',
      action: () => console.log('Zoom out'),
      searchTerms: ['zoom', 'out', 'shrink']
    },
    {
      id: 'view-fullscreen',
      name: 'Full Screen',
      description: 'Enter full screen mode',
      category: 'VIEW' as CommandCategory,
      shortcut: 'F11',
      icon: 'maximize',
      action: () => {
        if (document.fullscreenElement) {
          document.exitFullscreen()
        } else {
          document.documentElement.requestFullscreen()
        }
      },
      searchTerms: ['fullscreen', 'full', 'screen']
    }
  ]

  const searchCommands = (query: string): Command[] => {
    if (!query.trim()) return commands

    const lowerQuery = query.toLowerCase()
    return commands.filter(command => 
      command.name.toLowerCase().includes(lowerQuery) ||
      command.description.toLowerCase().includes(lowerQuery) ||
      command.category.toLowerCase().includes(lowerQuery) ||
      command.searchTerms?.some(term => term.toLowerCase().includes(lowerQuery))
    )
  }

  const getCommandsByCategory = (category: CommandCategory): Command[] => {
    return commands.filter(command => command.category === category)
  }

  const executeCommand = (commandId: string) => {
    const command = commands.find(cmd => cmd.id === commandId)
    if (command) {
      command.action()
    }
  }

  return {
    commands,
    searchCommands,
    getCommandsByCategory,
    executeCommand
  }
}