import type {
  Content,
  ContentUnion,
  FunctionDeclaration,
  GenerateContentConfig,
  Schema,
  ToolListUnion,
} from "@google/genai";
import ExpiryMap from "expiry-map";
import logger from "../utils/logger.js";
import { ai } from "./gemini.js";

export type CallableFunction = FunctionDeclaration & {
  call(args?: Record<string, unknown>): Promise<unknown>;
};

export interface TaskOptions {
  context?: Content[];
  functions?: CallableFunction[];
  schema?: Schema;
}

interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
  timestamp: number;
}

export class Agent {
  public model = "gemini-2.0-flash";
  public readonly MAX_FUNCTION_CALLS = 20;
  private readonly toolCallCache = new ExpiryMap<string, ToolCall[]>(
    5 * 60 * 1000,
  ); // 5 minutes cache

  private getCacheKey(task: string): string {
    return `${task}`;
  }

  private async injectToolContext(task: string): Promise<Content[]> {
    const cacheKey = this.getCacheKey(task);
    const recentCalls = this.toolCallCache.get(cacheKey) || [];
    if (recentCalls.length === 0) return [];

    const contextStr = recentCalls
      .map(
        (call) =>
          `Recent tool call: "${call.name}" with args ${JSON.stringify(call.args)} returned: ${JSON.stringify(call.result)}`,
      )
      .join("\n");

    return [
      {
        role: "user",
        parts: [
          { text: `Context from recent related tool calls:\n${contextStr}` },
        ],
      },
    ];
  }

  private async buildSystemInstruction(): Promise<ContentUnion> {
    // Persona details
    const persona = {
      name: "GooD Goose",
      role: "GDG on Campus: NTNU Smart Assistant",
      characteristics: [
        "friendly",
        "knowledgeable",
        "humorous",
        "helpful",
        "warm and reliable",
        "professional",
        "concise",
        "casual yet polite",
      ],
      style:
        "Responds in a relaxed, friendly, and warm tone, occasionally with a touch of humor, making users feel like they're chatting with a tech-savvy and approachable friend.",
    };
    const systemInstruction =
      `You are ${persona.name}, the ${persona.role}.` +
      `\nYour characteristics: ${persona.characteristics.join(", ")}.` +
      `\nStyle: ${persona.style}` +
      `\nCurrent time: ${new Date().toLocaleString()}.` +
      "\nBy default, respond in Traditional Chinese; if the user's query is in English or another language, reply in that language." +
      "\nYou can answer both GDG-related queries and general technical questions. For general technical questions (like comparing technologies or explaining concepts), provide clear, concise answers based on industry best practices, in 3-4 sentences unless more detail is specifically requested." +
      "\nFor GDG-related queries: Immediately use available tools to retrieve up-to-date information and include relevant links in your responses (should not be implemented as markdown format)." +
      "\nIf a user's question requires information lookup (such as event details or attendee counts), first use the appropriate tool to search or list events, then use the event name/context to match and fetch details. Never ask the user for technical details such as event IDs, even if the input is ambiguous—always try to resolve it yourself using available tools." +
      "\nIf there are multiple options, make a decision and chain multiple tool calls as needed, providing the final answer directly without asking for clarification." +
      "\nPrioritize function calls over clarifying questions. Do not ask the user for permission to execute functions." +
      "\nKeep responses concise—under 2000 characters for Discord." +
      "\nMaintain a friendly, professional tone, and feel free to add a bit of light humor occasionally." + 
      "\nAdd https:// in front of links if they are missing it, so the user can click the URLs directly.";
    return systemInstruction;
  }

  public async please(
    task: string,
    options: TaskOptions = {},
  ): Promise<string> {
    const systemInstruction = await this.buildSystemInstruction();

    const tools: ToolListUnion = [];
    if (options.functions?.length) {
      tools.push({ functionDeclarations: options.functions });
    }

    const config: GenerateContentConfig = {
      systemInstruction,
      tools,
    };
    if (options.schema) {
      config.responseMimeType = "application/json";
      config.responseSchema = options.schema;
    }

    // Inject context from recent tool calls
    const toolContext = await this.injectToolContext(task);
    const fullContext = [...(options.context || []), ...toolContext];

    let chat = ai.chats.create({
      model: this.model,
      history: fullContext,
      config,
    });

    let result = await chat.sendMessage({
      message: `Please ${task}`,
    });

    let functionCallCount = 0;
    const cacheKey = this.getCacheKey(task);
    const recentCalls: ToolCall[] = [];

    while (
      result.functionCalls &&
      result.functionCalls.length > 0 &&
      functionCallCount < this.MAX_FUNCTION_CALLS
    ) {
      if (result.functionCalls.length > 1) {
        const history = chat.getHistory();
        const parts = history[history.length - 1].parts || [];
        const idxOfFirstFunctionCall = parts.findIndex(
          (part) => part.functionCall,
        );
        if (idxOfFirstFunctionCall !== -1) {
          history[history.length - 1].parts = parts.filter((part, index) => {
            return index === idxOfFirstFunctionCall || !part.functionCall;
          });
        }
      }

      const functionCall = result.functionCalls[0];
      const { name, args } = functionCall;
      if (!name) {
        break;
      }

      logger.system(
        `Processing function call ${functionCallCount + 1}/${this.MAX_FUNCTION_CALLS}: ${name}`,
      );
      functionCallCount++;

      let functionResponse;
      const fn = options.functions?.find((f) => f.name === name);
      if (fn && typeof fn.call === "function") {
        functionResponse = await fn.call(args);
        // Cache the tool call result
        recentCalls.push({
          name,
          args: args || {},
          result: functionResponse,
          timestamp: Date.now(),
        });
      } else {
        functionResponse = { error: `Unknown function: ${name}` };
      }

      result = await chat.sendMessage({
        message: {
          functionResponse: {
            name: name,
            response: { functionResponse },
          },
        },
      });

      logger.system(
        `Function call ${functionCallCount}/${this.MAX_FUNCTION_CALLS} completed: ${name}`,
      );
    }

    // Update cache with recent tool calls
    if (recentCalls.length > 0) {
      this.toolCallCache.set(cacheKey, recentCalls);
    }

    if (
      functionCallCount >= this.MAX_FUNCTION_CALLS &&
      result.functionCalls &&
      result.functionCalls.length > 0
    ) {
      logger.system(
        `Reached maximum function call limit (${this.MAX_FUNCTION_CALLS})`,
      );
    }

    if (result.text) {
      logger.system("AI response generated successfully");
    }

    const response =
      result.text ||
      (options.schema
        ? JSON.stringify(undefined)
        : "I'm sorry, I couldn't understand your question. Could you please rephrase it?");

    return response;
  }
}

export const agent = new Agent();
