#!/usr/bin/env node

/**
 * Database Migration Script
 * 
 * Handles Prisma migrations with enhanced features
 */

import { execSync } from 'child_process'
import { readFileSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'

// Load configuration
const configPath = join(__dirname, '../../config/settings.json')
const config = JSON.parse(readFileSync(configPath, 'utf-8'))

interface MigrationOptions {
  mode: 'dev' | 'deploy' | 'reset'
  name?: string
  createOnly?: boolean
  skipSeed?: boolean
}

async function main() {
  console.log(chalk.bold.cyan('\n🗄️  Database Migration Manager\n'))
  
  // Check if we're in a valid project
  const projectRoot = join(__dirname, '../../../')
  const schemaPath = join(projectRoot, 'prisma/schema.prisma')
  
  if (!existsSync(schemaPath)) {
    console.error(chalk.red('❌ No Prisma schema found. Are you in a valid Athena project?'))
    process.exit(1)
  }
  
  // Get migration options
  const options = await getMigrationOptions()
  
  try {
    switch (options.mode) {
      case 'dev':
        await runDevMigration(options)
        break
      case 'deploy':
        await runDeployMigration(options)
        break
      case 'reset':
        await runReset(options)
        break
    }
    
    console.log(chalk.bold.green('\n✅ Migration completed successfully!\n'))
    
  } catch (error) {
    console.error(chalk.red(`❌ Migration failed: ${error.message}`))
    process.exit(1)
  }
}

/**
 * Get migration options from user
 */
async function getMigrationOptions(): Promise<MigrationOptions> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'Migration mode:',
      choices: [
        { name: 'Development (create and apply migration)', value: 'dev' },
        { name: 'Production Deploy (apply pending migrations)', value: 'deploy' },
        { name: 'Reset Database (WARNING: destroys all data)', value: 'reset' }
      ]
    }
  ])
  
  let additionalOptions = {}
  
  if (answers.mode === 'dev') {
    const devOptions = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Migration name (optional):',
        default: ''
      },
      {
        type: 'confirm',
        name: 'createOnly',
        message: 'Create migration file only (don\'t apply)?',
        default: false
      }
    ])
    additionalOptions = devOptions
  } else if (answers.mode === 'reset') {
    const resetConfirm = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: chalk.red('⚠️  This will DELETE ALL DATA. Are you sure?'),
        default: false
      }
    ])
    
    if (!resetConfirm.confirmed) {
      console.log(chalk.yellow('Migration cancelled.'))
      process.exit(0)
    }
  }
  
  const seedOption = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'skipSeed',
      message: 'Skip database seeding?',
      default: false,
      when: (answers) => answers.mode !== 'reset' // Always seed after reset
    }
  ])
  
  return { ...answers, ...additionalOptions, ...seedOption }
}

/**
 * Run development migration
 */
async function runDevMigration(options: MigrationOptions): Promise<void> {\n  const projectRoot = join(__dirname, '../../../')\n  \n  console.log(chalk.bold('Running development migration...'))\n  \n  // Check for schema changes\n  const statusSpinner = ora('Checking schema status...').start()\n  try {\n    execSync('npx prisma migrate status', {\n      cwd: projectRoot,\n      stdio: 'pipe'\n    })\n    statusSpinner.succeed('Schema is up to date')\n  } catch (error) {\n    statusSpinner.info('Schema changes detected')\n  }\n  \n  // Generate migration\n  const migrationSpinner = ora('Creating migration...').start()\n  try {\n    const migrationCmd = options.createOnly \n      ? 'npx prisma migrate dev --create-only'\n      : 'npx prisma migrate dev'\n    \n    const nameFlag = options.name ? `--name \"${options.name}\"` : ''\n    const fullCmd = `${migrationCmd} ${nameFlag}`.trim()\n    \n    execSync(fullCmd, {\n      cwd: projectRoot,\n      stdio: 'inherit'\n    })\n    \n    migrationSpinner.succeed(\n      options.createOnly \n        ? 'Migration file created (not applied)'\n        : 'Migration created and applied'\n    )\n  } catch (error) {\n    migrationSpinner.fail('Migration failed')\n    throw error\n  }\n  \n  if (!options.createOnly && !options.skipSeed) {\n    await runSeed()\n  }\n}\n\n/**\n * Run production deployment\n */\nasync function runDeployMigration(options: MigrationOptions): Promise<void> {\n  const projectRoot = join(__dirname, '../../../')\n  \n  console.log(chalk.bold('Running production deployment...'))\n  \n  // Check pending migrations\n  const statusSpinner = ora('Checking migration status...').start()\n  try {\n    const output = execSync('npx prisma migrate status', {\n      cwd: projectRoot,\n      encoding: 'utf-8',\n      stdio: 'pipe'\n    })\n    \n    if (output.includes('Following migration(s) have not yet been applied')) {\n      statusSpinner.warn('Pending migrations found')\n    } else {\n      statusSpinner.succeed('Database is up to date')\n      return\n    }\n  } catch (error) {\n    statusSpinner.fail('Migration status check failed')\n    throw error\n  }\n  \n  // Apply migrations\n  const deploySpinner = ora('Applying migrations...').start()\n  try {\n    execSync('npx prisma migrate deploy', {\n      cwd: projectRoot,\n      stdio: 'inherit'\n    })\n    deploySpinner.succeed('Migrations applied successfully')\n  } catch (error) {\n    deploySpinner.fail('Migration deployment failed')\n    throw error\n  }\n  \n  if (!options.skipSeed) {\n    await runSeed()\n  }\n}\n\n/**\n * Reset database\n */\nasync function runReset(options: MigrationOptions): Promise<void> {\n  const projectRoot = join(__dirname, '../../../')\n  \n  console.log(chalk.bold.red('Resetting database...'))\n  \n  const resetSpinner = ora('Resetting database...').start()\n  try {\n    execSync('npx prisma migrate reset --force', {\n      cwd: projectRoot,\n      stdio: 'inherit'\n    })\n    resetSpinner.succeed('Database reset complete')\n  } catch (error) {\n    resetSpinner.fail('Database reset failed')\n    throw error\n  }\n  \n  // Always seed after reset\n  await runSeed()\n}\n\n/**\n * Run database seeding\n */\nasync function runSeed(): Promise<void> {\n  const projectRoot = join(__dirname, '../../../')\n  const seedPath = join(projectRoot, 'prisma/seed.ts')\n  \n  if (!existsSync(seedPath)) {\n    console.log(chalk.yellow('⚠️  No seed file found, skipping seeding'))\n    return\n  }\n  \n  const seedSpinner = ora('Seeding database...').start()\n  try {\n    execSync('npx prisma db seed', {\n      cwd: projectRoot,\n      stdio: 'inherit'\n    })\n    seedSpinner.succeed('Database seeded successfully')\n  } catch (error) {\n    seedSpinner.warn('Seeding failed (this may be expected)')\n    console.log(chalk.gray('  You can run seeding separately with: pnpm run db:seed'))\n  }\n}\n\n/**\n * Create backup before destructive operations\n */\nasync function createBackup(): Promise<string> {\n  const backupSpinner = ora('Creating database backup...').start()\n  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')\n  const backupName = `backup-${timestamp}.db`\n  \n  try {\n    // This is a simplified backup - in production you'd want more robust backup strategy\n    const projectRoot = join(__dirname, '../../../')\n    const dbPath = join(projectRoot, 'prisma/dev.db')\n    const backupPath = join(__dirname, '../../data/backups', backupName)\n    \n    if (existsSync(dbPath)) {\n      execSync(`cp \"${dbPath}\" \"${backupPath}\"`, { stdio: 'ignore' })\n      backupSpinner.succeed(`Backup created: ${backupName}`)\n    } else {\n      backupSpinner.info('No database found to backup')\n    }\n    \n    return backupName\n  } catch (error) {\n    backupSpinner.warn('Backup creation failed')\n    return ''\n  }\n}\n\n// Error handling\nprocess.on('unhandledRejection', (error) => {\n  console.error(chalk.red('Unhandled error:'), error)\n  process.exit(1)\n})\n\n// Run\nmain().catch(error => {\n  console.error(chalk.red('Migration script failed:'), error)\n  process.exit(1)\n})