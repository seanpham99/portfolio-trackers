/**
 * Connections Controller
 * REST API endpoints for exchange connection management
 * Story: 2.7 Connection Settings
 */

import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ConnectionsService } from './connections.service';
import { BinanceSyncService, SyncResult } from './binance-sync.service';
import {
  ConnectionDto,
  CreateConnectionDto,
  ValidateConnectionDto,
  ValidationResultDto,
} from '@workspace/shared-types/api';
import { AuthGuard } from '../portfolios/guards/auth.guard';
import { UserId } from '../portfolios/decorators/user-id.decorator';

@ApiTags('connections')
@ApiBearerAuth()
@Controller('connections')
@UseGuards(AuthGuard)
export class ConnectionsController {
  constructor(
    private readonly connectionsService: ConnectionsService,
    private readonly binanceSyncService: BinanceSyncService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all user connections' })
  @ApiResponse({
    status: 200,
    description: 'List of connections (API secrets are never returned)',
    type: [ConnectionDto],
  })
  async findAll(@UserId() userId: string): Promise<ConnectionDto[]> {
    return this.connectionsService.findAll(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new exchange connection' })
  @ApiResponse({
    status: 201,
    description: 'Connection created successfully',
    type: ConnectionDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid API credentials',
  })
  @ApiResponse({
    status: 409,
    description: 'Connection to this exchange already exists',
  })
  async create(
    @UserId() userId: string,
    @Body() createDto: CreateConnectionDto,
  ): Promise<{
    success: boolean;
    data: ConnectionDto;
    meta: { assetsSync: number };
  }> {
    // Validate credentials first
    const validationResult = await this.connectionsService.validateConnection(
      createDto.exchange,
      createDto.apiKey,
      createDto.apiSecret,
    );

    if (!validationResult.valid) {
      throw new Error(validationResult.error || 'Invalid credentials');
    }

    // Create connection
    const connection = await this.connectionsService.create(
      userId,
      createDto.exchange,
      createDto.apiKey,
      createDto.apiSecret,
    );

    // Trigger initial sync
    let syncResult: SyncResult = {
      success: true,
      assetsSync: 0,
      syncedBalances: [],
    };
    if (createDto.exchange === 'binance') {
      syncResult = await this.binanceSyncService.syncHoldings(
        userId,
        connection.id,
      );
    }

    return {
      success: true,
      data: connection,
      meta: { assetsSync: syncResult.assetsSync },
    };
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate exchange credentials (dry-run, no save)' })
  @ApiResponse({
    status: 200,
    description: 'Validation result',
    type: ValidationResultDto,
  })
  async validate(
    @Body() validateDto: ValidateConnectionDto,
  ): Promise<ValidationResultDto> {
    return this.connectionsService.validateConnection(
      validateDto.exchange,
      validateDto.apiKey,
      validateDto.apiSecret,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a connection' })
  @ApiParam({ name: 'id', description: 'Connection UUID' })
  @ApiResponse({
    status: 204,
    description: 'Connection deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Connection not found',
  })
  async remove(
    @UserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.connectionsService.remove(userId, id);
  }
}
