export class AssetDetailsDto {
  asset_id: string;
  symbol: string;
  name: string;
  asset_class: string;
  market: string;
  currency: string;

  // Holding metrics
  total_quantity: number;
  avg_cost: number;
  current_price: number;
  current_value: number;

  // Performance metrics
  total_return_abs: number;
  total_return_pct: number;
  unrealized_pl: number;
  unrealized_pl_pct: number;
  realized_pl: number; // For realized gains from sells

  // FX metrics
  asset_gain: number;
  fx_gain: number;

  // Methodology
  calculation_method: string;

  // Metadata
  last_updated: string;
}

export class AssetTransactionDto {
  id: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  date: string;
  fee: number;
  notes?: string;
}

export class AssetDetailsResponseDto {
  details: AssetDetailsDto;
  transactions: AssetTransactionDto[];
}
