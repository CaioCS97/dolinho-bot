const welcomeMessage = (userId: string, guildName: string) => `
Hey <@${userId}>, nice to see you in ${guildName}!

The Guild is using **Dolinho**, yeah, it's me. I'm a tool that helps in monitoring currencies conversion rates like **USD to BRL** and keeping track of exchange rates.

**Here is a list of the available commands:**
* \`/view\` - Helps checking the value of a symbol;
* \`/simulate\` - Allows you to simulate the conversion rates for a give Exchange;
`;

export default welcomeMessage;
