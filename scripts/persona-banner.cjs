#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const claudeDir = path.join(__dirname, '..', '.claude')
const currentPersonaFile = path.join(claudeDir, 'current-persona.md')

function createBanner(persona, emoji, description) {
  const width = 60
  const line = '═'.repeat(width)
  const space = ' '.repeat(width - 2)
  
  console.log(`\n╔${line}╗`)
  console.log(`║${space}║`)
  console.log(`║  ${emoji} ${persona.padEnd(width - 10)} ║`)
  console.log(`║  ${description.padEnd(width - 4)} ║`)
  console.log(`║${space}║`)
  console.log(`╚${line}╝\n`)
}

function showPersonaStatus() {
  if (!fs.existsSync(currentPersonaFile)) {
    createBanner('Default AI Assistant', '🤖', 'General AI assistance for all tasks')
    console.log('💡 Activate a specialized persona:')
    console.log('   npm run dev-persona  - 👨‍💻 Developer focus')
    console.log('   npm run des-persona  - 🎨 Designer focus\n')
    return
  }

  try {
    const personaContent = fs.readFileSync(currentPersonaFile, 'utf8')
    
    if (personaContent.includes('Developer Persona')) {
      createBanner('Developer Persona Active', '👨‍💻', 'Technical implementation & code architecture')
      console.log('🔧 Focus Areas: Code quality, performance, security, scalability')
      console.log('💻 Expertise: Vue 3, Nuxt 3, TypeScript, Node.js, API design')
      console.log('🎯 Communication: Technical, direct, with implementation details\n')
    } else if (personaContent.includes('Designer Persona')) {
      createBanner('Designer Persona Active', '🎨', 'User experience & visual design excellence')
      console.log('🎨 Focus Areas: User experience, visual hierarchy, accessibility')
      console.log('👥 Expertise: UX/UI design, design systems, interaction patterns')
      console.log('🎯 Communication: User-centered, visual, with design rationale\n')
    }
    
    console.log('🔄 Switch personas:')
    console.log('   npm run dev-persona  - Switch to Developer')
    console.log('   npm run des-persona  - Switch to Designer')
    console.log('   npm run persona-reset - Reset to default\n')
    
  } catch (error) {
    console.error('❌ Error reading persona:', error.message)
  }
}

// If called directly, show status
if (require.main === module) {
  showPersonaStatus()
}

module.exports = { showPersonaStatus, createBanner }