const http = require("http");

const ORIGIN_URL = process.env.ORIGIN_URL || 'http://localhost:4000';

/**
 * Reads a file from the origin server via HTTP.
 * @param {string} filename - The name of the file to fetch.
 * @returns {Promise<string|null>} File contents or null if not found.
 */
function fetchFromOrigin(filename) {
    return new Promise((resolve, reject) => {
        console.log(`Fetching from origin via HTTP: ${ORIGIN_URL}/content/${filename}`);
        const url = new URL(`${ORIGIN_URL}/content/${filename}`);
        const req = http.request(url, res => {
            if (res.statusCode === 404) {
                return resolve(null);
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.end();
    });
}

function fetchFromOriginHttp(filename) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${ORIGIN_URL}/api/file/${filename.replace('.txt', '')}`);
        const req = http.request(url, res => {
            if (res.statusCode === 404) {
                return resolve(null);
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.end();
    });
}

module.exports = {
    fetchFromOrigin,
    fetchFromOriginHttp
};
