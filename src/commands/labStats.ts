import {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { classrooms } from "../models/classroom.js";
import { createAutoUpdateMessage } from "../utils/autoUpdateMessage.js";
import logger from "../utils/logger.js";

export const labStatsCommand = {
  data: new SlashCommandBuilder()
    .setName("lab-stats")
    .setDescription("Show current lab completion statistics with live updates")
    .addIntegerOption((option) =>
      option
        .setName("update-time")
        .setDescription("How long the stats should auto-update (in minutes)")
        .setMinValue(1)
        .setMaxValue(60)
        .setRequired(false),
    ),

  async execute(interaction: CommandInteraction) {
    try {
      if (!interaction.channel || !interaction.channel.isThread()) {
        logger.command(
          `${interaction.user.tag} attempted to use lab-stats outside of a thread`,
        );
        return await interaction.reply({
          content: "This command can only be used in classroom threads.",
          flags: "Ephemeral",
        });
      }

      const threadId = interaction.channel.id;
      const classroom = classrooms.get(threadId);

      if (!classroom) {
        logger.command(
          `${interaction.user.tag} attempted to use lab-stats in a non-classroom thread`,
        );
        return await interaction.reply({
          content: "This thread is not a registered classroom.",
          flags: "Ephemeral",
        });
      }

      if (!classroom.activeLabSession) {
        logger.command(
          `${interaction.user.tag} attempted to use lab-stats with no active lab`,
        );
        return await interaction.reply({
          content: "There is no active lab session in this classroom.",
          flags: "Ephemeral",
        });
      }

      const updateTimeMinutes =
        (interaction.options.get("update-time")?.value as number) || 15;
      const updateTimeMs = updateTimeMinutes * 60 * 1000;

      logger.command(
        `${interaction.user.tag} requested lab stats for "${classroom.activeLabSession.name}" with ${updateTimeMinutes} minute update time`,
      );

      await createAutoUpdateMessage({
        interaction,
        content: `Lab statistics for "${classroom.activeLabSession.name}" will update every 30 seconds for ${updateTimeMinutes} minutes and immediately when student progress changes.`,
        generateEmbed: () => createLabStatusEmbed(classroom),
        timeLimit: updateTimeMs,
        classroom: classroom,
      });
    } catch (error) {
      logger.command(`Error in lab-stats command: %O`, error);
      console.error(error);
      await interaction.reply({
        content: "An error occurred while retrieving lab statistics.",
        flags: "Ephemeral",
      });
    }
  },
};

/**
 * Helper function to create a lab status embed
 * Shows completion percentages overall and by group
 *
 * @param classroom - The classroom to generate lab statistics for
 * @returns An embed with detailed lab completion information
 */
function createLabStatusEmbed(classroom: any) {
  const embed = new EmbedBuilder()
    .setTitle(
      `Lab Status: ${classroom.activeLabSession?.name || "No active lab"}`,
    )
    .setColor("#0099FF")
    .setTimestamp();

  if (!classroom.activeLabSession) {
    embed.setDescription("No active lab session.");
    return embed;
  }

  let description = `Started: ${classroom.activeLabSession.startTime.toLocaleString()}\n\n`;

  const totalStudents = classroom.students.size;
  const completedStudents = Array.from(classroom.students.values()).filter(
    (student: any) => student.completedLabs.has(classroom.activeLabSession!.id),
  ).length;

  if (totalStudents === 0) {
    description += `**Completion Status:** No students in classroom\n\n`;
  } else {
    description += `**Completion Status:** ${completedStudents}/${totalStudents} students (${Math.round((completedStudents / totalStudents) * 100) || 0}%)\n\n`;
  }

  if (classroom.groups > 1) {
    for (let i = 1; i <= classroom.groups; i++) {
      const groupStudents = Array.from(classroom.students.values()).filter(
        (student: any) => student.group === i,
      );

      const groupTotal = groupStudents.length;

      if (groupTotal === 0) {
        description += `**Group ${i}:** No students in group\n`;
      } else {
        const groupCompleted = groupStudents.filter((student: any) =>
          student.completedLabs.has(classroom.activeLabSession!.id),
        ).length;

        const completionPercentage =
          Math.round((groupCompleted / groupTotal) * 100) || 0;
        description += `**Group ${i}:** ${groupCompleted}/${groupTotal} students (${completionPercentage}%)\n`;
      }
    }
  }

  if (completedStudents > 0) {
    description += "\n**Completed Students:**\n";

    const completedStudentsList = Array.from(classroom.students.values())
      .filter((student: any) =>
        student.completedLabs.has(classroom.activeLabSession!.id),
      )
      .map((student: any) => {
        const groupInfo = student.group ? ` (Group ${student.group})` : "";
        return `- ${student.name}${groupInfo}`;
      })
      .join("\n");

    description += completedStudentsList;
  }

  embed.setDescription(description);
  return embed;
}
