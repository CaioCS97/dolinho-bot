import { DolinhoCommand } from "../../types";
import { MarketEvents } from "../../market/index.js";
import { SlashCommandBuilder } from "discord.js";

const command: DolinhoCommand = {
  dev: true,
  data: new SlashCommandBuilder()
    .setName("dispatch_market_events")
    .setDescription(
      "Dispatches any available event on the bot (DEVELOPMENT ONLY)"
    )
    .addStringOption((option) =>
      option
        .setName("event")
        .setChoices(
          { name: "openning", value: "MARKET_OPENNING" },
          { name: "latest", value: "MARKET_LASTEST" },
          { name: "closing", value: "MARKET_CLOSING" }
        )
        .setRequired(true)
        .setDescription("The event to be emmited")
    )
    .addStringOption((option) =>
      option
        .setName("rate")
        .setRequired(true)
        .setDescription("The rate to be used")
    )
    .addStringOption((option) =>
      option.setName("variation").setDescription("The rate to be used")
    )
    .addStringOption((option) =>
      option.setName("percentage").setDescription("The rate to be used")
    ) as any,
  execute: async (client, interaction, market) => {
    const event = interaction.options.get("event")?.value as MarketEvents;
    const rate = Number(interaction.options.get("rate")?.value ?? 0);
    const variation = Number(interaction.options.get("variation")?.value ?? 0);
    const percentage = Number(
      interaction.options.get("percentage")?.value ?? 0
    );

    await interaction.reply(
      `[DEVELOPMENT] Dispatching event ${event} with rate ${rate} and variation ${variation} and percentage ${percentage}`
    );

    market.emit(event, { rate, variation, percentage });
  },
};

export default command;
