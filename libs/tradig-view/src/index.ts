import { request, Dispatcher } from 'undici';

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

type ResponseDataBody = Dispatcher.ResponseData['body'];

interface GenericBodyData<K> extends ResponseDataBody {
  json(): Promise<K>;
}

interface GenericTypedResponse<K> extends Dispatcher.ResponseData {
  body: GenericBodyData<K>;
}

export const symbol = async <T extends keyof Fields>(
  symbol: string,
  fields: Array<T> = []
) => {
  const defaults = [
    'name',
    'description',
    'type',
    'logoid',
    'close',
    'open',
    'high',
    'low',
    'change',
  ];

  const response = await request(`https://scanner.tradingview.com/symbol`, {
    method: 'GET',
    query: {
      symbol,
      fields: [...fields, ...defaults].join(','),
    },
  });

  return response as GenericTypedResponse<
    Pick<Fields, T> &
      Pick<
        Fields,
        | 'name'
        | 'description'
        | 'type'
        | 'logoid'
        | 'close'
        | 'open'
        | 'high'
        | 'low'
        | 'change'
      >
  >;
};

export const logo = async (logo: string, size: 'small' | 'big' = 'big') => {
  return `https://s3-symbol-logo.tradingview.com/${logo}--${size}.svg`;
};
