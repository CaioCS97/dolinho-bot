import { Channel } from 'discord.js';

import prisma from '../instances/prisma';

// TODO: when a Category channel is delete, delete all the sub text channels.
// TODO: when a text channel is deleted, create it back.
export default async function handleChannelDeleteEvent(channel: Channel) {
  console.log(`channel deleted: ${channel.id}`);

  const entry = await prisma.channel.findUnique({
    where: {
      id: channel.id,
    },
  });

  if (!entry) return;

  await prisma.channel.delete({
    where: {
      id: channel.id,
    },
  });
}
