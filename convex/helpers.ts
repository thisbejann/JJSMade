export function computeDerivedFields(data: {
  priceCNY: number;
  exchangeRateUsed: number;
  hasLocalShipping: boolean;
  localShippingCNY?: number;
  weightKg?: number;
  forwarderRatePerKg: number;
  isForwarderBuy?: boolean;
  forwarderBuyRateUsed?: number;
  forwarderBuyCommissionPercent?: number;
  sellingPrice?: number;
}) {
  const isForwarderBuy = data.isForwarderBuy ?? false;
  let forwarderBuyRate: number | undefined;
  let forwarderBuyCommissionPercent: number | undefined;
  let effectiveRate = data.exchangeRateUsed;

  if (isForwarderBuy) {
    const candidateRate = data.forwarderBuyRateUsed;
    if (
      candidateRate == null ||
      Number.isNaN(candidateRate) ||
      candidateRate <= 0
    ) {
      throw new Error("Forwarder buy service rate is required");
    }
    forwarderBuyRate = candidateRate;
    const candidateCommission = data.forwarderBuyCommissionPercent ?? 10;
    if (
      Number.isNaN(candidateCommission) ||
      candidateCommission < 0
    ) {
      throw new Error("Forwarder buy commission percent must be 0 or higher");
    }
    forwarderBuyCommissionPercent = candidateCommission;
    effectiveRate = candidateRate;
  }
  const pricePHP = round(data.priceCNY * effectiveRate);

  const localShippingPHP =
    data.hasLocalShipping && data.localShippingCNY
      ? round(data.localShippingCNY * effectiveRate)
      : undefined;

  const forwarderFee =
    data.weightKg != null
      ? round(data.weightKg * data.forwarderRatePerKg)
      : undefined;

  const forwarderBuyFeePHP = isForwarderBuy
    ? round(
        data.priceCNY *
          ((forwarderBuyCommissionPercent as number) / 100) *
          (forwarderBuyRate as number)
      )
    : undefined;

  const qcServiceFeePHP = isForwarderBuy ? 150 : undefined;

  const totalCost = round(
    pricePHP +
      (localShippingPHP ?? 0) +
      (forwarderFee ?? 0) +
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
