import { calculateVariation } from "..";

describe("calculateVariation", () => {
  it("should return [0, 0] when originalValue and currentValue are equal", () => {
    expect(calculateVariation(100, 100)).toEqual([0, 0]);
  });

  it("should return [0, 0] when originalValue or currentValue is null", () => {
    expect(calculateVariation(null, 100)).toEqual([0, 0]);
    expect(calculateVariation(100, null)).toEqual([0, 0]);
  });

  it("should calculate variation and percentage correctly", () => {
    expect(calculateVariation(100, 150)).toEqual([50, 50]);
    expect(calculateVariation(150, 100)).toEqual([-50, -33.33333333333333]);
  });
});
