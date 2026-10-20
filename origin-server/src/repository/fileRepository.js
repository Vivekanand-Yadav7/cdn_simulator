'use strict';

const { sql } = require('../db');

/**
 * Repository for the `files` table.
 * Responsibility: execute SQL and return plain JS objects.
 * No file-system or business logic lives here.
 */

/**
 * Inserts or replaces a file record (upsert by filename).
 * @param {string} filename
 * @param {string} content
 * @returns {Promise<void>}
 */
async function upsert(filename, content) {
    await sql`
        INSERT INTO files (filename, content)
        VALUES (${filename}, ${content})
        ON CONFLICT (filename) DO UPDATE SET content = EXCLUDED.content
    `;
}

/**
 * Retrieves a file's content by filename.
 * @param {string} filename
 * @returns {Promise<string | null>}  File content, or null if not found.
 */
async function findByFilename(filename) {
    const rows = await sql`
        SELECT content
        FROM files
        WHERE filename = ${filename}
        LIMIT 1
    `;
    return rows.length > 0 ? rows[0].content : null;
}

module.exports = { upsert, findByFilename };
