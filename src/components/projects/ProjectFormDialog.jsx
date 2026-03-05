import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2 } from "lucide-react";

const EMPTY = { name: "", slug: "", server_id: "", type: "nodejs", description: "", port: "", env_vars: "", auto_start: false, zip_url: "" };

const detectType = (filename) => {
  if (!filename) return "other";
  const n = filename.toLowerCase();
  if (n.includes("node") || n.includes("express") || n.includes("react")) return "nodejs";
  if (n.includes("python") || n.includes("django") || n.includes("flask")) return "python";
  if (n.includes("docker")) return "docker";
  return "other";
};

export default function ProjectFormDialog({ open, onOpenChange, project, servers, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm(project ? { ...EMPTY, ...project } : EMPTY);
  }, [project, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const nameFromFile = file.name.replace(".zip", "").replace(/_/g, " ");
    setForm(f => ({
      ...f,
      zip_url: file_url,
      name: f.name || nameFromFile,
      slug: f.slug || nameFromFile.toLowerCase().replace(/\s+/g, "-"),
      type: detectType(file.name),
    }));
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111827] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{project ? "Modifier le projet" : "Nouveau projet"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* ZIP Upload */}
          <div className="border-2 border-dashed border-white/10 rounded-xl p-4 text-center hover:border-white/20 transition-colors">
            <input type="file" accept=".zip" onChange={handleFile} className="hidden" id="zip-upload" />
            <label htmlFor="zip-upload" className="cursor-pointer flex flex-col items-center gap-2">
              {uploading ? <Loader2 className="h-6 w-6 text-indigo-400 animate-spin" /> : <Upload className="h-6 w-6 text-slate-400" />}
              <span className="text-sm text-slate-400">{form.zip_url ? "✓ ZIP uploadé" : uploading ? "Upload en cours..." : "Uploader un ZIP (optionnel)"}</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-slate-300 text-xs mb-1 block">Nom du projet *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} className="bg-white/5 border-white/10 text-white" placeholder="My App" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Serveur</Label>
              <Select value={form.server_id || "none"} onValueChange={v => set("server_id", v === "none" ? "" : v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-white/10">
                  <SelectItem value="none" className="text-white">Aucun</SelectItem>
                  {servers.map(s => <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Type</Label>
              <Select value={form.type} onValueChange={v => set("type", v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-white/10">
                  <SelectItem value="nodejs" className="text-white">🟢 Node.js</SelectItem>
                  <SelectItem value="python" className="text-white">🐍 Python</SelectItem>
                  <SelectItem value="docker" className="text-white">🐳 Docker</SelectItem>
                  <SelectItem value="static" className="text-white">📄 Static</SelectItem>
                  <SelectItem value="other" className="text-white">📦 Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Port</Label>
              <Input type="number" value={form.port || ""} onChange={e => set("port", parseInt(e.target.value) || "")} className="bg-white/5 border-white/10 text-white" placeholder="3000" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Slug</Label>
              <Input value={form.slug || ""} onChange={e => set("slug", e.target.value)} className="bg-white/5 border-white/10 text-white" placeholder="my-app" />
            </div>
          </div>

          <div>
            <Label className="text-slate-300 text-xs mb-1 block">Description</Label>
            <Textarea value={form.description || ""} onChange={e => set("description", e.target.value)} className="bg-white/5 border-white/10 text-white h-16" />
          </div>

          <div>
            <Label className="text-slate-300 text-xs mb-1 block">Variables d'environnement (JSON)</Label>
            <Textarea value={form.env_vars || ""} onChange={e => set("env_vars", e.target.value)}
              className="bg-white/5 border-white/10 text-white h-20 font-mono text-xs" placeholder={'{"NODE_ENV":"production","PORT":"3000"}'} />
          </div>

          <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5">
            <div>
              <p className="text-sm text-white">Démarrage automatique</p>
              <p className="text-xs text-slate-500">Démarrer le projet au boot du serveur</p>
            </div>
            <Switch checked={form.auto_start} onCheckedChange={v => set("auto_start", v)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-white">Annuler</Button>
          <Button onClick={handleSave} disabled={saving || !form.name}
            className="bg-indigo-600 hover:bg-indigo-500 text-white">
            {saving ? "Sauvegarde..." : project ? "Mettre à jour" : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}