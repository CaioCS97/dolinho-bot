import { GuildMember } from 'discord.js';
import prisma from '../instances/prisma';
import { api } from '../instances/api';
import welcomeMessage from './messages/welcome-message';

export default async function handleGuildMemberAddEvent({
  user,
  guild,
}: GuildMember) {
  const member = await prisma.member.upsert({
    where: {
      id: `${guild.id}:${user.id}`,
    },
    create: {
      id: `${guild.id}:${user.id}`,
      userId: user.id,
      guildId: guild.id,
    },
    update: {},
  });

  if (!member.welcomeMessageSent) {
    const channel = await api.users.createDM(user.id);

    await api.channels.createMessage(channel.id, {
      content: welcomeMessage(user.id, guild.name),
    });

    await prisma.member.update({
      where: {
        id: `${guild.id}:${user.id}`,
      },
      data: {
        welcomeMessageSent: true,
      },
    });
  }
}
