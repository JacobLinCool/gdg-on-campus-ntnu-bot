import { Content, GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { default as bevyClient } from "../bevy/index.js";
import logger from "../utils/logger.js";

dotenv.config();

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getUpcomingEventsFunctionDeclaration = {
  name: "get_upcoming_events",
  description: "Gets a list of upcoming events for the GDG community.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      limit: {
        type: Type.NUMBER,
        description: "Maximum number of events to return",
      },
    },
    required: [],
  },
};

const getPastEventsFunctionDeclaration = {
  name: "get_past_events",
  description: "Gets a list of past events for the GDG community.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      limit: {
        type: Type.NUMBER,
        description: "Maximum number of events to return",
      },
    },
    required: [],
  },
};

const getEventDetailsFunctionDeclaration = {
  name: "get_event_details",
  description:
    "Gets detailed information (description, location, speaker information, ticket status, and audience) about a specific event.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      eventId: {
        type: Type.STRING,
        description: "ID of the event to get details for",
      },
    },
    required: ["eventId"],
  },
};

/**
 * Processes a user question using Gemini API with Bevy function calling
 *
 * @param question - The user's question text
 * @param conversationContext - Previous conversation context (optional)
 * @returns A Promise resolving to Gemini's response
 */
export async function processQuestion(
  question: string,
  conversationContext?: Content[],
): Promise<string> {
  try {
    logger.system(`Processing AI question: ${question}`);

    const functionDeclarations = [
      getUpcomingEventsFunctionDeclaration,
      getPastEventsFunctionDeclaration,
      getEventDetailsFunctionDeclaration,
    ];

    let systemInstruction =
      "You are a helpful assistant for GDG on Campus: NTNU (National Taiwan Normal University). Current time is " +
      new Date().toLocaleString() +
      ". By default, respond in Traditional Chinese; however, if the user's query is in English or another language, reply accordingly. " +
      "Immediately use one or more available tools to retrieve up-to-date information and include relevant links in your responses when available. " +
      "Directly invoke the necessary tools to solve the problem without asking the user for permission, even if multiple options are available. " +
      "Prioritize function calls over clarifying questions. Sequentially call functions instead of parallelizing them. Answer as concisely as possible. " +
      "Keep responses concise - under 2000 characters for Discord. For URLs, simply paste directly in the text without markdown formatting.";

    let chat = ai.chats.create({
      model: "gemini-2.0-flash",
      history: conversationContext,
      config: {
        systemInstruction: [
          {
            text: systemInstruction,
          },
        ],
        tools: [{ functionDeclarations }],
      },
    });

    let result = await chat.sendMessage({
      message: question,
    });

    let functionCallCount = 0;
    const MAX_FUNCTION_CALLS = 10;

    while (
      result.functionCalls &&
      result.functionCalls.length > 0 &&
      functionCallCount < MAX_FUNCTION_CALLS
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

      logger.system(
        `Processing function call ${functionCallCount + 1}/${MAX_FUNCTION_CALLS}: ${name}`,
      );
      functionCallCount++;

      let functionResponse;
      switch (name) {
        case "get_upcoming_events": {
          const limit =
            args && typeof args === "object" && "limit" in args
              ? Number(args.limit) || 5
              : 5;

          functionResponse = await bevyClient.getUpcomingEvents(limit);
          break;
        }

        case "get_past_events": {
          const limit =
            args && typeof args === "object" && "limit" in args
              ? Number(args.limit) || 5
              : 5;

          functionResponse = await bevyClient.getPastEvents(limit);
          break;
        }

        case "get_event_details": {
          try {
            if (
              !args ||
              typeof args !== "object" ||
              !("eventId" in args) ||
              !args.eventId
            ) {
              functionResponse = {
                error: "Missing required parameter: eventId",
              };
              break;
            }

            const eventId = String(args.eventId);
            functionResponse = await bevyClient.getDetailedEvent(eventId);
          } catch (error) {
            functionResponse = { error: "Event not found" };
          }
          break;
        }

        default:
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
        `Function call ${functionCallCount}/${MAX_FUNCTION_CALLS} completed: ${name}`,
      );
    }

    if (
      functionCallCount >= MAX_FUNCTION_CALLS &&
      result.functionCalls &&
      result.functionCalls.length > 0
    ) {
      logger.system(
        `Reached maximum function call limit (${MAX_FUNCTION_CALLS})`,
      );
    }

    const response =
      result.text ||
      "I'm sorry, I couldn't understand your question. Could you please rephrase it?";

    logger.system("AI response generated successfully");
    return response;
  } catch (error) {
    logger.system(`Error processing AI question: %O`, error);
    return "I'm sorry, I couldn't process your question at this time. Please try again later.";
  }
}
