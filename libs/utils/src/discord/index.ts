import { API } from '@discordjs/core';
import { Colors, EmbedBuilder } from 'discord.js';
import { Symbol } from '@prisma/client';

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

export function formatStringForDiscordTitles(str: string) {
  return str.replaceAll('.', '․');
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

export function createChannelName(
  name: string,
  quotation: number,
  delta: number | null,
  decimalPlaces = 2
) {
  return [
    name,
    `${quotation.toFixed(decimalPlaces)}${getDirectionSymbol(delta)}`,
  ]
    .map(formatStringForDiscordTitles)
    .filter(Boolean)
    .join('・');
}

export function createSymbolEmbed(symbol: Symbol) {
  const fixedChange = symbol.change.toFixed(2);
  const directionSymbol = getDirectionSymbol(symbol.change);
  const closeText = `$${symbol.close} (${fixedChange}) ${directionSymbol}`;

  return new EmbedBuilder()
    .setColor(Colors.Green)
    .setAuthor({
      name: `${symbol.name}・${closeText}`,
      iconURL: symbol.logo.length
        ? `https://s3-symbol-logo.tradingview.com/${symbol.logo}.svg`
        : undefined,
      url: `https://br.tradingview.com/symbols/${symbol.id}/`,
    })
    .setDescription(symbol.description)
    .setFields(
      {
        name: 'Open',
        value: `$${symbol.open.toFixed(2)}`,
        inline: true,
      },
      {
        name: 'Close',
        value: closeText,
        inline: true,
      },
      {
        name: 'Low',
        value: `$${symbol.low.toFixed(2)}`,
        inline: true,
      },
      {
        name: 'High',
        value: `$${symbol.high.toFixed(2)}`,
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
