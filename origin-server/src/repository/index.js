'use strict';

/**
 * Barrel file — re-exports all repositories from one import point.
 *
 * Usage:
 *   const { userRepository, fileRepository } = require('../repository');
 */

const userRepository = require('./userRepository');
const fileRepository = require('./fileRepository');

module.exports = { userRepository, fileRepository };
