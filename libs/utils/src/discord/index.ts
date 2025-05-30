import { API, APIChannel, ChannelType, OverwriteType } from '@discordjs/core';
import {
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
  PermissionsBitField,
} from 'discord.js';
import {
  Channel,
  ChannelTopic,
  Guild,
  PrismaClient,
  Symbol,
} from '@prisma/client';
import assert from 'assert';

export function getDirectionSymbol(value: number | null) {
  switch (true) {
    case value && value > 0:
      return `▲`;

    case value && value < 0:
      return `▼`;

    default:
      return '';
  }
}

export function createChannelName(symbol: Symbol) {
  const { format } = new Intl.NumberFormat('en-US');

  return [
    symbol.name,
    [
      format(symbol.close),
      getDirectionSymbol(symbol.change),
      `(${symbol.change > 0 ? '+' : ''}${format(symbol.change)})`,
    ].join(' '),
  ].join(' · ');
}

export function createSymbolReportEmbed(
  symbol: Pick<
    Symbol,
    | 'id'
    | 'close'
    | 'change'
    | 'name'
    | 'description'
    | 'open'
    | 'close'
    | 'high'
    | 'low'
  >
) {
  const { format } = new Intl.NumberFormat('en-US');

  const fixedClose = format(symbol.close);
  const fixedChange = format(symbol.change);
  const directionSymbol = getDirectionSymbol(symbol.change);
  const closeText = `$${fixedClose} ${directionSymbol} (${fixedChange})`;

  return new EmbedBuilder()
    .setColor(Colors.Green)
    .setAuthor({
      name: `${symbol.name}・${closeText}`,
      url: `https://www.tradingview.com/symbols/${symbol.id}/`,
    })
    .setDescription(symbol.description)
    .setFields(
      {
        name: 'Open',
        value: `$${format(symbol.open)}`,
        inline: true,
      },
      {
        name: 'Close',
        value: closeText,
        inline: true,
      },
      {
        name: 'High',
        value: `$${format(symbol.high)}`,
        inline: true,
      },
      {
        name: 'Low',
        value: `$${format(symbol.low)}`,
        inline: true,
      }
    );
}

export function createSuccessEmbed(title: string, description: string) {
  return new EmbedBuilder()
    .setColor(Colors.Green)
    .setTitle(title)
    .setDescription(description);
}

export function createErrorEmbed(title: string, description: string) {
  return new EmbedBuilder()
    .setColor(Colors.Red)
    .setTitle(title)
    .setDescription(description);
}

export function ensureInteractionProperties(
  interaction: ChatInputCommandInteraction,
  properties: Array<string>
): Array<string> {
  return properties.reduce((results, property) => {
    const data = interaction.options
      .get(property, true)
      .value?.toString() as string;

    assert(Boolean(data), `Missing property ${property} in the interaction`);

    return [...results, data];
  }, [] as Array<string>);
}

export async function createSymbolCategoryChannel(
  api: API,
  prisma: PrismaClient,
  guild: Guild,
  symbol: Symbol
) {
  const channel = await api.guilds.createChannel(guild.id, {
    name: createChannelName(symbol),
    type: ChannelType.GuildCategory,
  });

  await prisma.channel.create({
    data: {
      id: channel.id,
      topic: ChannelTopic.Category,
      guild: {
        connect: {
          id: guild.id,
        },
      },
      symbol: {
        connect: {
          id: symbol.id,
        },
      },
    },
  });

  return channel;
}

export async function createSymbolNewsTextChannel(
  api: API,
  prisma: PrismaClient,
  guild: Guild,
  symbol: Symbol,
  parent: APIChannel
) {
  const channel = await api.guilds.createChannel(guild.id, {
    name: `Noticias`,
    topic: `Noticias relacionadas a ${symbol.name}.`,
    type: ChannelType.GuildText,
    permission_overwrites: [
      {
        id: guild.id, // Overrides for @everyone role
        type: OverwriteType.Role,
        deny: PermissionsBitField.Flags.SendMessages.toString(), // Denies viewing the channel
      },
    ],
    parent_id: parent.id,
  });

  await prisma.channel.create({
    data: {
      id: channel.id,
      topic: ChannelTopic.News,
      guild: {
        connect: {
          id: guild.id,
        },
      },
      symbol: {
        connect: {
          id: symbol.id,
        },
      },
    },
  });

  return channel;
}

export async function createSymbolDiscussionTextChannel(
  api: API,
  prisma: PrismaClient,
  guild: Guild,
  symbol: Symbol,
  parent: APIChannel
) {
  const channel = await api.guilds.createChannel(guild.id, {
    name: `Discussão`,
    topic: `Discuta assuntos relacionados a ${symbol.name}.`,
    type: ChannelType.GuildText,
    parent_id: parent.id,
  });

  await prisma.channel.create({
    data: {
      id: channel.id,
      topic: ChannelTopic.Discussion,
      guild: {
        connect: {
          id: guild.id,
        },
      },
      symbol: {
        connect: {
          id: symbol.id,
        },
      },
    },
  });

  return channel;
}

export async function createRequiredSymbolChannels(
  api: API,
  prisma: PrismaClient,
  guild: Guild,
  symbol: Symbol
) {
  const categoryChannel = await createSymbolCategoryChannel(
    api,
    prisma,
    guild,
    symbol
  );

  await createSymbolNewsTextChannel(
    api,
    prisma,
    guild,
    symbol,
    categoryChannel
  );

  await createSymbolDiscussionTextChannel(
    api,
    prisma,
    guild,
    symbol,
    categoryChannel
  );
}

export async function deleteChannel(
  api: API,
  prisma: PrismaClient,
  guild: Guild,
  channel: Channel
) {
  // Delete the channel from Discord
  // This action will also trigger the Events.ChannelDelete event listener,
  // which should handle DB cleanup if this function's DB cleanup part fails or is delayed.
  await api.channels.delete(channel.id);

  await prisma.channel.delete({
    where: {
      id: channel.id,
    },
  });
}
