const { Redis } = require('@upstash/redis');

// Upstash Redis REST client — uses HTTPS (port 443), no firewall issues.
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Default TTL for cached content: 5 minutes
const CACHE_TTL_SECONDS = 300;

module.exports = { redis, CACHE_TTL_SECONDS };
