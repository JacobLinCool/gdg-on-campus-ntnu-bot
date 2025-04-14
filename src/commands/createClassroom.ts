import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  ThreadChannel,
} from "discord.js";
import { Classroom, classrooms } from "../models/classroom.js";
import { createAutoUpdateMessage } from "../utils/autoUpdateMessage.js";
import logger from "../utils/logger.js";

export const createClassroomCommand = {
  data: new SlashCommandBuilder()
    .setName("create-classroom")
    .setDescription("Creates a new classroom thread")
    .addIntegerOption((option) =>
      option
        .setName("group-count")
        .setDescription("Number of groups to create")
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(false),
    ),

  async execute(interaction: CommandInteraction) {
    try {
      const groupCount =
        (interaction.options.get("group-count")?.value as number) || 1;

      // Create a new thread for the classroom
      if (!interaction.channel || !("threads" in interaction.channel)) {
        return await interaction.reply({
          content:
            "This command can only be used in channels that support threads.",
          flags: "Ephemeral",
        });
      }

      const threadName = `Classroom-${new Date().toLocaleDateString()}`;

      // Create the thread
      const thread = await (interaction.channel as any).threads.create({
        name: threadName,
        autoArchiveDuration: 1440, // Archive after 24 hours of inactivity
        reason: "New classroom created",
      });

      if (!(thread instanceof ThreadChannel)) {
        return await interaction.reply({
          content: "Failed to create a classroom thread.",
          flags: "Ephemeral",
        });
      }

      // Create a new classroom instance
      const classroom = new Classroom(thread.id, threadName, groupCount);
      classrooms.set(thread.id, classroom);

      // Create join buttons for each group
      const rows: ActionRowBuilder<ButtonBuilder>[] = [];

      // Create buttons for each group
      for (let i = 0; i < Math.ceil(groupCount / 5); i++) {
        const row = new ActionRowBuilder<ButtonBuilder>();

        for (let j = 1; j <= 5 && i * 5 + j <= groupCount; j++) {
          const groupNum = i * 5 + j;
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`join_group:${groupNum}:${thread.id}`)
              .setLabel(`Join Group ${groupNum}`)
              .setStyle(ButtonStyle.Primary),
          );
        }

        rows.push(row);
      }

      // Send a welcome message to the thread
      await thread.send({
        content: `Welcome to the classroom! This classroom has ${groupCount} group${groupCount > 1 ? "s" : ""}. Students, please join a group:`,
        components: rows,
      });

      // Use auto-updating message for live join status
      await createAutoUpdateMessage({
        interaction,
        content: `Classroom created successfully: ${thread.toString()}\nStudent enrollment will update every 30 seconds and immediately when students join.`,
        generateEmbed: () => createClassroomStatusEmbed(classroom),
        timeLimit: 15 * 60 * 1000, // 15 minutes
        classroom: classroom, // Pass classroom to listen for state changes
      });
    } catch (error) {
      logger.command(`Error creating classroom: %O`, error);
      console.error(error);
      await interaction.reply({
        content: "An error occurred while creating the classroom.",
        flags: "Ephemeral",
      });
    }
  },
};

// Helper function to create a classroom status embed
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
