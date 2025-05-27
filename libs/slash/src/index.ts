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

export type SlasherCommandInteraction =
  | Interaction
  | CommandInteraction
  | MessageComponentInteraction
  | ModalSubmitInteraction;

export type SlasherCommandInitializer = (
  guild: Guild
) => Promise<
  | Omit<SlashCommandBuilder, 'addSubcommandGroup' | 'addSubcommand'>
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandBuilder
>;

export type SlasherCommandHandler = (
  interaction: SlasherCommandInteraction,
  params: Partial<Record<string, string | string[]>> | null,
  error?: Error | undefined | unknown
) => Promise<unknown>;

export interface SlasherCommandSetup {
  initializer: SlasherCommandInitializer | null;
  handler: SlasherCommandHandler;
}

// TODO: criar os handlers que forem necessarios ex: handleGuildCreateEvent, handleGuildAvailableEvent, handleInteractionEvent
// TODO: registrar comandos globais;
export class Slasher {
  private readonly store: Array<SlasherCommandSetup> = [];

  /**
   * Saves the path `/<path>` and maps to the initializer and handler to the given path
   */
  private readonly paths = new Map<string, SlasherCommandSetup>();

  constructor(readonly client: Client) {
    assert(
      client.options.intents.has(GatewayIntentBits.Guilds),
      '`GatewayIntentBits.Guilds` intent is required so Slash library can manage commands in the Guild'
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
        for (const [path, { handler }] of this.paths.entries()) {
          const result = match(path)(this.generateInteractionPath(interaction));
          if (result) {
            await handler(interaction, result.params);
          }
        }
      } catch (error) {
        const entry = this.paths.get('error');

        if (!entry) return;

        await entry.handler(interaction, null, error);
      }
    });
  }

  /**
   * Stores the setup configuration for a slash command.
   * This method adds the provided `setup` object to an internal list,
   * effectively registering the command within the system for later use,
   * such as deployment to Discord or handling interactions.
   *
   * @param setup - The {@link SlasherCommandSetup} object containing all
   *                necessary information to define and handle the slash command,
   *                including its name, description, options, and execution logic.
   */
  public command(setup: SlasherCommandSetup) {
    this.store.push(setup);
  }

  /**
   * Registers a handler for a specific command path.
   *
   * This method associates a given path with a handler function, allowing the bot
   * to respond to specific commands or interactions. The path is stored with a
   * leading slash (`/`) for consistency.
   *
   * @param path - The command path to register. For example, `foo/:id/bar`.
   * @param handler - The function to handle the command when the path is matched.
   *
   * @example
   * ```typescript
   * slasher.handler('foo/:id/bar', async (interaction, { id }) => {
   *   await interaction.reply(`You pressed the button with ID: ${id}`);
   * });
   * ```
   *
   * @remarks
   * This method is particularly useful for handling dynamic command responses,
   * such as when a user interacts with a button or other UI element, and the
   * custom ID corresponds to a specific path.
   */
  public handler(path: string, handler: SlasherCommandHandler) {
    this.paths.set(`/${path}`, { initializer: null, handler });
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

  public initializeCommandsOnGuild = async (guild: Guild) => {
    try {
      await guild.commands.set([]);

      for (const entry of this.store) {
        if (!entry.initializer) continue;

        const slash = await entry.initializer(guild);

        this.paths.set(`/${slash.name}`, entry);

        await guild.commands.create(slash);

        console.log(`Command "/${slash.name}" initialized on ${guild.name}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  public async resetCommandOnGuild(command: string, guild: Guild) {
    const entry = this.paths.get(command);

    if (!entry) throw new Error('Slasher does not recognize the error');
    if (!entry.initializer)
      throw new Error(
        'Slasher command does not have a initializer, this means it can be just a handler'
      );

    const result = await entry.initializer(guild);

    await guild.commands.create(result);
  }

  public commands() {
    return Array.from(this.paths.keys());
  }
}
