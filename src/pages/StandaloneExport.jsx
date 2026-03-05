import React, { useState } from "react";
import { Copy, Check, Download, Terminal, Database, Server, Globe, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const CodeBlock = ({ code, title }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-xl border border-white/10 overflow-hidden mb-4">
      {title && (
        <div className="flex items-center justify-between bg-white/5 px-4 py-2 border-b border-white/10">
          <span className="text-xs font-mono text-slate-400">{title}</span>
          <button onClick={copy} className="text-slate-400 hover:text-white transition-colors">
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      )}
      <pre className="bg-[#0d1117] text-slate-300 text-xs p-4 overflow-x-auto leading-relaxed font-mono whitespace-pre">{code}</pre>
    </div>
  );
};

const Section = ({ icon: Icon, color, title, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 mb-6 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-white">{title}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
};

const BACKEND_SERVER = `// backend/server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { initDB, db } = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

app.use(cors());
app.use(express.json());

// ─── Auth middleware ───────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Non autorisé' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
}

// ─── Auth routes ───────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Identifiants invalides' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
});

app.get('/api/auth/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, email, full_name, role FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// ─── Generic CRUD factory ─────────────────────────────────
function crudRoutes(entity) {
  const table = entity.toLowerCase() + 's';

  app.get(\`/api/\${entity}\`, auth, (req, res) => {
    const rows = db.prepare(\`SELECT * FROM \${table} ORDER BY created_date DESC\`).all();
    res.json(rows.map(r => ({ ...r, tags: r.tags ? JSON.parse(r.tags) : [] })));
  });

  app.get(\`/api/\${entity}/:id\`, auth, (req, res) => {
    const row = db.prepare(\`SELECT * FROM \${table} WHERE id = ?\`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Non trouvé' });
    res.json({ ...row, tags: row.tags ? JSON.parse(row.tags) : [] });
  });

  app.post(\`/api/\${entity}\`, auth, (req, res) => {
    const data = req.body;
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const cols = ['id', 'created_date', 'updated_date', ...Object.keys(data)];
    const vals = [id, now, now, ...Object.values(data).map(v => Array.isArray(v) ? JSON.stringify(v) : v)];
    db.prepare(\`INSERT INTO \${table} (\${cols.join(',')}) VALUES (\${cols.map(() => '?').join(',')})\`).run(...vals);
    res.json(db.prepare(\`SELECT * FROM \${table} WHERE id = ?\`).get(id));
  });

  app.put(\`/api/\${entity}/:id\`, auth, (req, res) => {
    const data = req.body;
    const sets = Object.keys(data).map(k => \`\${k} = ?\`).join(', ');
    const vals = [...Object.values(data).map(v => Array.isArray(v) ? JSON.stringify(v) : v), new Date().toISOString(), req.params.id];
    db.prepare(\`UPDATE \${table} SET \${sets}, updated_date = ? WHERE id = ?\`).run(...vals);
    res.json(db.prepare(\`SELECT * FROM \${table} WHERE id = ?\`).get(req.params.id));
  });

  app.delete(\`/api/\${entity}/:id\`, auth, (req, res) => {
    db.prepare(\`DELETE FROM \${table} WHERE id = ?\`).run(req.params.id);
    res.json({ success: true });
  });
}

crudRoutes('server');
crudRoutes('project');
crudRoutes('dependency');
crudRoutes('backup');
crudRoutes('logentry');
crudRoutes('aitool');

// ─── Start ─────────────────────────────────────────────────
initDB();
app.listen(PORT, () => console.log(\`✅ API sur http://localhost:\${PORT}\`));
`;

const BACKEND_DB = `// backend/db.js
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data.db');
const db = new Database(dbPath);

function initDB() {
  db.exec(\`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT,
      role TEXT DEFAULT 'user',
      created_date TEXT,
      updated_date TEXT
    );

    CREATE TABLE IF NOT EXISTS servers (
      id TEXT PRIMARY KEY, name TEXT, host TEXT, port INTEGER DEFAULT 22,
      username TEXT, auth_type TEXT DEFAULT 'password', password TEXT,
      ssh_private_key TEXT, ssh_passphrase TEXT, tags TEXT,
      enabled INTEGER DEFAULT 1, status TEXT DEFAULT 'unknown',
      os TEXT, cpu_usage REAL, ram_usage REAL, disk_usage REAL,
      uptime TEXT, last_checked TEXT,
      created_date TEXT, updated_date TEXT, created_by TEXT
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY, name TEXT, slug TEXT, server_id TEXT,
      type TEXT DEFAULT 'other', status TEXT DEFAULT 'stopped',
      port INTEGER, path TEXT, description TEXT, zip_url TEXT,
      env_vars TEXT, auto_start INTEGER DEFAULT 0, last_deploy_at TEXT,
      created_date TEXT, updated_date TEXT, created_by TEXT
    );

    CREATE TABLE IF NOT EXISTS dependencies (
      id TEXT PRIMARY KEY, name TEXT, server_id TEXT,
      status TEXT DEFAULT 'not_installed', version TEXT, icon TEXT,
      last_checked_at TEXT, created_date TEXT, updated_date TEXT, created_by TEXT
    );

    CREATE TABLE IF NOT EXISTS backups (
      id TEXT PRIMARY KEY, name TEXT, type TEXT DEFAULT 'project',
      status TEXT DEFAULT 'queued', size TEXT, server_id TEXT,
      project_id TEXT, file_url TEXT, notes TEXT,
      created_date TEXT, updated_date TEXT, created_by TEXT
    );

    CREATE TABLE IF NOT EXISTS logentries (
      id TEXT PRIMARY KEY, level TEXT DEFAULT 'info',
      category TEXT DEFAULT 'system', message TEXT, details TEXT,
      server_id TEXT, project_id TEXT,
      created_date TEXT, updated_date TEXT, created_by TEXT
    );

    CREATE TABLE IF NOT EXISTS aitools (
      id TEXT PRIMARY KEY, name TEXT, description TEXT,
      type TEXT DEFAULT 'cloud', provider TEXT DEFAULT 'other',
      enabled INTEGER DEFAULT 1, is_default INTEGER DEFAULT 0,
      api_key TEXT, endpoint TEXT, default_model TEXT,
      server_id TEXT, category TEXT DEFAULT 'api',
      created_date TEXT, updated_date TEXT, created_by TEXT
    );
  \`);

  // Créer admin par défaut
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@serverpanel.local');
  if (!existing) {
    db.prepare('INSERT INTO users (id, email, password, full_name, role, created_date, updated_date) VALUES (?,?,?,?,?,?,?)')
      .run(Date.now().toString(), 'admin@serverpanel.local', bcrypt.hashSync('admin123', 10), 'Administrateur', 'admin', new Date().toISOString(), new Date().toISOString());
    console.log('👤 Admin créé: admin@serverpanel.local / admin123');
  }
}

module.exports = { db, initDB };
`;

const BACKEND_PACKAGE = `{
  "name": "serverpanel-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "better-sqlite3": "^9.4.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.3"
  }
}`;

const FRONTEND_CLIENT = `// src/api/localClient.js
// Remplace le client Base44 — pointe vers votre backend local

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

let token = localStorage.getItem('sp_token');
let currentUser = null;

const headers = () => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: \`Bearer \${token}\` } : {}),
});

async function req(method, path, body) {
  const r = await fetch(\`\${API_URL}\${path}\`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// Auth
const auth = {
  async login(email, password) {
    const data = await req('POST', '/api/auth/login', { email, password });
    token = data.token;
    currentUser = data.user;
    localStorage.setItem('sp_token', token);
    return data.user;
  },
  async me() {
    if (currentUser) return currentUser;
    currentUser = await req('GET', '/api/auth/me');
    return currentUser;
  },
  async isAuthenticated() {
    try { await auth.me(); return true; } catch { return false; }
  },
  logout(redirect) {
    token = null; currentUser = null;
    localStorage.removeItem('sp_token');
    window.location.href = redirect || '/login';
  },
  async updateMe(data) {
    currentUser = await req('PUT', \`/api/user/\${currentUser.id}\`, data);
    return currentUser;
  },
  redirectToLogin() { window.location.href = '/login'; }
};

// Entity factory
function entity(name) {
  const path = \`/api/\${name.toLowerCase()}\`;
  return {
    list: (sort, limit) => req('GET', path),
    filter: (filters) => req('GET', path),
    get: (id) => req('GET', \`\${path}/\${id}\`),
    create: (data) => req('POST', path, data),
    update: (id, data) => req('PUT', \`\${path}/\${id}\`, data),
    delete: (id) => req('DELETE', \`\${path}/\${id}\`),
    bulkCreate: (items) => Promise.all(items.map(d => req('POST', path, d))),
    subscribe: () => () => {},
    schema: () => ({}),
  };
}

export const base44 = {
  auth,
  entities: new Proxy({}, {
    get: (_, name) => entity(name),
  }),
  integrations: {
    Core: {
      InvokeLLM: async ({ prompt }) => {
        throw new Error('InvokeLLM non disponible en mode standalone. Utilisez un backend IA local (Ollama).');
      },
      UploadFile: async ({ file }) => {
        const form = new FormData();
        form.append('file', file);
        const r = await fetch(\`\${API_URL}/api/upload\`, { method: 'POST', headers: { Authorization: \`Bearer \${token}\` }, body: form });
        return r.json();
      },
      SendEmail: async () => { throw new Error('Email non configuré en mode standalone.'); },
    },
  },
  analytics: { track: () => {} },
  functions: { invoke: async (name, params) => req('POST', \`/api/fn/\${name}\`, params) },
  users: {
    inviteUser: async (email, role) => req('POST', '/api/users/invite', { email, role }),
  },
};
`;

const LOGIN_PAGE = `// src/pages/Login.jsx
import React, { useState } from 'react';
import { base44 } from '../api/localClient';
import { Terminal } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('admin@serverpanel.local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await base44.auth.login(email, password);
      window.location.href = '/';
    } catch {
      setError('Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Terminal className="h-7 w-7 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">ServerPanel</h1>
        <p className="text-slate-400 text-center text-sm mb-8">Connexion à votre panneau</p>

        {error && <div className="bg-red-500/15 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email" required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe" required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="text-slate-500 text-xs text-center mt-6">
          Compte par défaut: admin@serverpanel.local / admin123
        </p>
      </div>
    </div>
  );
}
`;

const INSTALL_SCRIPT = `#!/bin/bash
# install.sh — Installation automatique de ServerPanel Standalone

set -e
echo "🚀 Installation de ServerPanel Standalone..."

# Vérifier Node.js
if ! command -v node &> /dev/null; then
  echo "📦 Installation de Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "✅ Node.js $(node -v) détecté"

# Backend
echo "📦 Installation du backend..."
mkdir -p backend
cp package.backend.json backend/package.json
cp server.js backend/
cp db.js backend/
cd backend
npm install --production
cd ..

# Frontend
echo "📦 Installation du frontend..."
npm install

# Variables d'environnement
if [ ! -f .env.local ]; then
  echo "VITE_API_URL=http://localhost:4000" > .env.local
fi

if [ ! -f backend/.env ]; then
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  echo "JWT_SECRET=$SECRET" > backend/.env
  echo "PORT=4000" >> backend/.env
  echo "✅ Secret JWT généré automatiquement"
fi

# Build frontend
echo "🔨 Build du frontend..."
npm run build

# PM2
if ! command -v pm2 &> /dev/null; then
  sudo npm install -g pm2 serve
fi

pm2 delete serverpanel-api 2>/dev/null || true
pm2 delete serverpanel-ui 2>/dev/null || true

pm2 start backend/server.js --name serverpanel-api
pm2 start "serve -s dist -l 3000" --name serverpanel-ui
pm2 save

echo ""
echo "✅ ServerPanel installé avec succès !"
echo "🌍 Interface: http://$(hostname -I | awk '{print $1}'):3000"
echo "🔧 API:       http://$(hostname -I | awk '{print $1}'):4000"
echo "👤 Login:     admin@serverpanel.local / admin123"
`;

const NGINX_CONF = `# /etc/nginx/sites-available/serverpanel
server {
    listen 80;
    server_name VOTRE_DOMAINE.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API Backend
    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $host;
    }
}
# Après avoir créé ce fichier:
# sudo ln -s /etc/nginx/sites-available/serverpanel /etc/nginx/sites-enabled/
# sudo nginx -t && sudo systemctl reload nginx
# sudo certbot --nginx -d VOTRE_DOMAINE.com
`;

const steps = [
  {
    num: "1",
    title: "Cloner & préparer",
    code: `git clone https://github.com/VOTRE-USER/serverpanel.git
cd serverpanel`,
  },
  {
    num: "2",
    title: "Remplacer le client API",
    code: `# Copiez le contenu de "localClient.js" ci-dessous dans :
# src/api/localClient.js

# Puis dans TOUS les fichiers du projet, remplacez :
# import { base44 } from "@/api/base44Client"
# par :
# import { base44 } from "@/api/localClient"

# Sur Linux/Mac, une commande pour tout remplacer :
find src -name "*.jsx" -o -name "*.js" | xargs sed -i 's|@/api/base44Client|@/api/localClient|g'`,
  },
  {
    num: "3",
    title: "Créer le backend",
    code: `mkdir backend && cd backend

# Copier server.js et db.js (voir ci-dessous)
# Copier package.json backend

npm install
cd ..`,
  },
  {
    num: "4",
    title: "Lancer l'installation",
    code: `chmod +x install.sh
./install.sh`,
  },
];

export default function StandaloneExport() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start gap-4 mb-8">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
          <Download className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">ServerPanel — Version Standalone</h2>
          <p className="text-slate-400 mt-1">100% auto-hébergé · Sans Base44 · Node.js + SQLite</p>
        </div>
      </div>

      {/* Étapes rapides */}
      <Section icon={Terminal} color="bg-indigo-600" title="Étapes d'installation">
        <div className="space-y-4">
          {steps.map(s => (
            <div key={s.num} className="flex gap-4">
              <div className="h-7 w-7 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center flex-shrink-0 text-xs font-bold text-indigo-400">{s.num}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white mb-2">{s.title}</p>
                <CodeBlock code={s.code} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Backend files */}
      <Section icon={Database} color="bg-purple-600" title="Fichiers Backend">
        <p className="text-sm text-slate-400 mb-4">Créez ces fichiers dans le dossier <code className="text-indigo-400">backend/</code></p>
        <CodeBlock title="backend/package.json" code={BACKEND_PACKAGE} />
        <CodeBlock title="backend/db.js" code={BACKEND_DB} />
        <CodeBlock title="backend/server.js" code={BACKEND_SERVER} />
      </Section>

      {/* Frontend client */}
      <Section icon={Globe} color="bg-cyan-600" title="Client API Frontend (remplace Base44)">
        <p className="text-sm text-slate-400 mb-4">Copiez ce fichier dans <code className="text-indigo-400">src/api/localClient.js</code></p>
        <CodeBlock title="src/api/localClient.js" code={FRONTEND_CLIENT} />
        <CodeBlock title="src/pages/Login.jsx" code={LOGIN_PAGE} />
      </Section>

      {/* Script install */}
      <Section icon={Terminal} color="bg-emerald-600" title="Script d'installation automatique">
        <p className="text-sm text-slate-400 mb-4">Placez ce fichier à la racine du projet et exécutez-le</p>
        <CodeBlock title="install.sh" code={INSTALL_SCRIPT} />
      </Section>

      {/* Nginx */}
      <Section icon={Server} color="bg-orange-600" title="Configuration Nginx (domaine + HTTPS)">
        <CodeBlock title="/etc/nginx/sites-available/serverpanel" code={NGINX_CONF} />
      </Section>

      <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6">
        <h3 className="font-semibold text-emerald-400 mb-2">✅ Résultat final</h3>
        <ul className="text-sm text-slate-300 space-y-1">
          <li>• <strong>Frontend</strong> sur le port 3000</li>
          <li>• <strong>API</strong> sur le port 4000</li>
          <li>• <strong>Base de données</strong> SQLite locale dans <code className="text-indigo-400">backend/data.db</code></li>
          <li>• <strong>Compte admin</strong>: admin@serverpanel.local / admin123</li>
          <li>• <strong>Aucune dépendance externe</strong> — 100% sur votre serveur</li>
        </ul>
      </div>
    </div>
  );
}