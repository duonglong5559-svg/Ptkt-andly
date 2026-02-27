/**
 * Hook lấy giá XAUUSD từ sàn forex khi cặp được chọn
 */

import { useQuery } from "@tanstack/react-query";
import { fetchXAUUSDPrice, fetchForexCandles } from "@/services/forexApi";
import { TradingPair } from "@/data/tradingData";

export function useForexPrice(selectedPair: TradingPair) {
  const isXAU = selectedPair.symbol === "XAUUSD";

  const { data: xauPrice } = useQuery({
    queryKey: ["xauusd-price"],
    queryFn: fetchXAUUSDPrice,
    enabled: isXAU,
    staleTime: 60000,
  });

  if (isXAU && xauPrice != null) {
    return {
      ...selectedPair,
      currentPrice: xauPrice,
      buyPrice: xauPrice,
      sellPrice: xauPrice * 1.005,
    };
  }

  return selectedPair;
}
