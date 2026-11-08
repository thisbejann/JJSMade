import { useMemo } from "react";
import { FORWARDER_BUY_QC_FEE_PHP } from "../lib/constants";
import { tdRouteCost, type TdRates } from "../../convex/helpers";

interface ComputedCostsInput {
  /** Set for a watch: its TD rates, or null until a TD is picked. Absent on the China route. */
  td?: (TdRates & { insured: boolean }) | null;
  priceCNY: number;
  exchangeRate: number;
  hasLocalShipping: boolean;
  localShippingCNY: number;
  weightKg: number;
  forwarderRatePerKg: number;
  isForwarderBuy: boolean;
  forwarderBuyRateUsed: number;
  forwarderBuyCommissionPercent: number;
  sellingPrice: number;
}

export function useComputedCosts(input: ComputedCostsInput) {
  return useMemo(() => {
    if (input.td !== undefined) {
      const cost = tdRouteCost({
        priceCNY: input.priceCNY,
        rate: input.exchangeRate,
        ...(input.td ?? NO_TD_YET),
      });
      return {
        ...NO_CHINA_FEES,
        ...cost,
        ...profitAndMarkup(input.sellingPrice, cost.totalCost),
      };
    }

    const effectiveRate = input.isForwarderBuy ? input.forwarderBuyRateUsed : input.exchangeRate;
    const pricePHP = input.priceCNY * effectiveRate;
    const localShippingPHP = input.hasLocalShipping
      ? input.localShippingCNY * effectiveRate
      : 0;
    const forwarderFee =
      input.weightKg > 0 ? input.weightKg * input.forwarderRatePerKg : 0;

    const forwarderBuyFeeCNY = input.isForwarderBuy
      ? input.priceCNY * (input.forwarderBuyCommissionPercent / 100)
      : 0;
    const forwarderBuyFeePHP = input.isForwarderBuy
      ? forwarderBuyFeeCNY * input.forwarderBuyRateUsed
      : 0;
    const qcServiceFeePHP = input.isForwarderBuy ? FORWARDER_BUY_QC_FEE_PHP : 0;

    const totalCost =
      pricePHP +
      localShippingPHP +
      forwarderFee +
      forwarderBuyFeePHP +
      qcServiceFeePHP;
    return {
      pricePHP: round(pricePHP),
      localShippingPHP: round(localShippingPHP),
      forwarderFee: round(forwarderFee),
      forwarderBuyFeeCNY: round(forwarderBuyFeeCNY),
      forwarderBuyFeePHP: round(forwarderBuyFeePHP),
      qcServiceFeePHP: round(qcServiceFeePHP),
      tdShippingPHP: 0,
      tdInsurancePHP: 0,
      totalCost: round(totalCost),
      ...profitAndMarkup(input.sellingPrice, totalCost),
    };
  }, [
    input.td,
    input.priceCNY,
    input.exchangeRate,
    input.hasLocalShipping,
    input.localShippingCNY,
    input.weightKg,
    input.forwarderRatePerKg,
    input.isForwarderBuy,
    input.forwarderBuyRateUsed,
    input.forwarderBuyCommissionPercent,
    input.sellingPrice,
  ]);
}

const NO_TD_YET = { tdShippingCNY: 0, tdInsurancePct: 0, insured: false };

const NO_CHINA_FEES = {
  localShippingPHP: 0,
  forwarderFee: 0,
  forwarderBuyFeeCNY: 0,
  forwarderBuyFeePHP: 0,
  qcServiceFeePHP: 0,
};

function profitAndMarkup(sellingPrice: number, totalCost: number) {
  const profit = sellingPrice > 0 ? sellingPrice - totalCost : 0;
  const markupPercent = totalCost > 0 && sellingPrice > 0 ? (profit / totalCost) * 100 : 0;
  return { profit: round(profit), markupPercent: round(markupPercent) };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
