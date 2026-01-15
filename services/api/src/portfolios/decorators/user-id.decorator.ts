import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '@supabase/supabase-js';

// Extend Express Request to include user
interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Decorator to extract user ID from request
 * Requires AuthGuard to have run first
 */
export const UserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('User not found in request');
    }

    return user.id;
  },
);
