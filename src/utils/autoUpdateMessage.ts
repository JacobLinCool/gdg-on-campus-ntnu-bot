import {
  CommandInteraction,
  EmbedBuilder,
  InteractionResponse,
  Message,
} from "discord.js";
import { Classroom } from "../models/classroom.js";
import logger from "./logger.js";

// Configuration constants
const DEFAULT_UPDATE_INTERVAL = 30 * 1000; // 30 seconds in milliseconds
const DEFAULT_UPDATE_LIMIT = 15 * 60 * 1000; // 15 minutes in milliseconds
const MIN_UPDATE_INTERVAL = 10 * 1000; // 10 seconds minimum between immediate updates

/**
 * Options for creating an auto-updating message
 */
interface AutoUpdateOptions {
  interaction: CommandInteraction; // The Discord interaction to respond to
  generateEmbed: () => EmbedBuilder | Promise<EmbedBuilder>; // Function to generate updated content
  content?: string; // Optional text content for the message
  interval?: number; // Update interval in milliseconds
  timeLimit?: number; // Total time to keep updating in milliseconds
  classroom?: Classroom; // Optional classroom reference for state change listening
}

/**
 * Creates an auto-updating ephemeral message that refreshes with the latest data
 * The message will update at specified intervals and optionally in response to classroom events
 * Updates continue until the time limit is reached
 *
 * @param options - Configuration options for the auto-updating message
 */
export async function createAutoUpdateMessage({
  interaction,
  generateEmbed,
  content = "",
  interval = DEFAULT_UPDATE_INTERVAL,
  timeLimit = DEFAULT_UPDATE_LIMIT,
  classroom,
}: AutoUpdateOptions): Promise<void> {
  // Generate initial embed for the first response
  const initialEmbed = await generateEmbed();
  let response: InteractionResponse | Message;

  // Handle initial response based on interaction state
  if (!interaction.replied && !interaction.deferred) {
    // Send a new ephemeral reply
    response = await interaction.reply({
      content,
      embeds: [initialEmbed],
      flags: "Ephemeral",
    });
  } else {
    // Update an existing reply
    response = await interaction.editReply({
      content,
      embeds: [initialEmbed],
    });
  }

  // Initialize update tracking variables
  const startTime = Date.now();
  const endTime = startTime + timeLimit;
  let updateCount = 0;
  let lastUpdateTime = Date.now();
  let pendingUpdate = false;

  // Create a function to handle updates
  const performUpdate = async (reason: string = "scheduled") => {
    try {
      const now = Date.now();
      updateCount++;

      // Check if we've reached the time limit
      if (now >= endTime) {
        // Generate final update with time limit message
        const finalEmbed = await generateEmbed();
        finalEmbed.setFooter({
          text: `Auto-updates ended (time limit reached) • Total updates: ${updateCount + 1}`,
        });

        await interaction.editReply({
          content: `${content}\n**Auto-updates have stopped**: Time limit reached (${timeLimit / 60000} minutes)`,
          embeds: [finalEmbed],
        });

        // Clean up all resources
        clearInterval(intervalId);
        if (classroom) {
          removeEventListeners();
        }

        logger.system(
          `Auto-update stopped for interaction ${interaction.id} (time limit reached)`,
        );
        return;
      }

      // Generate updated embed with current data

      // Add footer with update status information
      const updatedEmbed = await generateEmbed();
      const remainingTime = Math.ceil((endTime - now) / 60000); // Convert to minutes
      updatedEmbed.setFooter({
        text: `Auto-updating • ${remainingTime} minute${remainingTime !== 1 ? "s" : ""} remaining • Update #${updateCount + 1} (${reason})`,
      });

      // Update the interaction response with new data
      await interaction.editReply({
        content,
        embeds: [updatedEmbed],
      });

      // Reset update tracking state
      lastUpdateTime = now;
      pendingUpdate = false;

      logger.system(
        `Auto-update ${updateCount} for interaction ${interaction.id} (${reason})`,
      );
    } catch (error) {
      logger.system(
        `Error during auto-update for interaction ${interaction.id}: %O`,
        error,
      );
      console.error("Auto-update error:", error);

      // Stop updates on error to prevent repeated failures
      clearInterval(intervalId);
      if (classroom) {
        removeEventListeners();
      }
    }
  };

  /**
   * Intelligently queues an update with rate limiting protection
   * Ensures we don't spam Discord's API with too many requests
   */
  const queueUpdate = (reason: string) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime;

    // If we've recently updated, don't spam the API
    if (timeSinceLastUpdate < MIN_UPDATE_INTERVAL) {
      if (!pendingUpdate) {
        // Schedule a single update to happen after the minimum interval
        pendingUpdate = true;
        const delay = MIN_UPDATE_INTERVAL - timeSinceLastUpdate;
        logger.system(
          `Queuing update for interaction ${interaction.id} in ${delay}ms (${reason})`,
        );
        setTimeout(() => performUpdate(reason), delay);
      }
      // If a pending update is already scheduled, skip this one
    } else {
      // Update immediately if sufficient time has passed
      performUpdate(reason);
    }
  };

  // Set up event listeners for the classroom events if provided
  const onStudentAdded = () => queueUpdate("student-joined");
  const onStudentGroupChanged = () => queueUpdate("group-changed");
  const onLabCompleted = () => queueUpdate("lab-completed");

  // Register event handlers
  if (classroom) {
    classroom.on("student-added", onStudentAdded);
    classroom.on("student-group-changed", onStudentGroupChanged);
    classroom.on("lab-completed", onLabCompleted);
  }

  // Helper function to clean up event listeners
  const removeEventListeners = () => {
    if (classroom) {
      classroom.removeListener("student-added", onStudentAdded);
      classroom.removeListener("student-group-changed", onStudentGroupChanged);
      classroom.removeListener("lab-completed", onLabCompleted);
    }
  };

  // Schedule periodic updates
  const intervalId = setInterval(() => performUpdate("scheduled"), interval);

  // Log the start of auto-updates
  logger.system(
    `Started auto-updates for interaction ${interaction.id} (every ${interval / 1000}s for ${timeLimit / 60000} minutes)`,
  );

  // Set a timeout to clean up at the end of the time limit
  setTimeout(() => {
    clearInterval(intervalId);
    if (classroom) {
      removeEventListeners();
    }
  }, timeLimit);
}
