# 🧠 Claude Configuration for Athena Project

## Project Overview
Athena is a sophisticated digital paper application built with Vue 3, Nuxt 3, and TypeScript. It features an advanced global AI system that serves as the lifeblood of the application, providing contextual assistance across both chat and page interactions.

## Key Technologies
- **Frontend**: Vue 3 Composition API, Nuxt 3, TypeScript, Tailwind CSS
- **Backend**: Nuxt server API routes, Node.js
- **AI System**: Global AI with contextual awareness and executable actions
- **Architecture**: Component-based with composables, stores, and unified AI service

## Project Structure
```
athena/
├── components/          # Vue components (PaperInterface, GlobalAiChat, etc.)
├── composables/         # Vue composables (useGlobalAi, useAiService)
├── server/api/         # Server API routes
├── stores/             # Pinia stores
├── .claude/            # Claude persona configurations
└── scripts/            # CLI utilities including persona management
```

## 🎭 Persona System

This project includes a sophisticated persona system that allows you to work with specialized AI assistants:

### Available Personas

**👨‍💻 Developer Persona** (`npm run dev-persona`)
- Focus: Technical implementation, code architecture, performance
- Expertise: Vue 3, Nuxt 3, TypeScript, API design, debugging
- Communication: Direct, technical, with code examples

**🎨 Designer Persona** (`npm run des-persona`)
- Focus: User experience, visual design, accessibility
- Expertise: UX/UI design, design systems, interaction patterns
- Communication: User-centered, visual, with design rationale

### Quick Commands
```bash
npm run dev-persona    # Activate Developer persona
npm run des-persona    # Activate Designer persona
npm run persona-status # Check current persona
npm run persona-reset  # Reset to default
```

## Current Context
The application features a revolutionary global AI system where:
- AI can execute actions on the page through chat commands
- AI maintains context across chat and document interactions
- AI can create, edit, and structure content directly
- AI provides specialized assistance based on active persona

## Working with Personas

When a persona is active, Claude will:
- Adopt the expertise and communication style of that role
- Provide specialized guidance relevant to the persona
- Use appropriate terminology and focus areas
- Consider the specific needs and workflows of that discipline

The persona system enhances your workflow by providing:
- **Contextual expertise** tailored to your current task
- **Specialized vocabulary** appropriate to the domain
- **Focused recommendations** relevant to the role
- **Workflow integration** with discipline-specific tools and practices

## Important Files

### Core AI System
- `composables/useGlobalAi.ts` - Global AI state management
- `composables/useAiService.ts` - Unified AI service
- `components/GlobalAiChat.vue` - AI chat interface
- `server/api/ai/chat.post.ts` - AI API endpoint

### Persona System
- `.claude/personas/developer.md` - Developer persona configuration
- `.claude/personas/designer.md` - Designer persona configuration
- `scripts/set-persona.js` - Persona switching utility
- `PERSONAS.md` - Detailed persona documentation

Use the persona system to get specialized, role-appropriate assistance for your work on the Athena application!