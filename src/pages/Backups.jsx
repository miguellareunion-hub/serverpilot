import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Archive, Download, Trash2, RotateCcw, Plus, Database, FolderGit2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import { toast } from "sonner";

const typeIcons = { project: FolderGit2, database: Database, full: Archive };
const typeLabels = { project: "Projet", database: "Base de données", full: "Complète" };

export default function Backups() {
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ name: "", type: "project", server_id: "", project_id: "", notes: "" });
  const queryClient = useQueryClient();

  const { data: backups = [], isLoading } = useQuery({
    queryKey: ["backups"],
    queryFn: () => base44.entities.Backup.list("-created_date"),
  });
  const { data: servers = [] } = useQuery({ queryKey: ["servers"], queryFn: () => base44.entities.Server.list() });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.Backup.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backups"] }),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Backup.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backups"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.Backup.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["backups"] }); toast.success("Sauvegarde supprimée."); },
  });

  const handleCreate = async () => {
    const name = form.name || `Backup ${new Date().toLocaleDateString("fr-FR")} ${new Date().toLocaleTimeString("fr-FR")}`;
    const backup = await createMutation.mutateAsync({ ...form, name, status: "running" });
    toast.success("Sauvegarde lancée !");
    setShowForm(false);
    setForm({ name: "", type: "project", server_id: "", project_id: "", notes: "" });
    // Mock completion
    setTimeout(() => {
      updateMutation.mutate({ id: backup.id, data: { status: "completed", size: `${(Math.random() * 450 + 50).toFixed(1)} MB` } });
      toast.success("Sauvegarde terminée !");
    }, 3500);
  };

  const serverName = (id) => servers.find(s => s.id === id)?.name;
  const projectName = (id) => projects.find(p => p.id === id)?.name;

  const completedCount = backups.filter(b => b.status === "completed").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Sauvegardes</h2>
          <p className="text-sm text-slate-400 mt-0.5">{completedCount} / {backups.length} terminées</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 text-sm">
          <Plus className="h-4 w-4" /> Nouvelle sauvegarde
        </Button>
      </div>

      {backups.length === 0 && !isLoading ? (
        <EmptyState icon={Archive} title="Aucune sauvegarde" description="Créez votre première sauvegarde."
          action="Créer" onAction={() => setShowForm(true)} />
      ) : (
        <div className="grid gap-3">
          {backups.map(backup => {
            const TypeIcon = typeIcons[backup.type] || Archive;
            return (
              <div key={backup.id} className="bg-[#111827] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                      <TypeIcon className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-white">{backup.name}</h3>
                        <StatusBadge status={backup.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {typeLabels[backup.type]}
                        {backup.size && ` · ${backup.size}`}
                        {serverName(backup.server_id) && ` · ${serverName(backup.server_id)}`}
                        {projectName(backup.project_id) && ` · ${projectName(backup.project_id)}`}
                      </p>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {new Date(backup.created_date).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {backup.status === "completed" && (
                      <Button size="sm" variant="ghost" onClick={() => toast.info("Restauration simulée (mock)")}
                        className="text-indigo-400 hover:bg-indigo-500/10 gap-1 text-xs">
                        <RotateCcw className="h-3.5 w-3.5" /> Restaurer
                      </Button>
                    )}
                    {backup.status === "running" && (
                      <span className="flex items-center gap-1.5 text-xs text-amber-400">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" /> En cours...
                      </span>
                    )}
                    {backup.file_url && (
                      <a href={backup.file_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="text-emerald-400 hover:bg-emerald-500/10 gap-1 text-xs">
                          <Download className="h-3.5 w-3.5" /> Télécharger
                        </Button>
                      </a>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(backup)}
                      className="text-rose-400 hover:bg-rose-500/10">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {backup.notes && <p className="text-xs text-slate-500 mt-2 ml-[52px]">{backup.notes}</p>}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-[#111827] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">Nouvelle sauvegarde</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Nom (optionnel)</Label>
              <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                className="bg-white/5 border-white/10 text-white" placeholder="Généré automatiquement" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v}))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-white/10">
                  <SelectItem value="project" className="text-white">📁 Projet</SelectItem>
                  <SelectItem value="database" className="text-white">🗄️ Base de données</SelectItem>
                  <SelectItem value="full" className="text-white">💾 Complète</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Serveur</Label>
              <Select value={form.server_id || "none"} onValueChange={v => setForm(f => ({...f, server_id: v === "none" ? "" : v}))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-white/10">
                  <SelectItem value="none" className="text-white">Aucun</SelectItem>
                  {servers.map(s => <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.type === "project" && (
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Projet</Label>
                <Select value={form.project_id || "none"} onValueChange={v => setForm(f => ({...f, project_id: v === "none" ? "" : v}))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-white/10">
                    <SelectItem value="none" className="text-white">Aucun</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id} className="text-white">{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                className="bg-white/5 border-white/10 text-white h-16" placeholder="Optionnel..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400">Annuler</Button>
            <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-500 text-white">Lancer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className="bg-[#111827] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Supprimer la sauvegarde</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">Supprimer « {deleting?.name} » ?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 text-white border-white/10 hover:bg-white/10">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteMutation.mutate(deleting.id); setDeleting(null); }}
              className="bg-rose-600 hover:bg-rose-500 text-white">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}