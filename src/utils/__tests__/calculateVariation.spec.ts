import { calculateVariation } from "..";

describe("calculateVariation", () => {
  it("should return [0, 0] when originalValue or currentValue is null", () => {
    // @ts-ignore
    expect(calculateVariation(null, 100)).toEqual([0, 0]);
    // @ts-ignore
    expect(calculateVariation(100, null)).toEqual([0, 0]);
  });

  it("should calculate variation and percentage correctly", () => {
    // @ts-ignore
    expect(calculateVariation(100, 150)).toEqual([50, 50]);
    // @ts-ignore
    expect(calculateVariation(150, 100)).toEqual([-50, -33.33333333333333]);
  });
});
