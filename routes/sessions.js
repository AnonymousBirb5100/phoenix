const express = require('express');
const db = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();

// Save (or update) the session ID for a given engine
router.post('/sessions/:engine', requireAuth, (req, res) => {
    const { userId } = req.user;
    const { engine } = req.params;         // e.g. 'rammerhead'
    const { sessionId } = req.body;

    // ON CONFLICT handles the update case — safe to call every time
    db.prepare(`
        INSERT INTO proxy_sessions (user_id, engine, session_data, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(user_id, engine) DO UPDATE SET
            session_data = excluded.session_data,
            updated_at   = excluded.updated_at
    `).run(userId, engine, JSON.stringify({ sessionId }));

    res.json({ message: 'Session saved' });
});

// Retrieve the saved session ID for a given engine
router.get('/sessions/:engine', requireAuth, (req, res) => {
    const { userId } = req.user;
    const { engine } = req.params;

    const row = db.prepare(
        'SELECT session_data FROM proxy_sessions WHERE user_id = ? AND engine = ?'
    ).get(userId, engine);

    if (!row) return res.json({ sessionId: null }); // no session saved yet

    const { sessionId } = JSON.parse(row.session_data);
    res.json({ sessionId });
});

module.exports = router;