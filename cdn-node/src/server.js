require('dotenv').config();
const app = require("./app");
const { redis } = require('./redis');

const port = process.env.PORT || 3000;

async function start() {
    // Verify Redis connection on startup
    const pong = await redis.ping();
    console.log(`Redis connected: ${pong}`);

    app.listen(port, () => {
        console.log(`CDN server is running on http://localhost:${port}`);
    });
}

start().catch((err) => {
    console.error('Failed to start CDN server:', err);
    process.exit(1);
});