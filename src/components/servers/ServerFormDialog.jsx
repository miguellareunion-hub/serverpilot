import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function ServerFormDialog({ open, onOpenChange, server, onSave }) {
  const [form, setForm] = useState(server || {
    name: "", host: "", port: 22, username: "root", auth_type: "password"
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111827] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">{server ? "Modifier le serveur" : "Ajouter un serveur"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-slate-300 text-xs">Nom du serveur</Label>
            <Input
              value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="bg-white/5 border-white/10 text-white mt-1" placeholder="Mon serveur"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label className="text-slate-300 text-xs">Host / IP</Label>
              <Input
                value={form.host} onChange={e => setForm({...form, host: e.target.value})}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="192.168.1.100"
              />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Port</Label>
              <Input
                type="number" value={form.port} onChange={e => setForm({...form, port: parseInt(e.target.value) || 22})}
                className="bg-white/5 border-white/10 text-white mt-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-slate-300 text-xs">Nom d'utilisateur</Label>
            <Input
              value={form.username} onChange={e => setForm({...form, username: e.target.value})}
              className="bg-white/5 border-white/10 text-white mt-1" placeholder="root"
            />
          </div>
          <div>
            <Label className="text-slate-300 text-xs">Authentification</Label>
            <Select value={form.auth_type} onValueChange={v => setForm({...form, auth_type: v})}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e293b] border-white/10">
                <SelectItem value="password" className="text-white">Mot de passe</SelectItem>
                <SelectItem value="ssh_key" className="text-white">Clé SSH</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-white">Annuler</Button>
          <Button onClick={handleSave} disabled={saving || !form.name || !form.host} className="bg-indigo-600 hover:bg-indigo-500 text-white">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}