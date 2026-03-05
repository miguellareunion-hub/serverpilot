import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ScrollText, Search, Trash2, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import StatusBadge from "../components/shared/StatusBadge";
import EmptyState from "../components/shared/EmptyState";
import { toast } from "sonner";

const levelColors = {
  info: "text-cyan-400", warning: "text-amber-400", error: "text-rose-400", success: "text-emerald-400"
};

export default function Logs() {
  const [levelFilter, setLevelFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [serverFilter, setServerFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ level: "info", category: "system", message: "", details: "" });
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["logs"],
    queryFn: () => base44.entities.LogEntry.list("-created_date", 200),
  });
  const { data: servers = [] } = useQuery({ queryKey: ["servers"], queryFn: () => base44.entities.Server.list() });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.LogEntry.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["logs"] }); toast.success("Log ajouté !"); },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      for (const log of logs) await base44.entities.LogEntry.delete(log.id);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["logs"] }); toast.success("Logs effacés !"); },
  });

  const filtered = logs.filter(log => {
    if (levelFilter !== "all" && log.level !== levelFilter) return false;
    if (categoryFilter !== "all" && log.category !== categoryFilter) return false;
    if (serverFilter !== "all" && log.server_id !== serverFilter) return false;
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Logs système</h2>
          <p className="text-sm text-slate-400 mt-0.5">{filtered.length} entrées</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAdd(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 text-xs">
            <Plus className="h-3.5 w-3.5" /> Ajouter
          </Button>
          {logs.length > 0 && (
            <Button onClick={() => clearMutation.mutate()} size="sm" variant="outline"
              className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 gap-2 text-xs">
              <Trash2 className="h-3.5 w-3.5" /> Effacer tout
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-36 bg-[#111827] border-white/10 text-white text-sm"><SelectValue placeholder="Niveau" /></SelectTrigger>
          <SelectContent className="bg-[#1e293b] border-white/10">
            <SelectItem value="all" className="text-white">Tous niveaux</SelectItem>
            <SelectItem value="info" className="text-white">Info</SelectItem>
            <SelectItem value="warning" className="text-white">Warning</SelectItem>
            <SelectItem value="error" className="text-white">Erreur</SelectItem>
            <SelectItem value="success" className="text-white">Succès</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-36 bg-[#111827] border-white/10 text-white text-sm"><SelectValue placeholder="Catégorie" /></SelectTrigger>
          <SelectContent className="bg-[#1e293b] border-white/10">
            <SelectItem value="all" className="text-white">Toutes</SelectItem>
            <SelectItem value="server" className="text-white">Serveur</SelectItem>
            <SelectItem value="project" className="text-white">Projet</SelectItem>
            <SelectItem value="dependency" className="text-white">Dépendance</SelectItem>
            <SelectItem value="auth" className="text-white">Auth</SelectItem>
            <SelectItem value="backup" className="text-white">Backup</SelectItem>
            <SelectItem value="ai" className="text-white">IA</SelectItem>
            <SelectItem value="system" className="text-white">Système</SelectItem>
          </SelectContent>
        </Select>
        <Select value={serverFilter} onValueChange={setServerFilter}>
          <SelectTrigger className="w-36 bg-[#111827] border-white/10 text-white text-sm"><SelectValue placeholder="Serveur" /></SelectTrigger>
          <SelectContent className="bg-[#1e293b] border-white/10">
            <SelectItem value="all" className="text-white">Tous</SelectItem>
            {servers.map(s => <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input value={search} onChange={e => setSearch(e.target.value)}
          className="w-44 bg-[#111827] border-white/10 text-white text-sm" placeholder="Rechercher..." />
      </div>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={ScrollText} title="Aucun log" description="Les logs apparaîtront ici." />
      ) : (
        <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase whitespace-nowrap">Date</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Niveau</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase hidden sm:table-cell">Catégorie</th>
                  <th className="text-left p-3 text-xs font-medium text-slate-500 uppercase">Message</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="p-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.created_date).toLocaleString("fr-FR")}
                    </td>
                    <td className="p-3"><StatusBadge status={log.level} /></td>
                    <td className="p-3 hidden sm:table-cell">
                      <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded">{log.category}</span>
                    </td>
                    <td className="p-3">
                      <p className="text-sm text-white">{log.message}</p>
                      {log.details && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{log.details}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-[#111827] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">Ajouter un log</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Niveau</Label>
                <Select value={form.level} onValueChange={v => setForm(f => ({...f, level: v}))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-white/10">
                    <SelectItem value="info" className="text-white">Info</SelectItem>
                    <SelectItem value="warning" className="text-white">Warning</SelectItem>
                    <SelectItem value="error" className="text-white">Erreur</SelectItem>
                    <SelectItem value="success" className="text-white">Succès</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Catégorie</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({...f, category: v}))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-white/10">
                    {["server","project","dependency","auth","backup","ai","system"].map(c =>
                      <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Message *</Label>
              <Input value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))}
                className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Détails</Label>
              <Textarea value={form.details} onChange={e => setForm(f => ({...f, details: e.target.value}))}
                className="bg-white/5 border-white/10 text-white h-16" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAdd(false)} className="text-slate-400">Annuler</Button>
            <Button onClick={async () => { await createMutation.mutateAsync(form); setShowAdd(false); }}
              disabled={!form.message} className="bg-indigo-600 hover:bg-indigo-500 text-white">Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}