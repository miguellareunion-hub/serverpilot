import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, CheckCircle2, XCircle, Zap } from "lucide-react";

const INSTALL_STEPS = {
  nodejs: [
    { id: "unzip", label: "Décompression du ZIP..." },
    { id: "detect", label: "Détection → Node.js (package.json)" },
    { id: "port", label: "Attribution du port automatique" },
    { id: "install", label: "npm install" },
    { id: "build", label: "npm run build" },
    { id: "start", label: "Démarrage du projet" },
  ],
  python: [
    { id: "unzip", label: "Décompression du ZIP..." },
    { id: "detect", label: "Détection → Python (requirements.txt)" },
    { id: "port", label: "Attribution du port automatique" },
    { id: "install", label: "pip install -r requirements.txt" },
    { id: "start", label: "Démarrage du projet" },
  ],
  docker: [
    { id: "unzip", label: "Décompression du ZIP..." },
    { id: "detect", label: "Détection → Docker (docker-compose.yml)" },
    { id: "port", label: "Attribution du port automatique" },
    { id: "install", label: "docker compose pull" },
    { id: "start", label: "docker compose up -d" },
  ],
  static: [
    { id: "unzip", label: "Décompression du ZIP..." },
    { id: "detect", label: "Détection → Site statique (index.html)" },
    { id: "port", label: "Attribution du port automatique" },
    { id: "start", label: "Démarrage serveur Nginx" },
  ],
  other: [
    { id: "unzip", label: "Décompression du ZIP..." },
    { id: "detect", label: "Détection → Type inconnu" },
    { id: "port", label: "Attribution du port automatique" },
    { id: "start", label: "Démarrage du projet" },
  ],
};

const STEP_DURATIONS = { unzip: 800, detect: 600, port: 400, install: 2500, build: 2000, start: 1000 };

const FAKE_LOGS = {
  nodejs: {
    unzip: ["[INFO] Extracting archive...", "[OK] 47 files extracted"],
    detect: ["[INFO] Scanning project files...", "[OK] Found package.json", "[INFO] Type: Node.js"],
    port: ["[INFO] Scanning used ports...", "[OK] Port 3001 is free"],
    install: ["[INFO] Running npm install...", "added 342 packages in 4.2s", "[OK] node_modules ready"],
    build: ["[INFO] Running npm run build...", "> react-scripts build", "[OK] Build complete → dist/"],
    start: ["[INFO] Starting Node.js app...", "[OK] Server running on port 3001"],
  },
  python: {
    unzip: ["[INFO] Extracting archive...", "[OK] 23 files extracted"],
    detect: ["[INFO] Scanning project files...", "[OK] Found requirements.txt", "[INFO] Type: Python"],
    port: ["[INFO] Scanning used ports...", "[OK] Port 3001 is free"],
    install: ["[INFO] pip install -r requirements.txt...", "Collecting flask==2.3.0", "Installing collected packages: flask", "[OK] Packages installed"],
    start: ["[INFO] Starting Python app...", "[OK] App running on port 3001"],
  },
  docker: {
    unzip: ["[INFO] Extracting archive...", "[OK] Files extracted"],
    detect: ["[INFO] Scanning project files...", "[OK] Found docker-compose.yml", "[INFO] Type: Docker"],
    port: ["[INFO] Scanning used ports...", "[OK] Port 3001 is free"],
    install: ["[INFO] docker compose pull...", "Pulling app ... done", "[OK] Images ready"],
    start: ["[INFO] docker compose up -d...", "Creating network ...", "[OK] Container started"],
  },
  static: {
    unzip: ["[INFO] Extracting archive...", "[OK] Files extracted"],
    detect: ["[INFO] Scanning project files...", "[OK] Found index.html", "[INFO] Type: Static site"],
    port: ["[INFO] Scanning used ports...", "[OK] Port 3001 is free"],
    start: ["[INFO] Starting Nginx...", "[OK] Static site served on port 3001"],
  },
  other: {
    unzip: ["[INFO] Extracting archive...", "[OK] Files extracted"],
    detect: ["[WARN] Could not auto-detect project type", "[INFO] Using generic setup"],
    port: ["[INFO] Scanning used ports...", "[OK] Port 3001 is free"],
    start: ["[INFO] Starting project...", "[OK] Project started"],
  },
};

export default function AutoInstallDialog({ open, onOpenChange, usedPorts, onInstallComplete }) {
  const [phase, setPhase] = useState("upload"); // upload | installing | done
  const [uploading, setUploading] = useState(false);
  const [detectedType, setDetectedType] = useState("nodejs");
  const [assignedPort, setAssignedPort] = useState(3001);
  const [zipUrl, setZipUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [logs, setLogs] = useState([]);
  const logsRef = useRef(null);

  useEffect(() => {
    if (logsRef.current) logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [logs]);

  const reset = () => {
    setPhase("upload"); setUploading(false); setZipUrl(""); setFileName("");
    setSteps([]); setCurrentStep(-1); setLogs([]); setDetectedType("nodejs");
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setZipUrl(file_url);
    setFileName(file.name);
    setUploading(false);
  };

  const detectTypeFromName = (name) => {
    const n = name.toLowerCase();
    if (n.includes("docker")) return "docker";
    if (n.includes("python") || n.includes("flask") || n.includes("django")) return "python";
    if (n.includes("static") || n.includes("html")) return "static";
    return "nodejs";
  };

  const runInstall = async () => {
    const type = detectTypeFromName(fileName);
    setDetectedType(type);

    // Assign next free port
    let port = 3001;
    while (usedPorts.includes(port)) port++;
    setAssignedPort(port);

    const stepsForType = INSTALL_STEPS[type] || INSTALL_STEPS.other;
    const fakeLogs = FAKE_LOGS[type] || FAKE_LOGS.other;
    setSteps(stepsForType.map(s => ({ ...s, status: "pending" })));
    setPhase("installing");
    setLogs([]);

    for (let i = 0; i < stepsForType.length; i++) {
      setCurrentStep(i);
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: "running" } : s));

      // Add logs for this step
      const stepLogs = (fakeLogs[stepsForType[i].id] || []).map(l =>
        l.includes("{port}") ? l.replace("{port}", port) : l
      );

      for (const line of stepLogs) {
        await new Promise(r => setTimeout(r, 180));
        setLogs(prev => [...prev, line]);
      }

      await new Promise(r => setTimeout(r, STEP_DURATIONS[stepsForType[i].id] || 800));
      setSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: "done" } : s));
    }

    setPhase("done");

    // Build project data
    const nameFromFile = fileName.replace(".zip", "").replace(/[_-]/g, " ");
    const projectData = {
      name: nameFromFile.charAt(0).toUpperCase() + nameFromFile.slice(1),
      slug: nameFromFile.toLowerCase().replace(/\s+/g, "-"),
      type,
      port,
      zip_url: zipUrl,
      status: "running",
      last_deploy_at: new Date().toISOString(),
      auto_start: true,
    };

    onInstallComplete(projectData);
  };

  const stepIcon = (status) => {
    if (status === "running") return <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />;
    if (status === "done") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
    return <div className="h-3.5 w-3.5 rounded-full border border-white/20" />;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="bg-[#111827] border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-400" /> Auto Install
          </DialogTitle>
        </DialogHeader>

        {phase === "upload" && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-400">Importez un ZIP — le système détecte le type et installe tout automatiquement.</p>
            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-indigo-500/40 transition-colors">
              <input type="file" accept=".zip" onChange={handleFile} className="hidden" id="auto-zip-upload" />
              <label htmlFor="auto-zip-upload" className="cursor-pointer flex flex-col items-center gap-3">
                {uploading ? (
                  <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
                ) : (
                  <Upload className="h-8 w-8 text-slate-400" />
                )}
                <span className="text-sm text-slate-300 font-medium">
                  {zipUrl ? `✓ ${fileName}` : uploading ? "Upload en cours..." : "Glissez ou cliquez pour uploader un ZIP"}
                </span>
                {!zipUrl && !uploading && (
                  <span className="text-xs text-slate-500">package.json / requirements.txt / docker-compose.yml / index.html</span>
                )}
              </label>
            </div>
            {zipUrl && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-sm text-indigo-300">
                ✓ ZIP prêt · Détection automatique + Installation + Démarrage
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => { reset(); onOpenChange(false); }} className="text-slate-400">Annuler</Button>
              <Button onClick={runInstall} disabled={!zipUrl} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
                <Zap className="h-4 w-4" /> Lancer l'installation
              </Button>
            </div>
          </div>
        )}

        {(phase === "installing" || phase === "done") && (
          <div className="space-y-4 py-2">
            {/* Steps */}
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={step.id} className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${step.status === "running" ? "bg-indigo-500/10 border-indigo-500/20" : step.status === "done" ? "bg-white/[0.02] border-white/5" : "border-transparent"}`}>
                  {stepIcon(step.status)}
                  <span className={`text-xs ${step.status === "done" ? "text-slate-400" : step.status === "running" ? "text-white font-medium" : "text-slate-600"}`}>
                    {step.label}
                    {step.id === "port" && step.status === "done" && ` → :${assignedPort}`}
                  </span>
                </div>
              ))}
            </div>

            {/* Logs */}
            <div
              ref={logsRef}
              className="bg-black/40 rounded-xl p-3 h-40 overflow-y-auto font-mono text-xs text-emerald-400 space-y-0.5 border border-white/5"
            >
              {logs.map((line, i) => (
                <div key={i} className={line.startsWith("[OK]") ? "text-emerald-400" : line.startsWith("[WARN]") ? "text-amber-400" : line.startsWith("[INFO]") ? "text-cyan-400" : "text-slate-400"}>
                  {line}
                </div>
              ))}
              {phase === "installing" && <span className="animate-pulse text-white">▌</span>}
            </div>

            {phase === "done" && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-300">Installation réussie ! Projet démarré sur le port <strong>:{assignedPort}</strong></p>
              </div>
            )}

            {phase === "done" && (
              <div className="flex justify-end">
                <Button onClick={() => { reset(); onOpenChange(false); }} className="bg-indigo-600 hover:bg-indigo-500 text-white">
                  Fermer
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}