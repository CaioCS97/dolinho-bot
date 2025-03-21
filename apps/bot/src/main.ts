import assert from 'assert';
import cron from 'node-cron';

import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  Partials,
  SlashCommandBuilder,
} from 'discord.js';

import { REST } from '@discordjs/rest';
import { API } from '@discordjs/core';

import { Slash } from '@dolinho/slash';
import { Database } from '@dolinho/types';
import { createChannelName, hasThrown } from '@dolinho/utils';

import { createClient } from '@supabase/supabase-js';
import { MarketManager, Symbols } from '@dolinho/market';

/**
 * Assertions
 */
assert(
  process.env.DISCORD_CLIENT_TOKEN,
  'process.env.DISCORD_CLIENT_TOKEN is required to run the BOT'
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
 * Initialization Stuff
 */
const rest = new REST({ version: '10' }).setToken(
  process.env.DISCORD_CLIENT_TOKEN
);

const api = new API(rest);

const client = new Client({
  partials: [Partials.Channel, Partials.Message],
  intents: [GatewayIntentBits.Guilds],
  rest: {
    timeout: 60_000,
    retries: 10,
  },
});

const supa = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const slash = new Slash(client);

const symbols = new Symbols();
const manager = new MarketManager(symbols.values());

/**
 * Client
 */
client.on(Events.ClientReady, async (): Promise<void> => {
  console.log('Discord Client ready!');
});

client.on(Events.Error, (error) => {
  console.log('Error', error);
  process.exit(1);
});

// TODO: improve metrics
client.on(Events.GuildCreate, async (guild): Promise<void> => {
  console.log(`${guild.name} installed Dolinho`);
});

// TODO: improve metrics
client.on(Events.GuildDelete, async (guild): Promise<void> => {
  console.log(`${guild.name} uninstalled Dolinho`);
});

client.on(Events.GuildAvailable, async (guild): Promise<void> => {
  const guilds = await supa.from('guilds').select().eq('id', guild.id);
  const instance = guilds.data?.[0];

  // Should create the channel and insert the guild into the DB
  if (!instance) {
    // Create the channel
    const category = await guild.channels.create({
      name: 'Dolinho',
      type: ChannelType.GuildCategory,
    });

    // Insert into the DB
    const insert = await supa.from('guilds').insert({
      id: guild.id,
      name: guild.name,
      category_channel_id: category.id,
    });

    if (insert.error) {
      throw new Error('could not insert the data into the table');
    }
  } else {
    const categoryDoesNotExists = await hasThrown(() =>
      api.channels.get(instance.category_channel_id)
    );

    // Initialize the category channel if it doesnt exists or was deleted
    if (categoryDoesNotExists) {
      const category = await guild.channels.create({
        name: 'Dolinho',
        type: ChannelType.GuildCategory,
      });

      // Insert into the DB
      const update = await supa
        .from('guilds')
        .update({
          id: guild.id,
          category_channel_id: category.id,
        })
        .eq('id', guild.id);

      if (update.error) {
        throw new Error(update.error.message);
      }
    }
  }
});

/**
 * Command Stuff
 */
slash.command(
  async () =>
    new SlashCommandBuilder()
      .setName('usd')
      .setDescription('Informa a cotação atual do dolar'),
  async (interaction) => {
    if (!interaction.isRepliable()) return;

    await interaction.reply({
      content: `A cotação atual do dolar é de: $ 6.66 trumps`,
      ephemeral: true,
    });
  }
);

slash.command(
  async () =>
    new SlashCommandBuilder()
      .setName('add')
      .setDescription('Adiciona um simbolo à Guilda')
      .addStringOption((option) =>
        option
          .setName('symbol')
          .setDescription('Selecione o simbolo a ser adicionado a sua guild')
          .setChoices(
            ...symbols.keys().map((name) => ({
              name: name,
              value: name,
            }))
          )
          .setRequired(true)
      ),
  async (interaction) => {
    assert(interaction.guild?.id);
    assert(interaction.isRepliable());
    assert(interaction.isChatInputCommand());

    const symbol = interaction.options.get('symbol')?.value as string | null;

    if (!symbol) {
      await interaction.reply({
        content: `ERROR: Symbol was not provided!`,
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const tradingViewSymbol = symbols.get(symbol);

    if (!tradingViewSymbol) {
      await interaction.reply({
        content: `ERROR: Symbol is not supported!`,
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const guilds = await supa
      .from('guilds')
      .select()
      .eq('id', interaction.guild.id);

    assert(guilds.data);

    const [{ category_channel_id }] = guilds.data;

    const market = manager.get(tradingViewSymbol);
    const period = market?.getLatestPeriod();
    const close = period?.close || 0;

    const channel = await interaction.guild.channels.create({
      name: createChannelName(symbol, close, null),
      parent: category_channel_id,
    });

    const insert = await supa.from('symbols').insert({
      guild_id: interaction.guild.id,
      channel_id: channel.id,
      symbol: tradingViewSymbol,
    });

    if (insert.error) {
      throw new Error(insert.error.message);
    }

    await interaction.reply({
      content: `Symbolo added successfully!`,
      flags: MessageFlags.Ephemeral,
    });
  }
);

/**
 * CRON
 */
cron.schedule('0 0 9 * * 1-5', async () => {
  try {
    console.log('foo');
  } catch (error) {
    console.error(error);
  }
});

// 10 to 17h because 9 and 18 are already scheduled with the cron above and bellow
cron.schedule('0 0 10-17 * * 1-5', async () => {
  try {
    console.log('foo');
  } catch (error) {
    console.error(error);
  }
});

// Closing the market
cron.schedule('0 0 18 * * 1-5', async () => {
  try {
    console.log('foo');
  } catch (error) {
    console.error(error);
  }
});

// every 30 minutes, update all channel names
cron.schedule('*/15 * * * 1-5', async () => {
  try {
    const markets = manager.markets();

    const channels = await supa
      .from('symbols')
      .select('*')
      .in(
        'symbol',
        markets.map((market) => market[0])
      );

    assert(channels.data);

    for (const channel of channels.data) {
      console.log(`Updating channel ${channel.channel_id} ${channel.symbol}`);

      const market = manager.get(channel.symbol);

      if (!market) continue;

      const period = market.getLatestPeriod();

      if (!period) continue;

      const symbol = symbols.get(channel.symbol, 'ba');

      if (!symbol) continue;

      const delta = channel.latest_period_close
        ? period.close - channel.latest_period_close
        : null;

      await supa
        .from('symbols')
        .update({
          latest_period_close: period.close,
        })
        .eq('id', channel.id);

      console.log('updated supa');

      await api.channels.edit(channel.channel_id, {
        name: createChannelName(symbol, period.close, delta),
      });

      console.log('updated channel');
    }
  } catch (error) {
    console.log(error);
  }
});

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
