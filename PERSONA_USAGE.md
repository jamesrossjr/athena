# 🎭 Persona System Usage Guide

## Quick Start

### Activate Personas
```bash
npm run dev-persona    # 👨‍💻 Developer persona
npm run des-persona    # 🎨 Designer persona
```

### Check Status
```bash
npm run persona-status # See current active persona
```

### Reset
```bash
npm run persona-reset  # Return to default AI
```

## What Happens When You Activate a Persona

### 👨‍💻 Developer Persona (`npm run dev-persona`)
**Claude becomes a Senior Full-Stack Developer with expertise in:**
- Vue 3, Nuxt 3, TypeScript, Node.js
- Code architecture and best practices
- Performance optimization and security
- Debugging and troubleshooting
- Technical implementation details

**Communication Style:**
- Direct and technical
- Provides code examples
- Focuses on implementation details
- Considers security and performance
- Uses developer terminology

**Example Questions for Developer Persona:**
- "How should I structure this component?"
- "What's the best way to handle this API call?"
- "How can I optimize this code for performance?"
- "What security considerations should I have?"

### 🎨 Designer Persona (`npm run des-persona`)
**Claude becomes a Senior UX/UI Designer with expertise in:**
- User experience and user interface design
- Design systems and component libraries
- Accessibility and inclusive design
- Visual hierarchy and interaction patterns
- User research and usability principles

**Communication Style:**
- User-centered and empathetic
- Focuses on user experience
- Provides design rationale
- Considers accessibility and inclusion
- Uses design terminology

**Example Questions for Designer Persona:**
- "How can I improve the user experience here?"
- "What's the best interaction pattern for this feature?"
- "How can I make this more accessible?"
- "What visual hierarchy should I use?"

## How It Works

1. **Persona Files**: Detailed configurations are stored in `.claude/personas/`
2. **Current Persona**: Active persona is stored in `.claude/current-persona.md`
3. **Claude Integration**: Claude reads the persona file to adapt its responses
4. **Visual Indicators**: CLI shows beautiful banners indicating active persona

## Tips for Using Personas

### For Development Work
```bash
npm run dev-persona
# Ask about code structure, performance, security, best practices
```

### For Design Work
```bash
npm run des-persona
# Ask about user experience, visual design, accessibility, usability
```

### For General Work
```bash
npm run persona-reset
# Use default AI for general tasks, project management, etc.
```

## Benefits

### 🎯 **Specialized Expertise**
- Get responses tailored to your current role
- Access deep domain knowledge
- Receive appropriate terminology and focus

### 🔄 **Context Switching**
- Quickly switch between technical and design perspectives
- Maintain workflow continuity
- Get role-appropriate suggestions

### 💡 **Enhanced Productivity**
- Receive guidance specific to your current task
- Access specialized knowledge bases
- Get workflow-optimized responses

## Example Workflow

```bash
# Starting UI development
npm run des-persona
# Ask: "How should I design the navigation for this app?"
# Get UX-focused, user-centered design advice

# Switching to implementation
npm run dev-persona  
# Ask: "How do I implement this navigation component?"
# Get technical implementation details and code examples

# General project questions
npm run persona-reset
# Ask about project management, documentation, etc.
```

The persona system transforms Claude into a specialized assistant that matches your current workflow needs! 🚀