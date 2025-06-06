# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Copilot for Obsidian Plugin Architecture

This plugin implements a **modular, manager-based architecture** built on Obsidian's plugin system with React UI and LangChain AI integration.

### Core Architecture Pattern

- **Singleton Managers**: VectorStoreManager, ChatModelManager, etc. manage subsystems
- **Event-driven**: Uses EventTarget API for decoupled communication
- **React UI**: Custom component library built on Radix UI + Tailwind CSS
- **State Management**: Jotai atoms for reactive settings

### Key Subsystems

1. **LLM Provider System** (`src/LLMProviders/`)

   - ChatModelManager: Manages 14+ provider instances (OpenAI, Anthropic, Google, etc.)
   - ChainManager: Orchestrates different chain types (LLM_CHAIN, VAULT_QA_CHAIN, COPILOT_PLUS_CHAIN, PROJECT_CHAIN)
   - EmbeddingManager: Handles embedding models for semantic search
   - BrevilabsClient: Premium features integration

2. **Vector Search** (`src/search/`)

   - VectorStoreManager: Singleton managing Orama vector database
   - HybridRetriever: Combines vector embeddings + BM25 text search
   - IndexOperations: 6000 char chunks with overlap, batch embedding
   - Automatic index sync with vault changes

3. **UI Components** (`src/components/`)

   - CopilotView: Main view extending Obsidian's ItemView
   - Chat.tsx: Core chat interface with streaming support
   - 15+ specialized modals for various interactions
   - Custom UI library with Obsidian theme integration

4. **Autocomplete** (`src/autocomplete/`)
   - Deep CodeMirror integration
   - Trie-based word completion
   - Multiple cache layers for performance

## Development Commands

- Build: `npm run build`
- Development: `npm run dev` (runs esbuild + Tailwind watch)
- Lint: `npm run lint` (fix: `npm run lint:fix`)
- Format: `npm run format` (check: `npm run format:check`)
- Test: `npm run test` (single test: `npm test -- -t "test name"`)
- Integration tests: `npm run test:integration`
- Before PR: Run `npm run format && npm run lint`

## Code Style Guidelines

- TypeScript with strict null checks and no implicit any
- Use absolute imports with `@/` prefix (e.g., `import { ChainType } from "@/chainFactory"`)
- React functional components with hooks
- Error handling: Use detailed error objects with type interfaces
- Consistent naming: PascalCase for components/classes, camelCase for functions/variables
- Comment complex logic and functions with JSDoc format
- Use async/await for asynchronous operations
- Prefer const/let over var
- Organize imports: React first, then external, then internal
- Format with Prettier and ESLint before commits

## Code Organization

- UI components in src/components/
- LLM providers in src/LLMProviders/
- Utility functions in src/utils.ts
- Settings in src/settings/
- Tests adjacent to implementation files
- Modals in src/components/modals/
- Search/indexing in src/search/
- Tools and parsers in src/tools/

## Important Implementation Details

### Multi-Provider Support

The plugin supports 15+ LLM providers through a unified interface:

```typescript
export enum ChatModelProviders {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  GOOGLE = "google",
  COPILOT_PLUS = "copilot-plus",
  OLLAMA = "ollama",
  CLAUDE_CODE_CLI = "claude-code-cli",
  // ... and more
}
```

### Settings Management

Uses Jotai for reactive settings with subscription system:

```typescript
subscribeToSettingsChange((prev, next) => {
  // React to settings changes across the app
});
```

### Performance Optimizations

- Lazy loading of components
- Debounced search and autocomplete
- Batch embedding processing
- Multiple cache layers (file, PDF, autocomplete, project context)
- Mobile-specific optimizations

### Security

- Optional AES encryption for API keys
- Local-first architecture (no telemetry in free version)
- Per-provider key storage
