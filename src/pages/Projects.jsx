import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FolderGit2, Play, Square, RotateCcw, Trash2, Pencil, ScrollText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import ProjectFormDialog from "../components/projects/ProjectFormDialog";

const typeIcons = { nodejs: "🟢", python: "🐍", docker: "🐳", static: "📄", other: "📦" };

export default function Projects() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list("-created_date"),
  });

  const { data: servers = [] } = useQuery({
    queryKey: ["servers"],
    queryFn: () => base44.entities.Server.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.Project.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.Project.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });

  const handleSave = async (data) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data });
    } else {
      const nextPort = 3001 + projects.length;
      await createMutation.mutateAsync({ ...data, port: data.port || nextPort, status: "stopped" });
    }
    setEditing(null);
  };

  const changeStatus = (project, status) => {
    updateMutation.mutate({ id: project.id, data: { status } });
  };

  const serverName = (id) => servers.find(s => s.id === id)?.name || "—";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des projets"
        description="Gérez, déployez et surveillez vos projets"
        action="Nouveau projet"
        onAction={() => { setEditing(null); setShowForm(true); }}
      />

      {projects.length === 0 && !isLoading ? (
        <EmptyState icon={FolderGit2} title="Aucun projet" description="Créez ou importez votre premier projet."
          action="Nouveau projet" onAction={() => setShowForm(true)} />
      ) : (
        <div className="grid gap-4">
          {projects.map(project => (
            <div key={project.id} className="bg-[#111827] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl shrink-0">
                    {typeIcons[project.type] || "📦"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white">{project.name}</h3>
                      <StatusBadge status={project.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {project.type} · Port {project.port || "—"} · Serveur: {serverName(project.server_id)}
                    </p>
                    {project.description && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{project.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {project.status !== "running" && (
                    <Button size="sm" variant="ghost" onClick={() => changeStatus(project, "running")}
                      className="text-emerald-400 hover:bg-emerald-500/10 gap-1 text-xs">
                      <Play className="h-3.5 w-3.5" /> Démarrer
                    </Button>
                  )}
                  {project.status === "running" && (
                    <Button size="sm" variant="ghost" onClick={() => changeStatus(project, "stopped")}
                      className="text-amber-400 hover:bg-amber-500/10 gap-1 text-xs">
                      <Square className="h-3.5 w-3.5" /> Arrêter
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => changeStatus(project, "deploying")}
                    className="text-indigo-400 hover:bg-indigo-500/10 gap-1 text-xs">
                    <RotateCcw className="h-3.5 w-3.5" /> Redémarrer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(project); setShowForm(true); }}
                    className="text-slate-400 hover:bg-white/5 gap-1 text-xs">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(project)}
                    className="text-rose-400 hover:bg-rose-500/10 gap-1 text-xs">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProjectFormDialog open={showForm} onOpenChange={setShowForm} project={editing} servers={servers} onSave={handleSave} />

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className="bg-[#111827] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Supprimer le projet « {deleting?.name} » ? Cette action est irréversible.
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