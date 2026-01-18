import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean } from "class-validator";
import { CalculationMethod } from "./calculation-method.enum.js";

export class HoldingDto {
  @IsString()
  asset_id: string;

  @IsString()
  symbol: string;

  @IsString()
  name: string;

  @IsString()
  asset_class: string;

  @IsNumber()
  total_quantity: number;

  @IsNumber()
  avg_cost: number;

  @IsString()
  @IsOptional()
  market?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  // Computed on frontend or optional backend fields
  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  value?: number;

  @IsNumber()
  @IsOptional()
  pl?: number;

  @IsNumber()
  @IsOptional()
  pl_percent?: number;

  @IsNumber()
  @IsOptional()
  realized_pl?: number;

  // Methodology transparency fields
  @IsEnum(CalculationMethod)
  @IsOptional()
  calculationMethod?: CalculationMethod;

  @IsString()
  @IsOptional()
  dataSource?: string;

  // NFR3: Staleness Indicators for UI badges
  @IsBoolean()
  @IsOptional()
  isStale?: boolean;

  @IsString()
  @IsOptional()
  lastUpdated?: string;

  @IsString()
  @IsOptional()
  providerStatus?: 'live' | 'cached' | 'fallback';

  @IsString()
  @IsOptional()
  provider?: 'Yahoo' | 'CoinGecko' | 'cached' | 'fallback';
}

