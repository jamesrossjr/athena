
const WINDOW_SIZE_MS = 60 * 1000; // 1 minute
const MAX_TOKENS = 100; // max requests per window

type TokenBucket = {
  tokens: number;
  lastRefill: number;
};

const buckets = new Map<string, TokenBucket>();

function getBucket(key: string): TokenBucket {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: now };
    buckets.set(key, bucket);
    return bucket;
  }
  const elapsed = now - bucket.lastRefill;
  const refillTokens = Math.floor(elapsed / WINDOW_SIZE_MS) * MAX_TOKENS;
  if (refillTokens > 0) {
    bucket.tokens = Math.min(bucket.tokens + refillTokens, MAX_TOKENS);
    bucket.lastRefill = now;
  }
  return bucket;
}

export default defineEventHandler((event) => {
  const ip = event.node.req.socket?.remoteAddress || 'unknown';
  const bucket = getBucket(ip);
  if (bucket.tokens > 0) {
    bucket.tokens--;
    return;
  }
  // Too many requests
  event.node.res.statusCode = 429;
  event.node.res.setHeader('Retry-After', `${WINDOW_SIZE_MS / 1000}`);
  event.node.res.end('Too Many Requests');
});