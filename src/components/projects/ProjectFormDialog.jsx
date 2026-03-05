import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ProjectFormDialog({ open, onOpenChange, project, servers, onSave }) {
  const [form, setForm] = useState(project || {
    name: "", type: "nodejs", status: "stopped", description: "", server_id: "", auto_start: false, env_vars: ""
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUploadZip = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm({ ...form, zip_url: file_url });

    // Auto detect type from filename
    const name = file.name.replace(".zip", "");
    if (!form.name) setForm(prev => ({ ...prev, name, zip_url: file_url }));
    else setForm(prev => ({ ...prev, zip_url: file_url }));
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
      <DialogContent className="bg-[#111827] border-white/10 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">{project ? "Modifier le projet" : "Nouveau projet"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <Label className="text-slate-300 text-xs">Nom du projet</Label>
            <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="bg-white/5 border-white/10 text-white mt-1" placeholder="Mon projet" />
          </div>
          <div>
            <Label className="text-slate-300 text-xs">Description</Label>
            <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
              className="bg-white/5 border-white/10 text-white mt-1 h-20" placeholder="Description du projet..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-slate-300 text-xs">Type</Label>
              <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-white/10">
                  <SelectItem value="nodejs" className="text-white">Node.js</SelectItem>
                  <SelectItem value="python" className="text-white">Python</SelectItem>
                  <SelectItem value="docker" className="text-white">Docker</SelectItem>
                  <SelectItem value="static" className="text-white">Site statique</SelectItem>
                  <SelectItem value="other" className="text-white">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Serveur</Label>
              <Select value={form.server_id} onValueChange={v => setForm({...form, server_id: v})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-white/10">
                  {servers?.map(s => (
                    <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-slate-300 text-xs">Port</Label>
            <Input type="number" value={form.port || ""} onChange={e => setForm({...form, port: parseInt(e.target.value) || undefined})}
              className="bg-white/5 border-white/10 text-white mt-1" placeholder="Auto-assigné si vide" />
          </div>
          <div>
            <Label className="text-slate-300 text-xs">Fichier ZIP</Label>
            <label className="mt-1 flex items-center gap-3 p-3 bg-white/[0.02] border border-dashed border-white/10 rounded-xl cursor-pointer hover:border-indigo-500/30 transition-all">
              <Upload className="h-5 w-5 text-slate-500" />
              <span className="text-sm text-slate-400">
                {uploading ? "Upload en cours..." : form.zip_url ? "Fichier uploadé ✓" : "Cliquer pour uploader"}
              </span>
              <input type="file" accept=".zip" className="hidden" onChange={handleUploadZip} />
            </label>
          </div>
          <div>
            <Label className="text-slate-300 text-xs">Variables d'environnement</Label>
            <Textarea value={form.env_vars} onChange={e => setForm({...form, env_vars: e.target.value})}
              className="bg-white/5 border-white/10 text-white mt-1 h-20 font-mono text-xs"
              placeholder="KEY=value&#10;DB_HOST=localhost" />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.auto_start} onCheckedChange={v => setForm({...form, auto_start: v})} />
            <Label className="text-slate-300 text-xs">Démarrage automatique</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-white">Annuler</Button>
          <Button onClick={handleSave} disabled={saving || !form.name} className="bg-indigo-600 hover:bg-indigo-500 text-white">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}