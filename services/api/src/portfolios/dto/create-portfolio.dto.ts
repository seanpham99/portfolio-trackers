import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  MaxLength,
} from 'class-validator';

/**
 * Valid base currencies for portfolios
 */
export const VALID_CURRENCIES = ['VND', 'USD', 'USDT'] as const;
export type BaseCurrency = (typeof VALID_CURRENCIES)[number];

/**
 * DTO for creating a new portfolio
 */
export class CreatePortfolioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsIn(VALID_CURRENCIES, {
    message: 'base_currency must be one of: VND, USD, USDT',
  })
  base_currency!: BaseCurrency;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
