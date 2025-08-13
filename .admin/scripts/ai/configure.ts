#!/usr/bin/env node

/**
 * AI Service Configuration Script
 * 
 * Configures AI services (Ollama, OpenAI, etc.) for code generation
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'

// Load configuration
const configPath = join(__dirname, '../../config/settings.json')

interface AIService {
  type: 'ollama' | 'openai' | 'anthropic'
  enabled: boolean
  endpoint?: string
  apiKey?: string
  model: string
  maxTokens?: number
  temperature?: number
}

interface AIConfig {
  services: AIService[]
  defaultService: string
  generation: {
    timeout: number
    retries: number
    fallback: boolean
  }
}

async function main() {
  console.log(chalk.bold.cyan('\n🤖 AI Service Configuration\n'))
  
  // Load existing config
  const config = existsSync(configPath) 
    ? JSON.parse(readFileSync(configPath, 'utf-8'))
    : { ai: { services: [], defaultService: '', generation: {} } }
  
  // Show current configuration
  if (config.ai?.services?.length > 0) {
    console.log(chalk.bold('Current AI services:'))
    config.ai.services.forEach((service: AIService, index: number) => {
      const status = service.enabled ? chalk.green('✓ Enabled') : chalk.gray('✗ Disabled')
      console.log(`  ${index + 1}. ${service.type} (${service.model}) - ${status}`)
    })
    console.log()
  }
  
  // Main configuration menu
  const action = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: 'Add new AI service', value: 'add' },
        { name: 'Configure existing service', value: 'configure' },
        { name: 'Test AI connection', value: 'test' },
        { name: 'Set default service', value: 'default' },
        { name: 'Remove service', value: 'remove' },
        { name: 'View current configuration', value: 'view' }
      ]
    }
  ])
  
  switch (action.action) {
    case 'add':
      await addService(config)
      break
    case 'configure':
      await configureService(config)
      break
    case 'test':
      await testServices(config)
      break
    case 'default':
      await setDefaultService(config)
      break
    case 'remove':
      await removeService(config)
      break
    case 'view':
      viewConfiguration(config)
      break
  }
}

/**
 * Add new AI service
 */
async function addService(config: any): Promise<void> {
  console.log(chalk.bold('\nAdding new AI service...\n'))
  
  const serviceConfig = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'AI service type:',
      choices: [
        { name: 'Ollama (Local)', value: 'ollama' },
        { name: 'OpenAI (API)', value: 'openai' },
        { name: 'Anthropic Claude (API)', value: 'anthropic' }
      ]
    }
  ])
  
  let additionalConfig = {}
  
  if (serviceConfig.type === 'ollama') {
    additionalConfig = await configureOllama()
  } else if (serviceConfig.type === 'openai') {
    additionalConfig = await configureOpenAI()
  } else if (serviceConfig.type === 'anthropic') {
    additionalConfig = await configureAnthropic()
  }
  
  const newService: AIService = {
    ...serviceConfig,
    ...additionalConfig,
    enabled: true
  }
  
  // Initialize AI config if not exists
  if (!config.ai) {
    config.ai = { services: [], defaultService: '', generation: {} }
  }
  
  // Add service
  config.ai.services.push(newService)
  
  // Set as default if it's the first service
  if (config.ai.services.length === 1) {
    config.ai.defaultService = serviceConfig.type
  }
  
  // Save configuration
  writeFileSync(configPath, JSON.stringify(config, null, 2))\n  \n  console.log(chalk.green(`\\n✅ ${serviceConfig.type} service added successfully!`))\n  \n  // Test the new service\n  const shouldTest = await inquirer.prompt([{\n    type: 'confirm',\n    name: 'test',\n    message: 'Test the new service now?',\n    default: true\n  }])\n  \n  if (shouldTest.test) {\n    await testService(newService)\n  }\n}\n\n/**\n * Configure Ollama service\n */\nasync function configureOllama(): Promise<Partial<AIService>> {\n  const config = await inquirer.prompt([\n    {\n      type: 'input',\n      name: 'endpoint',\n      message: 'Ollama endpoint:',\n      default: 'http://localhost:11434'\n    },\n    {\n      type: 'input',\n      name: 'model',\n      message: 'Model name:',\n      default: 'codellama:7b-instruct'\n    },\n    {\n      type: 'number',\n      name: 'temperature',\n      message: 'Temperature (0.0-2.0):',\n      default: 0.2\n    }\n  ])\n  \n  return config\n}\n\n/**\n * Configure OpenAI service\n */\nasync function configureOpenAI(): Promise<Partial<AIService>> {\n  const config = await inquirer.prompt([\n    {\n      type: 'password',\n      name: 'apiKey',\n      message: 'OpenAI API Key:',\n      validate: (input) => input ? true : 'API key is required'\n    },\n    {\n      type: 'list',\n      name: 'model',\n      message: 'Model:',\n      choices: [\n        'gpt-4-turbo-preview',\n        'gpt-4',\n        'gpt-3.5-turbo',\n        'gpt-3.5-turbo-16k'\n      ],\n      default: 'gpt-3.5-turbo'\n    },\n    {\n      type: 'number',\n      name: 'maxTokens',\n      message: 'Max tokens:',\n      default: 4000\n    },\n    {\n      type: 'number',\n      name: 'temperature',\n      message: 'Temperature (0.0-2.0):',\n      default: 0.2\n    }\n  ])\n  \n  return config\n}\n\n/**\n * Configure Anthropic service\n */\nasync function configureAnthropic(): Promise<Partial<AIService>> {\n  const config = await inquirer.prompt([\n    {\n      type: 'password',\n      name: 'apiKey',\n      message: 'Anthropic API Key:',\n      validate: (input) => input ? true : 'API key is required'\n    },\n    {\n      type: 'list',\n      name: 'model',\n      message: 'Model:',\n      choices: [\n        'claude-3-opus-20240229',\n        'claude-3-sonnet-20240229',\n        'claude-3-haiku-20240307'\n      ],\n      default: 'claude-3-sonnet-20240229'\n    },\n    {\n      type: 'number',\n      name: 'maxTokens',\n      message: 'Max tokens:',\n      default: 4000\n    }\n  ])\n  \n  return config\n}\n\n/**\n * Test AI services\n */\nasync function testServices(config: any): Promise<void> {\n  if (!config.ai?.services?.length) {\n    console.log(chalk.yellow('No AI services configured. Add a service first.'))\n    return\n  }\n  \n  console.log(chalk.bold('\\nTesting AI services...\\n'))\n  \n  for (const service of config.ai.services) {\n    if (service.enabled) {\n      await testService(service)\n    } else {\n      console.log(chalk.gray(`Skipping ${service.type} (disabled)`))\n    }\n  }\n}\n\n/**\n * Test individual service\n */\nasync function testService(service: AIService): Promise<void> {\n  const spinner = ora(`Testing ${service.type} (${service.model})...`).start()\n  \n  try {\n    const testPrompt = 'Respond with \"Hello from AI!\" if you can understand this message.'\n    let response: string\n    \n    if (service.type === 'ollama') {\n      response = await testOllama(service, testPrompt)\n    } else if (service.type === 'openai') {\n      response = await testOpenAI(service, testPrompt)\n    } else if (service.type === 'anthropic') {\n      response = await testAnthropic(service, testPrompt)\n    } else {\n      throw new Error(`Unsupported service type: ${service.type}`)\n    }\n    \n    if (response.toLowerCase().includes('hello')) {\n      spinner.succeed(`${service.type} is working correctly`)\n    } else {\n      spinner.warn(`${service.type} responded but output is unexpected`)\n      console.log(chalk.gray(`  Response: ${response.slice(0, 100)}...`))\n    }\n    \n  } catch (error) {\n    spinner.fail(`${service.type} test failed`)\n    console.error(chalk.red(`  Error: ${error.message}`))\n  }\n}\n\n/**\n * Test Ollama connection\n */\nasync function testOllama(service: AIService, prompt: string): Promise<string> {\n  const response = await fetch(`${service.endpoint}/api/generate`, {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({\n      model: service.model,\n      prompt,\n      stream: false\n    })\n  })\n  \n  if (!response.ok) {\n    throw new Error(`HTTP ${response.status}: ${response.statusText}`)\n  }\n  \n  const data = await response.json()\n  return data.response\n}\n\n/**\n * Test OpenAI connection\n */\nasync function testOpenAI(service: AIService, prompt: string): Promise<string> {\n  const response = await fetch('https://api.openai.com/v1/chat/completions', {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json',\n      'Authorization': `Bearer ${service.apiKey}`\n    },\n    body: JSON.stringify({\n      model: service.model,\n      messages: [{ role: 'user', content: prompt }],\n      max_tokens: 100,\n      temperature: 0.1\n    })\n  })\n  \n  if (!response.ok) {\n    const error = await response.json()\n    throw new Error(`HTTP ${response.status}: ${error.error?.message || response.statusText}`)\n  }\n  \n  const data = await response.json()\n  return data.choices[0].message.content\n}\n\n/**\n * Test Anthropic connection\n */\nasync function testAnthropic(service: AIService, prompt: string): Promise<string> {\n  const response = await fetch('https://api.anthropic.com/v1/messages', {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json',\n      'X-API-Key': service.apiKey!,\n      'anthropic-version': '2023-06-01'\n    },\n    body: JSON.stringify({\n      model: service.model,\n      max_tokens: 100,\n      messages: [{ role: 'user', content: prompt }]\n    })\n  })\n  \n  if (!response.ok) {\n    const error = await response.json()\n    throw new Error(`HTTP ${response.status}: ${error.error?.message || response.statusText}`)\n  }\n  \n  const data = await response.json()\n  return data.content[0].text\n}\n\n/**\n * Set default service\n */\nasync function setDefaultService(config: any): Promise<void> {\n  if (!config.ai?.services?.length) {\n    console.log(chalk.yellow('No AI services configured. Add a service first.'))\n    return\n  }\n  \n  const choices = config.ai.services.map((service: AIService, index: number) => ({\n    name: `${service.type} (${service.model})`,\n    value: service.type\n  }))\n  \n  const answer = await inquirer.prompt([{\n    type: 'list',\n    name: 'service',\n    message: 'Select default AI service:',\n    choices\n  }])\n  \n  config.ai.defaultService = answer.service\n  writeFileSync(configPath, JSON.stringify(config, null, 2))\n  \n  console.log(chalk.green(`\\n✅ Default service set to: ${answer.service}`))\n}\n\n/**\n * Remove service\n */\nasync function removeService(config: any): Promise<void> {\n  if (!config.ai?.services?.length) {\n    console.log(chalk.yellow('No AI services configured.'))\n    return\n  }\n  \n  const choices = config.ai.services.map((service: AIService, index: number) => ({\n    name: `${service.type} (${service.model})`,\n    value: index\n  }))\n  \n  const answer = await inquirer.prompt([{\n    type: 'list',\n    name: 'serviceIndex',\n    message: 'Select service to remove:',\n    choices\n  }])\n  \n  const removedService = config.ai.services[answer.serviceIndex]\n  config.ai.services.splice(answer.serviceIndex, 1)\n  \n  // Update default if needed\n  if (config.ai.defaultService === removedService.type) {\n    config.ai.defaultService = config.ai.services[0]?.type || ''\n  }\n  \n  writeFileSync(configPath, JSON.stringify(config, null, 2))\n  console.log(chalk.green(`\\n✅ Removed ${removedService.type} service`))\n}\n\n/**\n * View current configuration\n */\nfunction viewConfiguration(config: any): void {\n  console.log(chalk.bold('\\n📋 Current AI Configuration\\n'))\n  \n  if (!config.ai?.services?.length) {\n    console.log(chalk.yellow('No AI services configured.'))\n    return\n  }\n  \n  console.log(chalk.bold('Services:'))\n  config.ai.services.forEach((service: AIService, index: number) => {\n    const isDefault = service.type === config.ai.defaultService\n    const defaultFlag = isDefault ? chalk.cyan(' (default)') : ''\n    const status = service.enabled ? chalk.green('✓') : chalk.red('✗')\n    \n    console.log(`  ${status} ${service.type}${defaultFlag}`)\n    console.log(`    Model: ${service.model}`)\n    if (service.endpoint) console.log(`    Endpoint: ${service.endpoint}`)\n    if (service.temperature) console.log(`    Temperature: ${service.temperature}`)\n    if (service.maxTokens) console.log(`    Max Tokens: ${service.maxTokens}`)\n    console.log()\n  })\n}\n\n// Error handling\nprocess.on('unhandledRejection', (error) => {\n  console.error(chalk.red('Unhandled error:'), error)\n  process.exit(1)\n})\n\n// Run\nmain().catch(error => {\n  console.error(chalk.red('AI configuration failed:'), error)\n  process.exit(1)\n})