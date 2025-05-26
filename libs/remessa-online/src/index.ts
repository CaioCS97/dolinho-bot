import { request } from 'undici';

export interface SimulationResponse {
  input: {
    currencyISOCode: string;
    amount: string;
    value: string;
  };
  simulation: {
    policyLabel: string;
    currencyISOCode: string;
    amount: number;
    spread: number;
    spreadAmount: number;
    tradingQuotation: number;
    vet: number;
    taxes: number;
    USDAmount: number;
    hasDiscount: boolean;
    originalSpread: number;
    spreadReferenceAmount: number;
    feesTotalAmount: number;
    instantInfo: {
      enabled: boolean;
      arrivalTime: any;
    };
    value: number;
  };
  information: any;
  discountInformations: {
    color: any;
    hideOriginalSpreadAmount: boolean;
    mainMessage: string;
    tooltipMessage: string;
    detailsMessage: Array<any>;
  };
}

export async function simulate(
  from: string,
  to: string,
  ammount: string
): Promise<string> {
  const response = await request(
    `https://simulator-api.remessaonline.com.br/v1/simulator`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: '5b50b3f1cadc2f622d286a85da9ab85d', // This header is set by Remessa Online
      },
      body: JSON.stringify({
        targetCustomerType: 'business',
        amount: ammount,
        operationType: 'inbound',
        inputCurrencyISOCode: from,
        outputCurrencyISOCode: to,
        requestor: 'business.remessaonline.com.br',
      }),
    }
  );

  const data = (await response.body.json()) as SimulationResponse;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: to,
  }).format(data.simulation.value);
}
