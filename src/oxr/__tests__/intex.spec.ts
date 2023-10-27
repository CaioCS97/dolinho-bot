import { OPEN_EXCHANGE_RATES_API_KEY } from "../../constants";
import { createOpenExchangeClient } from "..";

describe('oxr', () => {
  let client: ReturnType<typeof createOpenExchangeClient>;

  beforeEach(() => {
    client = createOpenExchangeClient(OPEN_EXCHANGE_RATES_API_KEY)
  })

  it('should define OPEN_EXCHANGE_RATES_API_KEY', () => {
    expect(OPEN_EXCHANGE_RATES_API_KEY).toBeDefined()
    expect(typeof OPEN_EXCHANGE_RATES_API_KEY).toBe('string')
    expect(OPEN_EXCHANGE_RATES_API_KEY.length).toBeGreaterThan(0)
  })

  describe('createOpenExchangeClient', () => {
    it('should return a client', () => {
      expect(client).toBeDefined()
      expect(typeof client).toBe('object')
    })
  })

  describe('getLatestRate', () => {
    it('should return a number', async () => {
      const rate = await client.getLatestRate('BRL')

      expect(rate).toBeDefined()
      expect(typeof rate).toBe('number')
    })
  })
})