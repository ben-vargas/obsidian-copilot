import { BaseChatModel, BaseChatModelParams } from "@langchain/core/language_models/chat_models";
import {
  BaseMessage,
  AIMessage,
  HumanMessage,
  SystemMessage,
  AIMessageChunk,
} from "@langchain/core/messages";
import { ChatResult, ChatGeneration, ChatGenerationChunk } from "@langchain/core/outputs";
import { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";

export interface ClaudeCodeCLIConfig extends BaseChatModelParams {
  modelName?: string;
  maxTokens?: number;
  temperature?: number;
  streaming?: boolean;
  claudeExecutablePath?: string; // Allow custom path to claude executable
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
    const args: string[] = ["-p", prompt, "--output-format", "json"];

    // Add optional parameters
    if (this.modelName) {
      args.push("--model", this.modelName);
    }
    // Note: --max-tokens and --temperature flags are not supported by Claude Code CLI

    try {
      // Try to get child_process from Electron
      let exec: any;

      try {
        // Try the newer Electron API first
        const electron = (window as any).require("electron");
        if (electron?.remote) {
          exec = electron.remote.require("child_process").exec;
        } else {
          // Try direct require (for main process or if remote is disabled)
          exec = (window as any).require("child_process").exec;
        }
      } catch {
        // If neither work, try using obsidian's require
        const obsidianRequire = (window as any).require;
        if (obsidianRequire) {
          const cp = obsidianRequire("child_process");
          if (cp) {
            exec = cp.exec;
          }
        }
      }

      if (!exec) {
        throw new Error(
          "Claude Code CLI requires Obsidian to be running on desktop with Node.js integration enabled."
        );
      }

      return new Promise((resolve, reject) => {
        const command = `${this.claudeExecutablePath} ${args
          .map((arg) => {
            // Properly escape arguments for shell
            if (arg.includes(" ") || arg.includes('"') || arg.includes("'")) {
              return `"${arg.replace(/"/g, '\\"')}"`;
            }
            return arg;
          })
          .join(" ")}`;

        exec(
          command,
          {
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large responses
          },
          async (error: Error | null, stdout: string, stderr: string) => {
            if (error) {
              reject(new Error(`Claude Code CLI error: ${error.message}`));
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
          }
        );
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

    yield new ChatGenerationChunk({
      message: new AIMessageChunk(text),
      text,
    });
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
