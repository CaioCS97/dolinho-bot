import {
  Client,
  Collection,
  CommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

import { Market } from "../market/index.js";

export interface DolinhoCommand {
  data: SlashCommandBuilder;
  dev: boolean;
  execute: (
    client: Client,
    interaction: CommandInteraction,
    market: Market,
    commands: DolinhoCommandsCollection,
    ...args: any[]
  ) => Promise<void>;
}

export type DolinhoCommandsCollection = Collection<string, DolinhoCommand>;
