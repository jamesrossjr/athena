#!/usr/bin/env node

/**
 * Development Environment Shutdown Script
 * 
 * Stops all running local services gracefully
 */

import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'
import ora from 'ora'

// Load configuration
const configPath = join(__dirname, '../../config/settings.json')
const config = JSON.parse(readFileSync(configPath, 'utf-8'))

interface ServiceToStop {
  name: string
  stop: () => void
  checkRunning: () => boolean
}

const services: ServiceToStop[] = [
  {
    name: 'Nuxt Dev Server',
    checkRunning: () => {
      try {
        execSync(`lsof -i:${config.development.port}`, { stdio: 'ignore' })
        return true
      } catch {
        return false
      }
    },
    stop: () => {
      try {
        // Kill process on development port
        execSync(`lsof -ti:${config.development.port} | xargs kill -9`, { stdio: 'ignore' })
      } catch {
        // Already stopped
      }
    }
  },
  {
    name: 'Prisma Studio',
    checkRunning: () => {
      try {
        execSync(`lsof -i:${config.development.services.prismaStudio.port}`, { stdio: 'ignore' })
        return true
      } catch {
        return false
      }
    },
    stop: () => {
      try {
        execSync(`lsof -ti:${config.development.services.prismaStudio.port} | xargs kill -9`, { stdio: 'ignore' })
      } catch {
        // Already stopped
      }
    }
  },
  {
    name: 'Ollama',
    checkRunning: () => {
      try {
        execSync('curl -s http://localhost:11434/api/tags', { stdio: 'ignore' })
        return true
      } catch {
        return false
      }
    },
    stop: () => {
      try {
        // On macOS/Linux
        execSync('pkill ollama', { stdio: 'ignore' })
      } catch {
        // On Windows or if already stopped
        try {
          execSync('taskkill /F /IM ollama.exe', { stdio: 'ignore' })
        } catch {
          // Already stopped
        }
      }
    }
  }
]

async function main() {
  console.log(chalk.bold.cyan('\n🛑 Stopping Athena Development Environment\n'))

  let stoppedCount = 0
  let notRunningCount = 0

  for (const service of services) {
    const spinner = ora(`Checking ${service.name}...`).start()
    
    if (service.checkRunning()) {
      spinner.text = `Stopping ${service.name}...`
      try {
        service.stop()
        await new Promise(resolve => setTimeout(resolve, 500))
        
        if (!service.checkRunning()) {
          spinner.succeed(`${service.name} stopped`)
          stoppedCount++
        } else {
          spinner.warn(`${service.name} may still be running`)
        }
      } catch (error) {
        spinner.fail(`Failed to stop ${service.name}`)
        console.error(chalk.red(`  Error: ${error.message}`))
      }
    } else {
      spinner.info(`${service.name} is not running`)
      notRunningCount++
    }
  }

  // Clean up temporary files
  console.log(chalk.bold('\nCleaning up...'))
  const cleanSpinner = ora('Removing temporary files...').start()
  
  try {
    execSync('pnpm run clean', {
      cwd: join(__dirname, '../../'),
      stdio: 'ignore'
    })
    cleanSpinner.succeed('Temporary files cleaned')
  } catch {
    cleanSpinner.warn('Some temporary files could not be removed')
  }

  // Summary
  console.log(chalk.bold.green('\n✅ Environment shutdown complete\n'))
  console.log(chalk.gray(`Services stopped: ${stoppedCount}`))
  console.log(chalk.gray(`Services not running: ${notRunningCount}`))
  
  if (stoppedCount > 0) {
    console.log(chalk.yellow('\nTo restart the environment, run:'))
    console.log(chalk.blue('  pnpm run dev:up'))
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled error:'), error)
  process.exit(1)
})

// Run
main().catch(error => {
  console.error(chalk.red('Failed to stop environment:'), error)
  process.exit(1)
})