import assert = require('assert');

import {
  Client,
  CommandInteraction,
  Events,
  GatewayIntentBits,
  Guild,
  Interaction,
  InteractionType,
  MessageComponentInteraction,
  ModalSubmitInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

import { match } from 'path-to-regexp';

type InteractionHandler = (
  interaction:
    | Interaction
    | CommandInteraction
    | MessageComponentInteraction
    | ModalSubmitInteraction,
  params: Partial<Record<string, string | string[]>> | null,
  error?: Error | undefined | unknown
) => Promise<unknown>;

type SlashCommandInitialization = (
  guild: Guild
) => Promise<
  | Omit<SlashCommandBuilder, 'addSubcommandGroup' | 'addSubcommand'>
  | SlashCommandSubcommandsOnlyBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandBuilder
>;

export class Slash {
  private readonly commands = new Set<
    [SlashCommandInitialization, InteractionHandler]
  >();
  private readonly handlers = new Map<string, InteractionHandler>();

  constructor(readonly client: Client) {
    assert(
      client.options.intents.has(GatewayIntentBits.Guilds),
      'GatewayIntentBits.Guilds intent is required so Slash library can manage commands in the Guild'
    );

    client.on(
      Events.GuildCreate,
      async (guild): Promise<void> => this.initializeCommandsOnGuild(guild)
    );

    client.on(
      Events.GuildAvailable,
      async (guild): Promise<void> => this.initializeCommandsOnGuild(guild)
    );

    client.on(Events.InteractionCreate, async (interaction) => {
      try {
        for (const [handlerPath, handler] of this.handlers.entries()) {
          const result = match(handlerPath)(
            this.generateInteractionPath(interaction)
          );

          if (result) {
            await handler(interaction, result.params);
          }
        }
      } catch (error) {
        for (const [handlerPath, handler] of this.handlers.entries()) {
          if (match(handlerPath)('error')) {
            await handler(interaction, null, error);
          }
        }
      }
    });
  }

  public command(
    command: SlashCommandInitialization,
    handler: InteractionHandler
  ) {
    this.commands.add([command, handler]);
  }

  public handler(path: string, handler: InteractionHandler) {
    this.handlers.set(path, handler);
  }

  private readonly generateInteractionPath = (
    interaction: Interaction
  ): string => {
    switch (interaction.type) {
      case InteractionType.ApplicationCommand:
        return `/${interaction.commandName}`;

      case InteractionType.ModalSubmit:
      case InteractionType.MessageComponent:
        return `/${interaction.customId}`;

      default:
        throw new Error(`Unknown interaction type ${interaction.type}`);
    }
  };

  private initializeCommandsOnGuild = async (guild: Guild) => {
    try {
      await guild.commands.set([]);

      for (const [command, handler] of this.commands.values()) {
        const commandResult = await command(guild);

        await guild.commands.create(commandResult);

        this.handler(`/${commandResult.name}`, handler);

        console.log(
          `Command "/${commandResult.name}" initialized on ${guild.name}`
        );
      }
    } catch (error) {
      console.error(error);
    }
  };
}
