export type OXRClient = ReturnType<typeof createOpenExchangeClient>

export type OXRInternationalCurrencies = "USD" | "EUR" | "GBP" | "JPY" | "BRL";

export interface OXRQueryParams {
  'app_id': string,
  readonly [key: string]: string | number | boolean;
}

export interface OXEDollarRates {
  rates: Record<string, number>;
  base: string;
  timestamp: number;
  license: string;
  disclaimer: string;
}

const request = (method: 'GET', path: string, query: OXRQueryParams): Promise<Response> => {
  const url = `https://openexchangerates.org/api` + path + Object.entries(query).reduce((str, [key, value]) => str + `${str.length ? '&' : '?'}${key}=${value}`, '')

  return fetch(url, { method })
}

const getHistoricalRates = async (appId: string, currency: OXRInternationalCurrencies, date: Date = new Date): Promise<OXEDollarRates> => {
  const res = await request('GET', `/historical/${date.toISOString().slice(0,10)}.json`, {
    'app_id': appId,
    symbols: currency + ',USD',
    'prettyprint': false,
  })

  return res.json() as Promise<OXEDollarRates>
}

export const createOpenExchangeClient = (openExchangeRatesApiKey: string) => {
  const getTodayRate = async (currency: OXRInternationalCurrencies): Promise<number> => {
    const res = await getHistoricalRates(openExchangeRatesApiKey, currency, new Date())

    console.log(res)

    return res.rates[currency]
  }

  const getYesterdayRate = async (currency: OXRInternationalCurrencies): Promise<number> => {
    const date = new Date()

    date.setDate(date.getDate() - 1)

    const res = await getHistoricalRates(openExchangeRatesApiKey, currency, date)

    return res.rates[currency]
  }

  const getLatestRate = getTodayRate

  return {
    getLatestRate,
    getTodayRate,
    getYesterdayRate,
  }
}
