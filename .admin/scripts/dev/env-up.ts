#!/usr/bin/env node

/**
 * Development Environment Startup Script
 * 
 * Starts all required local services for Athena development
 */

import { execSync, spawn } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'
import ora from 'ora'

// Load configuration
const configPath = join(__dirname, '../../config/settings.json')
const config = JSON.parse(readFileSync(configPath, 'utf-8'))

// Service definitions
interface Service {
  name: string
  check: () => boolean
  start: () => void
  url?: string
  required: boolean
}

const services: Service[] = [
  {
    name: 'Docker',
    check: () => {
      try {
        execSync('docker --version', { stdio: 'ignore' })
        return true
      } catch {
        return false
      }
    },
    start: () => {
      console.log(chalk.yellow('Please start Docker Desktop manually'))
    },
    required: true
  },
  {
    name: 'Ollama',
    check: () => {
      try {
        execSync('ollama --version', { stdio: 'ignore' })
        return true
      } catch {
        return false
      }
    },
    start: () => {
      if (config.development.services.ollama.autoStart) {
        console.log(chalk.blue('Starting Ollama...'))
        spawn('ollama', ['serve'], { 
          detached: true,
          stdio: 'ignore'
        }).unref()
      }
    },
    url: 'http://localhost:11434',
    required: false
  },
  {
    name: 'Prisma Studio',
    check: () => {
      // Check if port is available
      try {
        execSync(`lsof -i:${config.development.services.prismaStudio.port}`, { stdio: 'ignore' })
        return true
      } catch {
        return false
      }
    },
    start: () => {
      if (config.development.services.prismaStudio.autoStart) {
        console.log(chalk.blue('Starting Prisma Studio...'))
        spawn('npx', ['prisma', 'studio', '--port', config.development.services.prismaStudio.port], {
          cwd: join(__dirname, '../../../'),
          detached: true,
          stdio: 'ignore'
        }).unref()
      }
    },
    url: `http://localhost:${config.development.services.prismaStudio.port}`,
    required: false
  }
]

// Main execution
async function main() {
  console.log(chalk.bold.cyan('\n🚀 Starting Athena Development Environment\n'))

  // Check prerequisites
  console.log(chalk.bold('Checking prerequisites...'))
  const missingRequired = services
    .filter(s => s.required && !s.check())
    .map(s => s.name)

  if (missingRequired.length > 0) {
    console.error(chalk.red(`\n❌ Missing required services: ${missingRequired.join(', ')}`))
    console.log(chalk.yellow('\nPlease install the missing services and try again.'))
    process.exit(1)
  }

  // Start services
  console.log(chalk.bold('\nStarting services...'))
  
  for (const service of services) {
    const spinner = ora(`Checking ${service.name}...`).start()
    
    if (service.check()) {
      spinner.succeed(`${service.name} is running`)
    } else {
      spinner.warn(`${service.name} is not running`)
      
      if (!service.required) {
        const startSpinner = ora(`Starting ${service.name}...`).start()
        try {
          service.start()
          await new Promise(resolve => setTimeout(resolve, 2000)) // Wait for service to start
          
          if (service.check()) {
            startSpinner.succeed(`${service.name} started`)
          } else {
            startSpinner.warn(`${service.name} may take a moment to start`)
          }
        } catch (error) {
          startSpinner.fail(`Failed to start ${service.name}`)
        }
      }
    }
  }

  // Database setup
  console.log(chalk.bold('\nSetting up database...'))
  const dbSpinner = ora('Running database migrations...').start()
  try {
    execSync('npx prisma migrate dev', { 
      cwd: join(__dirname, '../../../'),
      stdio: 'ignore'
    })
    dbSpinner.succeed('Database migrations complete')
  } catch (error) {
    dbSpinner.fail('Database migration failed')
    console.error(chalk.red('Please run: pnpm run db:migrate'))
  }

  // Start main development server
  console.log(chalk.bold('\nStarting development server...'))
  const devSpinner = ora('Starting Nuxt development server...').start()
  
  const devProcess = spawn('npm', ['run', 'dev'], {
    cwd: join(__dirname, '../../../'),
    stdio: 'inherit'
  })

  devSpinner.succeed('Development server starting...')

  // Display URLs
  console.log(chalk.bold.green('\n✅ Environment ready!\n'))
  console.log(chalk.bold('Access your services:'))
  console.log(chalk.blue(`  • Application: http://localhost:${config.development.port}`))
  
  services.forEach(service => {
    if (service.url && service.check()) {
      console.log(chalk.blue(`  • ${service.name}: ${service.url}`))
    }
  })

  console.log(chalk.gray('\nPress Ctrl+C to stop all services\n'))

  // Handle shutdown
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\nShutting down services...'))
    devProcess.kill()
    process.exit(0)
  })
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled error:'), error)
  process.exit(1)
})

// Run
main().catch(error => {
  console.error(chalk.red('Failed to start environment:'), error)
  process.exit(1)
})