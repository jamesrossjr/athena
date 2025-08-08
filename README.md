# Athena - Knowledge Management & Chat Interface

A modern Vue 3 + Nuxt 3 application for knowledge management, note-taking, chat interface, and project organization.

## Features

- 🗂️ **Vault Browser**: Organize and browse your knowledge base
- 💬 **Chat Interface**: AI-powered conversations 
- 📝 **Note Editor**: Rich text editing capabilities
- 📋 **Project Management**: Track projects and tasks
- 📊 **Briefings**: Summary and reporting features
- 🌙 **Dark Mode**: Built-in dark/light theme support

## Quick Start

### Prerequisites

- Node.js ≥18.0.0
- pnpm ≥8.0.0 (recommended) or npm ≥8.0.0

### Installation

1. **Clone and install dependencies:**
   ```bash
   pnpm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server:**
   ```bash
   pnpm run dev
   ```
   Visit http://localhost:3000 (or alternative port shown in terminal)

## Production Deployment

### Build for Production
```bash
pnpm run build
pnpm run start
```

### Docker Deployment
```bash
# Build Docker image
pnpm run docker:build

# Run with Docker
pnpm run docker:run

# Or use docker-compose
docker-compose up -d
```

### PM2 Process Manager
```bash
pnpm run build
pnpm run start:pm2
```

## Development Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run preview` - Preview production build
- `pnpm run lint` - Lint and fix code
- `pnpm run typecheck` - Type checking
- `pnpm run test` - Run tests

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `NUXT_PUBLIC_APP_NAME` - Application name
- `NUXT_PUBLIC_VERSION` - Application version  
- `NUXT_UI_PRO_LICENSE` - Your Nuxt UI Pro license key
- `NUXT_GOOGLE_GEMINI_API_KEY` - Google Gemini API key for AI features

## Architecture

- **Frontend**: Vue 3 + Nuxt 3 + TailwindCSS
- **UI Library**: Nuxt UI + Headless UI
- **State Management**: Pinia
- **Icons**: Heroicons + Lucide Vue
- **Deployment**: Docker, PM2, Node.js

## License

MIT
