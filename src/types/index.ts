import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export interface DolinhoCommand {
  data: SlashCommandBuilder,
  execute: (interaction: CommandInteraction) => Promise<void>,
}