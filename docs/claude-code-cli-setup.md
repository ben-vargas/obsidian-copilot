# Claude Code CLI Integration Guide

This guide explains how to use Claude Code CLI as an LLM provider in Copilot for Obsidian.

## Prerequisites

1. **Claude Code CLI installed**: You need to have Claude Code installed and accessible from your command line. You can verify this by running:

   ```bash
   claude --version
   ```

2. **Desktop Obsidian**: This integration only works with the desktop version of Obsidian (not mobile or web) as it requires access to system commands.

3. **Claude Code Authentication**: Make sure you're authenticated with Claude Code:
   ```bash
   claude auth login
   ```

## Setup Instructions

### 1. Enable Claude Code CLI Provider

The Claude Code CLI provider is already included in the list of available providers. You can find it in the model settings.

### 2. Add a Claude Code CLI Model

1. Go to Copilot settings → Model Settings
2. Click "Add Model"
3. Select "Claude Code CLI" as the provider
4. Configure the model:
   - **Model Selection**: Choose from:
     - **Claude Opus (Latest)** - Uses the `opus` alias for the latest Opus model
     - **Claude Sonnet (Latest)** - Uses the `sonnet` alias for the latest Sonnet model
     - **Custom Model** - Specify a custom model name (e.g., `claude-3-5-sonnet`, `claude-3-opus`, etc.)
   - **Claude Executable Path**: This field is used for the executable path.
     The built-in model calls `claude` by default, but you can specify the full
     path if needed (e.g., `/usr/local/bin/claude`).
   - **No API Key Required**: Claude Code CLI uses your existing Claude authentication, so no API key field is shown
   - **Note**: Temperature and max tokens settings are not supported by Claude Code CLI

### 3. Using Claude Code CLI

Once configured, you can select the Claude Code CLI model from the model dropdown in the chat interface. The plugin will execute the `claude` command with your prompts and return the responses.

## How It Works

When you send a message using Claude Code CLI as the provider, the plugin:

1. Formats your conversation into a prompt
2. Executes: `claude --print --output-format json --model <your-model>` (with the prompt sent via stdin)
3. Parses the JSON response which includes:
   - `result`: The actual response text
   - `is_error`: Whether an error occurred
   - `cost_usd`: The cost of the request
   - `usage`: Token usage information
   - `session_id`: Session identifier
4. Displays the result in the chat interface

**Note**: The prompt is passed via stdin rather than as a command-line argument to avoid shell escaping issues and length limitations.

## Customization Options

### Custom Claude Executable Path

If `claude` is not in your system PATH, you can specify the full path in the "Claude Executable Path" field when configuring the model. For example:

- macOS: `/usr/local/bin/claude`
- Windows: `C:\Program Files\Claude\claude.exe`
- Linux: `/opt/claude/bin/claude`

### Model Selection

The plugin supports three ways to specify Claude models:

1. **Model Aliases** (Recommended for always using latest versions):

   - `opus` - Always uses the latest Claude Opus model
   - `sonnet` - Always uses the latest Claude Sonnet model

2. **Specific Model Versions**:

   - `claude-3-opus-20240229`
   - `claude-3-sonnet-20240229`
   - `claude-3-haiku-20240307`
   - `claude-3-5-sonnet-latest`
   - And other valid Claude model identifiers

3. **Default Model**:
   - Leave blank or use `sonnet` to use the default model

## Limitations

1. **No Streaming**: Unlike API-based providers, Claude Code CLI returns complete responses only. Streaming is not supported.
2. **Desktop Only**: This integration requires Node.js/Electron APIs and only works on desktop Obsidian.
3. **Performance**: Each request spawns a new process, which may be slightly slower than direct API calls.
4. **Node.js Requirement**: Claude Code CLI requires Node.js to be installed and accessible in your system PATH.

## Troubleshooting

### "Claude Code CLI requires Obsidian to be running on desktop"

This error means the plugin couldn't access Node.js APIs. Make sure you're using the desktop version of Obsidian.

### "Command not found: claude"

Make sure Claude Code is installed and accessible from your terminal. Try specifying the full path to the claude executable in the Claude Executable Path field.

### "env: node: No such file or directory"

This error occurs when Node.js is not in the system PATH when Obsidian launches. Solutions:

1. Install Node.js if not already installed
2. Make sure Node.js is in your system PATH
3. For macOS users with nvm, GUI applications may not inherit shell PATH. The plugin includes a workaround for common Node.js locations.

### "Failed to parse Claude Code CLI response"

This usually means Claude Code returned an unexpected format. Make sure you're using a recent version of Claude Code that supports `--output-format json`.

### Process hangs with no response

If the Claude CLI process starts but doesn't return a response:

1. Check the Claude CLI works in your terminal: `claude --print "test" --output-format json`
2. Make sure you're using a recent version of Claude Code
3. Try restarting Obsidian

## Benefits

- **No API Key Required**: Uses your existing Claude Code authentication
- **Local Execution**: All processing happens locally using Claude Code
- **Same Models**: Access to the same Claude models available through Claude Code
- **Unified Interface**: Use Claude alongside other LLM providers in Obsidian
