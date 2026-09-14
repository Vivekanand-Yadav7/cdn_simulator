require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const https = require('https');

// Node.js v24's built-in fetch (undici) has connection issues with Neon's
// AWS endpoints. We provide a custom fetch using the native https module
// which works correctly.
function nodeFetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const reqOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 443,
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: options.headers || {},
            family: 4, // force IPv4 to avoid ENETUNREACH on IPv6
        };
        const req = https.request(reqOptions, (res) => {
            const chunks = [];
            res.on('data', (d) => chunks.push(d));
            res.on('end', () => {
                const body = Buffer.concat(chunks).toString();
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    headers: { get: (h) => res.headers[h.toLowerCase()] },
                    text: () => Promise.resolve(body),
                    json: () => Promise.resolve(JSON.parse(body)),
                });
            });
        });
        req.on('error', reject);
        req.setTimeout(10000, () => { req.destroy(new Error('Request timed out')); });
        if (options.body) req.write(options.body);
        req.end();
    });
}

const sql = neon(process.env.DATABASE_URL, { fetchFunction: nodeFetch });

/**
 * Initializes the database by creating the `files` table if it doesn't exist.
 */
async function initDb() {
    await sql`
        CREATE TABLE IF NOT EXISTS files (
            id SERIAL PRIMARY KEY,
            filename VARCHAR(255) UNIQUE NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    console.log('PostgreSQL (Neon) connected & table ready.');
}

module.exports = { sql, initDb };
