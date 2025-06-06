import {
  BaseChatModel,
  type BaseChatModelParams,
} from "@langchain/core/language_models/chat_models";
import {
  AIMessage,
  AIMessageChunk,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import type { ChatGeneration, ChatResult } from "@langchain/core/outputs";
import { ChatGenerationChunk } from "@langchain/core/outputs";
import type { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";

export interface ClaudeCodeCLIConfig extends BaseChatModelParams {
  modelName?: string;
  maxTokens?: number;
  temperature?: number;
  streaming?: boolean;
  claudeExecutablePath?: string;
}

export class ChatClaudeCodeCLI extends BaseChatModel {
  modelName: string;
  maxTokens?: number;
  temperature?: number;
  streaming: boolean;
  claudeExecutablePath: string;

  constructor(config: ClaudeCodeCLIConfig = {}) {
    super(config);
    this.modelName = config.modelName || "sonnet";
    this.maxTokens = config.maxTokens;
    this.temperature = config.temperature;
    this.streaming = config.streaming ?? false;
    this.claudeExecutablePath = config.claudeExecutablePath || "claude";
  }

  _llmType(): string {
    return "claude-code-cli";
  }

  async _generate(
    messages: BaseMessage[],
    options: this["ParsedCallOptions"],
    runManager?: CallbackManagerForLLMRun
  ): Promise<ChatResult> {
    // Convert messages to a single prompt
    const prompt = this.formatMessages(messages);

    // Build the command arguments
    // Use --print for non-interactive output, but pass prompt via stdin
    const args: string[] = ["--print", "--output-format", "json"];

    // Add model if specified
    if (this.modelName) {
      args.push("--model", this.modelName);
    }

    try {
      // Try to get child_process module from different sources
      let spawn: any;

      try {
        // Try electron remote first
        const electron = (window as any).require("electron");
        const cp = electron.remote.require("child_process");
        spawn = cp.spawn;
      } catch {
        // Try direct window.require
        const cp = (window as any).require?.("child_process");
        spawn = cp?.spawn;
      }

      if (!spawn) {
        // If neither work, try using obsidian's require
        const obsidianRequire = (window as any).require;
        if (obsidianRequire) {
          const cp = obsidianRequire("child_process");
          if (cp) {
            spawn = cp.spawn;
          }
        }
      }

      if (!spawn) {
        throw new Error(
          "Claude Code CLI requires Obsidian to be running on desktop with Node.js integration enabled."
        );
      }

      // Use spawn to avoid Electron callback bugs with exec/execFile
      // See: https://github.com/electron/electron/issues/25405
      return new Promise((resolve, reject) => {
        // Ensure PATH includes node
        const env = {
          ...process.env,
          PATH: `/Users/ben/.nvm/versions/node/v22.14.0/bin:${process.env.PATH || ""}`,
        };

        const claudeProcess = spawn(this.claudeExecutablePath, args, {
          env: env,
          windowsHide: true,
          stdio: ["pipe", "pipe", "pipe"], // Explicitly set stdio
          shell: false, // Don't use shell
        });

        // Write the prompt to stdin
        claudeProcess.stdin.write(prompt);
        claudeProcess.stdin.end();

        let stdout = "";
        let stderr = "";
        let processExited = false;

        // Set a timeout to prevent hanging
        const timeout = setTimeout(() => {
          if (!processExited) {
            console.error("[Claude CLI] Process timeout after 30 seconds");
            claudeProcess.kill();
            reject(new Error("Claude Code CLI timeout after 30 seconds"));
          }
        }, 30000);

        claudeProcess.stdout.on("data", (data: Buffer) => {
          const chunk = data.toString();
          stdout += chunk;
        });

        claudeProcess.stderr.on("data", (data: Buffer) => {
          stderr += data.toString();
        });

        claudeProcess.on("error", (error: Error) => {
          console.error("[Claude CLI] Process error:", error);
          reject(new Error(`Claude Code CLI error: ${error.message}`));
        });

        claudeProcess.on("close", async (code: number) => {
          processExited = true;
          clearTimeout(timeout);

          if (code !== 0) {
            reject(
              new Error(`Claude Code CLI exited with code ${code}: ${stderr || "Unknown error"}`)
            );
            return;
          }

          if (stderr) {
            console.warn("Claude Code CLI stderr:", stderr);
          }

          try {
            // Parse the JSON response
            const response = JSON.parse(stdout);

            // Check if the response indicates an error
            if (response.is_error) {
              reject(
                new Error(
                  `Claude Code CLI returned an error: ${response.result || "Unknown error"}`
                )
              );
              return;
            }

            // Extract the content from the response
            const content = response.result || "";

            // Handle callbacks if needed
            await runManager?.handleLLMNewToken(content);

            const message = new AIMessage(content);
            const generation: ChatGeneration = {
              message,
              text: content,
            };

            // Include additional metadata from the response
            const llmOutput = {
              cost_usd: response.cost_usd,
              duration_ms: response.duration_ms,
              num_turns: response.num_turns,
              session_id: response.session_id,
              usage: response.usage,
            };

            resolve({
              generations: [generation],
              llmOutput,
            });
          } catch (parseError) {
            reject(new Error(`Failed to parse Claude Code CLI response: ${parseError}`));
          }
        });
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Claude Code CLI error: ${error.message}`);
      }
      throw error;
    }
  }

  // Streaming is not supported for CLI, but we need to implement the method
  async *_streamResponseChunks(
    messages: BaseMessage[],
    options: this["ParsedCallOptions"],
    runManager?: CallbackManagerForLLMRun
  ): AsyncGenerator<ChatGenerationChunk> {
    // For CLI, we'll just get the full response and yield it as a single chunk
    const result = await this._generate(messages, options, runManager);
    const text = result.generations[0].text;

    // Create a chunk that matches what the streaming infrastructure expects
    // The chunk needs to have content as a direct property for ThinkBlockStreamer
    const chunk = new ChatGenerationChunk({
      message: new AIMessageChunk({
        content: text,
        additional_kwargs: {},
      }),
      text,
    });

    // Ensure the chunk has the content property at the top level
    // This is what ThinkBlockStreamer expects in its processChunk method
    (chunk as any).content = text;

    yield chunk;
  }

  private formatMessages(messages: BaseMessage[]): string {
    // Convert messages array to a single prompt string
    // Claude Code CLI expects a single prompt, not a conversation format
    let prompt = "";

    for (const message of messages) {
      if (message instanceof SystemMessage) {
        prompt += `System: ${message.content}\n\n`;
      } else if (message instanceof HumanMessage) {
        prompt += `Human: ${message.content}\n\n`;
      } else if (message instanceof AIMessage) {
        prompt += `Assistant: ${message.content}\n\n`;
      }
    }

    // Remove trailing newlines
    return prompt.trim();
  }

  // Required abstract methods
  _combineLLMOutput?(
    ...llmOutputs: (Record<string, any> | undefined)[]
  ): Record<string, any> | undefined {
    return llmOutputs.reduce((acc, output) => ({ ...acc, ...output }), {});
  }
}
