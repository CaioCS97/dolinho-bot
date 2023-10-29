import {
  ChannelType,
  Client as DiscordBotClient,
  Events,
  GatewayIntentBits,
} from "discord.js";
import {
  DISCORD_APP_TOKEN,
  OPEN_EXCHANGE_RATES_API_KEY,
} from "./constants/index.js";
import { Market, MarketEvents } from "./market/index.js";
import {
  loadDolinhoSlashCommandsFromFileSystem,
  loadDolinhoSlashCommandsOnGuild,
} from "./discord/index.js";

import { B3WorkingDaysCronJob } from "./cron/index.js";
import { createOpenExchangeClient } from "./oxr/index.js";
import dolinhoScheduler from "node-cron";
import express from "express";
import { getAllDolinhoChannels } from "./utils/index.js";

/**
 * Open Exchange Rates Client
 */
const oxr = createOpenExchangeClient(OPEN_EXCHANGE_RATES_API_KEY);

/**
 * Discord Bot Client
 */
const dolinhoClient = new DiscordBotClient({
  intents: [GatewayIntentBits.Guilds],
});

const dolinhoB3Market = new Market();

// Initialize the market with corretc rates
dolinhoB3Market.setClosingRate(await oxr.getYesterdayRate("BRL"));
dolinhoB3Market.setOpenningRate(await oxr.getYesterdayRate("BRL"));
dolinhoB3Market.setCurrentRate(await oxr.getLatestRate("BRL"));

dolinhoB3Market.on(MarketEvents.Openning, ({ rate }) => {
  const channels = getAllDolinhoChannels(dolinhoClient);
  const payload = `Mercado abriu e o **USD** está valendo **${rate} BRL**!`;

  for (const channel of channels) {
    channel
      .send(payload)
      .then(() => {
        console.log(
          `:D DOLINHO JUST UPDATED THE CHANNEL: ${channel.name} on the GUILD: ${channel.guild.name} - ${channel.guild.id}!`
        );
      })
      .catch(console.error);
  }
});

dolinhoB3Market.on(MarketEvents.Lastest, ({ rate, variation, percentage }) => {
  const channels = getAllDolinhoChannels(dolinhoClient);

  // prettier-ignore
  const payload = !variation
      ? `O **USD** está valendo **${rate} BRL**! (0.0 / 0.0%)`
      : variation > 0
        ? `O **USD** **SUBIU** e está valendo **${rate} BRL**! (↑ ${variation.toFixed(4)} / ${percentage.toFixed(4)}%)`
        : `O **USD** **CAIU** e está valendo **${rate} BRL**! (↓ ${variation.toFixed(4)} / ${percentage.toFixed(4)}%)`;

  for (const channel of channels) {
    channel
      .send(payload)
      .then(() => {
        console.log(
          `:D DOLINHO JUST UPDATED THE CHANNEL: ${channel.name} on the GUILD: ${channel.guild.name} - ${channel.guild.id}!`
        );
      })
      .catch(console.error);
  }
});

dolinhoB3Market.on(MarketEvents.Closing, ({ rate, variation, percentage }) => {
  const channels = getAllDolinhoChannels(dolinhoClient);

  // prettier-ignore
  const payload = !variation
      ? `O mercado **FECHOU**, o **USD** não variou e está valendo **${rate} BRL**! (0.0 / 0.0%)`
      : variation > 0
        ? `O mercado **FECHOU**, o **USD** **SUBIU** e está valendo **${rate} BRL**! (↑ ${variation.toFixed(4)} / ${percentage.toFixed(4)}%)`
        : `O mercado **FECHOU**, o **USD** **CAIU** e está valendo **${rate} BRL**! (↓ ${variation.toFixed(4)} / ${percentage.toFixed(4)}%)`;

  for (const channel of channels) {
    channel
      .send(payload)
      .then(() => {
        console.log(
          `:D DOLINHO JUST UPDATED THE CHANNEL: ${channel.name} on the GUILD: ${channel.guild.name} - ${channel.guild.id}!`
        );
      })
      .catch(console.error);
  }
});

/** Commands */
const dolinhoSlashCommands = await loadDolinhoSlashCommandsFromFileSystem();

/** Events */
/** When the bot is ready, it checks all Guilds */
dolinhoClient.on(Events.ClientReady, async () => {
  console.log(`=== DOLINHO LOGGED IN AS: ${dolinhoClient.user?.tag}! ===`);

  // Handle stuff for each guild the bot is in
  for (const guild of dolinhoClient.guilds.cache.values()) {
    console.log(
      `=== DOLINHO IS REGISTERED ON THE GUILD: ${guild.name} - ${guild.id}! ===`
    );

    await loadDolinhoSlashCommandsOnGuild(dolinhoSlashCommands, guild);

    const channel = guild.channels.cache.find(
      (channel) => channel.name === "dolinho"
    );

    if (!channel) {
      console.log(
        `====> DOLINHO CHANNEL IS NOT REGISTERED ON THE CHANNEL: Dolinho on the GUILD: ${guild.name} - ${guild.id}!`
      );

      try {
        await guild.channels.create({
          name: "Dolinho",
          type: ChannelType.GuildText as any,
          topic: "DOLINHO IS HERE TO HELP YOU!",
        });

        console.log(
          `====> DOLINHO CHANNEL REGISTERED ON THE CHANNEL: Dolinho on the GUILD: ${guild.name} - ${guild.id}!`
        );
      } catch (error) {
        console.log(
          `====> FAILED TO REGISTER THE DOLINHO CHANNEL ON THE GUILD: ${guild.name} - ${guild.id}!`
        );
      }
    }
  }

  // Initialize the cron job that send updates to each channel
  // Openning the market
  dolinhoScheduler.schedule(B3WorkingDaysCronJob.Openning, async () => {
    try {
      dolinhoB3Market.setOpenningRate(await oxr.getLatestRate("BRL"));
    } catch (error) {
      console.error(error);
    }
  });

  // 10 to 17h because 9 and 18 are already scheduled with the cron above and bellow
  dolinhoScheduler.schedule(B3WorkingDaysCronJob.Working, async () => {
    try {
      dolinhoB3Market.setCurrentRate(await oxr.getLatestRate("BRL"));
    } catch (error) {
      console.error(error);
    }
  });

  // Closing the market
  dolinhoScheduler.schedule(B3WorkingDaysCronJob.Closing, async () => {
    try {
      dolinhoB3Market.setClosingRate(await oxr.getLatestRate("BRL"));
    } catch (error) {
      console.error(error);
    }
  });
});

/**
 * When the bot joins a new guild it adds all commands to the guild
 */
dolinhoClient.on(Events.GuildCreate, async (guild) => {
  console.log(
    `DOLINHO JOINED A FUCKING NEW GUILD: ${guild.name} - ${guild.id}!`
  );

  for (const command of dolinhoSlashCommands.values()) {
    console.log(
      `DOLINHO IS REGISTERING COMMAND: /${command.data.name} on the GUILD: ${guild.name} - ${guild.id}!`
    );

    await guild.commands.create(command.data);
  }
});

dolinhoClient.on(Events.InteractionCreate, async (interaction) => {
  // Handle Commands
  if (interaction.isChatInputCommand()) {
    const command = dolinhoSlashCommands.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      console.log(
        `DOLINHO IS EXECUTING THE FUCKING COMMAND: /${interaction.commandName}!`
      );
      await command.execute(
        dolinhoClient,
        interaction,
        dolinhoB3Market,
        dolinhoSlashCommands
      );
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }
  }
});

/**
 * Express Server
 */
const app = express();
const port = process.env.PORT ?? 3000;

app.get("/health", (req, res): void => {
  res.status(200).json({ status: "ok" });
});

/**
 * Startup
 */
await dolinhoClient.login(DISCORD_APP_TOKEN);

console.log(`DOLINHO IS FUCKING ALIVE AND RUNNING!!!`);

app.listen(port, () => {
  console.log(`DOLINHO FUCKING SERVER IS RUNNING ON: ${port}!!!`);
});
