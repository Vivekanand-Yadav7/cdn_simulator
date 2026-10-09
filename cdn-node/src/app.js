'use strict';

const express = require('express');
const http    = require('http');
const os      = require('os');

const contentRoutes = require('./routes/contentRoutes');
const fileRoutes    = require('./routes/fileRoutes');
const metrics       = require('./metrics');

const app = express();

app.use(express.json());
app.use(express.text({ type: '*/*' }));

// ─── Content routes ───────────────────────────────────────────────────────────
app.use('/content',  contentRoutes);
app.use('/api/file', fileRoutes);

// ─── Health check ─────────────────────────────────────────────────────────────
// Returns JSON — compatible with future AWS ALB health checks.
app.get('/health', (req, res) => {
    res.status(200).json({
        status:        'ok',
        nodeId:        process.env.NODE_ID || 'unknown',
        hostname:      os.hostname(),
        timestamp:     new Date().toISOString(),
        uptimeSeconds: parseFloat(process.uptime().toFixed(2)),
    });
});

// ─── Per-node metrics ─────────────────────────────────────────────────────────
// Returns counters and latency stats for THIS node only.
app.get('/metrics', (req, res) => {
    res.status(200).json(metrics.getSnapshot());
});

// ─── Aggregated metrics ───────────────────────────────────────────────────────
// Queries /metrics on api1, api2, api3 in parallel via Docker's internal
// network, then sums counters and averages latency into one response.
app.get('/metrics/all', async (req, res) => {
    // Node hostnames on the Docker Compose internal network
    const nodeHosts = [
        process.env.NODE1_HOST || 'api1',
        process.env.NODE2_HOST || 'api2',
        process.env.NODE3_HOST || 'api3',
    ];
    const port = process.env.PORT || 3000;

    /**
     * Fetch /metrics from a single node.
     * Resolves to the parsed JSON object, or an error stub on failure.
     */
    function fetchNodeMetrics(host) {
        return new Promise((resolve) => {
            const url = `http://${host}:${port}/metrics`;
            const req = http.get(url, (nodeRes) => {
                let body = '';
                nodeRes.on('data', chunk => body += chunk);
                nodeRes.on('end', () => {
                    try {
                        resolve({ host, ...JSON.parse(body) });
                    } catch {
                        resolve({ host, error: 'invalid JSON' });
                    }
                });
            });
            req.on('error', (err) => {
                resolve({ host, error: err.message, unreachable: true });
            });
            req.setTimeout(3000, () => {
                req.destroy();
                resolve({ host, error: 'timeout', unreachable: true });
            });
        });
    }

    // Query all nodes in parallel
    const results = await Promise.all(nodeHosts.map(fetchNodeMetrics));

    // Separate reachable nodes from failed ones
    const reachable = results.filter(r => !r.unreachable && !r.error);
    const failed    = results.filter(r =>  r.unreachable ||  r.error);

    // Sum counters across all reachable nodes
    const aggregate = reachable.reduce((acc, node) => {
        acc.totalRequests += node.totalRequests  || 0;
        acc.cacheHits     += node.cacheHits      || 0;
        acc.cacheMisses   += node.cacheMisses    || 0;
        acc.originFetches += node.originFetches  || 0;
        acc.errors        += node.errors         || 0;
        acc._sumAvgLatency += node.avgLatencyMs  || 0;
        acc._sumP95Latency += node.p95LatencyMs  || 0;
        return acc;
    }, {
        totalRequests: 0, cacheHits: 0, cacheMisses: 0,
        originFetches: 0, errors: 0,
        _sumAvgLatency: 0, _sumP95Latency: 0,
    });

    const n = reachable.length || 1; // avoid divide-by-zero
    const cacheHitRatio = aggregate.totalRequests > 0
        ? parseFloat((aggregate.cacheHits / aggregate.totalRequests).toFixed(4))
        : 0;

    // Build per-node section (strip internal accumulator fields)
    const nodes = {};
    results.forEach(r => {
        const { host, _sumAvgLatency, _sumP95Latency, ...rest } = r;
        nodes[host] = rest;
    });

    res.status(200).json({
        collectedAt: new Date().toISOString(),
        nodesQueried: nodeHosts.length,
        nodesReachable: reachable.length,
        nodesFailed: failed.map(f => ({ host: f.host, error: f.error })),
        aggregate: {
            totalRequests:  aggregate.totalRequests,
            cacheHits:      aggregate.cacheHits,
            cacheMisses:    aggregate.cacheMisses,
            cacheHitRatio,
            cacheHitPercent: parseFloat((cacheHitRatio * 100).toFixed(2)),
            originFetches:  aggregate.originFetches,
            errors:         aggregate.errors,
            avgLatencyMs:   parseFloat((aggregate._sumAvgLatency / n).toFixed(2)),
            p95LatencyMs:   parseFloat((aggregate._sumP95Latency / n).toFixed(2)),
        },
        nodes,
    });
});

module.exports = app;