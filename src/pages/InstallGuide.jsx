import React, { useState } from "react";
import { Copy, Check, Terminal, Server, Package, Play, Globe, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const INSTALL_SH = `#!/bin/bash

# ============================================================
#  ServerPanel – Script d'installation automatique
#  Compatible : Ubuntu 20.04 / 22.04 / 24.04
# ============================================================

set -e

GREEN="\\033[0;32m"
YELLOW="\\033[1;33m"
CYAN="\\033[0;36m"
RED="\\033[0;31m"
NC="\\033[0m"

log()   { echo -e "\\${GREEN}[✔]\\${NC} $1"; }
info()  { echo -e "\\${CYAN}[i]\\${NC} $1"; }
warn()  { echo -e "\\${YELLOW}[!]\\${NC} $1"; }
error() { echo -e "\\${RED}[✘]\\${NC} $1"; exit 1; }

APP_DIR="/opt/serverpanel"
APP_PORT=\${PORT:-3000}
NODE_VERSION="20"

echo ""
echo -e "\\${CYAN}╔══════════════════════════════════════╗\\${NC}"
echo -e "\\${CYAN}║     ServerPanel – Auto Installer     ║\\${NC}"
echo -e "\\${CYAN}╚══════════════════════════════════════╝\\${NC}"
echo ""

# --- 1. Node.js ---
if ! command -v node &>/dev/null; then
  info "Installation de Node.js \$NODE_VERSION..."
  curl -fsSL https://deb.nodesource.com/setup_\${NODE_VERSION}.x | sudo -E bash -
  sudo apt-get install -y nodejs
  log "Node.js installé : \$(node -v)"
else
  log "Node.js déjà présent : \$(node -v)"
fi

# --- 2. npm ---
if ! command -v npm &>/dev/null; then
  info "Installation de npm..."
  sudo apt-get install -y npm
fi
log "npm : \$(npm -v)"

# --- 3. PM2 (process manager) ---
if ! command -v pm2 &>/dev/null; then
  info "Installation de PM2..."
  sudo npm install -g pm2
fi
log "PM2 prêt"

# --- 4. Répertoire de l'application ---
sudo mkdir -p \$APP_DIR
sudo chown -R \$USER:\$USER \$APP_DIR

# --- 5. Copie des fichiers (si lancé depuis le dossier du projet) ---
if [ -f "./package.json" ]; then
  info "Copie des fichiers du projet vers \$APP_DIR..."
  rsync -av --exclude='node_modules' --exclude='.git' ./ \$APP_DIR/
else
  warn "package.json introuvable dans le dossier courant."
  warn "Placez ce script à la racine du projet et relancez-le."
  exit 1
fi

# --- 6. Installation des dépendances ---
cd \$APP_DIR
info "Installation des dépendances npm..."
npm install --production=false
log "Dépendances installées"

# --- 7. Build ---
info "Build de l'application..."
npm run build
log "Build terminé"

# --- 8. Démarrage avec PM2 ---
info "Démarrage du serveur sur le port \$APP_PORT..."

pm2 delete serverpanel 2>/dev/null || true

# Serve le dossier dist avec un serveur statique
if ! npm list -g serve &>/dev/null; then
  sudo npm install -g serve
fi

pm2 start "serve -s dist -l \$APP_PORT" --name serverpanel
pm2 save
pm2 startup | tail -1 | sudo bash 2>/dev/null || true

echo ""
echo -e "\\${GREEN}╔══════════════════════════════════════════╗\\${NC}"
echo -e "\\${GREEN}║         Installation réussie ! ✅         ║\\${NC}"
echo -e "\\${GREEN}╚══════════════════════════════════════════╝\\${NC}"
echo ""
echo -e "  🌐 Application disponible sur :"
echo -e "     http://\$(hostname -I | awk '{print \$1}'):\$APP_PORT"
echo -e "     http://localhost:\$APP_PORT"
echo ""
echo -e "  📋 Commandes utiles :"
echo -e "     pm2 status        → état du service"
echo -e "     pm2 logs serverpanel → voir les logs"
echo -e "     pm2 restart serverpanel → redémarrer"
echo ""
`;

const steps = [
  {
    icon: Terminal,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    title: "1. Exporter / cloner le projet",
    desc: "Récupérez les sources sur votre serveur Ubuntu.",
    code: `# Option A – Depuis Base44 (export ZIP)\nunzip serverpanel.zip -d serverpanel && cd serverpanel\n\n# Option B – Depuis Git\ngit clone https://github.com/your-org/serverpanel.git && cd serverpanel`,
  },
  {
    icon: Package,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    title: "2. Lancer le script d'installation",
    desc: "Un seul script gère tout : Node.js, npm, build, PM2.",
    code: `chmod +x install.sh\nbash install.sh`,
  },
  {
    icon: Globe,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    title: "3. Changer de port (optionnel)",
    desc: "Par défaut le port 3000 est utilisé. Vous pouvez en choisir un autre.",
    code: `PORT=8080 bash install.sh`,
  },
  {
    icon: Play,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    title: "4. Commandes de gestion",
    desc: "PM2 gère le processus en arrière-plan.",
    code: `pm2 status                    # état\npm2 logs serverpanel          # logs en direct\npm2 restart serverpanel       # redémarrer\npm2 stop serverpanel          # arrêter\npm2 delete serverpanel        # supprimer`,
  },
  {
    icon: Server,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    title: "5. Ouvrir le firewall (si nécessaire)",
    desc: "Autorisez le port dans UFW si vous utilisez un pare-feu.",
    code: `sudo ufw allow 3000/tcp\nsudo ufw reload\n\n# Vérifier l'IP du serveur\nhostname -I`,
  },
];

function CodeBlock({ code, label }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copié !");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/50">
      {label && <div className="px-4 py-1.5 text-xs text-slate-500 border-b border-white/5 bg-white/5">{label}</div>}
      <pre className="p-4 text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
      </button>
    </div>
  );
}

function Step({ step }) {
  const [open, setOpen] = useState(true);
  const Icon = step.icon;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/5 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className={`p-2 rounded-lg ${step.bg}`}>
          <Icon className={`h-4 w-4 ${step.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white text-sm">{step.title}</div>
          <div className="text-xs text-slate-400 mt-0.5">{step.desc}</div>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
      </button>
      {open && (
        <div className="px-5 pb-5">
          <CodeBlock code={step.code} />
        </div>
      )}
    </div>
  );
}

export default function InstallGuide() {
  const [copiedScript, setCopiedScript] = useState(false);

  const downloadScript = () => {
    const blob = new Blob([INSTALL_SH], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "install.sh";
    a.click();
    toast.success("install.sh téléchargé !");
  };

  const copyScript = () => {
    navigator.clipboard.writeText(INSTALL_SH);
    setCopiedScript(true);
    toast.success("Script copié !");
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Terminal className="h-6 w-6 text-indigo-400" />
            Guide d'installation
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Installez ServerPanel sur votre Ubuntu local en une commande.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={copyScript} variant="outline" className="border-white/10 text-white hover:bg-white/5 gap-2 text-sm">
            {copiedScript ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            Copier le script
          </Button>
          <Button onClick={downloadScript} className="bg-indigo-600 hover:bg-indigo-500 gap-2 text-sm">
            <Terminal className="h-4 w-4" />
            Télécharger install.sh
          </Button>
        </div>
      </div>

      {/* Résumé rapide */}
      <div className="rounded-2xl bg-indigo-600/10 border border-indigo-500/20 p-5">
        <p className="text-indigo-300 font-semibold text-sm mb-2">⚡ Installation rapide</p>
        <CodeBlock code={"chmod +x install.sh\nbash install.sh\n\n# Puis ouvrir dans le navigateur :\n# http://<IP_DU_SERVEUR>:3000"} />
      </div>

      {/* Étapes détaillées */}
      <div className="space-y-3">
        {steps.map((s, i) => <Step key={i} step={s} />)}
      </div>

      {/* Script complet */}
      <div className="rounded-2xl border border-white/10 bg-[#111827] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <p className="text-white font-semibold text-sm">Script install.sh complet</p>
            <p className="text-slate-400 text-xs mt-0.5">Contenu du fichier à placer à la racine du projet</p>
          </div>
          <Button onClick={downloadScript} size="sm" className="bg-indigo-600 hover:bg-indigo-500 gap-2 text-xs">
            <Terminal className="h-3.5 w-3.5" /> Télécharger
          </Button>
        </div>
        <CodeBlock code={INSTALL_SH} label="install.sh" />
      </div>

      {/* Note */}
      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-amber-300 text-sm">
        <p className="font-semibold mb-1">📝 Note importante</p>
        <p className="text-amber-400/80 text-xs leading-relaxed">
          Ce script déploie l'application en tant que SPA statique via <code className="bg-black/30 px-1 rounded">serve</code> + PM2.
          Pour un accès depuis l'extérieur, assurez-vous que le port est ouvert dans votre firewall et/ou routeur.
          Pour un déploiement en production, il est recommandé d'ajouter un reverse-proxy Nginx avec HTTPS.
        </p>
      </div>
    </div>
  );
}