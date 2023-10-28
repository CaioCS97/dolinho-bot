import { DolinhoCommand } from "../../types";
import { SlashCommandBuilder } from "discord.js";

const command: DolinhoCommand = {
  dev: true,
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!"),
  execute: async (client, interaction) => {
    await interaction.reply("Pong!");
  },
};

export default command;
