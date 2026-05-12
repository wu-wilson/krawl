/** Request timeout in milliseconds — configurable via REQUEST_TIMEOUT_MS env var */
export const TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT_MS || '10000', 10);

/** Maximum response body size in bytes — configurable via MAX_BODY_SIZE_BYTES env var */
export const MAX_BODY_SIZE = parseInt(process.env.MAX_BODY_SIZE_BYTES || '5242880', 10);

/** User-Agent header sent with all outbound requests */
export const USER_AGENT = 'Krawl/1.0 (site health scanner)';
