import assert from 'assert';

import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  SlashCommandBuilder,
} from 'discord.js';

import { createClient } from '@supabase/supabase-js';

import { Slash } from '@dolinho/slash';
import { Database } from '@dolinho/types';

/**
 * Assertions
 */
assert(
  process.env.DISCORD_CLIENT_TOKEN,
  'process.env.DISCORD_CLIENT_TOKEN is required to run the BOT'
);

assert(
  process.env.OPEN_EXCHANGE_API_KEY,
  'process.env.OPEN_EXCHANGE_API_KEY is required to run the BOT'
);

assert(
  process.env.SUPABASE_URL,
  'process.env.SUPABASE_URL is required to run the BOT'
);

assert(
  process.env.SUPABASE_ANON_KEY,
  'process.env.SUPABASE_ANON_KEY is required to run the BOT'
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

const supabase = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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
  const { error: guildUpsertError } = await supabase
    .from('discord_guilds')
    .upsert({ guild_name: guild.name, guild_id: guild.id })
    .select();

  if (guildUpsertError) {
    throw new Error(guildUpsertError.message);
  }

  const { data: guildChannels, error: guildChannelsError } = await supabase
    .from('discord_channels')
    .select()
    .eq('guild_id', guild.id);

  if (!guildChannels?.length && !guildChannelsError) {
    const category = await guild.channels.create({
      name: 'Cotação',
      type: ChannelType.GuildCategory,
    });

    const channel = await guild.channels.create({
      name: 'USD',
      type: ChannelType.GuildText,
      parent: category.id,
    });

    const { error } = await supabase
      .from('discord_channels')
      .upsert({
        channel_id: channel.id,
        guild_id: guild.id,
      })
      .select();

    console.log(error);
  }
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
