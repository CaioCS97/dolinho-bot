import assert from 'assert';

import {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  SlashCommandBuilder,
} from 'discord.js';

import { Slash } from '@dolinho/slash';

assert(
  process.env.DISCORD_CLIENT_TOKEN,
  'process.env.DISCORD_CLIENT_TOKEN is required to run the BOT'
);

assert(
  process.env.OPEN_EXCHANGE_API_KEY,
  'process.env.OPEN_EXCHANGE_API_KEY is required to run the BOT'
);

/**
 * Client Stuff
 */
const client = new Client({
  partials: [Partials.Channel, Partials.Message],
  intents: [GatewayIntentBits.Guilds],
  rest: {
    timeout: 60_000,
    retries: 10,
  },
});

client.on(Events.ClientReady, async (): Promise<void> => {
  console.log('Discord Client ready!');
});

client.on(Events.Error, (error) => {
  console.log('Error', error);
  process.exit(1);
});

client.on(Events.GuildCreate, async (guild): Promise<void> => {
  console.log('joined guild');
});

client.on(Events.GuildDelete, async (guild): Promise<void> => {
  console.log('left guild');
});

client.on(Events.GuildAvailable, async (guild): Promise<void> => {
  console.log('something with the guild');
});

/**
 * Command Stuff
 */
const slash = new Slash(client);

slash.command(
  async () =>
    new SlashCommandBuilder()
      .setName('usd')
      .setDescription('Informa a cotação atual do dolar'),
  async (interaction) => {
    if (!interaction.isRepliable()) return;

    await interaction.reply({
      content: 'Foo Bar',
      ephemeral: true,
    });
  }
);

/**
 * Initialization stuff
 */
client.login(process.env.DISCORD_CLIENT_TOKEN);

/**
 * Process Stuff
 */
process.on('uncaughtException', (err) => {
  console.log(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled rejection at ', promise, `reason: ${reason}`);
  process.exit(1);
});
