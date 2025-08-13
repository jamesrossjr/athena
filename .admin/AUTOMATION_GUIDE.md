# 📚 Athena Automation Guide

## Overview

This guide documents what each automation script does, when to use it, and how it integrates with the overall development workflow.

## Table of Contents

1. [Billing Scripts](#billing-scripts)
2. [Database Scripts](#database-scripts)
3. [Development Scripts](#development-scripts)
4. [Documentation Scripts](#documentation-scripts)
5. [Generation Scripts](#generation-scripts)
6. [Test Scripts](#test-scripts)
7. [Workflow Scripts](#workflow-scripts)

---

## Billing Scripts

### `calculate-costs.ts`
**Purpose**: Analyzes cloud service usage and estimates monthly costs

**What it does**:
- Queries Supabase for database usage metrics
- Checks Vercel for hosting and function invocations
- Calculates AI API usage costs (Ollama is free, cloud providers vary)
- Generates a cost report with optimization recommendations

**When to use**:
- Weekly cost reviews
- Before scaling decisions
- When optimizing infrastructure

**Example**:
```bash
pnpm run billing:calculate -- --period=monthly --format=json
```

---

## Database Scripts

### `migrate.ts`
**Purpose**: Manages database schema migrations

**What it does**:
- Reads migration files from `prisma/migrations/`
- Applies pending migrations in order
- Updates migration history
- Validates schema integrity

**When to use**:
- After pulling new code with schema changes
- Before deploying to production
- When adding new data models

**Example**:
```bash
pnpm run db:migrate -- --env=development
pnpm run db:migrate -- --env=production --dry-run
```

### `seed.ts`
**Purpose**: Populates database with test data

**What it does**:
- Creates sample users, workspaces, and pages
- Generates realistic block content
- Establishes sample links and relationships
- Configures different session modes for testing

**When to use**:
- Setting up new development environment
- Testing data-heavy features
- Demo preparation

**Example**:
```bash
pnpm run db:seed -- --users=10 --workspaces=5
pnpm run db:seed -- --scenario=demo
```

---

## Development Scripts

### `env-up.ts`
**Purpose**: Starts all required local services

**What it does**:
- Starts Docker containers (Supabase, Redis)
- Launches Ollama for local AI
- Initializes Prisma Studio
- Opens development URLs in browser
- Runs health checks

**Dependencies**:
- Docker Desktop
- Ollama installed locally
- Node.js 18+

**Example**:
```bash
pnpm run dev:up
pnpm run dev:up -- --services=supabase,ollama
```

### `env-down.ts`
**Purpose**: Gracefully stops all local services

**What it does**:
- Stops Docker containers
- Terminates Ollama processes
- Cleans up temporary files
- Saves service logs

**Example**:
```bash
pnpm run dev:down
pnpm run dev:down -- --clean  # Also removes volumes
```

---

## Documentation Scripts

### `generate.ts`
**Purpose**: Auto-generates project documentation

**What it does**:
- Scans source code for JSDoc comments
- Analyzes component props and events
- Extracts API endpoint documentation
- Generates markdown files
- Creates interactive API explorer
- Builds static documentation site

**Output**:
- `docs/` - Generated documentation
- `docs/api/` - API reference
- `docs/components/` - Component documentation

**Example**:
```bash
pnpm run docs:generate
pnpm run docs:generate -- --watch
pnpm run docs:generate -- --format=html --serve
```

---

## Generation Scripts

### `block.ts`
**Purpose**: Generates new TipTap block components

**What it does**:
- Prompts for block type and properties
- Uses AI to generate Vue component code
- Creates corresponding TypeScript types
- Adds block to TipTap configuration
- Generates unit tests

**AI Integration**:
- Uses prompts from `ai/prompts/block/create.md`
- Validates against `ai/schemas/block-component.json`

**Example**:
```bash
pnpm run generate:block
pnpm run generate:block -- --name=CodeBlock --type=node
pnpm run generate:block -- --ai-model=gpt-4 --interactive
```

### `command.ts`
**Purpose**: Adds new commands to Command Palette

**What it does**:
- Generates command handler function
- Updates command registry
- Creates keyboard shortcut mapping
- Adds to command categories
- Generates tests

**Example**:
```bash
pnpm run generate:command -- --name="Export to PDF" --category=export
pnpm run generate:command -- --from-description="Create a command that backs up the workspace"
```

### `page.ts`
**Purpose**: Creates new page type components

**What it does**:
- Generates Vue page component
- Creates route configuration
- Sets up page-specific composables
- Adds to polymorphic engine
- Creates example content

**Example**:
```bash
pnpm run generate:page -- --type=TIMELINE --icon=📅
pnpm run generate:page -- --template=kanban --name=ProjectBoard
```

---

## Test Scripts

### `unit.ts`
**Purpose**: Runs and manages unit tests

**What it does**:
- Executes Vitest test suites
- Generates coverage reports
- Watches for file changes
- Runs type checking

**Example**:
```bash
pnpm run test:unit
pnpm run test:unit -- --coverage
pnpm run test:unit -- --watch
```

### `generate-test.ts`
**Purpose**: AI-powered test generation

**What it does**:
- Analyzes component/function code
- Generates comprehensive test cases
- Creates mock data and stubs
- Ensures edge case coverage

**AI Integration**:
- Uses `ai/prompts/test/create-unit.md`
- Follows testing best practices

**Example**:
```bash
pnpm run test:generate -- --file=components/Block.vue
pnpm run test:generate -- --dir=composables --type=integration
```

---

## Workflow Scripts

### `orchestrate.ts`
**Purpose**: Runs complex multi-step workflows

**What it does**:
- Executes predefined workflow sequences
- Handles dependencies between steps
- Provides rollback on failure
- Generates workflow reports

**Available Workflows**:
- `new-feature`: Creates branch, generates code, runs tests
- `release`: Runs tests, builds, generates changelog, deploys
- `maintenance`: Updates deps, migrates DB, regenerates docs

**Example**:
```bash
pnpm run workflow:run -- --name=new-feature --feature=auth
pnpm run workflow:run -- --name=release --version=patch
pnpm run workflow:list  # Shows all available workflows
```

---

## AI Integration

### How AI is Used

1. **Code Generation**:
   - Reads prompts from `ai/prompts/`
   - Validates output against JSON schemas
   - Applies project-specific patterns

2. **Test Creation**:
   - Analyzes code coverage gaps
   - Generates edge cases
   - Creates meaningful assertions

3. **Documentation**:
   - Extracts code intent
   - Generates usage examples
   - Creates API documentation

### AI Configuration

Configure in `config/settings.json`:
```json
{
  "ai": {
    "provider": "ollama",
    "model": "codellama",
    "temperature": 0.7
  }
}
```

---

## Metrics & Monitoring

### What's Tracked

- **Performance**: Lighthouse scores, build times
- **Quality**: Test coverage, type coverage, lint issues
- **AI Usage**: Tokens consumed, generation success rate
- **Development**: Commit frequency, PR metrics

### Accessing Metrics

```bash
pnpm run metrics:dashboard  # Opens metrics UI
pnpm run metrics:export -- --format=csv
```

---

## Best Practices

1. **Always run scripts from `.admin/` directory**
2. **Check script output for warnings**
3. **Use `--dry-run` for destructive operations**
4. **Review generated code before committing**
5. **Keep AI prompts up to date**

---

## Troubleshooting

### Script Fails to Run
1. Check Node version: `node --version` (requires 18+)
2. Install dependencies: `npm install`
3. Check permissions: Scripts need execute permission

### AI Generation Issues
1. Verify AI service: `pnpm run ai:test`
2. Check prompt file exists
3. Validate schema file
4. Review AI logs: `data/logs/ai.log`

### Database Issues
1. Check connection: `pnpm run db:test`
2. Verify migrations: `pnpm run db:status`
3. Reset if needed: `pnpm run db:reset` (⚠️ destructive)

---

## Adding New Scripts

1. Create script in appropriate `scripts/` subdirectory
2. Add npm script to `.admin/package.json`
3. Document here with:
   - Purpose
   - What it does
   - When to use
   - Example usage
4. Add tests if complex logic
5. Update README.md if significant feature

---

*This guide is your reference for all automation capabilities. Keep it updated!* 📖