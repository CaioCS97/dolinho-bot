import { DolinhoCommand } from "../../types";
import { SlashCommandBuilder } from "discord.js";

const command: DolinhoCommand = {
  dev: false,
  data: new SlashCommandBuilder()
    .setName("11")
    .setDescription("Celso Portiolli não tem nada a ver com isso 🏢 🏢!"),
  execute: async (client, interaction) => {
    await interaction.reply("✈💥🏢 🏢");
  },
};

export default command;
