import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscoverableAssetClass } from '@workspace/shared-types/database';

/**
 * Query parameters for external asset discovery
 */
export class ExternalSearchDto {
  @ApiProperty({
    description: 'Search query (symbol or name)',
    example: 'AAPL',
  })
  @IsString()
  @IsNotEmpty()
  q!: string;

  @ApiProperty({
    description: 'Asset class to search for',
    enum: DiscoverableAssetClass,
    example: DiscoverableAssetClass.US_STOCK,
  })
  @IsEnum(DiscoverableAssetClass as unknown as object)
  assetClass!: DiscoverableAssetClass;
}

/**
 * Response shape for discovered external assets
 */
export class DiscoveredAssetDto {
  @ApiProperty({ description: 'Asset symbol', example: 'AAPL' })
  symbol!: string;

  @ApiProperty({ description: 'Asset name in English', example: 'Apple Inc.' })
  name_en!: string;

  @ApiPropertyOptional({
    description: 'Local name (if available)',
    example: null,
  })
  name_local?: string | null;

  @ApiProperty({
    description: 'Asset class',
    example: 'EQUITY',
  })
  asset_class!: string;

  @ApiPropertyOptional({
    description: 'Market/Exchange code',
    example: 'US',
  })
  market?: string | null;

  @ApiPropertyOptional({
    description: 'Exchange name',
    example: 'NASDAQ',
  })
  exchange?: string | null;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'USD',
  })
  currency?: string;

  @ApiPropertyOptional({
    description: 'Logo URL',
    example: 'https://logo.clearbit.com/apple.com',
  })
  logo_url?: string | null;

  @ApiProperty({
    description: 'Data source provider',
    example: 'yahoo_finance',
  })
  source!: string;
}

/**
 * Submit asset request DTO for pending_assets queue
 */
export class SubmitAssetRequestDto {
  @ApiProperty({
    description: 'Asset symbol to request',
    example: 'VIC',
  })
  @IsString()
  @IsNotEmpty()
  symbol!: string;

  @ApiProperty({
    description: 'Asset class',
    enum: DiscoverableAssetClass,
    example: DiscoverableAssetClass.VN_STOCK,
  })
  @IsEnum(DiscoverableAssetClass as unknown as object)
  assetClass!: DiscoverableAssetClass;
}

/**
 * Response for submitted asset request
 */
export class AssetRequestResponseDto {
  @ApiProperty({
    description: 'Request ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'Requested symbol',
    example: 'VIC',
  })
  symbol!: string;

  @ApiProperty({
    description: 'Request status',
    example: 'pending',
  })
  status!: string;

  @ApiProperty({
    description: 'Success message',
    example: 'Asset request submitted successfully',
  })
  message!: string;
}
