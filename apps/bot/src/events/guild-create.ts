import { Guild } from 'discord.js';
import prisma from '../instances/prisma';

export default async function handleGuildCreateEvent(guild: Guild) {
  console.log(`${guild.name} installed Dolinho! :)`);

  await prisma.guild.create({
    data: {
      id: guild.id,
      name: guild.name,
    },
  });
}
