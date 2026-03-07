import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Database
const dbPath = process.env.DATABASE_PATH || "shatla.db";
const dbDir = path.dirname(path.resolve(dbPath));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(dbPath);

// Create Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'nursery', 'volunteer')) NOT NULL,
    phone TEXT,
    location TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS seedlings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nursery_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    count INTEGER NOT NULL,
    description TEXT,
    requirements TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nursery_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    volunteer_id INTEGER NOT NULL,
    seedling_id INTEGER NOT NULL,
    count INTEGER NOT NULL,
    location TEXT,
    status TEXT DEFAULT 'pending_nursery',
    rejection_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_id) REFERENCES users(id),
    FOREIGN KEY (seedling_id) REFERENCES seedlings(id)
  );

  CREATE TABLE IF NOT EXISTS proofs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    before_image_url TEXT NOT NULL,
    after_image_url TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES requests(id)
  );

  CREATE TABLE IF NOT EXISTS volunteer_hours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    volunteer_id INTEGER NOT NULL,
    request_id INTEGER NOT NULL,
    hours REAL DEFAULT 2.0,
    granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (volunteer_id) REFERENCES users(id),
    FOREIGN KEY (request_id) REFERENCES requests(id)
  );

  -- Create default admin if not exists
  INSERT OR IGNORE INTO users (name, email, password, role, status) 
  VALUES ('مدير النظام', 'admin@shatla.sa', 'admin123', 'admin', 'active');

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  INSERT OR IGNORE INTO settings (key, value) VALUES ('hero_image', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=2000');
  INSERT OR IGNORE INTO settings (key, value) VALUES ('stats_image', 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=1000');
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // --- API Routes ---

  // Site Settings
  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT key, value FROM settings").all();
    const settingsMap = (settings as {key: string, value: string}[]).reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
    res.json(settingsMap);
  });

  app.patch("/api/settings", (req, res) => {
    const { key, value } = req.body;
    try {
      db.prepare("UPDATE settings SET value = ? WHERE key = ?").run(value, key);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Auth
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, role, phone, location } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO users (name, email, password, role, phone, location) VALUES (?, ?, ?, ?, ?, ?)");
      const info = stmt.run(name, email, password, role, phone, location);
      const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(info.lastInsertRowid);
      res.json(user);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT id, name, email, role FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Seedlings
  app.get("/api/seedlings", (req, res) => {
    const seedlings = db.prepare(`
      SELECT s.*, u.name as nursery_name 
      FROM seedlings s 
      JOIN users u ON s.nursery_id = u.id 
      WHERE s.status = 'available' AND s.count > 0
    `).all();
    res.json(seedlings);
  });

  app.post("/api/seedlings", (req, res) => {
    const { nursery_id, type, count, description, requirements, image_url } = req.body;
    const stmt = db.prepare("INSERT INTO seedlings (nursery_id, type, count, description, requirements, image_url) VALUES (?, ?, ?, ?, ?, ?)");
    const info = stmt.run(nursery_id, type, count, description, requirements, image_url);
    res.json({ id: info.lastInsertRowid });
  });

  // Requests
  app.post("/api/requests", (req, res) => {
    const { volunteer_id, seedling_id, count, location } = req.body;
    const stmt = db.prepare("INSERT INTO requests (volunteer_id, seedling_id, count, location) VALUES (?, ?, ?, ?)");
    const info = stmt.run(volunteer_id, seedling_id, count, location);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/requests/nursery/:id", (req, res) => {
    const requests = db.prepare(`
      SELECT r.*, u.name as volunteer_name, s.type as seedling_type 
      FROM requests r 
      JOIN users u ON r.volunteer_id = u.id 
      JOIN seedlings s ON r.seedling_id = s.id 
      WHERE s.nursery_id = ?
    `).all(req.params.id);
    res.json(requests);
  });

  app.get("/api/requests/volunteer/:id", (req, res) => {
    const requests = db.prepare(`
      SELECT r.*, s.type as seedling_type, u.name as nursery_name 
      FROM requests r 
      JOIN seedlings s ON r.seedling_id = s.id 
      JOIN users u ON s.nursery_id = u.id 
      WHERE r.volunteer_id = ?
    `).all(req.params.id);
    res.json(requests);
  });

  app.patch("/api/requests/:id/status", (req, res) => {
    const { status, rejection_reason } = req.body;
    const stmt = db.prepare("UPDATE requests SET status = ?, rejection_reason = ? WHERE id = ?");
    stmt.run(status, rejection_reason || null, req.params.id);

    // If approved by nursery, decrement seedling count
    if (status === 'approved_nursery') {
      const request = db.prepare("SELECT seedling_id, count FROM requests WHERE id = ?").get(req.params.id) as any;
      db.prepare("UPDATE seedlings SET count = count - ? WHERE id = ?").run(request.count, request.seedling_id);
    }

    res.json({ success: true });
  });

  // Proofs
  app.post("/api/proofs", (req, res) => {
    const { request_id, before_image_url, after_image_url, notes } = req.body;
    db.transaction(() => {
      db.prepare("INSERT INTO proofs (request_id, before_image_url, after_image_url, notes) VALUES (?, ?, ?, ?)").run(request_id, before_image_url, after_image_url, notes);
      db.prepare("UPDATE requests SET status = 'proof_uploaded' WHERE id = ?").run(request_id);
    })();
    res.json({ success: true });
  });

  // Admin - User Management
  app.get("/api/admin/users", (req, res) => {
    const users = db.prepare("SELECT id, name, email, role, phone, location, status, created_at FROM users").all();
    res.json(users);
  });

  app.patch("/api/admin/users/:id", (req, res) => {
    const { name, email, role, phone, location, status } = req.body;
    try {
      const stmt = db.prepare(`
        UPDATE users 
        SET name = ?, email = ?, role = ?, phone = ?, location = ?, status = ? 
        WHERE id = ?
      `);
      stmt.run(name, email, role, phone, location, status, req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/admin/users/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Admin - Pending Proofs
  app.get("/api/admin/pending-proofs", (req, res) => {
    const proofs = db.prepare(`
      SELECT p.*, r.volunteer_id, r.count, s.type as seedling_type, u.name as volunteer_name 
      FROM proofs p 
      JOIN requests r ON p.request_id = r.id 
      JOIN seedlings s ON r.seedling_id = s.id 
      JOIN users u ON r.volunteer_id = u.id 
      WHERE r.status = 'proof_uploaded'
    `).all();
    res.json(proofs);
  });

  app.post("/api/admin/approve-proof", (req, res) => {
    const { request_id, volunteer_id } = req.body;
    db.transaction(() => {
      db.prepare("UPDATE requests SET status = 'approved_admin' WHERE id = ?").run(request_id);
      db.prepare("INSERT INTO volunteer_hours (volunteer_id, request_id) VALUES (?, ?)").run(volunteer_id, request_id);
    })();
    res.json({ success: true });
  });

  // Stats
  app.get("/api/stats", (req, res) => {
    const totalSeedlings = db.prepare("SELECT SUM(count) as total FROM seedlings").get() as any;
    const plantedSeedlings = db.prepare("SELECT SUM(count) as total FROM requests WHERE status = 'approved_admin'").get() as any;
    const totalVolunteers = db.prepare("SELECT COUNT(*) as total FROM users WHERE role = 'volunteer'").get() as any;
    const totalHours = db.prepare("SELECT SUM(hours) as total FROM volunteer_hours").get() as any;
    
    const topVolunteers = db.prepare(`
      SELECT u.name, SUM(vh.hours) as hours 
      FROM users u 
      JOIN volunteer_hours vh ON u.id = vh.volunteer_id 
      GROUP BY u.id 
      ORDER BY hours DESC 
      LIMIT 5
    `).all();

    res.json({
      totalSeedlings: totalSeedlings.total || 0,
      plantedSeedlings: plantedSeedlings.total || 0,
      totalVolunteers: totalVolunteers.total || 0,
      totalHours: totalHours.total || 0,
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
