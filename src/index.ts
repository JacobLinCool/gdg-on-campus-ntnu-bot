import { Type } from "@google/genai";
import {
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  GuildMember,
  Message,
} from "discord.js";
import dotenv from "dotenv";
import { agent } from "./ai/agent.js";
import { bevyFunctions } from "./ai/functions/bevy.js";
import { selfieFunctions } from "./ai/functions/selfie.js";
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
    console.log("===============================\n");
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

  // Handle new members joining the server with personalized welcome messages
  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      await handleNewMember(member, client);
    } catch (error) {
      logger.system(`Error handling new member: %O`, error);
      console.error("Error handling new member:", error);
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

  // Check if the message is in a thread started by the bot
  let isInBotThread = false;
  if (message.channel.isThread()) {
    try {
      const starterMessage = await message.channel.fetchStarterMessage();
      if (starterMessage && starterMessage.author.id === client.user!.id) {
        isInBotThread = true;
      }
    } catch (e) {
      // ignore errors (e.g., missing starter message)
    }
  }

  // Process message only if it's a direct mention, a reply to the bot, or in a thread started by the bot
  if (!isDirectMention && !isReplyToBot && !isInBotThread) return;

  // Extract the question (remove mention)
  const content = message.content.replace(/@<!?\d+>/g, "").trim();

  // Ignore empty messages or just mentions
  if (!content) return;

  logger.system(`Received question from ${message.author.tag}: ${content}`);

  // Show typing indicator while processing
  await message.channel.sendTyping();

  try {
    // Fetch conversation context from previous messages
    const context = await fetchConversationContext(message, client);
    const response = await agent.please(`answer my question: ${content}`, {
      context,
      functions: [...bevyFunctions, ...selfieFunctions],
    });

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

/**
 * Handles new members joining the server with a personalized welcome message
 * Uses Gemini LLM to generate a personalized welcome message
 *
 * @param member - The Discord guild member who joined
 * @param client - The Discord client
 */
async function handleNewMember(member: GuildMember, client: Client) {
  logger.system(`New member joined: ${member.user.tag}`);

  try {
    // Find the system channel or first suitable channel to send welcome message
    const welcomeChannel =
      member.guild.systemChannel ||
      member.guild.channels.cache.find(
        (channel) => channel.isTextBased() && !channel.isThread(),
      );

    if (!welcomeChannel || !welcomeChannel.isTextBased()) {
      logger.system(`No suitable channel found to welcome ${member.user.tag}`);
      return;
    }

    // Show typing indicator
    await welcomeChannel.sendTyping();

    // Get AI-generated welcome message using our specialized welcome generator
    // const welcomeMessage = await generateWelcomeMessage(member.user.username);
    const welcomeString = await agent.please(
      `generate a personalized welcome message for a new member named ${member.user.displayName} who is joining the GDG on Campus: NTNU Discord server. The message should be friendly, welcoming, and informative about the community.`,
      {
        functions: bevyFunctions,
        schema: {
          type: Type.OBJECT,
          properties: {
            message: {
              type: Type.STRING,
              description: "The generated welcome message",
            },
            upcomingEvents: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "Title of the event",
                  },
                  date: {
                    type: Type.STRING,
                    description: "Date of the event",
                  },
                  location: {
                    type: Type.STRING,
                    description: "Location of the event",
                  },
                  link: {
                    type: Type.STRING,
                    description: "Link to the event details",
                  },
                },
                required: ["title", "date", "location", "link"],
              },
            },
          },
          required: ["message"],
        },
      },
    );

    const welcome = JSON.parse(welcomeString);

    // Create embed for welcome message
    const welcomeEmbed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Welcome to GDG on Campus: NTNU!")
      .setDescription(welcome.message)
      .addFields({
        name: "Upcoming Events",
        value: welcome.upcomingEvents
          .map(
            (event: any) =>
              `**${event.title}**\nDate: ${event.date}\nLocation: ${event.location}\n[More Info](${event.link})`,
          )
          .join("\n\n"),
      })
      .setTimestamp()
      .setFooter({
        text: "We are glad to have you here!",
        iconURL: member.user.displayAvatarURL(),
      });

    // Send the welcome message
    await welcomeChannel.send({
      content: `Hey ${member}!`,
      embeds: [welcomeEmbed],
    });

    logger.system(`Sent AI-powered welcome message to ${member.user.tag}`);
  } catch (error) {
    logger.system(
      `Error sending welcome message to ${member.user.tag}: %O`,
      error,
    );
  }
}

// Start the application and handle any top-level errors
main().catch((err) => {
  logger.system("Fatal error occurred: %O", err);
  console.error("Fatal error:", err);
  process.exit(1);
});
