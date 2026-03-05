import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Archive, Download, Trash2, RotateCcw, Plus, Database, FolderGit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";

export default function Backups() {
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ name: "", type: "project", server_id: "", project_id: "" });
  const queryClient = useQueryClient();

  const { data: backups = [], isLoading } = useQuery({
    queryKey: ["backups"],
    queryFn: () => base44.entities.Backup.list("-created_date"),
  });

  const { data: servers = [] } = useQuery({
    queryKey: ["servers"],
    queryFn: () => base44.entities.Server.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
  });

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["backups"] }),
  });

  const handleCreate = async () => {
    const backup = await createMutation.mutateAsync({ ...form, status: "in_progress" });
    setShowForm(false);
    // Simulate backup completion
    setTimeout(() => {
      updateMutation.mutate({ id: backup.id, data: { status: "completed", size: `${(Math.random() * 500 + 50).toFixed(1)} MB` } });
    }, 3000);
  };

  const typeIcons = { project: FolderGit2, database: Database, full: Archive };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sauvegardes"
        description="Gérez les sauvegardes de vos projets et bases de données"
        action="Nouvelle sauvegarde"
        onAction={() => { setForm({ name: "", type: "project", server_id: "", project_id: "" }); setShowForm(true); }}
      />

      {backups.length === 0 && !isLoading ? (
        <EmptyState icon={Archive} title="Aucune sauvegarde" description="Créez votre première sauvegarde."
          action="Créer une sauvegarde" onAction={() => setShowForm(true)} />
      ) : (
        <div className="grid gap-4">
          {backups.map(backup => {
            const TypeIcon = typeIcons[backup.type] || Archive;
            return (
              <div key={backup.id} className="bg-[#111827] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                      <TypeIcon className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{backup.name}</h3>
                        <StatusBadge status={backup.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {backup.type === "project" ? "Projet" : backup.type === "database" ? "Base de données" : "Complète"}
                        {backup.size && ` · ${backup.size}`}
                        {" · "}{new Date(backup.created_date).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {backup.status === "completed" && (
                      <Button size="sm" variant="ghost" className="text-indigo-400 hover:bg-indigo-500/10 gap-1 text-xs">
                        <RotateCcw className="h-3.5 w-3.5" /> Restaurer
                      </Button>
                    )}
                    {backup.file_url && (
                      <a href={backup.file_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="text-emerald-400 hover:bg-emerald-500/10 gap-1 text-xs">
                          <Download className="h-3.5 w-3.5" /> Télécharger
                        </Button>
                      </a>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(backup)}
                      className="text-rose-400 hover:bg-rose-500/10 gap-1 text-xs">
                      <Trash2 className="h-3.5 w-3.5" /> Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-[#111827] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Nouvelle sauvegarde</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-300 text-xs">Nom</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="Backup 2024-01-15" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Type</Label>
              <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-white/10">
                  <SelectItem value="project" className="text-white">Projet</SelectItem>
                  <SelectItem value="database" className="text-white">Base de données</SelectItem>
                  <SelectItem value="full" className="text-white">Complète</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.type === "project" && (
              <div>
                <Label className="text-slate-300 text-xs">Projet</Label>
                <Select value={form.project_id} onValueChange={v => setForm({...form, project_id: v})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-white/10">
                    {projects.map(p => <SelectItem key={p.id} value={p.id} className="text-white">{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">Annuler</Button>
            <Button onClick={handleCreate} disabled={!form.name} className="bg-indigo-600 hover:bg-indigo-500 text-white">Lancer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className="bg-[#111827] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Supprimer la sauvegarde « {deleting?.name} » ?
            </AlertDialogDescription>
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