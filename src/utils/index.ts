export function calculateVariation (originalValue: number, currentValue: number): [number, number] {
  const variation = currentValue - originalValue
  const percentage = (variation / originalValue) * 100

  return [variation, percentage]
}
