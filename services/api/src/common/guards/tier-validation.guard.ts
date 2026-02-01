import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import {
  validatePortfolioCount,
  validateAssetCount,
} from '@workspace/shared-types';
import { UsersService } from '../../users/users.service';
import { PortfoliosService } from '../../portfolios/portfolios.service';

interface AuthenticatedRequest {
  user?: {
    id: string;
  };
  route: {
    path: string;
  };
  method: string;
}

@Injectable()
export class TierValidationGuard implements CanActivate {
  constructor(
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(PortfoliosService)
    private readonly portfoliosService: PortfoliosService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: AuthenticatedRequest = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      // If no user is attached, let it pass. AuthGuard should have run before this.
      return true;
    }

    const user = await this.usersService.findOne(userId);
    // Default to 'free' tier if no subscription info is found
    const tier = user?.subscription_tier ?? 'free';

    // Pro users bypass all limit checks
    if (tier === 'pro') {
      return true;
    }

    const endpoint = request.route.path;
    const method = request.method;

    if (endpoint.includes('/portfolios') && method === 'POST') {
      const currentCount = await this.portfoliosService.countByUser(userId);
      const validation = validatePortfolioCount(
        currentCount,
        tier as 'free' | 'pro',
      );

      if (!validation.valid) {
        throw new ForbiddenException(validation.error);
      }
    }

    if (endpoint.includes('/transactions') && method === 'POST') {
      const currentCount =
        await this.portfoliosService.countAssetsByUser(userId);
      const validation = validateAssetCount(
        currentCount,
        tier as 'free' | 'pro',
      );

      if (!validation.valid) {
        throw new ForbiddenException(validation.error);
      }
    }

    return true;
  }
}
