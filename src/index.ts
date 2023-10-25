import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  WebhookClient,
} from "discord.js";
import dotenv from "dotenv";
import cron from "node-cron";
import fetch from "node-fetch";

dotenv.config();

interface DollarRates {
  rates: Record<string, number>;
  base: string;
  timestamp: number;
  license: string;
  disclaimer: string;
}

const openExchangeRatesApiKey = process.env.OPEN_EXCHANGE_API_KEY ?? "";
const appId = process.env.APP_ID ?? "";
const appToken = process.env.APP_TOKEN ?? "";
const webhookClientId = process.env.WEBHOOK_ID;
const webhookClientToken = process.env.WEBHOOK_TOKEN;

const webhookUrl = `https://discord.com/api/webhooks/${webhookClientId}/${webhookClientToken}`;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const getUsdToBrlRate = async () => {
  try {
    const response = await fetch(
      `https://openexchangerates.org/api/latest.json?app_id=${openExchangeRatesApiKey}&prettyprint=false&show_alternative=false&show_inactive=false`
    );
    const data = (await response.json()) as DollarRates;
    return `R$ ${data.rates["BRL"].toLocaleString("pt-BR")}`;
  } catch (error) {
    console.error;
    throw error;
  }
};

async function sendRateUpdate() {
  const rate = await getUsdToBrlRate();
  const message = `O dolinha tá: ${rate} -  ${new Date().toLocaleString(
    "pt-BR"
  )}`;

  const webhookClient = new WebhookClient({
    url: webhookUrl,
  });

  webhookClient.send({
    embeds: [
      {
        title: message,
        image: {
          url:
            Number(rate.at(3)) > 4
              ? "https://istoedinheiro.com.br/wp-content/uploads/sites/17/2020/03/guedes.jpg"
              : "https://img.ibxk.com.br/2015/09/22/22172624838652.jpg?ims=328x",
        },
      },
    ],
  });
  console.log("Rate update sent:", message);
}

// Schedule rate updates to run every hour
cron.schedule("0 0 8-22 * * *", () => {
  sendRateUpdate();
});

const commands = [
  {
    name: "to_rico",
    description: "Retorna a cotação atual do dolar em reais",
  },
];

const rest = new REST({ version: "10" }).setToken(appToken);

try {
  console.log("Started refreshing application (/) commands.", appId);

  await rest.put(Routes.applicationCommands(appId), { body: commands });

  console.log("Successfully reloaded application (/) commands.");
} catch (error) {
  console.error(error);
}
//
client.on("ready", () => {
  console.log(`Logged in as ${client.user?.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "to_rico") {
    await interaction.reply(`O dolinha tá ${await getUsdToBrlRate()}`);
  }
});

client.login(appToken);
