const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { userRepository } = require('../repository');

// Use environment variable for JWT secret, or fallback to a hardcoded one for dev.
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-dev-key';

exports.signup = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        // Check if user already exists
        const existingUser = await userRepository.findByUsername(username);
        if (existingUser !== null) {
            return res.status(409).json({ error: 'Username already exists.' });
        }

        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const user = await userRepository.create(username, passwordHash);

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
        const user = await userRepository.findByUsername(username);
        if (user === null) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }

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
