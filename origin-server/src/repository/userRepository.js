'use strict';

const { sql } = require('../db');

/**
 * Repository for the `users` table.
 * Responsibility: execute SQL and return plain JS objects.
 * No business logic (no bcrypt, no JWT) lives here.
 */

/**
 * Finds a single user by username.
 * @param {string} username
 * @returns {Promise<{id: number, username: string, password_hash: string, created_at: Date} | null>}
 */
async function findByUsername(username) {
    const rows = await sql`
        SELECT id, username, password_hash, created_at
        FROM users
        WHERE username = ${username}
        LIMIT 1
    `;
    return rows.length > 0 ? rows[0] : null;
}

/**
 * Inserts a new user and returns the created record.
 * @param {string} username
 * @param {string} passwordHash  - Pre-hashed password (bcrypt)
 * @returns {Promise<{id: number, username: string}>}
 */
async function create(username, passwordHash) {
    const rows = await sql`
        INSERT INTO users (username, password_hash)
        VALUES (${username}, ${passwordHash})
        RETURNING id, username
    `;
    return rows[0];
}

module.exports = { findByUsername, create };
