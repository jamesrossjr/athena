#!/usr/bin/env node

/**
 * Database Seeding Script
 * 
 * Populates database with initial data for development
 */

import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'

// Load configuration
const configPath = join(__dirname, '../../config/settings.json')
const config = JSON.parse(readFileSync(configPath, 'utf-8'))

interface SeedOptions {
  mode: 'development' | 'production' | 'test'
  reset: boolean
  users: boolean
  workspaces: boolean
  pages: boolean
  blocks: boolean
}

async function main() {
  console.log(chalk.bold.cyan('\n🌱 Database Seeding Manager\n'))
  
  // Check if we're in a valid project
  const projectRoot = join(__dirname, '../../../')
  const schemaPath = join(projectRoot, 'prisma/schema.prisma')
  
  if (!existsSync(schemaPath)) {
    console.error(chalk.red('❌ No Prisma schema found. Are you in a valid Athena project?'))
    process.exit(1)
  }

  // Get seeding options
  const options = await getSeedOptions()
  
  try {
    // Initialize Prisma client
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    if (options.reset) {
      await clearExistingData(prisma)
    }

    if (options.users) {
      await seedUsers(prisma, options.mode)
    }

    if (options.workspaces) {
      await seedWorkspaces(prisma, options.mode)
    }

    if (options.pages) {
      await seedPages(prisma, options.mode)
    }

    if (options.blocks) {
      await seedBlocks(prisma, options.mode)
    }

    await prisma.$disconnect()
    
    console.log(chalk.bold.green('\n✅ Database seeding completed successfully!\n'))
    
  } catch (error) {
    console.error(chalk.red(`❌ Seeding failed: ${error.message}`))
    process.exit(1)
  }
}

/**
 * Get seeding options from user
 */
async function getSeedOptions(): Promise<SeedOptions> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'Seeding mode:',
      choices: [
        { name: 'Development (sample data)', value: 'development' },
        { name: 'Production (minimal data)', value: 'production' },
        { name: 'Test (test fixtures)', value: 'test' }
      ],
      default: 'development'
    },
    {
      type: 'confirm',
      name: 'reset',
      message: 'Clear existing data first?',
      default: false
    },
    {
      type: 'checkbox',
      name: 'categories',
      message: 'What to seed:',
      choices: [
        { name: 'Users', value: 'users', checked: true },
        { name: 'Workspaces', value: 'workspaces', checked: true },
        { name: 'Pages', value: 'pages', checked: true },
        { name: 'Blocks', value: 'blocks', checked: true }
      ],
      validate: (input) => input.length > 0 ? true : 'Select at least one category'
    }
  ])

  return {
    mode: answers.mode,
    reset: answers.reset,
    users: answers.categories.includes('users'),
    workspaces: answers.categories.includes('workspaces'),
    pages: answers.categories.includes('pages'),
    blocks: answers.categories.includes('blocks')
  }
}

/**
 * Clear existing data
 */
async function clearExistingData(prisma: any): Promise<void> {
  const clearSpinner = ora('Clearing existing data...').start()
  
  try {
    // Delete in correct order to respect foreign keys
    await prisma.link.deleteMany()
    await prisma.block.deleteMany()
    await prisma.page.deleteMany()
    await prisma.workspace.deleteMany()
    await prisma.user.deleteMany()
    
    clearSpinner.succeed('Existing data cleared')
  } catch (error) {
    clearSpinner.fail('Failed to clear existing data')
    throw error
  }
}

/**
 * Seed users
 */
async function seedUsers(prisma: any, mode: string): Promise<void> {
  const userSpinner = ora('Seeding users...').start()
  
  try {
    const users = getUserSeedData(mode)
    
    for (const userData of users) {
      await prisma.user.upsert({
        where: { email: userData.email },
        update: userData,
        create: userData
      })
    }
    
    userSpinner.succeed(`${users.length} users seeded`)
  } catch (error) {
    userSpinner.fail('Failed to seed users')
    throw error
  }
}

/**
 * Seed workspaces
 */
async function seedWorkspaces(prisma: any, mode: string): Promise<void> {
  const workspaceSpinner = ora('Seeding workspaces...').start()
  
  try {
    const workspaces = getWorkspaceSeedData(mode)
    
    // Get first user as owner
    const user = await prisma.user.findFirst()
    if (!user) throw new Error('No users found - seed users first')
    
    for (const workspaceData of workspaces) {
      await prisma.workspace.upsert({
        where: { name: workspaceData.name },
        update: workspaceData,
        create: {
          ...workspaceData,
          userId: user.id
        }
      })
    }
    
    workspaceSpinner.succeed(`${workspaces.length} workspaces seeded`)
  } catch (error) {
    workspaceSpinner.fail('Failed to seed workspaces')
    throw error
  }
}

/**
 * Seed pages
 */
async function seedPages(prisma: any, mode: string): Promise<void> {
  const pageSpinner = ora('Seeding pages...').start()
  
  try {
    const pages = getPageSeedData(mode)
    
    // Get first user and workspace
    const user = await prisma.user.findFirst()
    const workspace = await prisma.workspace.findFirst()
    
    if (!user || !workspace) {
      throw new Error('No users or workspaces found - seed those first')
    }
    
    for (const pageData of pages) {
      await prisma.page.create({
        data: {
          ...pageData,
          userId: user.id,
          workspaceId: workspace.id
        }
      })
    }
    
    pageSpinner.succeed(`${pages.length} pages seeded`)
  } catch (error) {
    pageSpinner.fail('Failed to seed pages')
    throw error
  }
}

/**
 * Seed blocks
 */
async function seedBlocks(prisma: any, mode: string): Promise<void> {
  const blockSpinner = ora('Seeding blocks...').start()
  
  try {
    const blocks = getBlockSeedData(mode)
    
    // Get first page
    const page = await prisma.page.findFirst()
    if (!page) throw new Error('No pages found - seed pages first')
    
    for (const blockData of blocks) {
      await prisma.block.create({
        data: {
          ...blockData,
          pageId: page.id
        }
      })
    }
    
    blockSpinner.succeed(`${blocks.length} blocks seeded`)
  } catch (error) {
    blockSpinner.fail('Failed to seed blocks')
    throw error
  }
}

/**
 * Get user seed data based on mode
 */
function getUserSeedData(mode: string) {
  const baseUsers = [
    {
      email: 'dev@athena.local',
      name: 'Developer',
      avatar: '👨‍💻'
    }
  ]

  if (mode === 'development') {
    return [
      ...baseUsers,
      {
        email: 'designer@athena.local',
        name: 'Designer',
        avatar: '🎨'
      },
      {
        email: 'manager@athena.local',
        name: 'Project Manager',
        avatar: '📋'
      }
    ]
  }

  return baseUsers
}

/**
 * Get workspace seed data
 */
function getWorkspaceSeedData(mode: string) {
  const baseWorkspaces = [
    {
      name: 'Getting Started',
      description: 'Your first workspace in Athena',
      icon: '🚀',
      color: '#3b82f6'
    }
  ]

  if (mode === 'development') {
    return [
      ...baseWorkspaces,
      {
        name: 'Personal Notes',
        description: 'Personal knowledge base',
        icon: '📝',
        color: '#10b981'
      },
      {
        name: 'Project Alpha',
        description: 'Development project workspace',
        icon: '🏗️',
        color: '#f59e0b'
      },
      {
        name: 'Research',
        description: 'Research and analysis workspace',
        icon: '🔬',
        color: '#8b5cf6'
      }
    ]
  }

  return baseWorkspaces
}

/**
 * Get page seed data
 */
function getPageSeedData(mode: string) {
  const basePages = [
    {
      title: 'Welcome to Athena',
      type: 'DOCUMENT',
      content: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: 'Welcome to Athena' }]
          },
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'This is your digital paper workspace. You can create documents, databases, whiteboards, and more - all in one unified interface.' }
            ]
          }
        ]
      }
    }
  ]

  if (mode === 'development') {
    return [
      ...basePages,
      {
        title: 'Project Planning',
        type: 'KANBAN',
        content: {
          columns: [
            { id: 'todo', title: 'To Do', cards: [] },
            { id: 'doing', title: 'In Progress', cards: [] },
            { id: 'done', title: 'Done', cards: [] }
          ]
        }
      },
      {
        title: 'Team Database',
        type: 'DATABASE',
        content: {
          schema: {
            name: { type: 'text', required: true },
            role: { type: 'select', options: ['Developer', 'Designer', 'Manager'] },
            status: { type: 'select', options: ['Active', 'Inactive'] }
          },
          records: []
        }
      }
    ]
  }

  return basePages
}

/**
 * Get block seed data
 */
function getBlockSeedData(mode: string) {
  const baseBlocks = [
    {
      type: 'heading',
      content: { level: 1, text: 'Getting Started' },
      position: 0
    },
    {
      type: 'paragraph',
      content: { text: 'Welcome to your Athena workspace!' },
      position: 1
    }
  ]

  if (mode === 'development') {
    return [
      ...baseBlocks,
      {
        type: 'codeBlock',
        content: {
          language: 'javascript',
          code: 'console.log("Hello, Athena!");'
        },
        position: 2
      },
      {
        type: 'taskList',
        content: {
          tasks: [
            { text: 'Explore the interface', completed: true },
            { text: 'Create your first page', completed: false },
            { text: 'Try different page types', completed: false }
          ]
        },
        position: 3
      }
    ]
  }

  return baseBlocks
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled error:'), error)
  process.exit(1)
})

// Run
main().catch(error => {
  console.error(chalk.red('Seeding failed:'), error)
  process.exit(1)
})