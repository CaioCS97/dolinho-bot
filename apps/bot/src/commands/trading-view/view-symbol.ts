import assert, { AssertionError } from 'assert';
import { Guild, MessageFlags, SlashCommandBuilder } from 'discord.js';

import { Discord } from '@dolinho/utils';
import { SlasherCommandInteraction } from '@dolinho/slash';

import * as TradingView from '@dolinho/trading-view';

import prisma from '../../instances/prisma';

import { CommandErrors } from '../../types';
import { ChannelTopic } from '@prisma/client';

export const initializer = async (guild: Guild) => {
  const channels = await prisma.channel.findMany({
    where: {
      guildId: guild.id,
    },
    include: {
      symbol: true,
    },
  });

  return new SlashCommandBuilder()
    .setName('view')
    .setDescription('View the data related to the Symbol')
    .addStringOption((option) =>
      option
        .setName('symbol')
        .setDescription('The symbol used to return the data')
        .addChoices(
          ...channels
            .filter((channel) => channel.topic === ChannelTopic.Category)
            .map((channel) => ({
              name: channel.symbol.name,
              value: channel.symbol.id,
            }))
        )
        .setRequired(true)
    );
};

export const handler = async (interaction: SlasherCommandInteraction) => {
  try {
    assert(interaction.guild, CommandErrors.GuildNotDefined);
    assert(interaction.isRepliable(), CommandErrors.MessageNotRepliable);
    assert(interaction.isChatInputCommand(), CommandErrors.NotChatInputCommand);

    // Target symbol
    const target = interaction.options
      .get('symbol', true)
      .value?.toString()
      .toUpperCase() as string;

    const respone = await TradingView.symbol(target);

    // This checks if the symbol exists or not
    assert(respone.statusCode === 200, CommandErrors.SymbolDoesNotExist);

    const symbol = await respone.body.json();

    await interaction.reply({
      embeds: [Discord.createSymbolReportEmbed({ id: target, ...symbol })],
    });
  } catch (error) {
    if (error instanceof AssertionError && interaction.isRepliable()) {
      switch (error.message) {
        case CommandErrors.SymbolDoesNotExist:
          await interaction.reply({
            embeds: [
              Discord.createErrorEmbed(
                'Símbolo não encontrado ou não suportado!',
                'O símbolo fornecido não foi encontrado ou não é suportado pelo Trading View. Verifique se o símbolo está correto e tente novamente.'
              ),
            ],
            flags: MessageFlags.Ephemeral,
          });
          break;

        default:
          await interaction.reply({
            embeds: [
              Discord.createErrorEmbed(
                'Opa... Parece que alguma coisa aconteceu.',
                'Não conseguimos verificar os valores do seu simbolo... tente novamente mais tarde.'
              ),
            ],
            flags: MessageFlags.Ephemeral,
          });
          break;
      }
    }
  }
};
