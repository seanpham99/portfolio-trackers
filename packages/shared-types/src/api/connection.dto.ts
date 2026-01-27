/**
 * DTOs for Connection Settings
 * Story: 2.7 Connection Settings
 *
 * NOTE: This package is shared between @workspace/web (frontend) and @workspace/api (backend).
 * DO NOT import @nestjs/swagger or any backend-specific dependencies here.
 * Use only plain TypeScript and framework-agnostic validation decorators.
 */

import { IsEnum, IsNotEmpty, IsString } from "class-validator";
// Import enums from database types (single source of truth)
import { ConnectionStatus, ExchangeId } from "../database";

/**
 * Response DTO for a single connection
 * API secret is NEVER included
 */
export class ConnectionDto {
  id: string;

  exchange: `${ExchangeId}`;

  apiKeyMasked: string;

  status: ConnectionStatus;

  lastSyncedAt?: string;

  createdAt: string;
}

/**
 * Request DTO to create a new connection
 */
export class CreateConnectionDto {
  @IsEnum(ExchangeId)
  exchange: `${ExchangeId}`;

  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @IsString()
  @IsNotEmpty()
  apiSecret: string;
}

/**
 * Request DTO for dry-run validation
 */
export class ValidateConnectionDto {
  @IsEnum(ExchangeId)
  exchange: `${ExchangeId}`;

  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @IsString()
  @IsNotEmpty()
  apiSecret: string;
}

/**
 * Response DTO for validation result
 */
export class ValidationResultDto {
  valid: boolean;

  error?: string;
}

// Re-export enums for convenience
export { ConnectionStatus, ExchangeId };
