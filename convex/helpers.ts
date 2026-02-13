export function computeDerivedFields(data: {
  priceCNY: number;
  exchangeRateUsed: number;
  hasLocalShipping: boolean;
  localShippingCNY?: number;
  weightKg?: number;
  forwarderRatePerKg: number;
  lalamoveFee?: number;
  sellingPrice?: number;
}) {
  const pricePHP = round(data.priceCNY * data.exchangeRateUsed);

  const localShippingPHP =
    data.hasLocalShipping && data.localShippingCNY
      ? round(data.localShippingCNY * data.exchangeRateUsed)
      : undefined;

  const forwarderFee =
    data.weightKg != null
      ? round(data.weightKg * data.forwarderRatePerKg)
      : undefined;

  const totalCost = round(
    pricePHP +
      (localShippingPHP ?? 0) +
      (forwarderFee ?? 0) +
      (data.lalamoveFee ?? 0)
  );

  const profit =
    data.sellingPrice != null ? round(data.sellingPrice - totalCost) : undefined;

  return {
    pricePHP,
    localShippingPHP,
    forwarderFee,
    totalCost,
    profit,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
