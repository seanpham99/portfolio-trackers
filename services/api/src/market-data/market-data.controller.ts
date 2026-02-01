import { Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MarketDataService } from './market-data.service';
import { GetExchangeRateDto } from './dto/get-exchange-rate.dto';
import {
  ApiResponse as SharedApiResponse,
  createApiResponse,
} from '@workspace/shared-types/api';

@ApiTags('Market Data')
@Controller('market-data')
export class MarketDataController {
  constructor(private readonly marketDataService: MarketDataService) {}

  @Get('exchange-rate')
  @ApiOperation({ summary: 'Get historical exchange rate' })
  @ApiResponse({
    status: 200,
    description: 'Exchange rate returned successfully',
  })
  @ApiResponse({ status: 404, description: 'Rate not found' })
  async getExchangeRate(
    @Query(new ValidationPipe({ transform: true })) query: GetExchangeRateDto,
  ): Promise<SharedApiResponse<{ rate: number | null }>> {
    const rate = await this.marketDataService.getHistoricalExchangeRate(
      query.from,
      query.to,
      new Date(query.date),
    );

    return createApiResponse({ rate }, new Date());
  }
}
