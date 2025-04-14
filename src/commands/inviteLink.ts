import {
  CommandInteraction,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { generateInviteLink } from "../utils/inviteLink.js";
import logger from "../utils/logger.js";

export const inviteLinkCommand = {
  data: new SlashCommandBuilder()
    .setName("invite-link")
    .setDescription("Get the bot invite link")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction: CommandInteraction) {
    try {
      const inviteLink = generateInviteLink();
      logger.command(`User ${interaction.user.tag} requested the invite link`);

      await interaction.reply({
        content: `Here's the invite link for the bot:\n${inviteLink}`,
        flags: "Ephemeral",
      });
    } catch (error) {
      logger.command(`Error generating invite link: %O`, error);
      console.error(error);
      await interaction.reply({
        content: "An error occurred while generating the invite link.",
        flags: "Ephemeral",
      });
    }
  },
};
