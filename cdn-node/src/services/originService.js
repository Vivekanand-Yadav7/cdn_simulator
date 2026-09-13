const fs = require("fs").promises;
const path = require("path");
const http = require("http");

const ORIGIN_DIR = path.resolve(__dirname, "../../../origin-server/content");

/**
 * Reads a file from the origin server content directory.
 * @param {string} filename - The name of the file to fetch.
 * @returns {Promise<string|null>} File contents or null if not found.
 */
async function fetchFromOrigin(filename) {
    console.log(`Fetching from origin locally: ${filename}`);
    const filePath = path.join(ORIGIN_DIR, filename);

    try {
        const data = await fs.readFile(filePath, "utf-8");
        return data;
    } catch (error) {
        if (error.code === "ENOENT") {
            return null;
        }
        throw error;
    }
}

function fetchFromOriginHttp(filename) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3001,
            path: `/api/file/${filename.replace('.txt', '')}`,
            method: 'GET'
        }, res => {
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

function postToOrigin(filename, content) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: 3001,
            path: `/api/file/${filename.replace('.txt', '')}`,
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
                'Content-Length': Buffer.byteLength(content)
            }
        }, res => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve();
            } else {
                reject(new Error(`Origin responded with status ${res.statusCode}`));
            }
        });
        req.on('error', reject);
        req.write(content);
        req.end();
    });
}

module.exports = {
    fetchFromOrigin,
    fetchFromOriginHttp,
    postToOrigin
};
