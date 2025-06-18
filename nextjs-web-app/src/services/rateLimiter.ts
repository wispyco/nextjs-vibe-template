/**
 * Simple rate limiter service for tracking API usage
 * In production, this should be replaced with Redis or another persistent store
 */
export class RateLimiter {
  private static instance: RateLimiter;
  private counts = new Map<string, number>();
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    // Reset counts every hour - store interval ID for cleanup
    this.intervalId = setInterval(() => this.counts.clear(), 60 * 60 * 1000);
  }

  /**
   * Clean up resources when the instance is no longer needed
   */
  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.counts.clear();
  }

  static getInstance() {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  /**
   * Check if a key has exceeded its rate limit
   * @param key - Unique identifier (usually IP address)
   * @param limit - Maximum number of requests allowed
   * @returns boolean - true if under limit, false if exceeded
   */
  check(key: string, limit: number): boolean {
    const count = this.counts.get(key) || 0;
    if (count >= limit) return false;
    this.counts.set(key, count + 1);
    return true;
  }

  /**
   * Get remaining requests for a key
   * @param key - Unique identifier (usually IP address)
   * @param limit - Maximum number of requests allowed
   * @returns number - Remaining requests
   */
  getRemainingRequests(key: string, limit: number): number {
    const count = this.counts.get(key) || 0;
    return Math.max(0, limit - count);
  }
}
