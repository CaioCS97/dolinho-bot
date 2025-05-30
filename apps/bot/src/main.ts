import cron from 'node-cron';

import { Events } from 'discord.js';

import { ChannelTopic } from '@prisma/client';

import { Discord } from '@dolinho/utils';

import * as TradingView from '@dolinho/trading-view';

import { api } from './instances/api';
import client from './instances/client';
import prisma from './instances/prisma';
import slasher from './instances/slasher';

import * as SimulateCommand from './commands/exchanges/simulate';

import * as TradingViewAddSymbolCommand from './commands/trading-view/add-symbol';
import * as TradingViewViewSymbolCommand from './commands/trading-view/view-symbol';

import handleGuildAvailableEvent from './events/guild-available';
import handleGuildMemberAddEvent from './events/guild-member-add';
import handleChannelDeleteEvent from './events/channel-delete';
import handleGuildDeleteEvent from './events/guild-delete';
import handleGuildCreateEvent from './events/guild-create';

/**
 * Register all client events
 */
client.on(Events.ClientReady, async (): Promise<void> => {
  console.log('Discord Client ready!');
});

client.on(Events.Error, (error) => {
  console.log('Error', error);
  process.exit(1);
});

client.on(Events.GuildCreate, handleGuildCreateEvent);
client.on(Events.GuildDelete, handleGuildDeleteEvent);
client.on(Events.GuildAvailable, handleGuildAvailableEvent);
client.on(Events.GuildMemberAdd, handleGuildMemberAddEvent);

client.on(Events.ChannelDelete, handleChannelDeleteEvent);

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
      where: {
        topic: ChannelTopic.Category,
      },
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
