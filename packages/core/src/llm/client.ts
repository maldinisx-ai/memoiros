/**
 * LLM Client - Local Ollama Models Only
 *
 * Creates LLM clients for local Ollama models
 * Supports both regular and streaming responses
 */

import type { LLMClient, LLMMessage } from "../agents/base.js";

/**
 * Streaming chunk callback
 */
export interface StreamChunk {
  readonly content: string;
  readonly done: boolean;
  readonly usage?: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };
}

/**
 * Stream callback function
 */
export type StreamCallback = (chunk: StreamChunk) => void;

/**
 * LLM provider configuration (Ollama only)
 */
export interface LLMConfig {
  readonly provider: "ollama";
  readonly model?: string;
  readonly baseURL?: string;
  readonly timeout?: number;
}

/**
 * Create an LLM client for Ollama
 */
export function createLLMClient(config: LLMConfig): LLMClient {
  return new OllamaClient(config);
}

/**
 * Ollama client (local models)
 */
class OllamaClient implements LLMClient {
  readonly provider = "ollama";
  private readonly baseURL: string;
  private readonly model: string;
  private readonly timeout: number;
  private readonly debug: boolean;

  constructor(config: LLMConfig) {
    this.baseURL = config.baseURL ?? "http://localhost:11434/api/chat";
    this.model = config.model ?? "qwen3:8b";
    this.timeout = config.timeout ?? 120000;
    this.debug = process.env.LLM_DEBUG === "true";
  }

  /**
   * Internal logger for LLM client issues
   */
  private log(level: "warn" | "error", message: string, meta?: Record<string, unknown>): void {
    if (!this.debug) return;
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [OllamaClient] [${level.toUpperCase()}] ${message}`;
    if (level === "warn") {
      console.warn(logMessage, meta ?? "");
    } else {
      console.error(logMessage, meta ?? "");
    }
  }

  /**
   * Stream chat completion
   *
   * Calls the callback with each chunk as it arrives from the LLM.
   * Useful for real-time UI updates.
   */
  async chatStream(
    messages: ReadonlyArray<LLMMessage>,
    callback: StreamCallback,
    options?: { readonly temperature?: number; readonly maxTokens?: number }
  ): Promise<{ readonly usage?: { readonly promptTokens: number; readonly completionTokens: number; readonly totalTokens: number } }> {
    const body = {
      model: this.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
      options: {
        temperature: options?.temperature ?? 0.7,
        num_predict: options?.maxTokens ?? 4096,
      },
    };

    const response = await fetch(this.baseURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} ${error}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    // Read the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line) as {
            readonly message?: { readonly content?: string };
            readonly done?: boolean;
            readonly prompt_eval_count?: number;
            readonly eval_count?: number;
          };

          const content = json.message?.content ?? "";
          const isDone = json.done ?? false;

          // Track token usage
          if (json.prompt_eval_count !== undefined) {
            totalPromptTokens = json.prompt_eval_count;
          }
          if (json.eval_count !== undefined) {
            totalCompletionTokens = json.eval_count;
          }

          callback({
            content,
            done: isDone,
            usage: isDone ? {
              promptTokens: totalPromptTokens,
              completionTokens: totalCompletionTokens,
              totalTokens: totalPromptTokens + totalCompletionTokens,
            } : undefined,
          });
        } catch (e) {
          // Skip invalid JSON lines - use proper logger instead of console.warn
          this.log("warn", "Failed to parse streaming chunk", { line, error: e instanceof Error ? e.message : String(e) });
        }
      }
    }

    return {
      usage: {
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        totalTokens: totalPromptTokens + totalCompletionTokens,
      },
    };
  }

  async chat(
    messages: ReadonlyArray<LLMMessage>,
    options?: { readonly temperature?: number; readonly maxTokens?: number }
  ): Promise<{ readonly content: string; readonly usage?: { readonly promptTokens: number; readonly completionTokens: number; readonly totalTokens: number } }> {
    const body = {
      model: this.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.7,
        num_predict: options?.maxTokens ?? 4096,
      },
    };

    const response = await fetch(this.baseURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} ${error}`);
    }

    const json = await response.json() as {
      readonly message?: { readonly content?: string };
      readonly prompt_eval_count?: number;
      readonly eval_count?: number;
    };

    const promptTokens = json.prompt_eval_count ?? 0;
    const completionTokens = json.eval_count ?? 0;

    return {
      content: json.message?.content ?? "",
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
  }
}

/**
 * Load LLM config from environment
 */
export function loadLLMConfig(): LLMConfig {
  const timeoutValue = process.env.LLM_TIMEOUT;
  let timeout = 120000; // Default timeout

  if (timeoutValue) {
    const parsed = parseInt(timeoutValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      timeout = parsed;
    }
    // If parsing failed or value is invalid, use default
  }

  return {
    provider: "ollama",
    model: process.env.LLM_MODEL ?? "qwen3:8b",
    baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/api/chat",
    timeout,
  };
}
