import {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { classrooms, type Classroom } from "../models/classroom.js";
import { createAutoUpdateMessage } from "../utils/autoUpdateMessage.js";
import logger from "../utils/logger.js";

export const enrollmentStatusCommand = {
  data: new SlashCommandBuilder()
    .setName("enrollment-status")
    .setDescription("Check current student enrollment status in this classroom")
    .addIntegerOption((option) =>
      option
        .setName("update-time")
        .setDescription("How long the status should auto-update (in minutes)")
        .setMinValue(1)
        .setMaxValue(60)
        .setRequired(false),
    ),

  async execute(interaction: CommandInteraction) {
    try {
      // Ensure this is being run in a thread
      if (!interaction.channel || !interaction.channel.isThread()) {
        logger.command(
          `${interaction.user.tag} attempted to use enrollment-status outside of a thread`,
        );
        return await interaction.reply({
          content: "This command can only be used in classroom threads.",
          flags: "Ephemeral",
        });
      }

      const threadId = interaction.channel.id;
      const classroom = classrooms.get(threadId);

      // Validate that the thread is a registered classroom
      if (!classroom) {
        logger.command(
          `${interaction.user.tag} attempted to use enrollment-status in a non-classroom thread`,
        );
        return await interaction.reply({
          content: "This thread is not a registered classroom.",
          flags: "Ephemeral",
        });
      }

      // Get the requested update time (default to 15 minutes if not specified)
      const updateTimeMinutes =
        (interaction.options.get("update-time")?.value as number) || 15;
      const updateTimeMs = updateTimeMinutes * 60 * 1000;

      logger.command(
        `${interaction.user.tag} requested enrollment status in ${classroom.name} with ${updateTimeMinutes} minute update time`,
      );

      // Create auto-updating message for enrollment status
      await createAutoUpdateMessage({
        interaction,
        content: `Current classroom enrollment status (updating for ${updateTimeMinutes} minutes):`,
        generateEmbed: () => createClassroomStatusEmbed(classroom),
        timeLimit: updateTimeMs,
        classroom: classroom, // Pass classroom to listen for state changes
      });
    } catch (error) {
      logger.command(`Error checking enrollment status: %O`, error);
      console.error(error);
      await interaction.reply({
        content: "An error occurred while checking enrollment status.",
        flags: "Ephemeral",
      });
    }
  },
};

/**
 * Helper function to create a classroom enrollment status embed
 * Shows total student count and breakdown by group
 *
 * @param classroom - The classroom to generate status for
 * @returns An embed with detailed enrollment information
 */
function createClassroomStatusEmbed(classroom: Classroom): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`Classroom: ${classroom.name}`)
    .setColor("#0099FF")
    .setTimestamp();

  let description = `**Total Students:** ${classroom.students.size}\n\n`;

  // No students yet
  if (classroom.students.size === 0) {
    description += "No students have joined yet.";
    embed.setDescription(description);
    return embed;
  }

  // Add group information if applicable
  if (classroom.groups > 1) {
    for (let i = 1; i <= classroom.groups; i++) {
      const groupStudents = Array.from(classroom.students.values()).filter(
        (student) => student.group === i,
      );

      description += `**Group ${i}:** ${groupStudents.length} student${groupStudents.length !== 1 ? "s" : ""}\n`;

      if (groupStudents.length > 0) {
        description +=
          groupStudents.map((student) => `- ${student.name}`).join("\n") +
          "\n\n";
      } else {
        description += "No students in this group yet.\n\n";
      }
    }
  } else {
    // List all students if only one group
    description += "**Students:**\n";
    description += Array.from(classroom.students.values())
      .map((student) => `- ${student.name}`)
      .join("\n");
  }

  embed.setDescription(description);
  return embed;
}
