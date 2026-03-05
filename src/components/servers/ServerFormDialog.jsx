import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Eye, EyeOff } from "lucide-react";

const EMPTY = { name: "", host: "", port: 22, username: "root", auth_type: "password", password: "", ssh_private_key: "", ssh_passphrase: "", tags: [], enabled: true };

export default function ServerFormDialog({ open, onOpenChange, server, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    setForm(server ? { ...EMPTY, ...server } : EMPTY);
  }, [server, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
          <DialogTitle className="text-white">{server ? "Modifier le serveur" : "Ajouter un serveur"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-slate-300 text-xs mb-1 block">Nom du serveur *</Label>
              <Input value={form.name} onChange={e => set("name", e.target.value)} className="bg-white/5 border-white/10 text-white" placeholder="Production Server" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Hôte (IP / DNS) *</Label>
              <Input value={form.host} onChange={e => set("host", e.target.value)} className="bg-white/5 border-white/10 text-white" placeholder="192.168.1.100" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Port SSH</Label>
              <Input type="number" value={form.port} onChange={e => set("port", parseInt(e.target.value))} className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Utilisateur *</Label>
              <Input value={form.username} onChange={e => set("username", e.target.value)} className="bg-white/5 border-white/10 text-white" placeholder="root" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Authentification</Label>
              <Select value={form.auth_type} onValueChange={v => set("auth_type", v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-white/10">
                  <SelectItem value="password" className="text-white">Mot de passe</SelectItem>
                  <SelectItem value="ssh_key" className="text-white">Clé SSH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.auth_type === "password" && (
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Mot de passe</Label>
              <div className="relative">
                <Input type={showPass ? "text" : "password"} value={form.password} onChange={e => set("password", e.target.value)}
                  className="bg-white/5 border-white/10 text-white pr-9" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          {form.auth_type === "ssh_key" && (
            <>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Clé privée SSH</Label>
                <Textarea value={form.ssh_private_key} onChange={e => set("ssh_private_key", e.target.value)}
                  className="bg-white/5 border-white/10 text-white h-24 font-mono text-xs" placeholder="-----BEGIN RSA PRIVATE KEY-----" />
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Passphrase (optionnel)</Label>
                <Input type="password" value={form.ssh_passphrase} onChange={e => set("ssh_passphrase", e.target.value)}
                  className="bg-white/5 border-white/10 text-white" />
              </div>
            </>
          )}

          <div className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg border border-white/5">
            <div>
              <p className="text-sm text-white">Serveur activé</p>
              <p className="text-xs text-slate-500">Désactiver pour ignorer ce serveur</p>
            </div>
            <Switch checked={form.enabled} onCheckedChange={v => set("enabled", v)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-white">Annuler</Button>
          <Button onClick={handleSave} disabled={saving || !form.name || !form.host || !form.username}
            className="bg-indigo-600 hover:bg-indigo-500 text-white">
            {saving ? "Sauvegarde..." : server ? "Mettre à jour" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}