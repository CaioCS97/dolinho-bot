import { Market, MarketEvents } from "../index";

import { EventEmitter } from "events";

describe("Market", () => {
  let market: Market;

  beforeEach(() => {
    market = new Market();
  });

  describe("setOpenningRate", () => {
    it("should set opening rate correctly and emit event", () => {
      const mockEmit = jest.spyOn(EventEmitter.prototype, "emit");
      market.setOpenningRate(100);
      expect(mockEmit).toHaveBeenCalledWith(MarketEvents.Openning, {
        rate: 100,
      });
    });
  });

  describe("setClosingRate", () => {
    it("should set closing rate correctly and emit event", () => {
      const mockEmit = jest.spyOn(EventEmitter.prototype, "emit");

      market.setOpenningRate(100);
      market.setClosingRate(150);

      expect(mockEmit).toHaveBeenCalledWith(MarketEvents.Closing, {
        rate: 150,
        variation: 50,
        percentage: 50,
      });
    });
  });

  describe("setCurrentRate", () => {
    it("should set current rate correctly and emit event", () => {
      const mockEmit = jest.spyOn(EventEmitter.prototype, "emit");
      market.setCurrentRate(100);

      expect(mockEmit).toHaveBeenCalledWith(MarketEvents.Lastest, {
        rate: 100,
        variation: 0,
        percentage: 0,
      });
    });
  });
});
