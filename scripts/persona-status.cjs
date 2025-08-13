#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const claudeDir = path.join(__dirname, '..', '.claude')
const currentPersonaFile = path.join(claudeDir, 'current-persona.md')

if (!fs.existsSync(currentPersonaFile)) {
  console.log('🤖 Default AI persona is active')
  console.log('')
  console.log('Available personas:')
  console.log('  👨‍💻 dev  - Developer persona (npm run dev-persona)')
  console.log('  🎨 des  - Designer persona (npm run des-persona)')
  console.log('')
  console.log('Switch with: npm run dev-persona or npm run des-persona')
  process.exit(0)
}

try {
  const personaContent = fs.readFileSync(currentPersonaFile, 'utf8')
  
  // Extract persona info from the content
  let personaType = 'Unknown'
  let personaEmoji = '🤖'
  
  if (personaContent.includes('Developer Persona')) {
    personaType = 'Developer'
    personaEmoji = '👨‍💻'
  } else if (personaContent.includes('Designer Persona')) {
    personaType = 'Designer'
    personaEmoji = '🎨'
  }
  
  console.log(`${personaEmoji} Active persona: ${personaType}`)
  console.log('')
  
  if (personaType === 'Developer') {
    console.log('🔧 Current focus: Technical implementation, code quality, performance')
    console.log('💡 Claude will provide: Code examples, architecture advice, best practices')
  } else if (personaType === 'Designer') {
    console.log('🎨 Current focus: User experience, visual design, accessibility')
    console.log('💡 Claude will provide: Design recommendations, UX insights, accessibility guidance')
  }
  
  console.log('')
  console.log('Switch personas:')
  console.log('  npm run dev-persona  - Switch to Developer')
  console.log('  npm run des-persona  - Switch to Designer')
  console.log('  npm run persona-reset - Reset to default')
  
} catch (error) {
  console.error('❌ Error reading persona status:', error.message)
  process.exit(1)
}