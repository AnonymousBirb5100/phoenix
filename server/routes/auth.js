const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

// Change this to any long random string — it's the secret used to
// sign tokens so nobody can fake them
const JWT_SECRET = 'the-phoenix-is-a-legendary-immortal-bird-that-cyclically-regenerates-or-is-otherwise-born-again';


// ── AUTH MIDDLEWARE ───────────────────────────────────────────
// Add requireAuth as the second argument to any route that needs login
// e.g. router.delete('/account', requireAuth, (req, res) => { ... })
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    // Check the token was actually sent
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    const token = authHeader.split(' ')[1]; // grab just the token, drop "Bearer "

    try {
        // Verify the signature using our secret — also checks expiry automatically
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // attach { userId, username } to the request for the route to use
        next();             // all good — let them through to the actual route
    } catch (err) {
        res.status(401).json({ error: 'Token invalid or expired, please log in again' });
    }
}
// ── REGISTER ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Hash the password before saving — 12 is the "difficulty" level
        const hash = await bcrypt.hash(password, 12);

        // The ? marks are placeholders — never put values directly in SQL
        // strings or attackers can manipulate your database (SQL injection)
        const stmt = db.prepare(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
        );
        const result = stmt.run(username, email, hash);

        res.json({ message: 'Account created!', userId: result.lastInsertRowid });

    } catch (err) {
        // SQLite throws this when username or email is already taken
        if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username or email already taken' });
        }
        res.status(500).json({ error: 'Something went wrong' });
    }
});

// ── LOGIN ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Look up the user by username
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    // We give the same vague error whether the username or password is wrong —
    // telling attackers WHICH one was wrong would help them too much
    if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    // bcrypt compares the typed password against the stored hash
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Password correct — create a token that expires in 7 days
    const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.json({ message: 'Logged in!', token });
});

// ── LOGOUT ───────────────────────────────────────────────────
// With JWTs, logout is handled on the client side — the browser
// just deletes the token it was storing. Nothing to do server-side.
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// ── DELETE ACCOUNT ────────────────────────────────────────────
router.delete('/account', requireAuth, async (req, res) => {
    const { userId } = req.user;
    const { password } = req.body; // user must send their password too

    if (!password) {
        return res.status(400).json({ error: 'Password required to delete account' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
        return res.status(401).json({ error: 'Incorrect password' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    res.json({ message: 'Account deleted' });
});

module.exports = router;
module.exports.requireAuth = requireAuth;