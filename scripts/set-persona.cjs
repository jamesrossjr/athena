#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { createBanner } = require('./persona-banner.cjs')

// Get command line arguments
const persona = process.argv[2]

if (!persona) {
  console.log('🎭 Usage: node set-persona.js [dev|des|reset]')
  console.log('')
  console.log('Available personas:')
  console.log('  dev  - 👨‍💻 Developer persona (technical focus)')
  console.log('  des  - 🎨 Designer persona (UX/UI focus)')
  console.log('  reset - 🤖 Default AI persona')
  process.exit(1)
}

const personaMap = {
  dev: 'developer',
  des: 'designer',
  reset: null
}

if (!personaMap.hasOwnProperty(persona)) {
  console.error('❌ Invalid persona. Use: dev, des, or reset')
  process.exit(1)
}

const personaName = personaMap[persona]
const claudeDir = path.join(__dirname, '..', '.claude')
const currentPersonaFile = path.join(claudeDir, 'current-persona.md')
const personasDir = path.join(claudeDir, 'personas')

// Ensure .claude directory exists
if (!fs.existsSync(claudeDir)) {
  fs.mkdirSync(claudeDir, { recursive: true })
}

try {
  if (persona === 'reset') {
    // Remove current persona
    if (fs.existsSync(currentPersonaFile)) {
      fs.unlinkSync(currentPersonaFile)
    }
    createBanner('Reset to Default AI', '🤖', 'General AI assistance for all tasks')
    console.log('💡 Activate a specialized persona:')
    console.log('   npm run dev-persona  - 👨‍💻 Developer focus')
    console.log('   npm run des-persona  - 🎨 Designer focus')
  } else {
    // Read the persona file
    const personaFile = path.join(personasDir, `${personaName}.md`)
    
    if (!fs.existsSync(personaFile)) {
      console.error(`❌ Persona file not found: ${personaFile}`)
      process.exit(1)
    }
    
    const personaContent = fs.readFileSync(personaFile, 'utf8')
    
    // Write to current persona
    fs.writeFileSync(currentPersonaFile, personaContent)
    
    const personaConfig = {
      dev: {
        emoji: '👨‍💻',
        name: 'Developer Persona Active',
        description: 'Technical implementation & code architecture'
      },
      des: {
        emoji: '🎨',
        name: 'Designer Persona Active',
        description: 'User experience & visual design excellence'
      }
    }
    
    const config = personaConfig[persona]
    createBanner(config.name, config.emoji, config.description)
    console.log(`✨ Claude will now respond with ${config.name.toLowerCase()} expertise`)
    console.log(`🎯 Use "npm run persona-status" to see detailed focus areas`)
  }
  
} catch (error) {
  console.error('❌ Error setting persona:', error.message)
  process.exit(1)
}