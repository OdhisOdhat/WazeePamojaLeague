
import express from 'express';
import cors from 'cors';
import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware configuration
app.use(cors({ origin: '*' }) as any);
app.use(express.json({ limit: '10mb' }) as any);

/**
 * Turso Client Configuration
 * Integrated with the provided cloud database credentials.
 */
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || "libsql://odhisodhat-vercel-icfg-ftcymaxmqxj9bs7ney2w5mpx.aws-us-east-1.turso.io",
  authToken: process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjkwODMyMjEsImlkIjoiNzA2MmVkNjItNDUwOS00YmEzLWIwYWYtNjBjY2YzNDJlMTg4IiwicmlkIjoiMDQ4ZmNlMDctMGEwOS00OGIxLTg3OWQtNTEzZGZiMWUxZmUzIn0.0i537WhP95mSF1AUrhIiakcMQebMcDFk21Q2C0d4b-YZpgJB4Plba8ox3wDDLtoFhJrsKDtr7r_E-dQ_aIDiBw",
});

async function setupDb() {
  try {
    console.log('Connecting to Turso Cloud at:', "libsql://odhisodhat-vercel-icfg-ftcymaxmqxj9bs7ney2w5mpx.aws-us-east-1.turso.io");
    
    // Create tables if they don't exist
    await db.execute(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, role TEXT, teamId TEXT);`);
    await db.execute(`CREATE TABLE IF NOT EXISTS teams (id TEXT PRIMARY KEY, data TEXT);`);
    await db.execute(`CREATE TABLE IF NOT EXISTS matches (id TEXT PRIMARY KEY, data TEXT);`);
    await db.execute(`CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY, data TEXT);`);

    // Ensure a default admin exists
    const adminCheck = await db.execute({ sql: 'SELECT * FROM users WHERE role = ?', args: ['ADMIN'] });
    if (adminCheck.rows.length === 0) {
      await db.execute({
        sql: 'INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, ?)',
        args: ['u-admin', 'admin', 'admin123', 'ADMIN']
      });
      console.log('✅ Seeded default admin user (admin/admin123)');
    }
    
    console.log('🚀 Turso Database initialized and ready');
  } catch (err) {
    console.error('❌ Turso DB Error:', err);
  }
}

// API Routes
app.get('/api/teams', async (req: any, res: any) => {
  try {
    const result = await db.execute('SELECT data FROM teams');
    res.json(result.rows.map((row: any) => JSON.parse(row.data as string)));
  } catch (e) { res.status(500).json({ error: 'Failed to fetch teams' }); }
});

app.post('/api/teams', async (req: any, res: any) => {
  try {
    await db.execute({
      sql: 'INSERT INTO teams (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data',
      args: [req.body.id, JSON.stringify(req.body)]
    });
    res.status(201).json(req.body);
  } catch (e) { res.status(500).json({ error: 'Failed to save team' }); }
});

app.get('/api/matches', async (req: any, res: any) => {
  try {
    const result = await db.execute('SELECT data FROM matches');
    res.json(result.rows.map((row: any) => JSON.parse(row.data as string)));
  } catch (e) { res.status(500).json({ error: 'Failed to fetch matches' }); }
});

app.post('/api/matches', async (req: any, res: any) => {
  try {
    await db.execute({
      sql: 'INSERT INTO matches (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data',
      args: [req.body.id, JSON.stringify(req.body)]
    });
    res.status(201).json(req.body);
  } catch (e) { res.status(500).json({ error: 'Failed to save match' }); }
});

app.get('/api/settings', async (req: any, res: any) => {
  try {
    const result = await db.execute("SELECT data FROM settings WHERE id = 'global'");
    res.json(result.rows.length > 0 ? JSON.parse(result.rows[0].data as string) : null);
  } catch (e) { res.status(500).json({ error: 'Failed to fetch settings' }); }
});

app.post('/api/settings', async (req: any, res: any) => {
  try {
    await db.execute({
      sql: "INSERT INTO settings (id, data) VALUES ('global', ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data",
      args: [JSON.stringify(req.body)]
    });
    res.status(201).json(req.body);
  } catch (e) { res.status(500).json({ error: 'Failed to save settings' }); }
});

app.post('/api/auth/register', async (req: any, res: any) => {
  const { username, password, role, teamId } = req.body;
  try {
    const id = `u-${Date.now()}`;
    await db.execute({
      sql: 'INSERT INTO users (id, username, password, role, teamId) VALUES (?, ?, ?, ?, ?)',
      args: [id, username, password, role, teamId || null]
    });
    res.status(201).json({ id, username, role, teamId });
  } catch (e) { res.status(400).json({ error: 'Registration failed' }); }
});

app.post('/api/auth/login', async (req: any, res: any) => {
  const { username, password } = req.body;
  try {
    const result = await db.execute({ sql: 'SELECT * FROM users WHERE username = ? AND password = ?', args: [username, password] });
    if (result.rows[0]) {
      const user = result.rows[0];
      res.json({ role: user.role, teamId: user.teamId });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (e) { res.status(500).json({ error: 'Login failed' }); }
});

setupDb().then(() => {
  app.listen(port, () => {
    console.log(`📡 Backend listening at http://localhost:${port}`);
  });
});
