import assert from 'assert';
import { Client, Partials, GatewayIntentBits } from 'discord.js';

assert(
  process.env.DISCORD_CLIENT_TOKEN,
  'process.env.DISCORD_CLIENT_TOKEN is required to run the BOT'
);

export default new Client({
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
  ],
  rest: {
    timeout: 60_000,
    retries: 10,
  },
});
