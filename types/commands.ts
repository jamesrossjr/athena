export interface Command {
  id: string
  name: string
  description: string
  category: CommandCategory
  shortcut?: string
  icon?: string
  action: () => void | Promise<void>
  searchTerms?: string[]
}

export enum CommandCategory {
  FORMAT = 'Format',
  INSERT = 'Insert',
  LAYOUT = 'Layout',
  TABLE = 'Table',
  REVIEW = 'Review',
  VIEW = 'View',
  FILE = 'File',
  EDIT = 'Edit',
  TOOLS = 'Tools'
}

export interface CommandGroup {
  category: CommandCategory
  commands: Command[]
}