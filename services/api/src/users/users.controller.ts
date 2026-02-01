import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  UserSettingsDto,
  UpdateUserSettingsDto,
  ApiResponse as SharedApiResponse,
  createApiResponse,
} from '@workspace/shared-types/api';
import { AuthGuard } from '../portfolios/guards/auth.guard';
import { UserId } from '../portfolios/decorators/user-id.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users/me')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get current user settings' })
  @ApiResponse({ status: 200, type: UserSettingsDto })
  async getSettings(
    @UserId() userId: string,
  ): Promise<SharedApiResponse<UserSettingsDto>> {
    const settings = await this.usersService.getSettings(userId);
    return createApiResponse(settings, new Date());
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update current user settings' })
  @ApiResponse({ status: 200, type: UserSettingsDto })
  async updateSettings(
    @UserId() userId: string,
    @Body() updateDto: UpdateUserSettingsDto,
  ): Promise<SharedApiResponse<UserSettingsDto>> {
    const settings = await this.usersService.updateSettings(userId, updateDto);
    return createApiResponse(settings, new Date());
  }
}
