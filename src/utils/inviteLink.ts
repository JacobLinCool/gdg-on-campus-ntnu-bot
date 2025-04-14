import { PermissionsBitField } from "discord.js";
import logger from "./logger.js";

/**
 * Generate a Discord bot invite link with the required permissions
 * @returns The bot invite link
 */
export function generateInviteLink(): string {
  const clientId = process.env.DISCORD_APP_ID;

  if (!clientId) {
    logger.system("Missing DISCORD_APP_ID in environment variables");
    return "Error: Missing DISCORD_APP_ID in environment variables";
  }

  // Define required permissions for the bot
  const permissions = new PermissionsBitField([
    PermissionsBitField.Flags.ViewChannel,
    PermissionsBitField.Flags.SendMessages,
    PermissionsBitField.Flags.ManageThreads,
    PermissionsBitField.Flags.CreatePublicThreads,
    PermissionsBitField.Flags.EmbedLinks,
    PermissionsBitField.Flags.AttachFiles,
    PermissionsBitField.Flags.ReadMessageHistory,
    PermissionsBitField.Flags.SendMessagesInThreads,
  ]);

  // Generate the invite link
  const inviteLink = `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=${permissions.bitfield}&scope=bot%20applications.commands`;

  logger.system(`Generated bot invite link: ${inviteLink}`);
  return inviteLink;
}
