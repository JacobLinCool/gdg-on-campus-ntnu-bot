import { Client, Events, GatewayIntentBits, Message } from "discord.js";
import dotenv from "dotenv";
import { processQuestion } from "./ai/gemini.js";
import { registerCommands } from "./commands/index.js";
import { handleInteraction } from "./interactions.js";
import { generateInviteLink } from "./utils/inviteLink.js";
import logger from "./utils/logger.js";
import { fetchConversationContext } from "./utils/messageContext.js";

/**
 * Main application entry point
 * Initializes the Discord bot and sets up event handlers
 */
async function main() {
  // Load environment variables from .env file
  dotenv.config();

  // Validate required environment variables
  const requiredEnvVars = ["DISCORD_TOKEN", "DISCORD_APP_ID", "GEMINI_API_KEY"];
  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingVars.length > 0) {
    logger.system(
      `Missing required environment variables: ${missingVars.join(", ")}`,
    );
    console.error(
      `Error: Missing required environment variables: ${missingVars.join(", ")}`,
    );
    console.error(
      "Please create a .env file with these variables and try again.",
    );
    process.exit(1);
  }

  logger.system("Starting GDG on Campus: NTNU Bot...");

  // Generate and display the invite link for convenience
  try {
    const inviteLink = generateInviteLink();
    console.log("\n=== Discord Bot Invite Link ===");
    console.log(inviteLink);
    console.log("==============================\n");
  } catch (error) {
    logger.system(`Failed to generate invite link: %O`, error);
    console.error("Warning: Failed to generate invite link:", error);
    // Continue execution as this is not critical
  }

  // Create a new Discord client instance with required intents
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds, // For guild and channel data
      GatewayIntentBits.GuildMessages, // For message content
      GatewayIntentBits.MessageContent, // For reading message content
      GatewayIntentBits.GuildMembers, // For member information
    ],
  });

  // Register commands with Discord when the client is ready
  client.once(Events.ClientReady, async (readyClient) => {
    logger.system(`Ready! Logged in as ${readyClient.user.tag}`);

    try {
      await registerCommands();
      logger.system("Successfully registered all application commands");
    } catch (error) {
      logger.system(`Failed to register commands: %O`, error);
      console.error("Error: Failed to register application commands:", error);
    }
  });

  // Set up error event handlers for the client
  client.on(Events.Error, (error) => {
    logger.system(`Discord client error: %O`, error);
    console.error("Discord client error:", error);
  });

  client.on(Events.Warn, (warning) => {
    logger.system(`Discord client warning: ${warning}`);
  });

  client.on(Events.Debug, (message) => {
    if (process.env.NODE_ENV === "development") {
      logger.system(`Discord debug: ${message}`);
    }
  });

  // Handle all incoming interactions
  client.on(Events.InteractionCreate, handleInteraction);

  // Handle messages mentioning the bot for AI responses
  client.on(Events.MessageCreate, async (message) => {
    try {
      await handleBotMention(message, client);
    } catch (error) {
      logger.system(`Error handling message: %O`, error);
      console.error("Error handling message:", error);
    }
  });

  // Log in to Discord with the client token
  logger.system("Attempting to log in to Discord...");
  try {
    await client.login(process.env.DISCORD_TOKEN);
    logger.system("Successfully logged in to Discord");
  } catch (error) {
    logger.system(`Failed to log in to Discord: %O`, error);
    console.error("Failed to log in to Discord:", error);
    process.exit(1);
  }
}

/**
 * Handles messages that mention the bot to provide AI-powered responses
 *
 * @param message - The Discord message
 * @param client - The Discord client
 */
async function handleBotMention(message: Message, client: Client) {
  // Ignore messages from bots (including self)
  if (message.author.bot) {
    return;
  }

  if (message.channel.isDMBased()) {
    return;
  }

  // Check if the message is a direct mention or a reply to the bot
  const isDirectMention = message.mentions.has(client.user!.id);
  const isReplyToBot =
    message.reference?.messageId &&
    (await message.channel.messages.fetch(message.reference.messageId)).author
      .id === client.user!.id;

  // Process message only if it's a direct mention or a reply to the bot
  if (!isDirectMention && !isReplyToBot) return;

  // Extract the question (remove mention)
  const content = message.content.replace(/@<!?\d+>/g, "").trim();

  // Ignore empty messages or just mentions
  if (!content) return;

  logger.system(`Received question from ${message.author.tag}: ${content}`);

  // Show typing indicator while processing
  await message.channel.sendTyping();

  try {
    // Fetch conversation context from previous messages
    const conversationContext = await fetchConversationContext(message, client);

    // Process the question with Gemini AI, including conversation context if available
    const response = await processQuestion(content, conversationContext);

    // Send the response
    await message.reply(response);
    logger.system(`Sent AI response to ${message.author.tag}`);
  } catch (error) {
    logger.system(`Error processing question: %O`, error);
    await message.reply(
      "I'm sorry, I couldn't process your question at this time. Please try again later.",
    );
  }
}

// Start the application and handle any top-level errors
main().catch((err) => {
  logger.system("Fatal error occurred: %O", err);
  console.error("Fatal error:", err);
  process.exit(1);
});
