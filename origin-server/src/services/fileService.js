'use strict';

const { fileRepository } = require('../repository');

/**
 * Saves (or replaces) a file's content in PostgreSQL.
 * @param {string} filename
 * @param {string} content
 */
exports.saveFile = async (filename, content) => {
    await fileRepository.upsert(filename, content);
    console.log(`Saved to PostgreSQL: ${filename}`);
};

/**
 * Retrieves a file's content from PostgreSQL.
 * @param {string} filename
 * @returns {Promise<string|null>}
 */
exports.getFile = async (filename) => {
    return fileRepository.findByFilename(filename);
};
