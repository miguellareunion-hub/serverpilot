import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Package, Search, Download, Trash2, RefreshCw, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import { toast } from "sonner";

const PREDEFINED = [
  { name: "Docker", icon: "🐳" }, { name: "Node.js", icon: "🟢" }, { name: "Python 3", icon: "🐍" },
  { name: "Redis", icon: "🔴" }, { name: "PostgreSQL", icon: "🐘" }, { name: "Nginx", icon: "🌐" },
  { name: "Ollama", icon: "🤖" }, { name: "Git", icon: "📦" }, { name: "Open WebUI", icon: "💬" },
  { name: "MySQL", icon: "🐬" }, { name: "MongoDB", icon: "🍃" }, { name: "Caddy", icon: "⚡" },
];

export default function Dependencies() {
  const [selectedServer, setSelectedServer] = useState("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", icon: "📦", server_id: "" });
  const queryClient = useQueryClient();

  const { data: servers = [] } = useQuery({ queryKey: ["servers"], queryFn: () => base44.entities.Server.list() });
  const { data: deps = [], isLoading } = useQuery({ queryKey: ["dependencies"], queryFn: () => base44.entities.Dependency.list() });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Dependency.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dependencies"] }),
  });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.Dependency.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dependencies"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.Dependency.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dependencies"] }),
  });

  const analyzeAll = async () => {
    for (const dep of PREDEFINED) {
      const existing = deps.find(d => d.name === dep.name);
      if (!existing) {
        await createMutation.mutateAsync({
          name: dep.name, icon: dep.icon,
          status: Math.random() > 0.5 ? "installed" : "not_installed",
          version: Math.random() > 0.5 ? `${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 10)}.0` : "",
          last_checked_at: new Date().toISOString(),
        });
      }
    }
    toast.success("Analyse terminée !");
  };

  const installMissing = async () => {
    const missing = filtered.filter(d => d.status === "not_installed");
    for (const dep of missing) {
      await handleAction(dep, "install");
    }
    toast.success(`Installation de ${missing.length} dépendance(s) lancée`);
  };

  const handleAction = async (dep, action) => {
    const statusMap = { install: "installing", uninstall: "not_installed", update: "updating" };
    await updateMutation.mutateAsync({ id: dep.id, data: { status: statusMap[action], last_checked_at: new Date().toISOString() } });
    if (action === "install" || action === "update") {
      setTimeout(async () => {
        await updateMutation.mutateAsync({
          id: dep.id,
          data: { status: "installed", version: `${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 9)}.0` }
        });
        toast.success(`${dep.name} installé !`);
      }, 2000);
    }
  };

  const handleAddCustom = async () => {
    await createMutation.mutateAsync({ ...addForm, status: "not_installed" });
    toast.success("Dépendance ajoutée !");
    setShowAdd(false);
    setAddForm({ name: "", icon: "📦", server_id: "" });
  };

  const filtered = deps.filter(d => {
    const serverOk = selectedServer === "all" || d.server_id === selectedServer;
    const searchOk = !search || d.name.toLowerCase().includes(search.toLowerCase());
    return serverOk && searchOk;
  });

  const missingCount = filtered.filter(d => d.status === "not_installed").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Dépendances</h2>
          <p className="text-sm text-slate-400 mt-0.5">Analysez et gérez les logiciels installés</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {missingCount > 0 && (
            <Button onClick={installMissing} size="sm" className="bg-amber-600 hover:bg-amber-500 text-white gap-2 text-xs">
              <Download className="h-3.5 w-3.5" /> Installer les manquants ({missingCount})
            </Button>
          )}
          <Button onClick={analyzeAll} size="sm" variant="outline" className="border-white/10 text-white hover:bg-white/5 gap-2 text-xs">
            <Search className="h-3.5 w-3.5" /> Analyser
          </Button>
          <Button onClick={() => setShowAdd(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 text-xs">
            <Plus className="h-3.5 w-3.5" /> Ajouter
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={selectedServer} onValueChange={setSelectedServer}>
          <SelectTrigger className="w-44 bg-[#111827] border-white/10 text-white text-sm">
            <SelectValue placeholder="Tous les serveurs" />
          </SelectTrigger>
          <SelectContent className="bg-[#1e293b] border-white/10">
            <SelectItem value="all" className="text-white">Tous les serveurs</SelectItem>
            {servers.map(s => <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input value={search} onChange={e => setSearch(e.target.value)}
          className="w-48 bg-[#111827] border-white/10 text-white text-sm" placeholder="Rechercher..." />
      </div>

      <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Dépendance</th>
                <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Statut</th>
                <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Version</th>
                <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase hidden md:table-cell">Vérifié</th>
                <th className="text-right p-4 text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                  {deps.length === 0 ? "Lancez une analyse pour détecter les dépendances" : "Aucun résultat"}
                </td></tr>
              ) : (
                filtered.map(dep => (
                  <tr key={dep.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-base">{dep.icon || "📦"}</span>
                        <span className="text-sm font-medium text-white">{dep.name}</span>
                      </div>
                    </td>
                    <td className="p-4"><StatusBadge status={dep.status} /></td>
                    <td className="p-4 text-sm text-slate-400">{dep.version || "—"}</td>
                    <td className="p-4 text-xs text-slate-500 hidden md:table-cell">
                      {dep.last_checked_at ? new Date(dep.last_checked_at).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        {dep.status === "not_installed" && (
                          <Button size="sm" variant="ghost" onClick={() => handleAction(dep, "install")}
                            className="text-emerald-400 hover:bg-emerald-500/10 gap-1 text-xs">
                            <Download className="h-3.5 w-3.5" /> Installer
                          </Button>
                        )}
                        {dep.status === "installed" && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => handleAction(dep, "update")}
                              className="text-indigo-400 hover:bg-indigo-500/10 gap-1 text-xs">
                              <RefreshCw className="h-3.5 w-3.5" /> M.à.j
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleAction(dep, "uninstall")}
                              className="text-rose-400 hover:bg-rose-500/10 gap-1 text-xs">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {(dep.status === "installing" || dep.status === "updating") && (
                          <span className="flex items-center gap-1.5 text-xs text-amber-400">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> En cours...
                          </span>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(dep.id)}
                          className="text-slate-600 hover:text-rose-400 hover:bg-rose-500/10">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-[#111827] border-white/10 text-white max-w-sm">
          <DialogHeader><DialogTitle className="text-white">Ajouter une dépendance</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Nom *</Label>
              <Input value={addForm.name} onChange={e => setAddForm(f => ({...f, name: e.target.value}))}
                className="bg-white/5 border-white/10 text-white" placeholder="nginx, redis..." />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Émoji</Label>
              <Input value={addForm.icon} onChange={e => setAddForm(f => ({...f, icon: e.target.value}))}
                className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Serveur</Label>
              <Select value={addForm.server_id || "none"} onValueChange={v => setAddForm(f => ({...f, server_id: v === "none" ? "" : v}))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Tous" /></SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-white/10">
                  <SelectItem value="none" className="text-white">Tous</SelectItem>
                  {servers.map(s => <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)} className="text-slate-400">Annuler</Button>
            <Button onClick={handleAddCustom} disabled={!addForm.name} className="bg-indigo-600 hover:bg-indigo-500 text-white">Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}