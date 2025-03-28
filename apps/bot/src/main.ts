import assert, { AssertionError } from 'assert';
import cron from 'node-cron';

import {
  ChannelType,
  Client,
  Events,
  GatewayIntentBits,
  // MessageFlags,
  Partials,
  SlashCommandBuilder,
} from 'discord.js';

import { REST } from '@discordjs/rest';
import { API } from '@discordjs/core';

import { Slash } from '@dolinho/slash';
import { Discord } from '@dolinho/utils';
import * as TradingView from '@dolinho/trading-view';

import { PrismaClient } from '@prisma/client';

/**
 * Assertions
 */
assert(
  process.env.DATABASE_URL,
  'process.env.DATABASE_URL is required to run the BOT'
);
assert(
  process.env.DISCORD_CLIENT_TOKEN,
  'process.env.DISCORD_CLIENT_TOKEN is required to run the BOT'
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

const slash = new Slash(client);

const prisma = new PrismaClient();

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

  const category = await api.guilds.createChannel(guild.id, {
    name: 'Dolinho',
    type: ChannelType.GuildCategory,
  });

  console.log('foo');

  await prisma.guild.create({
    data: {
      id: guild.id,
      name: guild.name,
      category_channel_id: category.id,
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

  const instance = await prisma.guild.upsert({
    where: {
      id: guild.id,
    },
    create: {
      id: guild.id,
      name: guild.name,
      category_channel_id: null,
    },
    update: {
      id: guild.id,
      name: guild.name,
    },
  });

  // Should create the channel if the channel was deleted when the bot is offline
  if (!(await Discord.discordChannelExist(api, instance.category_channel_id))) {
    const category = await api.guilds.createChannel(instance.id, {
      name: 'Dolinho',
      type: ChannelType.GuildCategory,
    });

    await prisma.guild.update({
      where: {
        id: instance.id,
      },
      data: {
        category_channel_id: category.id,
      },
    });
  }
});

// TODO: Remove the deleted channel from the database if the user delete it;
client.on(Events.ChannelDelete, async (channel) => {
  console.log(`channel deleted: ${channel.id}`);
});

// TODO: If a channel that we owns is updated for watever reason, check which kind of update was made and revert it back;
client.on(Events.ChannelUpdate, async (channel) => {
  console.log(`channel updated: ${channel.id}`);
});

/**
 * Command Stuff
 */
slash.command(
  async () => {
    // TODO: pegar uma lista de todos os simbolos disponiveis na guilda e adicionar como opções;
    // TODO: adicionar uma maneira de resetar comandos especificos para certas guildas para que essa lista seja atualizada
    // toda vez que o comando de `add` for executado;
    return new SlashCommandBuilder()
      .setName('usd')
      .setDescription('Informa a cotação atual do dolar');
  },
  async (interaction) => {
    if (!interaction.isRepliable()) return;

    await interaction.reply({
      content: `A cotação atual do dolar é de: $ 6.66 trumps`,
      ephemeral: true,
    });
  }
);

enum AddCommandErrors {
  GuildNotDefined = 'guild_not_defined',
  MessageNotRepliable = 'message_not_repliable',
  NotChatInputCommand = 'not_chat_input_command',
  SymbolDoesNotExist = 'symbol_does_not_exist',
  GuildRegistryNotFound = 'guild_registry_not_found',
  GuildAlreadyObserveSymbol = 'guild_already_observe_symbol',
}

slash.command(
  async () =>
    new SlashCommandBuilder()
      .setName('add')
      .setDescription('Adiciona um simbolo à Guilda')
      .addStringOption((option) =>
        option
          .setName('symbol')
          .setDescription('simbolo do Trading View a ser monitorado na guilda')
          .setRequired(true)
      ),
  async (interaction) => {
    try {
      assert(interaction.guild, AddCommandErrors.GuildNotDefined);
      assert(interaction.isRepliable(), AddCommandErrors.MessageNotRepliable);
      assert(
        interaction.isChatInputCommand(),
        AddCommandErrors.NotChatInputCommand
      );

      const target = interaction.options
        .get('symbol', true)
        .value?.toString()
        .toUpperCase() as string;

      // BMFBOVESPA:PETR4
      const respone = await TradingView.symbol(target);

      // This checks if the symbol exists or not
      assert(respone.statusCode === 200, AddCommandErrors.SymbolDoesNotExist);

      const data = await respone.body.json();

      // Creates or update the symbol in the DB
      const symbol = await prisma.symbol.upsert({
        where: {
          id: target,
        },
        update: {
          open: data.open,
          close: data.close,
          change: data.change,
          high: data.high,
          low: data.low,
        },
        create: {
          id: target,
          name: data.name,
          description: data.description,
          logo: data.logoid,
          open: data.open,
          close: data.close,
          high: data.high,
          low: data.low,
          change: data.change,
        },
      });

      const guild = await prisma.guild.findFirst({
        where: {
          id: interaction.guild.id,
        },
        include: {
          channels: {
            include: {
              symbol: true,
            },
          },
        },
      });

      assert(guild, AddCommandErrors.GuildRegistryNotFound);

      console.log(guild?.channels);

      for (const channel of guild.channels) {
        assert(
          channel.symbol.id !== symbol.id,
          AddCommandErrors.GuildAlreadyObserveSymbol
        );
      }

      const channel = await interaction.guild.channels.create({
        name: Discord.createChannelName(
          symbol.name,
          symbol.close,
          symbol.change,
          2
        ),
        parent: guild.category_channel_id,
      });

      await prisma.channel.create({
        data: {
          id: channel.id,
          guild: {
            connect: {
              id: interaction.guild.id,
            },
          },
          symbol: {
            connect: {
              id: symbol.id,
            },
          },
        },
      });

      await interaction.reply({
        embeds: [
          Discord.createSuccessEmbed(
            `${symbol.name} adicionado com sucesso!`,
            'O símbolo foi adicionado com sucesso e agora pode ser monitorado na Guilda!'
          ),
          Discord.createSymbolEmbed(symbol),
        ],
      });
    } catch (error) {
      if (error instanceof AssertionError && interaction.isRepliable()) {
        switch (error.message) {
          case AddCommandErrors.SymbolDoesNotExist:
            await interaction.reply({
              embeds: [
                Discord.createErrorEmbed(
                  'Símbolo não encontrado ou não suportado!',
                  'O símbolo fornecido não foi encontrado ou não é suportado pelo Trading View. Verifique se o símbolo está correto e tente novamente.'
                ),
              ],
            });
            break;

          case AddCommandErrors.GuildAlreadyObserveSymbol:
            await interaction.reply({
              embeds: [
                Discord.createErrorEmbed(
                  'Símbolo já monitorado!',
                  'O símbolo fornecido já está sendo monitorado nesta Guilda. Por favor, escolha um símbolo diferente para adicionar.'
                ),
              ],
            });
            break;

          default:
            await interaction.reply({
              embeds: [
                Discord.createErrorEmbed(
                  'Opa... Parece que alguma coisa aconteceu.',
                  'Não conseguimos adicionar seu simbolo... tente novamente mais tarde.'
                ),
              ],
            });
            break;
        }
      }
    }
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
    console.log('should update the channels');
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
