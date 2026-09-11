const fs = require("fs").promises;
const path = require("path");

const CACHE_DIR = path.resolve(__dirname, "../../cache");

/**
 * Retrieves cached content if available.
 * @param {string} filename - The name of the file to check.
 * @returns {Promise<string|null>} Cached content or null if not found.
 */
async function getCachedContent(filename) {
    const filePath = path.join(CACHE_DIR, filename);

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

/**
 * Writes content to the local cache directory.
 * @param {string} filename - The name of the file to store.
 * @param {string} content - The file data to cache.
 * @returns {Promise<void>}
 */
async function setCachedContent(filename, content) {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const filePath = path.join(CACHE_DIR, filename);
    await fs.writeFile(filePath, content, "utf-8");
    console.log(`Stored in cache: ${filename}`);
}

module.exports = {
    getCachedContent,
    setCachedContent,
};
