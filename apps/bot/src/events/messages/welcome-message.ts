const welcomeMessage = (userId: string, guildName: string) => `\n
Hey <@${userId}>, welcome to the **${guildName}** server!

I'm **Dolinho**, your friendly bot assistant. I'm here to help you monitor currency conversion rates, like **USD to BRL**, and keep track of exchange rates.

**Here's what I can do for you:**
* \`/view\` - Check the current value of a specific currency symbol.
* \`/simulate\` - Simulate currency conversions for a given exchange.
`;

export default welcomeMessage;
