import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { FolderGit2, Play, Square, RotateCcw, Trash2, Pencil, Zap, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import ProjectFormDialog from "../components/projects/ProjectFormDialog";
import AutoInstallDialog from "../components/projects/AutoInstallDialog";
import { toast } from "sonner";

const typeIcon = { nodejs: "🟢", python: "🐍", docker: "🐳", static: "📄", other: "📦" };

export default function Projects() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showAutoInstall, setShowAutoInstall] = useState(false);
  const [logsProject, setLogsProject] = useState(null);
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list("-created_date") });
  const { data: servers = [] } = useQuery({ queryKey: ["servers"], queryFn: () => base44.entities.Server.list() });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Project.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
  const createMutation = useMutation({
    mutationFn: data => base44.entities.Project.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["projects"] }); toast.success("Projet créé !"); },
  });
  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.Project.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["projects"] }); toast.success("Projet supprimé."); },
  });

  const handleSave = async (data) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data });
      toast.success("Projet mis à jour !");
    } else {
      const usedPorts = projects.map(p => p.port).filter(Boolean);
      let nextPort = 3001;
      while (usedPorts.includes(nextPort)) nextPort++;
      await createMutation.mutateAsync({ ...data, port: data.port || nextPort, status: "stopped" });
    }
    setEditing(null);
  };

  const changeStatus = async (project, status) => {
    const updates = { status };
    if (status === "running") updates.last_deploy_at = new Date().toISOString();
    await updateMutation.mutateAsync({ id: project.id, data: updates });
    toast.success(`Projet ${status === "running" ? "démarré" : status === "stopped" ? "arrêté" : "redémarré"}`);
  };

  const serverName = (id) => servers.find(s => s.id === id)?.name || "—";

  const handleAutoInstallComplete = async (projectData) => {
    const usedPorts = projects.map(p => p.port).filter(Boolean);
    let port = projectData.port;
    while (usedPorts.includes(port)) port++;
    const created = await createMutation.mutateAsync({ ...projectData, port });
    toast.success(`✅ ${created.name} installé et démarré sur :${port} !`);
    // Log entry
    await base44.entities.LogEntry.create({ level: "success", category: "project", message: `Auto-install: ${created.name} démarré sur :${port}`, details: `Type: ${created.type}` });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Projets</h2>
          <p className="text-sm text-slate-400 mt-0.5">Déployez et gérez vos applications</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAutoInstall(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 text-sm">
            <Zap className="h-4 w-4" /> Auto Install
          </Button>
          <Button variant="outline" onClick={() => { setEditing(null); setShowForm(true); }} className="border-white/10 text-white hover:bg-white/5 gap-2 text-sm">
            + Nouveau projet
          </Button>
        </div>
      </div>

      {projects.length === 0 && !isLoading ? (
        <EmptyState icon={FolderGit2} title="Aucun projet" description="Importez ou créez votre premier projet."
          action="Nouveau projet" onAction={() => setShowForm(true)} />
      ) : (
        <div className="grid gap-3">
          {projects.map(project => (
            <div key={project.id} className="bg-[#111827] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-lg shrink-0">
                    {typeIcon[project.type] || "📦"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white">{project.name}</h3>
                      <StatusBadge status={project.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {project.type} · Port {project.port || "—"} · {serverName(project.server_id)}
                    </p>
                    {project.last_deploy_at && <p className="text-[10px] text-slate-600 mt-0.5">Déployé : {new Date(project.last_deploy_at).toLocaleString("fr-FR")}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {project.status !== "running" && (
                    <Button size="sm" variant="ghost" onClick={() => changeStatus(project, "running")} className="text-emerald-400 hover:bg-emerald-500/10 gap-1 text-xs">
                      <Play className="h-3.5 w-3.5" /> Démarrer
                    </Button>
                  )}
                  {project.status === "running" && (
                    <Button size="sm" variant="ghost" onClick={() => changeStatus(project, "stopped")} className="text-amber-400 hover:bg-amber-500/10 gap-1 text-xs">
                      <Square className="h-3.5 w-3.5" /> Arrêter
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => changeStatus(project, "deploying")} className="text-indigo-400 hover:bg-indigo-500/10 gap-1 text-xs">
                    <RotateCcw className="h-3.5 w-3.5" /> Redémarrer
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(project); setShowForm(true); }} className="text-slate-400 hover:bg-white/5">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setLogsProject(project)} className="text-slate-400 hover:bg-white/5 gap-1 text-xs">
                    <ScrollText className="h-3.5 w-3.5" /> Logs
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(project)} className="text-rose-400 hover:bg-rose-500/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {project.description && <p className="text-xs text-slate-500 mt-2 ml-[52px] line-clamp-1">{project.description}</p>}
            </div>
          ))}
        </div>
      )}

      <ProjectFormDialog open={showForm} onOpenChange={setShowForm} project={editing} servers={servers} onSave={handleSave} />

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className="bg-[#111827] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Supprimer le projet</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">Supprimer « {deleting?.name} » (port {deleting?.port}) ? Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 text-white border-white/10 hover:bg-white/10">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteMutation.mutate(deleting.id); setDeleting(null); }} className="bg-rose-600 hover:bg-rose-500 text-white">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}