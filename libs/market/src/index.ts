import EventEmitter from 'node:events';
import { createThrottle } from '@dolinho/utils';

const { Client }: any = require('@mathieuc/tradingview');

export enum Symbols {
  USDBRL = 'FX_IDC:USDBRL',
}

export enum Events {
  Update = 'update',
}

interface InternalMarketEventsEmmiters {
  [Events.Update]: {
    close: number;
  };
}

type InternalMarketEventsHandlers = {
  [K in keyof InternalMarketEventsEmmiters]: (
    payload: InternalMarketEventsEmmiters[K]
  ) => void;
};

export class Market extends EventEmitter {
  #chart;

  public constructor(symbol: Symbols, interval = 10000) {
    super();

    const { Session } = new Client();
    const { Chart } = Session;

    this.#chart = new Chart();

    // Only update in certain intervals
    const update = createThrottle(() => {
      if (!this.#chart.periods[0]) return;

      const close = this.#chart.periods[0].close;

      this.emit(Events.Update, { close });
    }, interval);

    this.#chart.setMarket(symbol, {
      timeframe: 'D',
    });

    this.#chart.onUpdate(() => update());
  }

  /**
   * Registers an event listener for the specified event.
   *
   * @param event - The name of the event to listen for.
   * @param listener - The callback function that will be invoked when the event is emitted.
   * @returns The current instance for method chaining.
   */
  public override on<K extends keyof InternalMarketEventsHandlers>(
    event: K,
    listener: InternalMarketEventsHandlers[K]
  ): this {
    return super.on(event, listener);
  }

  /**
   * Emits an event of type `K` with the given `payload`.
   *
   * @template K - The type of the event key.
   * @param event - The event key to emit.
   * @param payload - The payload associated with the event.
   * @returns `true` if the event had listeners, `false` otherwise.
   */
  public override emit<K extends keyof InternalMarketEventsEmmiters>(
    event: K,
    payload: InternalMarketEventsEmmiters[K]
  ): boolean {
    return super.emit(event, payload);
  }

  /**
   * Retrieves the latest closing rate from the chart periods.
   *
   * @returns {number | null} The latest closing rate if available, otherwise null.
   */
  public getLatestRate() {
    if (!this.#chart.periods?.length) return null;

    return this.#chart.periods[0].close;
  }
}
