import { Database } from '@workspace/database-types';

/**
 * Portfolio entity interface matching database schema
 */
export type Portfolio = Database['public']['Tables']['portfolios']['Row'];
