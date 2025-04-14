import {
  ButtonInteraction,
  Interaction,
  UserSelectMenuInteraction,
} from "discord.js";
import { handleStudentStatusSelect } from "./commands/checkStatus.js";
import { commandHandlers } from "./commands/index.js";
import { classrooms } from "./models/classroom.js";
import logger from "./utils/logger.js";

/**
 * Main handler for all Discord interactions
 * Routes interactions to appropriate handlers based on type
 *
 * @param interaction - The Discord interaction object
 */
export async function handleInteraction(interaction: Interaction) {
  try {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      logger.interaction(
        `Received command: ${interaction.commandName} from ${interaction.user.tag}`,
      );
      const handler = commandHandlers[interaction.commandName];
      if (handler) {
        await handler(interaction);
      } else {
        logger.interaction(
          `No handler found for command: ${interaction.commandName}`,
        );
      }
    }
    // Handle button interactions
    else if (interaction.isButton()) {
      logger.interaction(
        `Button click: ${interaction.customId} from ${interaction.user.tag}`,
      );
      await handleButtonInteraction(interaction);
    }
    // Handle user select menu interactions
    else if (interaction.isUserSelectMenu()) {
      logger.interaction(
        `User select menu: ${interaction.customId} from ${interaction.user.tag}`,
      );
      await handleUserSelectMenuInteraction(interaction);
    }
  } catch (error) {
    logger.interaction(`Error handling interaction: %O`, error);
    console.error(error);
    // Try to respond if the interaction is still valid
    try {
      if (interaction.isRepliable() && !interaction.replied) {
        await interaction.reply({
          content: "An error occurred while handling the interaction.",
          flags: "Ephemeral",
        });
      }
    } catch (err) {
      logger.interaction("Failed to send error response: %O", err);
      console.error("Failed to send error response:", err);
    }
  }
}

/**
 * Handler for button interactions
 * Routes button interactions based on their customId prefix
 *
 * @param interaction - The Discord button interaction object
 */
async function handleButtonInteraction(interaction: ButtonInteraction) {
  // Parse the action and parameters from the button's customId
  const [action, ...params] = interaction.customId.split(":");
  logger.interaction(
    `Handling button action: ${action} with params: ${params.join(", ")}`,
  );

  // Route to appropriate handler based on the action
  switch (action) {
    case "join_group":
      await handleJoinGroup(interaction, params);
      break;
    case "complete_lab":
      await handleCompleteLab(interaction, params);
      break;
    default:
      logger.interaction(`Unknown button action: ${action}`);
      await interaction.reply({
        content: `Unknown button action: ${action}`,
        flags: "Ephemeral",
      });
  }
}

/**
 * Handler for user select menu interactions
 * Routes select menu interactions based on their customId prefix
 *
 * @param interaction - The Discord user select menu interaction object
 */
async function handleUserSelectMenuInteraction(
  interaction: UserSelectMenuInteraction,
) {
  // Parse the action and parameters from the menu's customId
  const [action, ...params] = interaction.customId.split(":");
  logger.interaction(
    `Handling user select menu action: ${action} with params: ${params.join(", ")}`,
  );

  // Route to appropriate handler based on the action
  switch (action) {
    case "check_student_status":
      await handleStudentStatusSelect(interaction);
      break;
    default:
      logger.interaction(`Unknown user select menu action: ${action}`);
      await interaction.reply({
        content: `Unknown user select menu action: ${action}`,
        flags: "Ephemeral",
      });
  }
}

/**
 * Handler for join group button interactions
 * Allows students to join a specific group in a classroom
 *
 * @param interaction - The Discord button interaction object
 * @param params - Parameters extracted from the button's customId [groupNumber, threadId]
 */
async function handleJoinGroup(
  interaction: ButtonInteraction,
  params: string[],
) {
  const [groupStr, threadId] = params;
  const groupNum = parseInt(groupStr, 10);

  // Validate group number
  if (isNaN(groupNum)) {
    logger.interaction(`Invalid group number: ${groupStr}`);
    return await interaction.reply({
      content: "Invalid group number.",
      flags: "Ephemeral",
    });
  }

  // Get the classroom from the collection
  const classroom = classrooms.get(threadId);
  if (!classroom) {
    logger.interaction(`Classroom not found for thread ID: ${threadId}`);
    return await interaction.reply({
      content: "This classroom no longer exists.",
      flags: "Ephemeral",
    });
  }

  // Get or create student in the classroom
  const userId = interaction.user.id;
  let student = classroom.getStudent(userId);

  // If student doesn't exist in classroom, create new record
  if (!student) {
    logger.interaction(
      `Creating new student record for user: ${interaction.user.tag}`,
    );
    student = {
      id: userId,
      name: interaction.user.username,
      completedLabs: new Set(),
    };
    classroom.addStudent(student);
  }

  // Assign to the selected group
  logger.interaction(
    `Assigning user ${interaction.user.tag} to group ${groupNum}`,
  );
  classroom.assignStudentToGroup(userId, groupNum);

  await interaction.reply({
    content: `You have joined Group ${groupNum} in this classroom!`,
    flags: "Ephemeral",
  });
}

/**
 * Handler for complete lab button interactions
 * Allows students to mark a lab as completed
 *
 * @param interaction - The Discord button interaction object
 * @param params - Parameters extracted from the button's customId [labId, threadId]
 */
async function handleCompleteLab(
  interaction: ButtonInteraction,
  params: string[],
) {
  const [labId, threadId] = params;

  // Get the classroom from the collection
  const classroom = classrooms.get(threadId);
  if (!classroom) {
    logger.interaction(`Classroom not found for thread ID: ${threadId}`);
    return await interaction.reply({
      content: "This classroom no longer exists.",
      flags: "Ephemeral",
    });
  }

  // Validate the lab session is active and matches the ID
  if (!classroom.activeLabSession || classroom.activeLabSession.id !== labId) {
    logger.interaction(`Invalid lab session ID: ${labId}`);
    return await interaction.reply({
      content: "This lab session is no longer active.",
      flags: "Ephemeral",
    });
  }

  // Get student in the classroom
  const userId = interaction.user.id;
  let student = classroom.getStudent(userId);

  // Ensure student is registered
  if (!student) {
    logger.interaction(`Student not found: ${interaction.user.tag}`);
    return await interaction.reply({
      content:
        "You are not registered in this classroom. Please join a group first.",
      flags: "Ephemeral",
    });
  }

  // Mark lab as completed and check if it was already completed
  const wasAlreadyCompleted = classroom.hasCompletedActiveLab(userId);
  logger.interaction(
    `User ${interaction.user.tag} ${wasAlreadyCompleted ? "already" : "newly"} completed lab: ${classroom.activeLabSession.name}`,
  );
  classroom.completeLab(userId);

  // Reply with appropriate message based on completion status
  await interaction.reply({
    content: wasAlreadyCompleted
      ? `You have already completed the "${classroom.activeLabSession.name}" lab.`
      : `You have completed the "${classroom.activeLabSession.name}" lab!`,
    flags: "Ephemeral",
  });
}
