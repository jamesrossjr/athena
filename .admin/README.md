# 🛠️ Athena Admin System

## Overview

The `.admin/` directory is the operational command center for the Athena project. It contains all automation scripts, AI integrations, and administrative tools needed to efficiently develop, maintain, and scale the application.

## Core Philosophy

- **🤖 AI-First**: Leverage AI for code generation, testing, and documentation
- **📊 Data-Driven**: Track metrics and make informed decisions
- **🔄 Automated**: Minimize manual tasks through intelligent scripts
- **🎯 Centralized**: All admin operations in one organized location

## Directory Structure

```
.admin/
├── ai/                 # AI integration and prompts
├── config/            # Centralized configuration
├── data/              # Persistent data and metrics
├── lib/               # Shared utilities
├── scripts/           # Executable automation scripts
├── templates/         # Code generation templates
└── workflows/         # CI/CD pipeline definitions
```

## Quick Start

### 1. Initial Setup
```bash
# Install admin dependencies
cd .admin
pnpm install

# Set up environment variables
cp config/.env.admin.example config/.env.admin

# Initialize the metrics database
pnpm run db:init
```

### 2. Common Commands

```bash
# Start development environment
pnpm run dev:up

# Generate a new block component
pnpm run generate:block

# Run database migrations
pnpm run db:migrate

# Analyze project metrics
pnpm run metrics:analyze

# Generate documentation
pnpm run docs:generate
```

### 3. AI Integration

The system integrates with local (Ollama) and cloud AI providers:

```bash
# Configure AI provider
pnpm run ai:configure

# Test AI connection
pnpm run ai:test

# Generate code with AI
pnpm run ai:generate -- --type=block --name=MyBlock
```

## Key Features

### 🧠 AI-Powered Development
- Smart code generation from natural language
- Automated test creation
- Intelligent refactoring suggestions
- Documentation generation

### 📈 Metrics & Analytics
- Performance tracking (Lighthouse scores)
- AI usage statistics
- Cost analysis and optimization
- Development velocity metrics

### 🔧 Automation Scripts
- **Development**: Environment setup, hot reload, debugging
- **Database**: Migrations, seeding, backups
- **Testing**: Unit tests, integration tests, E2E tests
- **Documentation**: Auto-generated docs from code
- **Deployment**: CI/CD pipelines, release management

### 🏗️ Code Generation
- TipTap blocks from templates
- Command Palette commands
- API endpoints with validation
- Test suites with coverage

## Configuration

All configuration is centralized in `config/`:

- `paths.json`: Project directory mappings
- `prompts.json`: AI prompt configurations
- `settings.json`: General settings
- `.env.admin`: Environment variables (not committed)

## Scripts Organization

Scripts are organized by domain:

- **billing/**: Cost tracking and optimization
- **db/**: Database management
- **dev/**: Development environment
- **docs/**: Documentation generation
- **generate/**: Code generation
- **test/**: Testing automation
- **workflows/**: Complex multi-step operations

## AI Prompts Library

The `ai/prompts/` directory contains master prompts for:

- **block/**: TipTap block generation
- **command/**: Command Palette commands
- **graph/**: Knowledge graph analysis
- **test/**: Test generation

## Templates

Reusable templates in `templates/`:

- `BLOCK.template.vue`: Standard TipTap block
- `COMMAND.template.ts`: Command Palette command
- `PAGE.template.vue`: Page component
- `API.template.ts`: API endpoint

## Workflows

CI/CD pipelines in `workflows/`:

- `deploy.yml`: Production deployment
- `nightly-update.yml`: Scheduled maintenance
- `pr-checks.yml`: Pull request validation

## Best Practices

1. **Always use the admin scripts** instead of manual operations
2. **Track metrics** for data-driven decisions
3. **Leverage AI** for repetitive tasks
4. **Document changes** in AUTOMATION_GUIDE.md
5. **Test scripts locally** before committing

## Troubleshooting

### Common Issues

**AI not responding:**
```bash
pnpm run ai:diagnose
```

**Database migration failed:**
```bash
pnpm run db:rollback
pnpm run db:migrate
```

**Environment not starting:**
```bash
pnpm run dev:clean
pnpm run dev:up
```

## Contributing

When adding new admin functionality:

1. Create the script in the appropriate `scripts/` subdirectory
2. Add configuration to `config/`
3. Document in `AUTOMATION_GUIDE.md`
4. Add tests if applicable
5. Update this README

## Support

For issues or questions about the admin system:
- Check `AUTOMATION_GUIDE.md` for detailed script documentation
- Review logs in `data/logs/`
- Run diagnostics: `pnpm run diagnose`

---

*The .admin system is the backbone of efficient Athena development. Use it wisely!* 🚀