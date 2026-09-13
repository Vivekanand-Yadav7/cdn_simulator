const fs = require('fs').promises;
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '../../content');

exports.saveFile = async (filename, content) => {
    await fs.mkdir(CONTENT_DIR, { recursive: true });
    const filePath = path.join(CONTENT_DIR, filename);
    await fs.writeFile(filePath, content, 'utf-8');
};

exports.getFile = async (filename) => {
    const filePath = path.join(CONTENT_DIR, filename);
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        if (error.code === 'ENOENT') {
            return null;
        }
        throw error;
    }
};
