'use strict';

const cacheService  = require('../services/cacheService');
const originService = require('../services/originService');
const metrics       = require('../metrics');

/**
 * Handles GET /api/file/:name
 * Tracks: totalRequests, cacheHits, cacheMisses, originFetches, errors, latency.
 */
exports.getFile = async (req, res) => {
    const start = Date.now();
    const { name } = req.params;
    const filename = `${name}.txt`;

    metrics.incrementTotal();

    // Identify which node answered
    res.setHeader('X-Node-ID',   process.env.NODE_ID || 'unknown');
    res.setHeader('X-Cache-TTL', process.env.CACHE_TTL_SECONDS || 60);

    try {
        // 1. Check Redis cache
        const cachedContent = await cacheService.getCachedContent(filename);
        if (cachedContent !== null) {
            console.log(`Cache HIT: ${filename}`);
            metrics.incrementCacheHit();
            res.setHeader('X-Cache', 'HIT');
            metrics.recordLatency(Date.now() - start);
            return res.status(200).send(cachedContent);
        }

        // 2. Cache MISS — fetch from origin
        console.log(`Cache MISS: ${filename}`);
        metrics.incrementCacheMiss();
        metrics.incrementOrigin();

        const originContent = await originService.fetchFromOriginHttp(filename);
        if (originContent === null) {
            metrics.recordLatency(Date.now() - start);
            return res.status(404).send('File not found');
        }

        // 3. Store in Redis for next request
        await cacheService.setCachedContent(filename, originContent);

        res.setHeader('X-Cache', 'MISS');
        metrics.recordLatency(Date.now() - start);
        return res.status(200).send(originContent);

    } catch (error) {
        console.error(`Error handling file request for "${req.params.name}":`, error);
        metrics.incrementError();
        metrics.recordLatency(Date.now() - start);
        return res.status(500).send('Internal Server Error');
    }
};
