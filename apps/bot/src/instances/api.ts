import { API } from '@discordjs/core';
import { REST } from '@discordjs/rest';
import assert from 'assert';

assert(
  process.env.DISCORD_CLIENT_TOKEN,
  'process.env.DISCORD_CLIENT_TOKEN is required to run the BOT'
);

export const rest = new REST({ version: '10' }).setToken(
  process.env.DISCORD_CLIENT_TOKEN
);

export const api = new API(rest);
