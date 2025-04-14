import type { Content } from "@google/genai";
import { Client, Message } from "discord.js";
import logger from "./logger.js";

/**
 * Fetches conversation context for a message from Discord
 *
 * This helper function retrieves recent messages in the conversation thread
 * between the user and the bot to provide context for AI responses.
 *
 * @param message - The current Discord message
 * @param client - The Discord client instance
 * @param maxMessages - Maximum number of previous messages to fetch (default: 5)
 * @returns A formatted string containing the conversation history
 */
export async function fetchConversationContext(
  message: Message,
  client: Client,
  maxMessages: number = 5,
): Promise<Content[]> {
  try {
    // Only fetch messages if it's a reply or in a thread
    if (!message.reference?.messageId && !message.channel.isThread()) {
      return [];
    }

    // Get messages from the channel
    const channel = message.channel;
    const messages = await channel.messages.fetch({
      limit: maxMessages + 1, // +1 to include the current message
      before: message.id,
    });

    // Filter to only include messages from this user and the bot
    const relevantMessages = messages.filter(
      (msg) =>
        msg.author.id === message.author.id ||
        msg.author.id === client.user!.id,
    );

    if (relevantMessages.size === 0) {
      return [];
    }

    // Format the messages into a conversation history string
    // We want messages in chronological order (oldest first)
    const orderedMessages = Array.from(relevantMessages.values()).sort(
      (a, b) => a.createdTimestamp - b.createdTimestamp,
    );

    const formattedHistory: Content[] = orderedMessages.map((msg) => {
      const role = msg.author.id === client.user!.id ? "model" : "user";
      return {
        role: role,
        parts: [{ text: msg.content }],
      };
    });

    logger.system(
      `Fetched ${orderedMessages.length} messages for conversation context`,
    );
    return formattedHistory;
  } catch (error) {
    logger.system(`Error fetching conversation context: %O`, error);
    return [];
  }
}
