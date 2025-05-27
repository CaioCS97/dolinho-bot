import assert, { AssertionError } from 'assert';
import { MessageFlags, SlashCommandBuilder } from 'discord.js';

import { Discord } from '@dolinho/utils';
import { SlasherCommandInteraction } from '@dolinho/slash';

import * as RemessaOnline from '@dolinho/remessa-online';

import { CommandErrors } from '../../types';

export const initializer = async () =>
  new SlashCommandBuilder()
    .setName('simulate')
    .setDescription(
      'Simulate an transaction from the specified provider, it will use the current provider exchange rate.'
    )
    .addStringOption((option) =>
      option
        .setName('provider')
        .setDescription('The provider used to simulate the operation')
        .addChoices(
          { name: 'Remessa Online', value: 'remessa-online' }
          // Add other providers here as needed, e.g.:
          // { name: 'Wise', value: 'wise' }
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('from')
        .setDescription('ISO code for the currency')
        .addChoices(
          { name: 'USD', value: 'USD' },
          { name: 'BRL', value: 'BRL' },
          { name: 'EUR', value: 'EUR' }
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('to')
        .setDescription('ISO code for the currency')
        .addChoices(
          { name: 'USD', value: 'USD' },
          { name: 'BRL', value: 'BRL' },
          { name: 'EUR', value: 'EUR' }
        )
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('ammount')
        .setDescription(
          'The floating ammount of the currency you want to simulate'
        )
        .setRequired(true)
    );

export const handler = async (interaction: SlasherCommandInteraction) => {
  try {
    assert(interaction.guild, CommandErrors.GuildNotDefined);
    assert(interaction.isRepliable(), CommandErrors.MessageNotRepliable);
    assert(interaction.isChatInputCommand(), CommandErrors.NotChatInputCommand);

    // Target symbol
    const [provider, from, to, ammount] = Discord.ensureInteractionProperties(
      interaction,
      ['provider', 'from', 'to', 'ammount']
    );

    const simulators: Record<
      string,
      (from: string, to: string, ammount: string) => Promise<string>
    > = {
      'remessa-online': RemessaOnline.simulate,
    };

    const result = await simulators[provider](from, to, ammount);

    await interaction.reply({
      content: result,
      flags: [MessageFlags.Ephemeral],
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
