import assert, { AssertionError } from 'assert';
import {
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';

import { CommandErrors } from '../../types';

import { api } from '../../instances/api';
import prisma from '../../instances/prisma';
import slasher from '../../instances/slasher';

import { Discord } from '@dolinho/utils';
import { SlasherCommandInteraction } from '@dolinho/slash';

import * as TradingView from '@dolinho/trading-view';

export const initializer = async () =>
  new SlashCommandBuilder()
    .setName('add')
    .setDescription('Adiciona um simbolo à Guilda')
    .addStringOption((option) =>
      option
        .setName('symbol')
        .setDescription('simbolo do Trading View a ser monitorado na guilda')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

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

    const {
      open,
      close,
      change,
      high,
      low,
      name,
      description,
      logoid,
      currency,
    } = await respone.body.json();

    // Creates or update the symbol in the DB
    const symbol = await prisma.symbol.upsert({
      where: {
        id: target,
      },
      update: {
        open,
        close,
        change,
        high,
        low,
      },
      create: {
        id: target,
        name,
        description,
        logo: logoid,
        open,
        close,
        high,
        low,
        change,
        currency,
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

    assert(guild, CommandErrors.GuildRegistryNotFound);

    for (const channel of guild.channels) {
      assert(
        channel.symbol.id !== symbol.id,
        CommandErrors.GuildAlreadyObserveSymbol
      );
    }

    await Discord.createRequiredSymbolChannels(api, prisma, guild, symbol);

    await interaction.reply({
      embeds: [
        Discord.createSuccessEmbed(
          `${symbol.name} adicionado com sucesso!`,
          'O símbolo foi adicionado com sucesso e agora pode ser monitorado na Guilda!'
        ),
      ],
      flags: [MessageFlags.Ephemeral],
    });

    // This ensures the command `/current` have a list of updated symbols;
    await slasher.resetCommandOnGuild('/view', interaction.guild);
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

        case CommandErrors.GuildAlreadyObserveSymbol:
          await interaction.reply({
            embeds: [
              Discord.createErrorEmbed(
                'Símbolo já monitorado!',
                'O símbolo fornecido já está sendo monitorado nesta Guilda. Por favor, escolha um símbolo diferente para adicionar.'
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
                'Não conseguimos adicionar seu simbolo... tente novamente mais tarde.'
              ),
            ],
            flags: MessageFlags.Ephemeral,
          });
          break;
      }
    }
  }
};
