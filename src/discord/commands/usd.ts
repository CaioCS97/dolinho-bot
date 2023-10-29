import { DolinhoCommand } from "../../types";
import { SlashCommandBuilder } from "discord.js";

const command: DolinhoCommand = {
  dev: false,
  data: new SlashCommandBuilder()
    .setName("usd")
    .setDescription("Replies with the current USD quotation"),
  execute: async (client, interaction, market) => {
    const { rate, variation, percentage } =
      market.getCurrentRateVariationObject();

    // prettier-ignore
    const payload = !variation
      ? `O **USD** está valendo **${rate} BRL**! (0.0 / 0.0%)`
      : variation > 0
        ? `O **USD** **SUBIU** e está valendo **${rate} BRL**! (↑ ${variation.toFixed(4)} / ${percentage.toFixed(4)}%)`
        : `O **USD** **CAIU** e está valendo **${rate} BRL**! (↓ ${variation.toFixed(4)} / ${percentage.toFixed(4)}%)`;

    await interaction.reply(payload);
  },
};

export default command;
