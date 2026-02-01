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
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ConnectionsService } from './connections.service';
import { ExchangeSyncService, SyncResult } from './exchange-sync.service';
import {
  ConnectionDto,
  CreateConnectionDto,
  ValidateConnectionDto,
  ValidationResultDto,
  ApiResponse as SharedApiResponse,
  createApiResponse,
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
    private readonly exchangeSyncService: ExchangeSyncService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all user connections' })
  @ApiResponse({
    status: 200,
    description: 'List of connections (API secrets are never returned)',
    type: [ConnectionDto],
  })
  async findAll(
    @UserId() userId: string,
  ): Promise<SharedApiResponse<ConnectionDto[]>> {
    const connections = await this.connectionsService.findAll(userId);
    return createApiResponse(connections, new Date());
  }

  @Post(':id/sync')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 1, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger manual sync for a connection' })
  @ApiParam({ name: 'id', description: 'Connection UUID' })
  @ApiResponse({
    status: 200,
    description: 'Sync triggered successfully',
    type: ConnectionDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests (limit: 1 per 60s)',
  })
  async syncOne(
    @UserId() userId: string,
    @Param('id') id: string,
  ): Promise<SharedApiResponse<ConnectionDto>> {
    // 1. Trigger sync
    const result = await this.exchangeSyncService.syncHoldings(userId, id);

    if (!result.success) {
      // If error is "Connection not found", it throws NotFoundException which is handled globally
      // Otherwise throw generic error
      throw new Error(result.error || 'Sync failed');
    }

    // 2. Fetch updated connection to return latest lastSyncedAt
    const connection = await this.connectionsService.findOne(userId, id);

    return createApiResponse(connection, new Date(), {
      assetsSync: result.assetsSync,
    });
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
  ): Promise<SharedApiResponse<ConnectionDto>> {
    // Validate credentials first
    const validationResult = await this.connectionsService.validateConnection(
      createDto.exchange,
      createDto.apiKey,
      createDto.apiSecret,
      createDto.passphrase,
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
      createDto.passphrase,
    );

    // Trigger initial sync
    const syncResult = await this.exchangeSyncService.syncHoldings(
      userId,
      connection.id,
    );

    return createApiResponse(connection, new Date(), {
      assetsSync: syncResult.assetsSync,
    });
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
      validateDto.passphrase,
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
