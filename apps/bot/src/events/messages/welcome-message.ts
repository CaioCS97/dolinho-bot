const welcomeMessage = (userId: string, guildName: string) => `\n
Hey <@${userId}>, welcome to the **${guildName}** guild!

I'm **Dolinho**, your friendly bot assistant. I'm here to help you monitor currency conversion rates, like **USD to BRL**, and keep track of exchange rates.

**Here's what I can do for you in ${guildName}'s guild:**
* \`/view\` - Check the current value of a specific currency symbol.
* \`/simulate\` - Simulate currency conversions for a given exchange.

**Note:** commands can only be used in **${guildName}** guild for the moment.
`;

export default welcomeMessage;
