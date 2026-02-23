export function computeDerivedFields(data: {
  priceCNY: number;
  exchangeRateUsed: number;
  hasLocalShipping: boolean;
  localShippingCNY?: number;
  weightKg?: number;
  forwarderRatePerKg: number;
  isForwarderBuy?: boolean;
  forwarderBuyRateUsed?: number;
  lalamoveFee?: number;
  sellingPrice?: number;
}) {
  const isForwarderBuy = data.isForwarderBuy ?? false;
  const pricePHP = round(data.priceCNY * data.exchangeRateUsed);

  const localShippingPHP =
    data.hasLocalShipping && data.localShippingCNY
      ? round(data.localShippingCNY * data.exchangeRateUsed)
      : undefined;

  const forwarderFee =
    data.weightKg != null
      ? round(data.weightKg * data.forwarderRatePerKg)
      : undefined;

  const forwarderBuyFeePHP = isForwarderBuy
    ? round((data.priceCNY * 0.1 + 10) * (data.forwarderBuyRateUsed ?? 0))
    : undefined;

  const qcServiceFeePHP = isForwarderBuy ? 150 : undefined;

  const totalCost = round(
    pricePHP +
      (localShippingPHP ?? 0) +
      (forwarderFee ?? 0) +
      (data.lalamoveFee ?? 0) +
      (forwarderBuyFeePHP ?? 0) +
      (qcServiceFeePHP ?? 0)
  );

  const profit =
    data.sellingPrice != null ? round(data.sellingPrice - totalCost) : undefined;

  return {
    pricePHP,
    localShippingPHP,
    forwarderFee,
    forwarderBuyFeePHP,
    qcServiceFeePHP,
    totalCost,
    profit,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
