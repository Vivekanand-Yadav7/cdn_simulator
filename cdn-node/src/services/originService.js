const fs = require("fs").promises;
const path = require("path");

const ORIGIN_DIR = path.resolve(__dirname, "../../../origin-server/content");

/**
 * Reads a file from the origin server content directory.
 * @param {string} filename - The name of the file to fetch.
 * @returns {Promise<string|null>} File contents or null if not found.
 */
async function fetchFromOrigin(filename) {
    console.log(`Fetching from origin: ${filename}`);
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

module.exports = {
    fetchFromOrigin,
};
