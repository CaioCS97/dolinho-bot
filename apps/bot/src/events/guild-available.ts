import { Guild } from 'discord.js';

import prisma from '../instances/prisma';
import { api } from '../instances/api';
import welcomeMessage from './messages/welcome-message';

export default async function handleGuildAvailableEvent({ id, name }: Guild) {
  console.log(`Dolinho is available in ${name} guild!`);

  const guild = await prisma.guild.upsert({
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

  const members = await prisma.$transaction(
    // TODO: we should improve this, servers may have more than 1000 users in the future. Maybe we should do this in chunks.
    (
      await api.guilds.getMembers(id, { limit: 1000 })
    )
      .filter((member) => !member.user.bot)
      .map((member) =>
        prisma.member.upsert({
          where: {
            id: `${guild.id}:${member.user.id}`,
          },
          create: {
            id: `${guild.id}:${member.user.id}`,
            userId: member.user.id,
            guildId: guild.id,
          },
          update: {},
          include: {
            guild: true,
          },
        })
      )
  );

  for (const member of members.filter((member) => !member.welcomeMessageSent)) {
    const channel = await api.users.createDM(member.userId);

    await api.channels.createMessage(channel.id, {
      content: welcomeMessage(member.userId, member.guild.name),
    });

    await prisma.member.update({
      where: {
        id: `${member.guildId}:${member.userId}`,
      },
      data: {
        welcomeMessageSent: true,
      },
    });
  }
}
