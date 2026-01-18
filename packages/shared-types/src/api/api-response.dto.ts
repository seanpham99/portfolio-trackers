/**
 * Standard API Response Envelope
 * All API endpoints MUST return responses wrapped in this structure.
 * Implements NFR3 (Staleness Indicators) per Story 4.4.
 */

/**
 * Metadata for API responses including staleness information
 * @property staleness - ISO 8601 timestamp when data was last fetched from external provider
 */
export interface ApiMeta {
    /** ISO 8601 timestamp indicating when the data was last fetched from the external provider */
    staleness: string;
    /** Additional metadata fields */
    [key: string]: unknown;
}

/**
 * Standard API response wrapper with typed data and metadata
 * @template T - The type of the data payload
 */
export interface ApiResponse<T> {
    /** Indicates if the request was successful */
    success: boolean;
    /** The response data payload */
    data: T;
    /** Error information if success is false */
    error: ApiError | null;
    /** Response metadata including staleness information */
    meta: ApiMeta;
}

/**
 * Standard API error structure
 */
export interface ApiError {
    /** Machine-readable error code */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Additional error details */
    details?: Record<string, unknown>;
}

/**
 * Factory function to create a successful API response
 */
export function createApiResponse<T>(
    data: T,
    staleness: string | Date,
    additionalMeta?: Omit<ApiMeta, "staleness">
): ApiResponse<T> {
    return {
        success: true,
        data,
        error: null,
        meta: {
            staleness: typeof staleness === "string" ? staleness : staleness.toISOString(),
            ...additionalMeta,
        },
    };
}

/**
 * Factory function to create an error API response
 */
export function createApiErrorResponse<T = null>(
    error: ApiError,
    staleness?: string | Date
): ApiResponse<T> {
    return {
        success: false,
        data: null as T,
        error,
        meta: {
            staleness: staleness
                ? typeof staleness === "string"
                    ? staleness
                    : staleness.toISOString()
                : new Date().toISOString(),
        },
    };
}
