import { IsString, IsNotEmpty, IsISO8601, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetExchangeRateDto {
  @ApiProperty({
    description: 'Source currency code (ISO 3-char)',
    example: 'USD',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  from!: string;

  @ApiProperty({
    description: 'Target currency code (ISO 3-char)',
    example: 'VND',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  to!: string;

  @ApiProperty({
    description: 'Date for the exchange rate (ISO 8601)',
    example: '2023-01-15T00:00:00Z',
  })
  @IsISO8601()
  @IsNotEmpty()
  date!: string;
}
