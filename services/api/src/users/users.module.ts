import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { PortfoliosModule } from '../portfolios/portfolios.module';

@Module({
  imports: [SupabaseModule, PortfoliosModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
