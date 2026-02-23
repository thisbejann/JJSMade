import { useMemo } from "react";

interface ComputedCostsInput {
  priceCNY: number;
  exchangeRate: number;
  hasLocalShipping: boolean;
  localShippingCNY: number;
  weightKg: number;
  forwarderRatePerKg: number;
  isForwarderBuy: boolean;
  forwarderBuyRateUsed: number;
  lalamoveFee: number;
  sellingPrice: number;
}

const FORWARDER_BUY_QC_FEE_PHP = 150;

export function useComputedCosts(input: ComputedCostsInput) {
  return useMemo(() => {
    const pricePHP = input.priceCNY * input.exchangeRate;
    const localShippingPHP = input.hasLocalShipping
      ? input.localShippingCNY * input.exchangeRate
      : 0;
    const forwarderFee =
      input.weightKg > 0 ? input.weightKg * input.forwarderRatePerKg : 0;

    const forwarderBuyFeeCNY = input.isForwarderBuy
      ? input.priceCNY * 0.1 + 10
      : 0;
    const forwarderBuyFeePHP = input.isForwarderBuy
      ? forwarderBuyFeeCNY * input.forwarderBuyRateUsed
      : 0;
    const qcServiceFeePHP = input.isForwarderBuy ? FORWARDER_BUY_QC_FEE_PHP : 0;

    const totalCost =
      pricePHP +
      localShippingPHP +
      forwarderFee +
      input.lalamoveFee +
      forwarderBuyFeePHP +
      qcServiceFeePHP;
    const profit = input.sellingPrice > 0 ? input.sellingPrice - totalCost : 0;
    const markupPercent =
      totalCost > 0 && input.sellingPrice > 0
        ? ((input.sellingPrice - totalCost) / totalCost) * 100
        : 0;

    return {
      pricePHP: round(pricePHP),
      localShippingPHP: round(localShippingPHP),
      forwarderFee: round(forwarderFee),
      forwarderBuyFeeCNY: round(forwarderBuyFeeCNY),
      forwarderBuyFeePHP: round(forwarderBuyFeePHP),
      qcServiceFeePHP: round(qcServiceFeePHP),
      totalCost: round(totalCost),
      profit: round(profit),
      markupPercent: round(markupPercent),
    };
  }, [
    input.priceCNY,
    input.exchangeRate,
    input.hasLocalShipping,
    input.localShippingCNY,
    input.weightKg,
    input.forwarderRatePerKg,
    input.isForwarderBuy,
    input.forwarderBuyRateUsed,
    input.lalamoveFee,
    input.sellingPrice,
  ]);
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
