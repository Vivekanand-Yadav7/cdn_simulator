require('dotenv').config();
const app = require('./src/app');
const { initDb } = require('./src/db');

const PORT = process.env.PORT || 4000;

initDb()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Origin server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    });

