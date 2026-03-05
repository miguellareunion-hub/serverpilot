import React, { useState } from "react";
import { Copy, Check, Server, Database, Lock, Package } from "lucide-react";

function CodeBlock({ code, language = "bash" }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-slate-900 rounded-xl border border-slate-700 overflow-hidden my-3">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs text-slate-400 font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>
      <pre className="p-4 text-sm text-slate-100 overflow-x-auto font-mono leading-relaxed whitespace-pre">{code}</pre>
    </div>
  );
}

function Section({ icon: Icon, title, color, children }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

const STEP1_INIT = `mkdir serverpanel-backend && cd serverpanel-backend
npm init -y
npm install express better-sqlite3 bcryptjs jsonwebtoken cors dotenv multer`;

const STEP2_SERVER = `// server.js
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const db = new Database('./serverpanel.db');
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-secret';

app.use(cors());
app.use(express.json());

// ─── Init DB ────────────────────────────────────────────────
db.exec(\`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    password TEXT,
    role TEXT DEFAULT 'user',
    created_date TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS servers (
    id TEXT PRIMARY KEY,
    name TEXT, host TEXT, port INTEGER DEFAULT 22,
    username TEXT, password TEXT, ssh_private_key TEXT,
    status TEXT DEFAULT 'unknown', os TEXT,
    cpu_usage REAL, ram_usage REAL, disk_usage REAL,
    enabled INTEGER DEFAULT 1,
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT, slug TEXT, server_id TEXT,
    type TEXT DEFAULT 'other', status TEXT DEFAULT 'stopped',
    port INTEGER, path TEXT, description TEXT,
    zip_url TEXT, env_vars TEXT, auto_start INTEGER DEFAULT 0,
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    level TEXT DEFAULT 'info', category TEXT DEFAULT 'system',
    message TEXT, details TEXT,
    server_id TEXT, project_id TEXT,
    created_date TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS dependencies (
    id TEXT PRIMARY KEY,
    name TEXT, server_id TEXT,
    status TEXT DEFAULT 'not_installed', version TEXT,
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS backups (
    id TEXT PRIMARY KEY,
    name TEXT, type TEXT DEFAULT 'project',
    status TEXT DEFAULT 'queued', size TEXT,
    server_id TEXT, project_id TEXT, file_url TEXT, notes TEXT,
    created_date TEXT DEFAULT (datetime('now')),
    updated_date TEXT DEFAULT (datetime('now'))
  );
\`);

// ─── Helpers ─────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

// ─── Auth Routes ─────────────────────────────────────────────
app.post('/auth/register', (req, res) => {
  const { email, password, full_name } = req.body;
  const hash = bcrypt.hashSync(password, 10);
  const id = uid();
  db.prepare('INSERT INTO users (id, email, full_name, password) VALUES (?,?,?,?)')
    .run(id, email, full_name, hash);
  res.json({ id, email, full_name });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
});

app.get('/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, email, full_name, role FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// ─── Generic CRUD Factory ────────────────────────────────────
function crudRoutes(table) {
  app.get(\`/entities/\${table}\`, auth, (req, res) => {
    const rows = db.prepare(\`SELECT * FROM \${table} ORDER BY created_date DESC\`).all();
    res.json(rows);
  });
  app.post(\`/entities/\${table}\`, auth, (req, res) => {
    const data = { id: uid(), ...req.body, created_date: new Date().toISOString(), updated_date: new Date().toISOString() };
    const cols = Object.keys(data).join(',');
    const vals = Object.keys(data).map(() => '?').join(',');
    db.prepare(\`INSERT INTO \${table} (\${cols}) VALUES (\${vals})\`).run(...Object.values(data));
    res.json(data);
  });
  app.put(\`/entities/\${table}/:id\`, auth, (req, res) => {
    const data = { ...req.body, updated_date: new Date().toISOString() };
    const sets = Object.keys(data).map(k => \`\${k}=?\`).join(',');
    db.prepare(\`UPDATE \${table} SET \${sets} WHERE id=?\`).run(...Object.values(data), req.params.id);
    res.json({ id: req.params.id, ...data });
  });
  app.delete(\`/entities/\${table}/:id\`, auth, (req, res) => {
    db.prepare(\`DELETE FROM \${table} WHERE id=?\`).run(req.params.id);
    res.json({ success: true });
  });
}

['servers', 'projects', 'logs', 'dependencies', 'backups'].forEach(crudRoutes);

app.listen(4000, () => console.log('✅ ServerPanel Backend running on http://localhost:4000'));`;

const STEP3_ENV = `# .env
JWT_SECRET=votre-secret-tres-long-et-complexe
PORT=4000`;

const STEP4_RUN = `# Créer un admin
curl -X POST http://localhost:4000/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@monserveur.com","password":"motdepasse","full_name":"Admin"}'

# Démarrer le backend
node server.js

# Ou avec PM2 (auto-restart)
npm install -g pm2
pm2 start server.js --name serverpanel-api
pm2 save && pm2 startup`;

const STEP5_FRONTEND = `# Dans le dossier du frontend (cloné depuis GitHub)
# Créer .env.local
echo "VITE_API_URL=http://localhost:4000" > .env.local

# Remplacer base44Client par votre API
# (voir section suivante)
npm install
npm run dev`;

const STEP6_CLIENT = `// src/api/localClient.js
const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getToken() { return localStorage.getItem('token'); }

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + getToken()
});

export const localClient = {
  auth: {
    async login(email, password) {
      const res = await fetch(\`\${API}/auth/login\`, {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      localStorage.setItem('token', data.token);
      return data;
    },
    async me() {
      const res = await fetch(\`\${API}/auth/me\`, { headers: headers() });
      return res.json();
    },
    logout() { localStorage.removeItem('token'); window.location.reload(); }
  },
  entities: new Proxy({}, {
    get(_, table) {
      return {
        async list() {
          return fetch(\`\${API}/entities/\${table}\`, { headers: headers() }).then(r => r.json());
        },
        async create(data) {
          return fetch(\`\${API}/entities/\${table}\`, {
            method:'POST', headers: headers(), body: JSON.stringify(data)
          }).then(r => r.json());
        },
        async update(id, data) {
          return fetch(\`\${API}/entities/\${table}/\${id}\`, {
            method:'PUT', headers: headers(), body: JSON.stringify(data)
          }).then(r => r.json());
        },
        async delete(id) {
          return fetch(\`\${API}/entities/\${table}/\${id}\`, {
            method:'DELETE', headers: headers()
          }).then(r => r.json());
        }
      };
    }
  })
};`;

const STEP7_PM2 = `# Démarrer les deux services
pm2 start server.js --name api --cwd /chemin/backend
pm2 start "serve -s dist -l 3000" --name frontend --cwd /chemin/frontend

# Voir les logs
pm2 logs

# Nginx reverse proxy (optionnel)
# /etc/nginx/sites-available/serverpanel
server {
    listen 80;
    server_name votre-domaine.com;
    location /api/ { proxy_pass http://localhost:4000/; }
    location / { root /chemin/frontend/dist; try_files $uri /index.html; }
}`;

export default function LocalBackend() {
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Backend Local — Node.js + SQLite</h1>
          <p className="text-slate-400">Guide complet pour héberger ServerPanel sur votre propre serveur Ubuntu</p>
        </div>

        {/* Timeline */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {["1. Init", "2. Server.js", "3. Config", "4. Démarrage", "5. Frontend", "6. Client API", "7. Production"].map((s, i) => (
            <span key={i} className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full text-xs font-medium">
              {s}
            </span>
          ))}
        </div>

        <Section icon={Package} title="Étape 1 — Initialiser le projet" color="bg-indigo-600">
          <p className="text-slate-300 text-sm mb-2">Créez un dossier et installez les dépendances :</p>
          <CodeBlock code={STEP1_INIT} language="bash" />
        </Section>

        <Section icon={Server} title="Étape 2 — Créer le fichier server.js" color="bg-violet-600">
          <p className="text-slate-300 text-sm mb-2">Ce fichier crée toute l'API REST avec la base de données SQLite :</p>
          <CodeBlock code={STEP2_SERVER} language="javascript" />
        </Section>

        <Section icon={Lock} title="Étape 3 — Fichier .env" color="bg-amber-600">
          <CodeBlock code={STEP3_ENV} language="bash" />
        </Section>

        <Section icon={Server} title="Étape 4 — Démarrer et créer l'admin" color="bg-emerald-600">
          <CodeBlock code={STEP4_RUN} language="bash" />
        </Section>

        <Section icon={Package} title="Étape 5 — Configurer le Frontend" color="bg-cyan-600">
          <p className="text-slate-300 text-sm mb-2">Après avoir cloné le repo GitHub (depuis Base44 GitHub Sync) :</p>
          <CodeBlock code={STEP5_FRONTEND} language="bash" />
        </Section>

        <Section icon={Database} title="Étape 6 — Remplacer base44Client" color="bg-rose-600">
          <p className="text-slate-300 text-sm mb-2">Créez ce fichier et remplacez les imports <code className="bg-slate-700 px-1 rounded text-xs">base44</code> par <code className="bg-slate-700 px-1 rounded text-xs">localClient</code> :</p>
          <CodeBlock code={STEP6_CLIENT} language="javascript" />
        </Section>

        <Section icon={Server} title="Étape 7 — Production avec PM2 + Nginx" color="bg-slate-600">
          <CodeBlock code={STEP7_PM2} language="bash" />
        </Section>

        {/* Summary */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 mt-6">
          <h3 className="text-emerald-400 font-bold mb-3">✅ Résumé de l'architecture</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-white font-medium mb-1">Frontend</div>
              <div className="text-slate-400">React + Vite → port 3000</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-white font-medium mb-1">Backend API</div>
              <div className="text-slate-400">Express + SQLite → port 4000</div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4">
              <div className="text-white font-medium mb-1">Process Manager</div>
              <div className="text-slate-400">PM2 + Nginx reverse proxy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}