import { PartialType } from '@nestjs/mapped-types';
import { CreatePortfolioDto } from './create-portfolio.dto';

/**
 * DTO for updating an existing portfolio
 * All fields are optional (partial update)
 */
export class UpdatePortfolioDto extends PartialType(CreatePortfolioDto) {}
