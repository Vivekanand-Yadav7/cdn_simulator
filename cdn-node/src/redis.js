const { Redis } = require('@upstash/redis');

// Upstash Redis REST client — uses HTTPS (port 443), no firewall issues.
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Default TTL for cached content: 60 seconds (configurable via CACHE_TTL_SECONDS env var)
const CACHE_TTL_SECONDS = parseInt(process.env.CACHE_TTL_SECONDS || '60', 10);

module.exports = { redis, CACHE_TTL_SECONDS };
