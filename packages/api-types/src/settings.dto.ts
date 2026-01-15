import { IsEnum, IsInt, Min, Max, IsOptional } from "class-validator";

export enum Currency {
  USD = "USD",
  VND = "VND",
  EUR = "EUR",
  GBP = "GBP",
}

export class UserSettingsDto {
  @IsEnum(Currency)
  currency: Currency;

  @IsInt()
  @Min(10)
  @Max(300)
  refresh_interval: number;
}

export class UpdateUserSettingsDto {
  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @IsInt()
  @Min(10)
  @Max(300)
  @IsOptional()
  refresh_interval?: number;
}

export class PopularAssetDto {
  id: string;
  symbol: string;
  name_en: string;
  asset_class: string;
  logo_url?: string;
  market?: string;
}
