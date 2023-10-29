import * as url from "url";

import { Collection, Guild } from "discord.js";
import { DolinhoCommand, DolinhoCommandsCollection } from "../types";

import { ENABLE_DEVELOPMENT_COMMANDS } from "../constants/index.js";
import fs from "fs";
import path from "path";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

export async function loadDolinhoSlashCommandsFromFileSystem(): Promise<DolinhoCommandsCollection> {
  const commands = new Collection<string, DolinhoCommand>();

  const files = fs.readdirSync(path.join(__dirname, "commands"));

  for (const file of files) {
    const { default: command } = await import(
      new URL(path.join("commands", file), import.meta.url).toString()
    );

    commands.set(command.data.name, command);
  }

  return commands;
}

export async function loadDolinhoSlashCommandsOnGuild(
  availableDolinhoCommands: DolinhoCommandsCollection,
  guild: Guild
) {
  const commands = guild.commands;

  // Reset all commands of an guild, this ensures that when we don't have
  // a command on our files any more (or disabled develpment commands),
  // it will be removed from the guild
  await commands.set([]);

  // Loop through all available commands and add them to the guild
  for (const [, command] of availableDolinhoCommands) {
    if (!ENABLE_DEVELOPMENT_COMMANDS && command.dev) continue; // Skip development commands

    console.log(
      `====> DOLINHO IS REGISTERING COMMAND: /${command.data.name} on the GUILD: ${guild.name} - ${guild.id}!`
    );

    await commands.create(command.data);
  }
}
