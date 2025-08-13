#!/usr/bin/env node

/**
 * Metrics Collection Script
 * 
 * Collects and stores development metrics
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'
import ora from 'ora'

// Load configuration
const configPath = join(__dirname, '../../config/settings.json')
const config = JSON.parse(readFileSync(configPath, 'utf-8'))

interface Metric {
  timestamp: string
  type: string
  name: string
  value: number | string
  tags?: Record<string, string>
}

interface ProjectMetrics {
  codebase: {
    totalLines: number
    totalFiles: number
    languages: Record<string, number>
    complexity: number
  }
  git: {
    totalCommits: number
    contributors: number
    branchCount: number
    lastCommitDate: string
  }
  dependencies: {
    production: number
    development: number
    outdated: number
    vulnerabilities: number
  }
  performance: {
    buildTime: number
    testTime: number
    bundleSize: number
  }
  ai: {
    blocksGenerated: number
    commandsGenerated: number
    totalGenerations: number
    averageGenerationTime: number
  }
}

async function main() {
  console.log(chalk.bold.cyan('\n📊 Metrics Collection\n'))

  const spinner = ora('Collecting metrics...').start()
  
  try {
    const metrics = await collectAllMetrics()
    await storeMetrics(metrics)
    await generateReport(metrics)
    
    spinner.succeed('Metrics collection completed')
    console.log(chalk.bold.green('\n✅ Metrics collected and stored successfully!\n'))
    
  } catch (error) {
    spinner.fail('Metrics collection failed')
    console.error(chalk.red(`Error: ${error.message}`))
    process.exit(1)
  }
}

/**
 * Collect all project metrics
 */
async function collectAllMetrics(): Promise<ProjectMetrics> {
  const projectRoot = join(__dirname, '../../../')
  
  return {
    codebase: await collectCodebaseMetrics(projectRoot),
    git: await collectGitMetrics(projectRoot),
    dependencies: await collectDependencyMetrics(projectRoot),
    performance: await collectPerformanceMetrics(projectRoot),
    ai: await collectAIMetrics()
  }
}

/**
 * Collect codebase metrics
 */
async function collectCodebaseMetrics(projectRoot: string) {
  const spinner = ora('Analyzing codebase...').start()
  
  try {
    // Count lines and files
    const cloc = execSync('cloc . --json', { 
      cwd: projectRoot, 
      encoding: 'utf-8' 
    })
    const clocData = JSON.parse(cloc)
    
    // Calculate complexity (simplified)
    const complexity = calculateComplexity(projectRoot)
    
    spinner.succeed('Codebase analyzed')
    
    return {
      totalLines: clocData.SUM?.code || 0,
      totalFiles: clocData.SUM?.nFiles || 0,
      languages: Object.fromEntries(
        Object.entries(clocData)
          .filter(([key]) => key !== 'SUM' && key !== 'header')
          .map(([lang, data]: [string, any]) => [lang, data.code])
      ),
      complexity
    }
  } catch (error) {
    spinner.warn('CLOC not available, using fallback')
    
    // Fallback method
    const files = execSync('find . -type f -name "*.ts" -o -name "*.vue" -o -name "*.js" | wc -l', {
      cwd: projectRoot,
      encoding: 'utf-8'
    }).trim()
    
    return {
      totalLines: 0,
      totalFiles: parseInt(files),
      languages: {},
      complexity: 0
    }
  }
}

/**
 * Collect Git metrics
 */
async function collectGitMetrics(projectRoot: string) {
  try {
    const totalCommits = parseInt(
      execSync('git rev-list --count HEAD', { 
        cwd: projectRoot, 
        encoding: 'utf-8' 
      }).trim()
    )
    
    const contributors = execSync('git shortlog -sn | wc -l', {
      cwd: projectRoot,
      encoding: 'utf-8'
    }).trim()
    
    const branchCount = execSync('git branch -r | wc -l', {
      cwd: projectRoot,
      encoding: 'utf-8'
    }).trim()
    
    const lastCommitDate = execSync('git log -1 --format=%ci', {
      cwd: projectRoot,
      encoding: 'utf-8'
    }).trim()
    
    return {
      totalCommits,
      contributors: parseInt(contributors),
      branchCount: parseInt(branchCount),
      lastCommitDate
    }
  } catch (error) {
    return {
      totalCommits: 0,
      contributors: 0,
      branchCount: 0,
      lastCommitDate: new Date().toISOString()
    }
  }
}

/**
 * Collect dependency metrics
 */
async function collectDependencyMetrics(projectRoot: string) {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(projectRoot, 'package.json'), 'utf-8')
    )
    
    const production = Object.keys(packageJson.dependencies || {}).length
    const development = Object.keys(packageJson.devDependencies || {}).length
    
    // Check for outdated packages
    let outdated = 0
    try {
      const outdatedResult = execSync('npm outdated --json', {
        cwd: projectRoot,
        encoding: 'utf-8'
      })
      const outdatedData = JSON.parse(outdatedResult)
      outdated = Object.keys(outdatedData).length
    } catch {
      // npm outdated exits with code 1 when packages are outdated
    }
    
    // Check for vulnerabilities
    let vulnerabilities = 0
    try {
      const auditResult = execSync('pnpm audit --json', {
        cwd: projectRoot,
        encoding: 'utf-8'
      })
      const auditData = JSON.parse(auditResult)
      vulnerabilities = auditData.metadata?.vulnerabilities?.total || 0
    } catch {
      // Audit may fail
    }
    
    return {
      production,
      development,
      outdated,
      vulnerabilities
    }
  } catch (error) {
    return {
      production: 0,
      development: 0,
      outdated: 0,
      vulnerabilities: 0
    }
  }
}

/**
 * Collect performance metrics
 */
async function collectPerformanceMetrics(projectRoot: string) {
  const metrics = {
    buildTime: 0,
    testTime: 0,
    bundleSize: 0
  }
  
  try {
    // Measure build time
    const buildStart = Date.now()
    execSync('pnpm run build', { cwd: projectRoot, stdio: 'ignore' })
    metrics.buildTime = Date.now() - buildStart
    
    // Check bundle size
    try {
      const bundleSizeCmd = 'du -sh .output 2>/dev/null || du -sh dist 2>/dev/null || echo "0"'
      const bundleSize = execSync(bundleSizeCmd, {
        cwd: projectRoot,
        encoding: 'utf-8'
      }).trim()
      
      // Parse size (rough estimation)
      const sizeMatch = bundleSize.match(/(\d+(?:\.\d+)?)[KMG]?/)
      if (sizeMatch) {
        metrics.bundleSize = parseFloat(sizeMatch[1])
      }
    } catch {
      // Bundle size check failed
    }
    
    // Measure test time (if tests exist)
    try {
      const testStart = Date.now()
      execSync('npm test', { cwd: projectRoot, stdio: 'ignore' })
      metrics.testTime = Date.now() - testStart
    } catch {
      // Tests may not exist or may fail
    }
    
  } catch (error) {
    console.warn(chalk.yellow('Some performance metrics could not be collected'))
  }
  
  return metrics
}

/**
 * Collect AI-related metrics
 */
async function collectAIMetrics() {
  // Read AI generation logs or database
  return {
    blocksGenerated: 0,
    commandsGenerated: 0,
    totalGenerations: 0,
    averageGenerationTime: 0
  }
}

/**
 * Calculate code complexity
 */
function calculateComplexity(projectRoot: string): number {
  try {
    // Simple complexity calculation based on file count and structure
    const componentCount = execSync(
      'find components -name "*.vue" 2>/dev/null | wc -l || echo "0"',
      { cwd: projectRoot, encoding: 'utf-8' }
    ).trim()
    
    const pageCount = execSync(
      'find pages -name "*.vue" 2>/dev/null | wc -l || echo "0"',
      { cwd: projectRoot, encoding: 'utf-8' }
    ).trim()
    
    return parseInt(componentCount) + parseInt(pageCount) * 2
  } catch {
    return 0
  }
}

/**
 * Store metrics in database
 */
async function storeMetrics(metrics: ProjectMetrics): Promise<void> {
  const timestamp = new Date().toISOString()
  const metricsFile = join(__dirname, '../../data/metrics.json')
  
  // Create individual metric entries
  const metricEntries: Metric[] = [
    {
      timestamp,
      type: 'codebase',
      name: 'total_lines',
      value: metrics.codebase.totalLines
    },
    {
      timestamp,
      type: 'codebase',
      name: 'total_files',
      value: metrics.codebase.totalFiles
    },
    {
      timestamp,
      type: 'git',
      name: 'total_commits',
      value: metrics.git.totalCommits
    },
    {
      timestamp,
      type: 'dependencies',
      name: 'production_count',
      value: metrics.dependencies.production
    },
    {
      timestamp,
      type: 'dependencies',
      name: 'dev_count',
      value: metrics.dependencies.development
    },
    {
      timestamp,
      type: 'security',
      name: 'vulnerabilities',
      value: metrics.dependencies.vulnerabilities
    },
    {
      timestamp,
      type: 'performance',
      name: 'build_time_ms',
      value: metrics.performance.buildTime
    },
    {
      timestamp,
      type: 'performance',
      name: 'bundle_size_mb',
      value: metrics.performance.bundleSize
    }
  ]
  
  // Load existing metrics
  let existingMetrics: Metric[] = []
  try {
    existingMetrics = JSON.parse(readFileSync(metricsFile, 'utf-8'))
  } catch {
    // File doesn't exist yet
  }
  
  // Append new metrics
  const allMetrics = [...existingMetrics, ...metricEntries]
  
  // Keep only last 1000 entries
  const recentMetrics = allMetrics.slice(-1000)
  
  writeFileSync(metricsFile, JSON.stringify(recentMetrics, null, 2))
}

/**
 * Generate metrics report
 */
async function generateReport(metrics: ProjectMetrics): Promise<void> {
  const reportPath = join(__dirname, '../../data/reports/metrics-report.md')
  
  const report = `# Project Metrics Report

Generated: ${new Date().toLocaleDateString()}

## Codebase
- **Total Lines**: ${metrics.codebase.totalLines.toLocaleString()}
- **Total Files**: ${metrics.codebase.totalFiles.toLocaleString()}
- **Complexity Score**: ${metrics.codebase.complexity}

## Git Repository  
- **Total Commits**: ${metrics.git.totalCommits.toLocaleString()}
- **Contributors**: ${metrics.git.contributors}
- **Branches**: ${metrics.git.branchCount}
- **Last Commit**: ${metrics.git.lastCommitDate}

## Dependencies
- **Production**: ${metrics.dependencies.production}
- **Development**: ${metrics.dependencies.development}
- **Outdated**: ${metrics.dependencies.outdated}
- **Security Issues**: ${metrics.dependencies.vulnerabilities}

## Performance
- **Build Time**: ${(metrics.performance.buildTime / 1000).toFixed(2)}s
- **Test Time**: ${(metrics.performance.testTime / 1000).toFixed(2)}s
- **Bundle Size**: ${metrics.performance.bundleSize}MB

## AI Usage
- **Blocks Generated**: ${metrics.ai.blocksGenerated}
- **Commands Generated**: ${metrics.ai.commandsGenerated}
- **Total Generations**: ${metrics.ai.totalGenerations}

---
*Report generated by Athena Admin System*
`

  writeFileSync(reportPath, report)
  console.log(chalk.blue(`📊 Report generated: ${reportPath}`))
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('Unhandled error:'), error)
  process.exit(1)
})

// Run
main().catch(error => {
  console.error(chalk.red('Metrics collection failed:'), error)
  process.exit(1)
})