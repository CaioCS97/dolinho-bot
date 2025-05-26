import { API } from '@discordjs/core';
import { ChatInputCommandInteraction, Colors, EmbedBuilder } from 'discord.js';
import { Symbol } from '@prisma/client';
import assert from 'assert';

export const discordChannelExist = async (
  api: API,
  channelId: string | null
) => {
  if (!channelId) return false;

  try {
    await api.channels.get(channelId);
  } catch {
    return false;
  }

  return true;
};

// https://coolsymbol.com/
export function formatStringForDiscordTitles(str: string) {
  return str
    .replaceAll('.', '․')
    .replaceAll(',', 'ˏ')
    .replaceAll('(', '（')
    .replaceAll(')', '）');
}

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

  const directionSymbol = getDirectionSymbol(symbol.change);

  return [
    symbol.name,
    `${format(symbol.close)}${directionSymbol}(${format(symbol.change)})`,
  ]
    .map(formatStringForDiscordTitles)
    .filter(Boolean)
    .join('・');
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
