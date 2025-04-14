import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { classrooms } from "../models/classroom.js";
import { createAutoUpdateMessage } from "../utils/autoUpdateMessage.js";
import logger from "../utils/logger.js";

export const startLabCommand = {
  data: new SlashCommandBuilder()
    .setName("start-lab")
    .setDescription("Start a lab session in the current classroom")
    .addStringOption((option) =>
      option
        .setName("lab-name")
        .setDescription("Name of the lab session")
        .setRequired(true),
    ),

  async execute(interaction: CommandInteraction) {
    try {
      if (!interaction.channel || !interaction.channel.isThread()) {
        return await interaction.reply({
          content: "This command can only be used in classroom threads.",
          flags: "Ephemeral",
        });
      }

      const threadId = interaction.channel.id;
      const classroom = classrooms.get(threadId);

      if (!classroom) {
        return await interaction.reply({
          content: "This thread is not a registered classroom.",
          flags: "Ephemeral",
        });
      }

      if (classroom.activeLabSession) {
        return await interaction.reply({
          content: `There is already an active lab session: "${classroom.activeLabSession.name}"`,
          flags: "Ephemeral",
        });
      }

      const labName = interaction.options.get("lab-name")!.value as string;

      const labSession = classroom.startLab(labName);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`complete_lab:${labSession.id}:${threadId}`)
          .setLabel("Mark as Complete")
          .setStyle(ButtonStyle.Success),
      );

      const embed = new EmbedBuilder()
        .setTitle(`Lab Session: ${labName}`)
        .setDescription("Click the button below when you complete this lab.")
        .setColor("#00FF00")
        .setTimestamp();

      await interaction.channel.send({
        embeds: [embed],
        components: [row],
      });

      await createAutoUpdateMessage({
        interaction,
        content:
          "Lab session started! Status will update every 30 seconds and immediately when student progress changes.",
        generateEmbed: () => createStatusEmbed(classroom),
        timeLimit: 15 * 60 * 1000, // 15 minutes
        classroom: classroom,
      });
    } catch (error) {
      logger.command(`Error starting lab session: %O`, error);
      console.error(error);
      await interaction.reply({
        content: "An error occurred while starting the lab session.",
        flags: "Ephemeral",
      });
    }
  },
};

function createStatusEmbed(classroom: any) {
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

  description += `**Completion Status:** ${completedStudents}/${totalStudents} students (${Math.round((completedStudents / totalStudents) * 100) || 0}%)\n\n`;

  if (classroom.groups > 1) {
    for (let i = 1; i <= classroom.groups; i++) {
      const groupStudents = Array.from(classroom.students.values()).filter(
        (student: any) => student.group === i,
      );

      const groupTotal = groupStudents.length;
      const groupCompleted = groupStudents.filter((student: any) =>
        student.completedLabs.has(classroom.activeLabSession!.id),
      ).length;

      description += `**Group ${i}:** ${groupCompleted}/${groupTotal} students (${Math.round((groupCompleted / groupTotal) * 100) || 0}%)\n`;
    }
  }

  embed.setDescription(description);
  return embed;
}
