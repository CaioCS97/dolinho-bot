import cron from 'node-cron';

import { Events } from 'discord.js';

import { Discord } from '@dolinho/utils';

import * as TradingView from '@dolinho/trading-view';

import { api } from './instances/api';
import client from './instances/client';
import prisma from './instances/prisma';
import slasher from './instances/slasher';

import * as SimulateCommand from './commands/exchanges/simulate';

import * as TradingViewAddSymbolCommand from './commands/trading-view/add-symbol';
import * as TradingViewViewSymbolCommand from './commands/trading-view/view-symbol';

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

/**
 * Add channels to the DB
 */
client.on(Events.GuildCreate, async (guild): Promise<void> => {
  console.log(`${guild.name} installed Dolinho! :)`);

  await prisma.guild.create({
    data: {
      id: guild.id,
      name: guild.name,
    },
  });
});

/**
 * Remove all the related channels from the DB
 */
client.on(Events.GuildDelete, async (guild): Promise<void> => {
  console.log(`${guild.name} uninstalled Dolinho! :(`);

  const instance = await prisma.guild.findFirst({
    where: {
      id: guild.id,
    },
    include: {
      channels: true,
    },
  });

  if (!instance) return;

  await prisma.guild.delete({
    where: {
      id: instance.id,
    },
    include: {
      channels: true,
    },
  });
});

client.on(Events.GuildAvailable, async (guild): Promise<void> => {
  console.log(`Dolinho is available in ${guild.name} guild!`);

  await prisma.guild.upsert({
    where: {
      id: guild.id,
    },
    create: {
      id: guild.id,
      name: guild.name,
    },
    update: {
      id: guild.id,
      name: guild.name,
    },
  });
});

// TODO: Remove the deleted channel from the database if the user delete it;
client.on(Events.ChannelDelete, async (channel) => {
  console.log(`channel deleted: ${channel.id}`);

  const entry = await prisma.channel.findUnique({
    where: {
      id: channel.id,
    },
  });

  if (!entry) return;

  await prisma.channel.delete({
    where: {
      id: channel.id,
    },
  });
});

// TODO: If a channel that we owns is updated for watever reason, check which kind of update was made and revert it back;
client.on(Events.ChannelUpdate, async (channel) => {
  console.log(`channel updated: ${channel.id}`);
});

/**
 * Register all commands
 */
slasher.command(SimulateCommand);

slasher.command(TradingViewAddSymbolCommand);
slasher.command(TradingViewViewSymbolCommand);

/**
 * CRON
 */
cron.schedule('*/15 * * * 1-5', async () => {
  try {
    // Update symbols data
    const symbols = await prisma.symbol.findMany();

    for (const symbol of symbols) {
      const response = await TradingView.symbol(symbol.id);

      const { open, close, change, high, low, currency } =
        await response.body.json();

      console.log(`Updating symbol ${symbol.id} ${close}`);

      await prisma.symbol.update({
        where: {
          id: symbol.id,
        },
        data: {
          open,
          close,
          change,
          high,
          low,
          currency,
        },
      });
    }

    // Update channels data
    const channels = await prisma.channel.findMany({
      include: {
        symbol: true,
      },
    });

    for (const { id, symbol } of channels) {
      console.log(
        `Updating channel ${id} ${symbol.id} ${symbol.name} ${symbol.close}`
      );

      await api.channels.edit(id, {
        name: Discord.createChannelName(symbol),
        topic: `${symbol.name} - ${symbol.description}`,
      });
    }
  } catch (error) {
    console.log(error);
  }
});

/**
 * Initialize Discord Client
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
