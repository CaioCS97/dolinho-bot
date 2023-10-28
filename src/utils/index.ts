import { Client, TextChannel } from "discord.js";

export function calculateVariation(
  originalValue: number | null,
  currentValue: number | null
): [number, number] {
  if (!originalValue || !currentValue) {
    return [0, 0];
  }

  const variation = currentValue - originalValue;
  const percentage = (variation / originalValue) * 100;

  return [variation, percentage];
}

export function getAllDolinhoChannels(client: Client) {
  return client.channels.cache
    .filter((channel) =>
      channel.isTextBased()
        ? (channel as TextChannel).name === "dolinho"
        : false
    )
    .values() as IterableIterator<TextChannel>;
}
