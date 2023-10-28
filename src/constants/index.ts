import dotenv from "dotenv";

dotenv.config();

/**
 * DISCORD
 */
export const DISCORD_APP_ID = process.env.APP_ID ?? "";
export const DISCORD_APP_TOKEN = process.env.APP_TOKEN ?? "";

/**
 * OPEN EXCHANGE RATES
 */
export const OPEN_EXCHANGE_RATES_API_KEY =
  process.env.OPEN_EXCHANGE_API_KEY ?? "";

/**
 * DEVELOPMENT
 */
export const ENABLE_DEVELOPMENT_COMMANDS =
  process.env.ENABLE_DEVELOPMENT_COMMANDS === "true";
