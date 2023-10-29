import { EventEmitter } from "events";
import { calculateVariation } from "../utils/index.js";

export enum MarketEvents {
  Openning = "MARKET_OPENNING",
  Closing = "MARKET_CLOSING",
  Lastest = "MARKET_LASTEST",
}

export interface MarketEventsListeners extends EventEmitter {
  on(
    event: MarketEvents.Openning,
    listener: (payload: { rate: number }) => void
  ): this;
  on(
    event: MarketEvents.Closing,
    listener: (payload: {
      rate: number;
      variation: number;
      percentage: number;
    }) => void
  ): this;
  on(
    event: MarketEvents.Lastest,
    listener: (payload: {
      rate: number;
      variation: number;
      percentage: number;
    }) => void
  ): this;
}

export class Market extends EventEmitter implements MarketEventsListeners {
  oppenningRate: number = 0;
  closingRate: number = 0;
  lastRate: number = 0;
  currentRate: number = 0;

  constructor() {
    super();
  }

  setOpenningRate(rate: number) {
    this.oppenningRate = rate;

    this.emit(MarketEvents.Openning, { rate });
  }

  setClosingRate(rate: number) {
    this.closingRate = rate;

    const [variation, percentage] = calculateVariation(
      this.oppenningRate,
      this.closingRate
    );

    this.emit(MarketEvents.Closing, { rate, variation, percentage });
  }

  setCurrentRate(rate: number) {
    // Since we cant retrieve the data from the last hour, we need to initialize the last rate with the current rate,
    // so we can calculate the variation and percentage on the first update without getting crazy and unrealistic values.
    this.lastRate = this.currentRate || rate;
    this.currentRate = rate;

    this.emit(MarketEvents.Lastest, this.getCurrentRateVariationObject());
  }

  getCurrentRateVariationObject() {
    const [variation, percentage] = calculateVariation(
      this.lastRate,
      this.currentRate
    );

    return {
      rate: this.currentRate,
      variation,
      percentage,
    };
  }
}
