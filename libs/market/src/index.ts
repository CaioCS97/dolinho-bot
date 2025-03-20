// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { Client }: any = require('@mathieuc/tradingview');

export class Symbols {
  #supported = new Map<string, string>();

  constructor() {
    this.#supported.set('USDBRL', 'FX_IDC:USDBRL');
    this.#supported.set('PETR4', 'BMFBOVESPA:PETR4');
  }

  has(name: string | null) {
    return name ? this.#supported.has(name) : null;
  }

  get(name: string) {
    return this.#supported.get(name);
  }

  keys() {
    return [...this.#supported.keys()];
  }

  values() {
    return [...this.#supported.values()];
  }

  entries() {
    return [...this.#supported.entries()];
  }
}

export class Market {
  #chart;

  public constructor(symbol: string) {
    const { Session } = new Client();
    const { Chart } = Session;

    this.#chart = new Chart();

    this.#chart.setMarket(symbol, {
      timeframe: 'D',
    });
  }

  /**
   * Retrieves the latest closing rate from the chart periods.
   *
   * @returns {number | null} The latest closing rate if available, otherwise null.
   */
  public getLatestPeriod() {
    if (!this.#chart.periods?.length) return null;

    return this.#chart.periods[0];
  }
}

export class MarketManager {
  #markets = new Map<string, Market>();

  constructor(symbols?: Array<string>) {
    if (symbols) {
      for (const symbol of symbols) this.add(symbol);
    }
  }

  /**
   * Checks if the specified market exists in the collection.
   *
   * @param market - The name of the market to check for existence.
   * @returns A boolean indicating whether the market exists in the collection.
   */
  has(market: string) {
    return this.#markets.has(market);
  }

  /**
   * Retrieves the market data for the specified market.
   * If the market does not exist in the collection, it will be added.
   *
   * @param market - The name of the market to retrieve.
   * @returns The market data associated with the specified market.
   */
  get(market: string) {
    if (!this.#markets.has(market)) this.add(market);

    return this.#markets.get(market);
  }

  /**
   * Adds a new market to the collection.
   *
   * @param market - The name of the market to add.
   */
  add(market: string) {
    this.#markets.set(market, new Market(market));
  }
}
