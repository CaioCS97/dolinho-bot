/* eslint-disable @typescript-eslint/no-unused-vars */
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

type SlashCommandInitializer = (
  guild: Guild
) => Promise<
  | Omit<SlashCommandBuilder, 'addSubcommandGroup' | 'addSubcommand'>
  | SlashCommandSubcommandsOnlyBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandBuilder
>;

type SlashCommandHandler = (
  interaction:
    | Interaction
    | CommandInteraction
    | MessageComponentInteraction
    | ModalSubmitInteraction,
  params: Partial<Record<string, string | string[]>> | null,
  error?: Error | undefined | unknown
) => Promise<unknown>;

interface SlashCommandStoreEntry {
  initializer: SlashCommandInitializer | null;
  handler: SlashCommandHandler;
}

export class Slasher {
  private readonly store: Array<SlashCommandStoreEntry> = [];

  /**
   * Saves the path `/foo` and maps to the initializer and handler to the given path
   */
  private readonly paths = new Map<string, SlashCommandStoreEntry>();

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
   * Registers a new slash command by providing its initializer and handler.
   *
   * @param initializer - An object or function that defines the structure and metadata
   * of the slash command, such as its name, description, and options.
   * @param handler - A function that handles the execution of the slash command
   * when it is invoked by a user.
   *
   * @example
   * // Registering a simple slash command
   * slasher.command(
   *   async (guild) => {
   *     return new SlashCommandBuilder()
   *       .setName('ping')
   *       .setDescription('Replies with Pong!');
   *   },
   *   async (interaction) => {
   *     if (interaction.isCommand()) {
   *       await interaction.reply('Pong!');
   *     }
   *   }
   * );
   *
   * @example
   * // Registering a slash command with options
   * slasher.command(
   *   async (guild) => {
   *     return new SlashCommandBuilder()
   *       .setName('echo')
   *       .setDescription('Replies with your input')
   *       .addStringOption(option =>
   *         option.setName('message')
   *           .setDescription('The message to echo')
   *           .setRequired(true)
   *       );
   *   },
   *   async (interaction) => {
   *     if (interaction.isCommand()) {
   *       const message = interaction.options.getString('message');
   *       await interaction.reply(`You said: ${message}`);
   *     }
   *   }
   * );
   */
  public command(
    initializer: SlashCommandInitializer,
    handler: SlashCommandHandler
  ) {
    this.store.push({ initializer, handler });
  }

  /**
   * Registers a handler for a specific slash command path.
   *
   * @param path - The path of the slash command. This should be a string representing the command's endpoint.
   * @param handler - The function that will handle the slash command. It must conform to the `SlashCommandHandler` type.
   */
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
  public handler(path: string, handler: SlashCommandHandler) {
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
