import { IsString, IsNumber, IsOptional, IsEnum } from "class-validator";
import { CalculationMethod } from "./calculation-method.enum";

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

  // Methodology transparency fields
  @IsEnum(CalculationMethod)
  @IsOptional()
  calculationMethod?: CalculationMethod;

  @IsString()
  @IsOptional()
  dataSource?: string;
}
