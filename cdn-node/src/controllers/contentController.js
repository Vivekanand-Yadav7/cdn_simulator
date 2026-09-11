const path = require("path");
const cacheService = require("../services/cacheService");
const originService = require("../services/originService");

/**
 * Validates that a filename does not attempt directory traversal.
 * @param {string} filename - The filename to validate.
 * @returns {boolean} True if safe, false if path traversal detected.
 */
function isSafeFilename(filename) {
    if (!filename || typeof filename !== "string") {
        return false;
    }
    // Block path traversal indicators and directory separators
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
        return false;
    }
    return path.basename(filename) === filename;
}

/**
 * Handles GET /content/:filename requests.
 */
async function getContent(req, res) {
    const { filename } = req.params;

    // 1. Guard against path traversal attacks
    if (!isSafeFilename(filename)) {
        return res.status(400).send("Invalid filename: Path traversal is not allowed.");
    }

    try {
        // 2. Check local filesystem cache
        const cachedContent = await cacheService.getCachedContent(filename);

        if (cachedContent !== null) {
            console.log(`Cache HIT: ${filename}`);
            res.setHeader("X-Cache", "HIT");
            return res.status(200).send(cachedContent);
        }

        // 3. Cache MISS: Fetch from origin
        console.log(`Cache MISS: ${filename}`);
        const originContent = await originService.fetchFromOrigin(filename);

        if (originContent === null) {
            return res.status(404).send("Content not found");
        }

        // 4. Store retrieved content in local cache
        await cacheService.setCachedContent(filename, originContent);

        res.setHeader("X-Cache", "MISS");
        return res.status(200).send(originContent);
    } catch (error) {
        console.error(`Error handling content request for "${filename}":`, error);
        return res.status(500).send("Internal Server Error");
    }
}

module.exports = {
    getContent,
};
