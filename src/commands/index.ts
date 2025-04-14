import { REST, Routes } from "discord.js";
import logger from "../utils/logger.js";
import { checkStatusCommand } from "./checkStatus.js";
import { createClassroomCommand } from "./createClassroom.js";
import { enrollmentStatusCommand } from "./enrollmentStatus.js";
import { inviteLinkCommand } from "./inviteLink.js";
import { labStatsCommand } from "./labStats.js";
import { startLabCommand } from "./startLab.js";

// Array of all command data
const commands = [
  createClassroomCommand.data.toJSON(),
  startLabCommand.data.toJSON(),
  checkStatusCommand.data.toJSON(),
  inviteLinkCommand.data.toJSON(),
  enrollmentStatusCommand.data.toJSON(),
  labStatsCommand.data.toJSON(),
];

// Export command handlers
export const commandHandlers = {
  [createClassroomCommand.data.name]: createClassroomCommand.execute,
  [startLabCommand.data.name]: startLabCommand.execute,
  [checkStatusCommand.data.name]: checkStatusCommand.execute,
  [inviteLinkCommand.data.name]: inviteLinkCommand.execute,
  [enrollmentStatusCommand.data.name]: enrollmentStatusCommand.execute,
  [labStatsCommand.data.name]: labStatsCommand.execute,
};

// Function to register all commands with Discord
export async function registerCommands() {
  try {
    logger.command(
      `Started refreshing ${commands.length} application commands.`,
    );

    const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
    logger.command(
      `Commands to register: ${commands.map((c) => (c as any).name).join(", ")}`,
    );

    const data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_APP_ID!),
      { body: commands },
    );

    logger.command("Successfully reloaded application commands.");
    return data;
  } catch (error) {
    logger.command("Failed to register commands: %O", error);
    console.error(error);
  }
}
