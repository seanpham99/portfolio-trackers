import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AssetsService } from './assets.service';
import { AuthGuard } from '../portfolios/guards/auth.guard';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  /**
   * GET /assets/search - Search for assets by symbol or name
   * Throttled to prevent abuse
   */
  @Get('search')
  @UseGuards(AuthGuard, ThrottlerGuard)
  async search(@Query('q') query: string) {
    return this.assetsService.search(query);
  }
}
