import { Module } from '@nestjs/common';
import { AssetsService } from './assets.service.js';
import { AssetsController } from './assets.controller.js';
import { DiscoveryService } from './discovery.service.js';

@Module({
  providers: [AssetsService, DiscoveryService],
  controllers: [AssetsController],
  exports: [AssetsService, DiscoveryService],
})
export class AssetsModule {}
