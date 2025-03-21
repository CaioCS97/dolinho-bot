// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { Client }: any = require('@mathieuc/tradingview');

export interface Pediod {
  time: number; // Unix timestamp
  open: number;
  close: number;
  min: number;
  max: number;
  volume: number;
}

export class Symbols {
  #ab = new Map<string, string>();
  #ba = new Map<string, string>();

  constructor() {
    this.set('USDBRL', 'FX_IDC:USDBRL');
    this.set('PETR4', 'BMFBOVESPA:PETR4');
  }

  set(a: string, b: string) {
    this.#ab.set(a, b);
    this.#ba.set(b, a);
  }

  has(name: string | null) {
    return name ? this.#ab.has(name) : null;
  }

  get(name: string, mode: 'ab' | 'ba' = 'ab') {
    switch (mode) {
      case 'ab':
        return this.#ab.get(name);

      case 'ba':
        return this.#ba.get(name);
    }
  }

  keys() {
    return [...this.#ab.keys()];
  }

  values() {
    return [...this.#ab.values()];
  }

  entries() {
    return [...this.#ab.entries()];
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
  public getLatestPeriod(): Pediod | null {
    if (!this.#chart.periods?.length) return null;

    return this.#chart.periods[0];
  }

  public periods(): Array<Pediod> | null {
    return this.#chart.periods || null;
  }

  /**
   * Retrieves the periods within the specified timeframe.
   *
   * @param timeframe - The timeframe in milliseconds to look back from the latest period.
   * @returns An array of periods within the specified timeframe.
   */
  public getPeriodsInTimeframe(timeframe: number): Array<Pediod> | null {
    const periods = this.periods();

    if (!periods) return null;

    const [period] = periods;
    const end = period.time * 1000;
    const start = end - timeframe;

    return periods.filter(
      (period) => period.time * 1000 >= start && period.time * 1000 <= end
    );
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

  markets() {
    return [...this.#markets.entries()];
  }
}
