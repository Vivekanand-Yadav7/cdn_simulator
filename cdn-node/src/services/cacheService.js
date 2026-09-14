const { redis, CACHE_TTL_SECONDS } = require('../redis');

/**
 * Retrieves cached content from Redis.
 * @param {string} filename - The cache key.
 * @returns {Promise<string|null>} Cached content or null if not found / expired.
 */
async function getCachedContent(filename) {
    const data = await redis.get(filename);
    return data ?? null;
}

/**
 * Stores content in Redis with a TTL.
 * @param {string} filename - The cache key.
 * @param {string} content - The content to cache.
 * @returns {Promise<void>}
 */
async function setCachedContent(filename, content) {
    await redis.set(filename, content, { ex: CACHE_TTL_SECONDS });
    console.log(`Stored in Redis cache: ${filename} (TTL: ${CACHE_TTL_SECONDS}s)`);
}

/**
 * Deletes a cached entry from Redis.
 * @param {string} filename - The cache key to invalidate.
 * @returns {Promise<void>}
 */
async function invalidateCache(filename) {
    await redis.del(filename);
    console.log(`Invalidated Redis cache: ${filename}`);
}

module.exports = {
    getCachedContent,
    setCachedContent,
    invalidateCache,
};

