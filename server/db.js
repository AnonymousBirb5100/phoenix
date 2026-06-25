const Database = require('better-sqlite3');
const db = new Database('phoenix.db'); // Creates or opens phoenix.db

// CREATE TABLE IF NOT EXISTS, well, creates the spreadsheet if it doesn't exist
// Following code creates the 2 spreadsheets
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS proxy_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    engine TEXT NOT NULL,
    session_data TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, engine)
  );
`);

console.log('Database ready');
module.exports = db;