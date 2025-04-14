import {
  ActionRowBuilder,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  UserSelectMenuBuilder,
  UserSelectMenuInteraction,
} from "discord.js";
import { classrooms } from "../models/classroom.js";
import logger from "../utils/logger.js";

export const checkStatusCommand = {
  data: new SlashCommandBuilder()
    .setName("check-status")
    .setDescription("Check the lab completion status for a student"),

  async execute(interaction: CommandInteraction) {
    try {
      // Validate context: command must be run in a thread representing a classroom
      if (!interaction.channel || !interaction.channel.isThread()) {
        logger.command(
          `${interaction.user.tag} attempted to use check-status outside of a thread`,
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
          `${interaction.user.tag} attempted to use check-status in a non-classroom thread`,
        );
        return await interaction.reply({
          content: "This thread is not a registered classroom.",
          flags: "Ephemeral",
        });
      }

      // Check if there are any students to display
      if (classroom.students.size === 0) {
        logger.command(
          `${interaction.user.tag} checked status in empty classroom ${classroom.name}`,
        );
        return await interaction.reply({
          content: "There are no students in this classroom yet.",
          flags: "Ephemeral",
        });
      }

      // Create a user select menu for choosing a student
      const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
        new UserSelectMenuBuilder()
          .setCustomId(`check_student_status:${threadId}`)
          .setPlaceholder("Select a student to check")
          .setMinValues(1)
          .setMaxValues(1),
      );

      logger.command(
        `${interaction.user.tag} initiated student status check in ${classroom.name}`,
      );
      await interaction.reply({
        content: "Select a student to check their lab completion status:",
        components: [row],
        flags: "Ephemeral",
      });
    } catch (error) {
      logger.command(`Error in check-status command: %O`, error);
      console.error(error);
      await interaction.reply({
        content: "An error occurred while checking student status.",
        flags: "Ephemeral",
      });
    }
  },
};

/**
 * Handles the interaction when an instructor selects a student from the user select menu
 * Displays detailed information about the student's lab completion status
 *
 * @param interaction - The UserSelectMenuInteraction object from Discord.js
 */
export async function handleStudentStatusSelect(
  interaction: UserSelectMenuInteraction,
) {
  try {
    // Extract data from the interaction custom ID
    const [, threadId] = interaction.customId.split(":");
    const classroom = classrooms.get(threadId);

    // Verify the classroom still exists
    if (!classroom) {
      logger.interaction(
        `Student status check failed - classroom no longer exists for threadId ${threadId}`,
      );
      return await interaction.update({
        content: "This classroom no longer exists.",
        components: [],
      });
    }

    // Get the selected student's ID from the interaction values
    const studentId = interaction.values[0];
    const student = classroom.students.get(studentId);

    // Verify the student exists in the classroom
    if (!student) {
      logger.interaction(
        `Student status check failed - student ${studentId} not found in classroom`,
      );
      return await interaction.update({
        content: "This student is not in the classroom.",
        components: [],
      });
    }

    // Create an embed with detailed student information
    const embed = new EmbedBuilder()
      .setTitle(`Student Status: ${student.name}`)
      .setColor("#0099FF")
      .setTimestamp();

    // Build the description with student details
    let description = `**Group:** ${student.group || "Not assigned"}\n\n`;

    // Add current lab status if a lab is active
    if (classroom.activeLabSession) {
      const completed = student.completedLabs.has(
        classroom.activeLabSession.id,
      );
      description += `**Current Lab (${classroom.activeLabSession.name}):** ${completed ? "✅ Completed" : "❌ Not completed"}\n\n`;
    } else {
      description += "**No active lab session.**\n\n";
    }

    // Add completion history summary
    if (student.completedLabs.size > 0) {
      description += "**Completed Labs:**\n";
      let completedCount = 0;

      // Count completed labs
      student.completedLabs.forEach(() => {
        completedCount++;
      });

      description += `Total completed: ${completedCount}`;
    } else {
      description += "**Completed Labs:** None";
    }

    embed.setDescription(description);

    logger.interaction(
      `Successfully displayed status for student ${student.name} in classroom ${classroom.name}`,
    );
    await interaction.update({
      content: "",
      embeds: [embed],
      components: [],
    });
  } catch (error) {
    logger.interaction(`Error displaying student status: %O`, error);
    console.error(error);
    await interaction.update({
      content: "An error occurred while retrieving student status.",
      components: [],
    });
  }
}
