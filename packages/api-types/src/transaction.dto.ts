import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsDateString,
} from "class-validator";

export enum TransactionType {
  BUY = "BUY",
  SELL = "SELL",
}

export class CreateTransactionDto {
  @IsUUID()
  @IsNotEmpty()
  portfolio_id: string;

  @IsUUID()
  @IsNotEmpty()
  asset_id: string;

  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

  @IsNumber()
  @Min(0.00000001, { message: "Quantity must be greater than 0" })
  @IsNotEmpty()
  quantity: number;

  @IsNumber()
  @Min(0.01, { message: "Price must be greater than 0" })
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fee?: number;

  @IsDateString(
    {},
    { message: "Transaction date must be a valid ISO 8601 date string" },
  )
  @IsOptional()
  transaction_date?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateTransactionDto {
  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;

  @IsNumber()
  @Min(0.00000001, { message: "Quantity must be greater than 0" })
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @Min(0.01, { message: "Price must be greater than 0" })
  @IsOptional()
  price?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  fee?: number;

  @IsDateString(
    {},
    { message: "Transaction date must be a valid ISO 8601 date string" },
  )
  @IsOptional()
  transaction_date?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
