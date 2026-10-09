'use strict';

const path = require('path');
const cacheService  = require('../services/cacheService');
const originService = require('../services/originService');
const metrics       = require('../metrics');

/**
 * Validates that a filename does not attempt directory traversal.
 * @param {string} filename
 * @returns {boolean}
 */
function isSafeFilename(filename) {
    if (!filename || typeof filename !== 'string') return false;
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) return false;
    return path.basename(filename) === filename;
}

/**
 * Handles GET /content/:filename
 * Tracks: totalRequests, cacheHits, cacheMisses, originFetches, errors, latency.
 */
async function getContent(req, res) {
    const start = Date.now();
    const { filename } = req.params;

    metrics.incrementTotal();

    // Identify which node answered
    res.setHeader('X-Node-ID',    process.env.NODE_ID || 'unknown');
    res.setHeader('X-Cache-TTL',  process.env.CACHE_TTL_SECONDS || 60);

    // Guard against path traversal attacks
    if (!isSafeFilename(filename)) {
        metrics.incrementError();
        metrics.recordLatency(Date.now() - start);
        return res.status(400).send('Invalid filename: Path traversal is not allowed.');
    }

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

        const originContent = await originService.fetchFromOrigin(filename);

        if (originContent === null) {
            metrics.recordLatency(Date.now() - start);
            return res.status(404).send('Content not found');
        }

        // 3. Store in Redis for next request
        await cacheService.setCachedContent(filename, originContent);

        res.setHeader('X-Cache', 'MISS');
        metrics.recordLatency(Date.now() - start);
        return res.status(200).send(originContent);

    } catch (error) {
        console.error(`Error handling content request for "${filename}":`, error);
        metrics.incrementError();
        metrics.recordLatency(Date.now() - start);
        return res.status(500).send('Internal Server Error');
    }
}

module.exports = { getContent };
