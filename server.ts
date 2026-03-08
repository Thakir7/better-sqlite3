import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import fs from "fs";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Database Configuration ---
const isPostgres = !!process.env.DATABASE_URL;
let db: any;

if (isPostgres) {
  // PostgreSQL (Production)
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  db = {
    prepare: (sql: string) => ({
      all: async (...params: any[]) => (await pool.query(sql.replace(/\?/g, (_, i) => `$${i + 1}`), params)).rows,
      get: async (...params: any[]) => (await pool.query(sql.replace(/\?/g, (_, i) => `$${i + 1}`), params)).rows[0],
      run: async (...params: any[]) => {
        const res = await pool.query(sql.replace(/\?/g, (_, i) => `$${i + 1}`), params);
        return { lastInsertRowid: res.rows[0]?.id || (res as any).oid };
      }
    }),
    exec: async (sql: string) => {
      // Split by semicolon but ignore inside strings
      const queries = sql.split(';').filter(q => q.trim());
      for (const q of queries) {
        await pool.query(q);
      }
    },
    transaction: (fn: Function) => fn() // Simple wrapper for now
  };
} else {
  // SQLite (Local Development)
  const dbPath = process.env.DATABASE_PATH || "shatla.db";
  const dbDir = path.dirname(path.resolve(dbPath));
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  const sqlite = new Database(dbPath);
  db = {
    prepare: (sql: string) => {
      const stmt = sqlite.prepare(sql);
      return {
        all: (...params: any[]) => stmt.all(...params),
        get: (...params: any[]) => stmt.get(...params),
        run: (...params: any[]) => stmt.run(...params)
      };
    },
    exec: (sql: string) => sqlite.exec(sql),
    transaction: (fn: Function) => sqlite.transaction(fn as any)()
  };
}

// --- Initialize Schema ---
const initSchema = async () => {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'nursery', 'volunteer')) NOT NULL,
      phone TEXT,
      location TEXT,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS seedlings (
      id SERIAL PRIMARY KEY,
      nursery_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      count INTEGER NOT NULL,
      description TEXT,
      requirements TEXT,
      image_url TEXT,
      status TEXT DEFAULT 'available',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS requests (
      id SERIAL PRIMARY KEY,
      volunteer_id INTEGER NOT NULL,
      seedling_id INTEGER NOT NULL,
      count INTEGER NOT NULL,
      location TEXT,
      status TEXT DEFAULT 'pending_nursery',
      rejection_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS proofs (
      id SERIAL PRIMARY KEY,
      request_id INTEGER NOT NULL,
      before_image_url TEXT NOT NULL,
      after_image_url TEXT NOT NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS volunteer_hours (
      id SERIAL PRIMARY KEY,
      volunteer_id INTEGER NOT NULL,
      request_id INTEGER NOT NULL,
      hours REAL DEFAULT 2.0,
      granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `;

  // Convert SERIAL to INTEGER PRIMARY KEY AUTOINCREMENT for SQLite
  const finalSchema = isPostgres ? schema : schema.replace(/SERIAL PRIMARY KEY/g, "INTEGER PRIMARY KEY AUTOINCREMENT").replace(/TIMESTAMP/g, "DATETIME");
  
  await db.exec(finalSchema);

  // Seed default data
  try {
    if (isPostgres) {
      await db.prepare("INSERT INTO users (name, email, password, role, status) VALUES ('مدير النظام', 'admin@shatla.sa', 'admin123', 'admin', 'active') ON CONFLICT (email) DO NOTHING").run();
      await db.prepare("INSERT INTO settings (key, value) VALUES ('hero_image', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=2000') ON CONFLICT (key) DO NOTHING").run();
      await db.prepare("INSERT INTO settings (key, value) VALUES ('stats_image', 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=1000') ON CONFLICT (key) DO NOTHING").run();
    } else {
      db.prepare("INSERT OR IGNORE INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)").run('مدير النظام', 'admin@shatla.sa', 'admin123', 'admin', 'active');
      db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('hero_image', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=2000');
      db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)").run('stats_image', 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=1000');
    }
  } catch (e) {
    console.log("Seeding skipped or already done");
  }
};

async function startServer() {
  await initSchema();
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // --- API Routes ---

  app.get("/api/settings", async (req, res) => {
    const settings = await db.prepare("SELECT key, value FROM settings").all();
    const settingsMap = (settings as {key: string, value: string}[]).reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
    res.json(settingsMap);
  });

  app.patch("/api/settings", async (req, res) => {
    const { key, value } = req.body;
    try {
      await db.prepare("UPDATE settings SET value = ? WHERE key = ?").run(value, key);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, role, phone, location } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO users (name, email, password, role, phone, location) VALUES (?, ?, ?, ?, ?, ?) RETURNING id");
      const info = await stmt.run(name, email, password, role, phone, location);
      const id = info.lastInsertRowid;
      const user = await db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(id);
      res.json(user);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await db.prepare("SELECT id, name, email, role FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/seedlings", async (req, res) => {
    const seedlings = await db.prepare(`
      SELECT s.*, u.name as nursery_name 
      FROM seedlings s 
      JOIN users u ON s.nursery_id = u.id 
      WHERE s.status = 'available' AND s.count > 0
    `).all();
    res.json(seedlings);
  });

  app.get("/api/seedlings/nursery/:id", async (req, res) => {
    const seedlings = await db.prepare(`
      SELECT * FROM seedlings WHERE nursery_id = ?
    `).all(parseInt(req.params.id));
    res.json(seedlings);
  });

  app.post("/api/seedlings", async (req, res) => {
    const { nursery_id, type, count, description, requirements, image_url } = req.body;
    const stmt = db.prepare("INSERT INTO seedlings (nursery_id, type, count, description, requirements, image_url) VALUES (?, ?, ?, ?, ?, ?) RETURNING id");
    const info = await stmt.run(parseInt(nursery_id), type, parseInt(count), description, requirements, image_url);
    res.json({ id: info.lastInsertRowid });
  });

  app.post("/api/requests", async (req, res) => {
    const { volunteer_id, seedling_id, count, location } = req.body;
    const stmt = db.prepare("INSERT INTO requests (volunteer_id, seedling_id, count, location) VALUES (?, ?, ?, ?) RETURNING id");
    const info = await stmt.run(parseInt(volunteer_id), parseInt(seedling_id), parseInt(count), location);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/requests/nursery/:id", async (req, res) => {
    const requests = await db.prepare(`
      SELECT r.*, u.name as volunteer_name, s.type as seedling_type 
      FROM requests r 
      JOIN users u ON r.volunteer_id = u.id 
      JOIN seedlings s ON r.seedling_id = s.id 
      WHERE s.nursery_id = ?
    `).all(parseInt(req.params.id));
    res.json(requests);
  });

  app.get("/api/requests/volunteer/:id", async (req, res) => {
    const requests = await db.prepare(`
      SELECT r.*, s.type as seedling_type, u.name as nursery_name 
      FROM requests r 
      JOIN seedlings s ON r.seedling_id = s.id 
      JOIN users u ON s.nursery_id = u.id 
      WHERE r.volunteer_id = ?
    `).all(parseInt(req.params.id));
    res.json(requests);
  });

  app.patch("/api/requests/:id/status", async (req, res) => {
    const { status, rejection_reason } = req.body;
    const stmt = db.prepare("UPDATE requests SET status = ?, rejection_reason = ? WHERE id = ?");
    await stmt.run(status, rejection_reason || null, parseInt(req.params.id));

    if (status === 'approved_nursery') {
      const request = await db.prepare("SELECT seedling_id, count FROM requests WHERE id = ?").get(parseInt(req.params.id)) as any;
      await db.prepare("UPDATE seedlings SET count = count - ? WHERE id = ?").run(parseInt(request.count), parseInt(request.seedling_id));
    }

    res.json({ success: true });
  });

  app.post("/api/proofs", async (req, res) => {
    const { request_id, before_image_url, after_image_url, notes } = req.body;
    await db.transaction(async () => {
      await db.prepare("INSERT INTO proofs (request_id, before_image_url, after_image_url, notes) VALUES (?, ?, ?, ?)").run(request_id, before_image_url, after_image_url, notes);
      await db.prepare("UPDATE requests SET status = 'proof_uploaded' WHERE id = ?").run(request_id);
    });
    res.json({ success: true });
  });

  app.get("/api/admin/users", async (req, res) => {
    const users = await db.prepare("SELECT id, name, email, role, phone, location, status, created_at FROM users").all();
    res.json(users);
  });

  app.patch("/api/admin/users/:id", async (req, res) => {
    const { name, email, role, phone, location, status } = req.body;
    try {
      const stmt = db.prepare(`
        UPDATE users 
        SET name = ?, email = ?, role = ?, phone = ?, location = ?, status = ? 
        WHERE id = ?
      `);
      await stmt.run(name, email, role, phone, location, status, parseInt(req.params.id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    try {
      await db.prepare("DELETE FROM users WHERE id = ?").run(parseInt(req.params.id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/admin/pending-proofs", async (req, res) => {
    const proofs = await db.prepare(`
      SELECT p.*, r.volunteer_id, r.count, s.type as seedling_type, u.name as volunteer_name 
      FROM proofs p 
      JOIN requests r ON p.request_id = r.id 
      JOIN seedlings s ON r.seedling_id = s.id 
      JOIN users u ON r.volunteer_id = u.id 
      WHERE r.status = 'proof_uploaded'
    `).all();
    res.json(proofs);
  });

  app.post("/api/admin/approve-proof", async (req, res) => {
    const { request_id, volunteer_id } = req.body;
    await db.transaction(async () => {
      await db.prepare("UPDATE requests SET status = 'approved_admin' WHERE id = ?").run(parseInt(request_id));
      await db.prepare("INSERT INTO volunteer_hours (volunteer_id, request_id) VALUES (?, ?)").run(parseInt(volunteer_id), parseInt(request_id));
    });
    res.json({ success: true });
  });

  app.get("/api/stats", async (req, res) => {
    const totalSeedlings = await db.prepare("SELECT SUM(count) as total FROM seedlings").get() as any;
    const plantedSeedlings = await db.prepare("SELECT SUM(count) as total FROM requests WHERE status = 'approved_admin'").get() as any;
    const totalVolunteers = await db.prepare("SELECT COUNT(*) as total FROM users WHERE role = 'volunteer'").get() as any;
    const totalHours = await db.prepare("SELECT SUM(hours) as total FROM volunteer_hours").get() as any;
    
    const topVolunteers = await db.prepare(`
      SELECT u.name, SUM(vh.hours) as hours 
      FROM users u 
      JOIN volunteer_hours vh ON u.id = vh.volunteer_id 
      GROUP BY u.id, u.name
      ORDER BY hours DESC 
      LIMIT 5
    `).all();

    res.json({
      totalSeedlings: totalSeedlings?.total || 0,
      plantedSeedlings: plantedSeedlings?.total || 0,
      totalVolunteers: totalVolunteers?.total || 0,
      totalHours: totalHours?.total || 0,
      topVolunteers
    });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
