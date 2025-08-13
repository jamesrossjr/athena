#!/usr/bin/env node

/**
 * AI-Powered Block Generator
 * 
 * Creates TipTap block components using AI
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import chalk from 'chalk'
import ora from 'ora'
import inquirer from 'inquirer'
import Handlebars from 'handlebars'

// Load configuration
const configPath = join(__dirname, '../../config/settings.json')
const config = JSON.parse(readFileSync(configPath, 'utf-8'))

interface BlockSpec {
  name: string
  description: string
  icon: string
  category: string
  hasHeader: boolean
  hasFooter: boolean
  editable: boolean
  persistsData: boolean
  customLogic?: string
}

async function main() {
  console.log(chalk.bold.cyan('\n🧱 AI Block Generator\n'))
  
  // Get block specification from user
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Block name (PascalCase):',
      validate: (input) => {
        if (!input) return 'Name is required'
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
          return 'Name must be PascalCase (e.g., CodeBlock, ImageGallery)'
        }
        return true
      }
    },
    {
      type: 'input',
      name: 'description',
      message: 'Block description:',
      validate: (input) => input ? true : 'Description is required'
    },
    {
      type: 'input',
      name: 'icon',
      message: 'Block icon (emoji):',
      default: '📦'
    },
    {
      type: 'list',
      name: 'category',
      message: 'Block category:',
      choices: [
        'Text & Content',
        'Media & Assets', 
        'Data & Analytics',
        'Interactive',
        'Layout',
        'Integration',
        'Custom'
      ]
    },
    {
      type: 'confirm',
      name: 'hasHeader',
      message: 'Include block header?',
      default: true
    },
    {
      type: 'confirm',
      name: 'hasFooter',
      message: 'Include block footer?',
      default: false
    },
    {
      type: 'confirm',
      name: 'editable',
      message: 'Allow inline editing?',
      default: true
    },
    {
      type: 'confirm',
      name: 'persistsData',
      message: 'Persist data to database?',
      default: true
    },
    {
      type: 'input',
      name: 'customLogic',
      message: 'Custom implementation details (optional):',
      default: ''
    }
  ])

  const blockSpec: BlockSpec = answers as BlockSpec

  // Generate with AI
  console.log(chalk.bold('\nGenerating block with AI...'))\n  const aiSpinner = ora('Requesting AI generation...').start()\n  \n  try {\n    const blockContent = await generateBlockWithAI(blockSpec)\n    aiSpinner.succeed('AI generation complete')\n    \n    // Write files\n    await writeBlockFiles(blockSpec, blockContent)\n    \n    console.log(chalk.bold.green('\\n✅ Block generated successfully!\\n'))\n    \n    // Show next steps\n    console.log(chalk.bold('Next steps:'))\n    console.log(chalk.blue(`  1. Review the generated component: components/blocks/${blockSpec.name}Block.vue`))\n    console.log(chalk.blue(`  2. Register in TipTap: extensions/${blockSpec.name.toLowerCase()}.ts`))\n    console.log(chalk.blue(`  3. Add to command palette if needed`))\n    console.log(chalk.blue(`  4. Test the block in your editor\\n`))\n    \n  } catch (error) {\n    aiSpinner.fail('AI generation failed')\n    console.error(chalk.red(`Error: ${error.message}`))\n    process.exit(1)\n  }\n}\n\n/**\n * Generate block content using AI\n */\nasync function generateBlockWithAI(spec: BlockSpec): Promise<any> {\n  // Load AI prompt template\n  const promptPath = join(__dirname, '../../ai/prompts/block/create.md')\n  const promptTemplate = readFileSync(promptPath, 'utf-8')\n  \n  // Compile prompt with block specification\n  const prompt = Handlebars.compile(promptTemplate)({\n    name: spec.name,\n    description: spec.description,\n    icon: spec.icon,\n    category: spec.category,\n    hasHeader: spec.hasHeader,\n    hasFooter: spec.hasFooter,\n    editable: spec.editable,\n    persistsData: spec.persistsData,\n    customLogic: spec.customLogic || 'Standard block implementation'\n  })\n  \n  // Call AI service\n  const aiService = config.ai.services.find(s => s.enabled)\n  if (!aiService) {\n    throw new Error('No AI service configured. Please run: pnpm run ai:configure')\n  }\n  \n  let response\n  \n  if (aiService.type === 'ollama') {\n    response = await callOllama(prompt, aiService)\n  } else if (aiService.type === 'openai') {\n    response = await callOpenAI(prompt, aiService)\n  } else {\n    throw new Error(`Unsupported AI service: ${aiService.type}`)\n  }\n  \n  // Parse AI response\n  try {\n    return JSON.parse(response)\n  } catch (error) {\n    // If not JSON, try to extract code blocks\n    const codeBlocks = extractCodeBlocks(response)\n    return {\n      component: codeBlocks.vue || '',\n      extension: codeBlocks.typescript || '',\n      types: codeBlocks.types || ''\n    }\n  }\n}\n\n/**\n * Call Ollama API\n */\nasync function callOllama(prompt: string, service: any): Promise<string> {\n  const response = await fetch(`${service.endpoint}/api/generate`, {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({\n      model: service.model,\n      prompt,\n      stream: false\n    })\n  })\n  \n  if (!response.ok) {\n    throw new Error(`Ollama API error: ${response.statusText}`)\n  }\n  \n  const data = await response.json()\n  return data.response\n}\n\n/**\n * Call OpenAI API\n */\nasync function callOpenAI(prompt: string, service: any): Promise<string> {\n  const response = await fetch('https://api.openai.com/v1/chat/completions', {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json',\n      'Authorization': `Bearer ${service.apiKey}`\n    },\n    body: JSON.stringify({\n      model: service.model,\n      messages: [{ role: 'user', content: prompt }],\n      temperature: 0.2\n    })\n  })\n  \n  if (!response.ok) {\n    throw new Error(`OpenAI API error: ${response.statusText}`)\n  }\n  \n  const data = await response.json()\n  return data.choices[0].message.content\n}\n\n/**\n * Extract code blocks from AI response\n */\nfunction extractCodeBlocks(response: string): Record<string, string> {\n  const blocks: Record<string, string> = {}\n  \n  // Extract Vue component\n  const vueMatch = response.match(/```vue\\s*\\n([\\s\\S]*?)\\n```/)\n  if (vueMatch) blocks.vue = vueMatch[1]\n  \n  // Extract TypeScript\n  const tsMatch = response.match(/```typescript\\s*\\n([\\s\\S]*?)\\n```/)\n  if (tsMatch) blocks.typescript = tsMatch[1]\n  \n  // Extract types\n  const typesMatch = response.match(/```types\\s*\\n([\\s\\S]*?)\\n```/)\n  if (typesMatch) blocks.types = typesMatch[1]\n  \n  return blocks\n}\n\n/**\n * Write generated files\n */\nasync function writeBlockFiles(spec: BlockSpec, content: any): Promise<void> {\n  const projectRoot = join(__dirname, '../../../')\n  \n  // Load templates\n  const blockTemplate = readFileSync(\n    join(__dirname, '../../templates/BLOCK.template.vue'),\n    'utf-8'\n  )\n  \n  // Prepare template data\n  const templateData = {\n    BLOCK_NAME: spec.name,\n    BLOCK_NAME_KEBAB: spec.name.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1),\n    BLOCK_ICON: spec.icon,\n    BLOCK_LABEL: spec.name.replace(/([A-Z])/g, ' $1').trim(),\n    BLOCK_VIEW_CONTENT: content.component?.template || '<!-- Add view content -->',\n    BLOCK_EDIT_CONTENT: content.component?.editTemplate || '<!-- Add edit content -->',\n    BLOCK_FOOTER_CONTENT: spec.hasFooter ? '<!-- Footer content -->' : '',\n    SHOW_HEADER_LOGIC: spec.hasHeader.toString(),\n    SHOW_FOOTER_LOGIC: spec.hasFooter.toString(),\n    DEFAULT_DATA: content.component?.defaultData || '// Add default data',\n    ADDITIONAL_METHODS: content.component?.methods || '// Add additional methods',\n    ADDITIONAL_STYLES: content.component?.styles || '/* Add additional styles */'\n  }\n  \n  // Compile template\n  const compiledBlock = Handlebars.compile(blockTemplate)(templateData)\n  \n  // Write Vue component\n  const componentPath = join(projectRoot, `components/blocks/${spec.name}Block.vue`)\n  writeFileSync(componentPath, compiledBlock)\n  \n  // Write TipTap extension\n  if (content.extension) {\n    const extensionPath = join(projectRoot, `extensions/${spec.name.toLowerCase()}.ts`)\n    writeFileSync(extensionPath, content.extension)\n  }\n  \n  // Write TypeScript types\n  if (content.types) {\n    const typesPath = join(projectRoot, `types/blocks/${spec.name.toLowerCase()}.ts`)\n    writeFileSync(typesPath, content.types)\n  }\n  \n  console.log(chalk.green(`\\n📁 Files created:`))\n  console.log(chalk.blue(`   ${componentPath}`))\n  if (content.extension) {\n    console.log(chalk.blue(`   ${join(projectRoot, `extensions/${spec.name.toLowerCase()}.ts`)}`))\n  }\n  if (content.types) {\n    console.log(chalk.blue(`   ${join(projectRoot, `types/blocks/${spec.name.toLowerCase()}.ts`)}`))\n  }\n}\n\n// Error handling\nprocess.on('unhandledRejection', (error) => {\n  console.error(chalk.red('Unhandled error:'), error)\n  process.exit(1)\n})\n\n// Run\nmain().catch(error => {\n  console.error(chalk.red('Block generation failed:'), error)\n  process.exit(1)\n})