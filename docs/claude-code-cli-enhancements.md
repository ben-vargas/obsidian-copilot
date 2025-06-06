# Claude Code CLI Integration - Enhancement Roadmap

This document outlines potential enhancements to the Claude Code CLI integration in Obsidian Copilot, based on the available CLI features documented in Claude Code's official documentation.

## 1. Model Alias Support in UI ✅

### Overview

Enhance the model selection interface to support Claude's model aliases (`opus`, `sonnet`) alongside full model names, making it easier for users to select the latest versions.

### User Story

As a user, I want to easily select "latest Opus" or "latest Sonnet" without needing to know the exact model version numbers, so that I always use the most current model.

### Requirements

- Add a dropdown or radio button group in the model configuration UI with options:
  - "Claude Opus (Latest)" → sends `opus` to CLI
  - "Claude Sonnet (Latest)" → sends `sonnet` to CLI
  - "Custom Model" → allows entering specific model names like `claude-3-5-sonnet`
- Maintain backward compatibility with existing configurations
- Update tooltips to explain that aliases always use the latest model version

### Implementation Plan

1. Modify `src/components/modals/ModelAddDialog.tsx` or relevant settings component
2. Add a model selection component with predefined options
3. Update `ChatClaudeCodeCLI` to handle both aliases and full model names
4. Add migration logic to convert existing model names to aliases where appropriate
5. Update documentation to reflect new options

### Acceptance Criteria

- [x] Users can select model aliases from a dropdown
- [x] Custom model names are still supported
- [x] Existing configurations continue to work
- [x] UI clearly indicates which options use latest versions

### Implementation Status: COMPLETED

- Added model selection dropdown in ModelAddDialog for Claude Code CLI provider
- Added same functionality to ModelEditDialog for editing existing models
- Updated UI labels: "Base URL" → "Claude Executable Path" for Claude Code CLI
- Removed API Key field for Claude Code CLI (not needed)
- Updated documentation to explain the three model selection options
- Default selection is "sonnet" when adding new Claude Code CLI model

---

## 2. Max Turns Control

### Overview

Implement support for the `--max-turns` flag to give users control over the number of agentic iterations Claude Code performs, helping manage costs and execution time.

### User Story

As a user, I want to limit how many steps Claude Code takes to complete a task, so that I can control costs and prevent runaway operations.

### Requirements

- Add a "Max Turns" setting in the model configuration (optional field)
- Default to no limit (Claude Code's default behavior)
- Valid range: 1-100 turns
- Include help text explaining the cost/completeness tradeoff

### Implementation Plan

1. Add `maxTurns?: number` to `ClaudeCodeCLIConfig` interface
2. Add UI input field with validation in model settings
3. Modify command construction to include `--max-turns` when specified
4. Add tooltip explaining: "Limits the number of steps Claude can take. Lower values reduce cost but may result in incomplete tasks."

### Acceptance Criteria

- [ ] Users can set max turns in model configuration
- [ ] Setting is optional with clear default behavior
- [ ] Input validation prevents invalid values
- [ ] Help text clearly explains the feature

---

## 3. Verbose Mode for Debugging

### Overview

Add support for Claude Code's `--verbose` flag to help users debug issues and understand what Claude is doing during execution.

### User Story

As a developer, I want to see detailed logs of what Claude Code is doing, so that I can debug issues and understand its decision-making process.

### Requirements

- Add a "Verbose Mode" toggle in settings
- When enabled, capture and display verbose output
- Consider adding a separate "Debug Output" panel in the UI
- Ensure verbose output doesn't interfere with normal chat display

### Implementation Plan

1. Add `verbose?: boolean` to `ClaudeCodeCLIConfig`
2. Add toggle switch in model settings
3. Modify output parsing to handle verbose format
4. Create a collapsible "Debug Output" section in chat messages
5. Parse verbose output to extract turn-by-turn information
6. Consider storing verbose logs for later inspection

### Acceptance Criteria

- [ ] Users can enable/disable verbose mode
- [ ] Verbose output is captured and displayed appropriately
- [ ] Normal chat functionality is not disrupted
- [ ] Debug information is easily accessible but not intrusive

---

## 4. Session Persistence and Resume

### Overview

Implement support for continuing Claude Code sessions across Obsidian sessions using the `--continue` and `--resume` flags.

### User Story

As a user, I want to continue my conversation with Claude Code even after closing and reopening Obsidian, so that I don't lose context from long-running tasks.

### Requirements

- Store session IDs from Claude Code responses
- Add "Continue Last Session" option in chat
- Support resuming specific sessions by ID
- Handle session expiration gracefully
- Integrate with Obsidian's existing chat history

### Implementation Plan

1. Extract and store `session_id` from Claude Code responses
2. Create a session manager to track active sessions per workspace
3. Add UI options:
   - "Continue Last Session" button when starting new chat
   - Session picker for multiple recent sessions
4. Modify `ChatClaudeCodeCLI` to support `--continue` and `--resume` flags
5. Store session metadata in Obsidian's data.json
6. Handle edge cases (expired sessions, network issues)

### Acceptance Criteria

- [ ] Session IDs are extracted and stored
- [ ] Users can continue their last session
- [ ] Users can resume specific sessions
- [ ] Session expiration is handled gracefully
- [ ] Session data persists across Obsidian restarts

---

## 5. Output Format Control

### Overview

Expose Claude Code's `--output-format` options to support different use cases, particularly structured JSON output for automation.

### User Story

As a power user, I want to receive Claude's responses in JSON format, so that I can process them programmatically or integrate with other tools.

### Requirements

- Add output format selector (text/json/stream-json)
- Default to text for normal chat interface
- Provide raw JSON view for json/stream-json formats
- Consider use cases for each format

### Implementation Plan

1. Add `outputFormat?: 'text' | 'json' | 'stream-json'` to config
2. Add format selector in advanced settings
3. Modify response parsing based on selected format
4. Create appropriate UI representations for each format:
   - Text: Current chat display
   - JSON: Collapsible JSON viewer with syntax highlighting
   - Stream-JSON: Real-time JSON event display
5. Add export functionality for JSON outputs

### Acceptance Criteria

- [ ] Users can select output format
- [ ] Each format is parsed and displayed appropriately
- [ ] JSON outputs can be viewed and exported
- [ ] Default behavior remains unchanged

---

## 6. Advanced Permission Control

### Overview

Implement support for `--allowedTools` and `--disallowedTools` flags to give users fine-grained control over what Claude Code can do.

### User Story

As a security-conscious user, I want to restrict which tools Claude Code can use, so that I can prevent unwanted file modifications or command executions.

### Requirements

- Add tool permission configuration interface
- Support glob patterns for tool specifications
- Provide preset permission profiles (e.g., "Read Only", "Safe Mode", "Full Access")
- Clear documentation of tool names and patterns

### Implementation Plan

1. Create a permission configuration UI component
2. Add `allowedTools?: string[]` and `disallowedTools?: string[]` to config
3. Implement preset profiles:
   - Read Only: Only allow read operations
   - Safe Mode: No destructive operations
   - Development: Full access except production credentials
   - Custom: User-defined rules
4. Add tool pattern builder/validator
5. Include comprehensive tool documentation

### Acceptance Criteria

- [ ] Users can configure allowed/disallowed tools
- [ ] Preset profiles are available and well-documented
- [ ] Custom patterns can be created and validated
- [ ] Settings are persisted and applied to all sessions

---

## 7. Project-Specific Memory Integration

### Overview

Leverage Claude Code's memory system (`/memory`, `#` shortcut) to maintain project-specific context within Obsidian vaults.

### User Story

As a user working on multiple projects, I want Claude to remember project-specific conventions and preferences, so that I get consistent and contextual assistance.

### Requirements

- Integrate with Claude Code's CLAUDE.md memory system
- Support quick memory additions from chat
- Sync memories with Obsidian vault structure
- Provide memory management interface

### Implementation Plan

1. Detect and use existing CLAUDE.md files in vault
2. Add "Add to Memory" action in chat context menu
3. Implement memory search and management UI
4. Support the `#` prefix for quick memory additions
5. Create memory templates for common use cases
6. Consider vault-specific vs global memories

### Acceptance Criteria

- [ ] CLAUDE.md files are detected and used
- [ ] Users can add memories from chat interface
- [ ] Memory management UI is available
- [ ] Quick memory syntax is supported
- [ ] Memories persist and are used in future sessions

---

## Implementation Priority

Based on user value and implementation complexity:

1. **High Priority**

   - Model Alias Support (Quick win, high value)
   - Max Turns Control (Cost management)
   - Verbose Mode (Debugging support)

2. **Medium Priority**

   - Session Persistence (Complex but valuable)
   - Output Format Control (Power user feature)

3. **Low Priority**
   - Advanced Permission Control (Niche use case)
   - Project-Specific Memory (Requires deeper integration)

## Technical Considerations

### Backward Compatibility

- All enhancements must maintain compatibility with existing configurations
- Provide migration paths for breaking changes
- Default values should preserve current behavior

### Performance Impact

- Verbose mode and JSON parsing may increase memory usage
- Session persistence requires efficient storage strategy
- Consider lazy loading for advanced features

### Error Handling

- Each feature needs robust error handling
- Clear error messages for CLI failures
- Graceful degradation when features aren't available

### Testing Strategy

- Unit tests for new configuration options
- Integration tests for CLI interaction
- Mock Claude Code responses for testing
- Consider test cases for each output format

## Next Steps

1. Gather user feedback on priority
2. Create detailed technical specifications for high-priority items
3. Implement features incrementally with feature flags
4. Document each feature thoroughly
5. Consider creating a "Claude Code CLI Advanced Settings" section in the UI
