const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sql } = require('../db');

// Use environment variable for JWT secret, or fallback to a hardcoded one for dev.
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';

exports.signup = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        // Check if user already exists
        const existingUsers = await sql`SELECT id FROM users WHERE username = ${username}`;
        if (existingUsers.length > 0) {
            return res.status(409).json({ error: 'Username already exists.' });
        }

        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const newUsers = await sql`
            INSERT INTO users (username, password_hash) 
            VALUES (${username}, ${passwordHash}) 
            RETURNING id, username
        `;

        const user = newUsers[0];
        res.status(201).json({ message: 'User created successfully.', user });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error during signup.' });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        // Fetch user from DB
        const users = await sql`SELECT * FROM users WHERE username = ${username}`;
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        const user = users[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ message: 'Login successful.', token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error during login.' });
    }
};
