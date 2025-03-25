import { request } from 'undici';

interface Fields {
  name: string;
  description: string;
  type: string;
  logoid: string;
  close: number;
  open: number;
  high: number;
  low: number;
  change: number;
  /** Unix timesamp */
  time: number;
  update_mode: string;
}

export class TradingView {
  static symbol = async <T extends keyof Fields>(
    symbol: string,
    fields: Array<T>
  ) => {
    const response = await request(`https://scanner.tradingview.com/symbol`, {
      method: 'GET',
      query: {
        symbol,
        fields: fields.join(','),
      },
    });

    const data = await response.body.json();

    return data as Pick<Fields, T>;
  };
}
