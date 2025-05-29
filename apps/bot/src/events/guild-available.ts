import { Guild } from 'discord.js';

import prisma from '../instances/prisma';

export default async function handleGuildAvailableEvent({ id, name }: Guild) {
  console.log(`Dolinho is available in ${name} guild!`);

  await prisma.guild.upsert({
    where: {
      id: id,
    },
    create: {
      id: id,
      name: name,
    },
    update: {
      id: id,
      name: name,
    },
    include: {
      channels: {
        include: {
          symbol: true,
        },
      },
    },
  });
}
