const { sql } = require('../db');

/**
 * Saves (or replaces) a file's content in PostgreSQL.
 * @param {string} filename
 * @param {string} content
 */
exports.saveFile = async (filename, content) => {
    await sql`
        INSERT INTO files (filename, content)
        VALUES (${filename}, ${content})
        ON CONFLICT (filename) DO UPDATE SET content = EXCLUDED.content
    `;
    console.log(`Saved to PostgreSQL: ${filename}`);
};

/**
 * Retrieves a file's content from PostgreSQL.
 * @param {string} filename
 * @returns {Promise<string|null>}
 */
exports.getFile = async (filename) => {
    const rows = await sql`
        SELECT content FROM files WHERE filename = ${filename}
    `;
    if (rows.length === 0) {
        return null;
    }
    return rows[0].content;
};
