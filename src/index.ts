import {
  ChannelType,
  Collection,
  CommandInteraction,
  Client as DiscordBotClient,
  Events,
  GatewayIntentBits,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import {
  DISCORD_APP_TOKEN,
  OPEN_EXCHANGE_RATES_API_KEY
} from "./constants/index.js";

import { DolinhoCommand } from "./types/index.js";
import {
  createOpenExchangeClient
} from "./oxr/index.js";
import cron from "node-cron";
import express from "express";

/**
 * Open Exchange Rates Client
 */
const oxr = createOpenExchangeClient(OPEN_EXCHANGE_RATES_API_KEY);

/**
 * Discord Bot Client
 */
const dolinhoClient = new DiscordBotClient({
  intents: [
    GatewayIntentBits.Guilds
  ],
});

/** Commands */
const dolinhoCommands = new Collection<string, DolinhoCommand>()

dolinhoCommands.set("ping", {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  execute: async (interaction: CommandInteraction) => {
    await interaction.reply('Pong!');
  },
});

dolinhoCommands.set("usd", {
  data: new SlashCommandBuilder()
    .setName('usd')
    .setDescription('Replies with the USD quotation!'),
  execute: async (interaction: CommandInteraction) => {
    const rate = await oxr.getLatestRate('BRL')
    await interaction.reply(`1 USD === ${rate} BRL!`);
  },
});

dolinhoCommands.set("11", {
  data: new SlashCommandBuilder()
    .setName('11')
    .setDescription('Celso portiole não tem nada a ver com isso'),
  execute: async (interaction: CommandInteraction) => {
    await interaction.reply(`✈💥🏢 🏢`);
  },
});

/** Events */

/** When the bot is ready, it checks all Guilds */
dolinhoClient.on(Events.ClientReady, async () => {
  console.log(`=== DOLINHO LOGGED IN AS: ${dolinhoClient.user?.tag}! ===`);

  // Handle stuff for each guild the bot is in
  for (const guild of dolinhoClient.guilds.cache.values()) {
    console.log(`=== DOLINHO IS REGISTERED ON THE GUILD: ${guild.name} - ${guild.id}! ===`);

    for (const command of dolinhoCommands.values()) {
      console.log(`====> DOLINHO IS REGISTERING COMMAND: /${command.data.name} on the GUILD: ${guild.name} - ${guild.id}!`);

      await guild.commands.create(command.data)
    }

    const channel = guild.channels.cache.find(channel => channel.name === 'dolinho')

    if (!channel) {
      console.log(`====> DOLINHO CHANNEL IS NOT REGISTERED ON THE CHANNEL: Dolinho on the GUILD: ${guild.name} - ${guild.id}!`);

      try {
        await guild.channels.create({
          name: 'Dolinho',
          type: ChannelType.GuildText as any,
          topic: 'DOLINHO IS HERE TO HELP YOU!'
        })

        console.log(`====> DOLINHO CHANNEL REGISTERED ON THE CHANNEL: Dolinho on the GUILD: ${guild.name} - ${guild.id}!`);
      } catch (error) {
        console.log(`====> FAILED TO REGISTER THE DOLINHO CHANNEL ON THE GUILD: ${guild.name} - ${guild.id}!`);
      }
    }
  }

  // Initialize the cron job that send updates to each channel
  // TODO: armazenad valores historicos para adicionar emoji de que o valor subiu ou desceu
  cron.schedule("0 0 8-22 * * *", async () => {
    const channels = dolinhoClient.channels.cache
      .filter(channel => channel.isTextBased() ? (channel as TextChannel).name === 'dolinho' : false)
      .values() as IterableIterator<TextChannel>

    for (const channel of channels) {
      try {
        console.log(`:D DOLINHO JUST UPDATED THE CHANNEL: ${channel.name} on the GUILD: ${channel.guild.name} - ${channel.guild.id}!`)
        await channel.send(`1 USD === ${await oxr.getLatestRate('BRL')} BRL!`)
      } catch (error) {
        console.log(`:( DOLINHO FAILED TO UPDATE THE CHANNEL: ${channel.name} on the GUILD: ${channel.guild.name} - ${channel.guild.id}!`)
      }
    }
  });
})

/**
 * When the bot joins a new guild it adds all commands to the guild
 */
dolinhoClient.on(Events.GuildCreate, async (guild) => {
  console.log(`DOLINHO JOINED A FUCKING NEW GUILD: ${guild.name} - ${guild.id}!`);

  for (const command of dolinhoCommands.values()) {
    console.log(`DOLINHO IS REGISTERING COMMAND: /${command.data.name} on the GUILD: ${guild.name} - ${guild.id}!`);

    await guild.commands.create(command.data)
  }
})

dolinhoClient.on(Events.InteractionCreate, async interaction => {
  // Handle Commands
  if (interaction.isChatInputCommand()) {
    const command = dolinhoCommands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      console.log(`DOLINHO IS EXECUTING THE FUCKING COMMAND: /${interaction.commandName}!`)
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
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
await dolinhoClient.login(DISCORD_APP_TOKEN)

console.log(`DOLINHO IS FUCKING ALIVE AND RUNNING!!!`)

app.listen(port, () => {
  console.log(`DOLINHO FUCKING SERVER IS RUNNING ON: ${port}!!!`);
});
