#!/usr/bin/env node

/**
 * Workflow Orchestration Script
 * 
 * Manages complex multi-step automation workflows
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'

// Load configuration
const configPath = join(__dirname, '../../config/settings.json')
const config = JSON.parse(readFileSync(configPath, 'utf-8'))

interface WorkflowStep {
  id: string
  name: string
  type: 'script' | 'command' | 'api' | 'ai'
  action: string
  condition?: string
  onSuccess?: string[]
  onError?: string[]
  timeout?: number
}

interface Workflow {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  environment?: string[]
}

const WORKFLOWS: Record<string, Workflow> = {
  'full-setup': {
    id: 'full-setup',
    name: 'Full Development Setup',
    description: 'Complete environment setup for new developers',
    environment: ['NODE_ENV=development'],
    steps: [
      {
        id: 'check-deps',
        name: 'Check Dependencies',
        type: 'script',
        action: 'npm list --depth=0',
        onError: ['install-deps']
      },
      {
        id: 'install-deps',
        name: 'Install Dependencies',
        type: 'script',
        action: 'pnpm install',
        timeout: 300000
      },
      {
        id: 'setup-db',
        name: 'Setup Database',
        type: 'script',
        action: 'pnpm run db:setup',
        onError: ['db-troubleshoot']
      },
      {
        id: 'seed-db',
        name: 'Seed Database',
        type: 'script',
        action: 'pnpm run db:seed',
        condition: 'development'
      },
      {
        id: 'start-services',
        name: 'Start Development Services',
        type: 'script',
        action: 'pnpm run dev:up'
      },
      {
        id: 'verify-setup',
        name: 'Verify Setup',
        type: 'script',
        action: 'pnpm run test:smoke'
      }
    ]
  },
  
  'deploy-staging': {
    id: 'deploy-staging',
    name: 'Deploy to Staging',
    description: 'Deploy application to staging environment',
    environment: ['NODE_ENV=staging'],
    steps: [
      {
        id: 'run-tests',
        name: 'Run Test Suite',
        type: 'script',
        action: 'pnpm run test'
      },
      {
        id: 'type-check',
        name: 'TypeScript Check',
        type: 'script',
        action: 'pnpm run typecheck'
      },
      {
        id: 'build-app',
        name: 'Build Application',
        type: 'script',
        action: 'pnpm run build'
      },
      {
        id: 'db-migrate',
        name: 'Run Database Migrations',
        type: 'script',
        action: 'pnpm run db:migrate:deploy'
      },
      {
        id: 'deploy-files',
        name: 'Deploy Files',
        type: 'command',
        action: 'rsync -av --delete .output/ staging:/var/www/athena/'
      },
      {
        id: 'restart-service',
        name: 'Restart Service',
        type: 'command',
        action: 'ssh staging "pm2 restart athena"'
      },
      {
        id: 'health-check',
        name: 'Health Check',
        type: 'api',
        action: 'GET https://staging.athena.app/api/health'
      }
    ]
  },

  'ai-block-generator': {
    id: 'ai-block-generator',
    name: 'AI Block Generator Workflow',
    description: 'Generate and integrate a new block component using AI',
    steps: [
      {
        id: 'gather-specs',
        name: 'Gather Block Specifications',
        type: 'script',
        action: 'node .admin/scripts/generate/block.ts --interactive'
      },
      {
        id: 'generate-component',
        name: 'Generate Component with AI',
        type: 'ai',
        action: 'generate-block-component'
      },
      {
        id: 'create-extension',
        name: 'Create TipTap Extension',
        type: 'ai',
        action: 'generate-tiptap-extension'
      },
      {
        id: 'register-block',
        name: 'Register Block in System',
        type: 'script',
        action: 'node .admin/scripts/register-block.ts'
      },
      {
        id: 'test-block',
        name: 'Test Block Integration',
        type: 'script',
        action: 'pnpm run test:blocks'
      },
      {
        id: 'update-docs',
        name: 'Update Documentation',
        type: 'ai',
        action: 'generate-block-documentation'
      }
    ]
  },

  'maintenance': {
    id: 'maintenance',
    name: 'System Maintenance',
    description: 'Routine system maintenance and cleanup',
    steps: [
      {
        id: 'update-deps',
        name: 'Update Dependencies',
        type: 'script',
        action: 'pnpm update'
      },
      {
        id: 'audit-security',
        name: 'Security Audit',
        type: 'script',
        action: 'pnpm audit'
      },
      {
        id: 'clean-cache',
        name: 'Clean Cache',
        type: 'script',
        action: 'pnpm run clean'
      },
      {
        id: 'optimize-db',
        name: 'Optimize Database',
        type: 'script',
        action: 'pnpm run db:optimize'
      },
      {
        id: 'backup-db',
        name: 'Backup Database',
        type: 'script',
        action: 'pnpm run db:backup'
      },
      {
        id: 'generate-report',
        name: 'Generate Maintenance Report',
        type: 'script',
        action: 'node .admin/scripts/reports/maintenance.ts'
      }
    ]
  }
}

async function main() {
  console.log(chalk.bold.cyan('\n🔄 Workflow Orchestration Manager\n'))

  // Show available workflows
  const workflowChoices = Object.values(WORKFLOWS).map(w => ({
    name: `${w.name} - ${w.description}`,
    value: w.id
  }))

  const { workflowId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'workflowId',
      message: 'Select workflow to run:',
      choices: workflowChoices
    }
  ])

  const workflow = WORKFLOWS[workflowId]
  if (!workflow) {
    console.error(chalk.red('Workflow not found'))
    process.exit(1)
  }

  // Confirm execution
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message: `Run workflow "${workflow.name}"?`,
      default: true
    }
  ])

  if (!confirmed) {
    console.log(chalk.yellow('Workflow cancelled'))
    process.exit(0)
  }

  // Execute workflow
  await executeWorkflow(workflow)
}

/**
 * Execute a workflow
 */
async function executeWorkflow(workflow: Workflow): Promise<void> {
  console.log(chalk.bold(`\nExecuting workflow: ${workflow.name}\n`))

  // Set environment variables
  if (workflow.environment) {
    for (const env of workflow.environment) {
      const [key, value] = env.split('=')
      process.env[key] = value
    }
  }

  const results: Record<string, { success: boolean; error?: string }> = {}
  let currentSteps = [workflow.steps[0].id]

  while (currentSteps.length > 0) {
    const nextSteps: string[] = []

    for (const stepId of currentSteps) {
      const step = workflow.steps.find(s => s.id === stepId)
      if (!step) continue

      // Check condition
      if (step.condition && !evaluateCondition(step.condition)) {
        console.log(chalk.yellow(`⏭️  Skipping ${step.name} (condition not met)`))
        continue
      }

      const result = await executeStep(step)
      results[stepId] = result

      if (result.success) {
        console.log(chalk.green(`✅ ${step.name} completed`))
        
        // Add success steps
        if (step.onSuccess) {
          nextSteps.push(...step.onSuccess)
        }
        
        // Add next step if no explicit routing
        if (!step.onSuccess && !step.onError) {
          const currentIndex = workflow.steps.findIndex(s => s.id === stepId)
          if (currentIndex < workflow.steps.length - 1) {
            nextSteps.push(workflow.steps[currentIndex + 1].id)
          }
        }
      } else {
        console.log(chalk.red(`❌ ${step.name} failed: ${result.error}`))
        
        // Add error steps
        if (step.onError) {
          nextSteps.push(...step.onError)
        } else {
          // Stop workflow on error if no error handling
          throw new Error(`Workflow failed at step: ${step.name}`)
        }
      }
    }

    currentSteps = [...new Set(nextSteps)]
  }

  // Generate workflow report
  await generateWorkflowReport(workflow, results)

  console.log(chalk.bold.green('\n✅ Workflow completed successfully!\n'))
}

/**
 * Execute a single workflow step
 */
async function executeStep(step: WorkflowStep): Promise<{ success: boolean; error?: string }> {
  const spinner = ora(`Running ${step.name}...`).start()

  try {
    switch (step.type) {
      case 'script':
        return await executeScript(step)
      case 'command':
        return await executeCommand(step)
      case 'api':
        return await executeAPI(step)
      case 'ai':
        return await executeAI(step)
      default:
        throw new Error(`Unknown step type: ${step.type}`)
    }
  } catch (error) {
    spinner.fail()
    return { success: false, error: error.message }
  }
}

/**
 * Execute script step
 */
async function executeScript(step: WorkflowStep): Promise<{ success: boolean; error?: string }> {
  try {
    execSync(step.action, {
      cwd: join(__dirname, '../../..'),
      stdio: 'inherit',
      timeout: step.timeout || 60000
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Execute command step
 */
async function executeCommand(step: WorkflowStep): Promise<{ success: boolean; error?: string }> {
  try {
    execSync(step.action, {
      stdio: 'inherit',
      timeout: step.timeout || 30000
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Execute API step
 */
async function executeAPI(step: WorkflowStep): Promise<{ success: boolean; error?: string }> {
  try {
    const [method, url] = step.action.split(' ')
    const response = await fetch(url, { method })
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`)
    }
    
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Execute AI step
 */
async function executeAI(step: WorkflowStep): Promise<{ success: boolean; error?: string }> {
  try {
    // Import AI clients
    const { ollama } = await import('../ai/services/ollama-client')
    
    // Check if Ollama is available
    if (await ollama.isRunning()) {
      const result = await ollama.generate(`Execute AI action: ${step.action}`)
      console.log(chalk.blue(`AI Response: ${result.slice(0, 100)}...`))
    } else {
      console.log(chalk.yellow('⚠️  AI service not available, skipping AI step'))
    }
    
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Evaluate step condition
 */
function evaluateCondition(condition: string): boolean {
  switch (condition) {
    case 'development':
      return process.env.NODE_ENV === 'development'
    case 'production':
      return process.env.NODE_ENV === 'production'
    case 'staging':
      return process.env.NODE_ENV === 'staging'
    default:
      return true
  }
}

/**
 * Generate workflow execution report
 */
async function generateWorkflowReport(
  workflow: Workflow, 
  results: Record<string, { success: boolean; error?: string }>
): Promise<void> {
  const reportPath = join(__dirname, '../../data/reports/workflow-report.json')
  
  const report = {
    workflow: workflow.name,
    executedAt: new Date().toISOString(),
    results,
    summary: {
      totalSteps: Object.keys(results).length,
      successful: Object.values(results).filter(r => r.success).length,
      failed: Object.values(results).filter(r => !r.success).length
    }
  }

  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(chalk.blue(`\n📊 Workflow report saved to: ${reportPath}`))
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled error:'), error)
  process.exit(1)
})

// Run
main().catch(error => {
  console.error(chalk.red('Workflow orchestration failed:'), error)
  process.exit(1)
})