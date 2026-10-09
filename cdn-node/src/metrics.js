'use strict';

/**
 * In-memory metrics store for this CDN node.
 * Counters reset when the process restarts (container restart).
 * Exposed via GET /metrics  (this node only)
 * Aggregated via GET /metrics/all (queries all nodes)
 */

const MAX_LATENCY_SAMPLES = 1000; // rolling window for p95 calculation

const counters = {
    totalRequests: 0,
    cacheHits:     0,
    cacheMisses:   0,
    originFetches: 0,
    errors:        0,
};

/** @type {number[]} Rolling window of per-request latencies in ms */
const latencySamples = [];

// ─── Counter helpers ──────────────────────────────────────────────────────────

function incrementTotal()   { counters.totalRequests++; }
function incrementCacheHit()  { counters.cacheHits++; }
function incrementCacheMiss() { counters.cacheMisses++; }
function incrementOrigin()  { counters.originFetches++; }
function incrementError()   { counters.errors++; }

// ─── Latency helpers ──────────────────────────────────────────────────────────

/**
 * Record one request's latency into the rolling window.
 * @param {number} ms
 */
function recordLatency(ms) {
    latencySamples.push(ms);
    if (latencySamples.length > MAX_LATENCY_SAMPLES) {
        latencySamples.shift(); // drop oldest
    }
}

function getAvgLatency() {
    if (latencySamples.length === 0) return 0;
    const sum = latencySamples.reduce((a, v) => a + v, 0);
    return parseFloat((sum / latencySamples.length).toFixed(2));
}

function getP95Latency() {
    if (latencySamples.length === 0) return 0;
    const sorted = [...latencySamples].sort((a, b) => a - b);
    const idx = Math.ceil(sorted.length * 0.95) - 1;
    return sorted[Math.max(0, idx)];
}

// ─── Snapshot ─────────────────────────────────────────────────────────────────

/**
 * Returns a clean JSON-serialisable snapshot of all metrics for this node.
 */
function getSnapshot() {
    const { totalRequests, cacheHits, cacheMisses, originFetches, errors } = counters;
    const cacheHitRatio = totalRequests > 0
        ? parseFloat((cacheHits / totalRequests).toFixed(4))
        : 0;

    return {
        nodeId:             process.env.NODE_ID || 'unknown',
        uptimeSeconds:      parseFloat(process.uptime().toFixed(2)),
        totalRequests,
        cacheHits,
        cacheMisses,
        cacheHitRatio,
        cacheHitPercent:    parseFloat((cacheHitRatio * 100).toFixed(2)),
        originFetches,
        errors,
        avgLatencyMs:       getAvgLatency(),
        p95LatencyMs:       getP95Latency(),
        latencySampleCount: latencySamples.length,
    };
}

module.exports = {
    incrementTotal,
    incrementCacheHit,
    incrementCacheMiss,
    incrementOrigin,
    incrementError,
    recordLatency,
    getSnapshot,
};
