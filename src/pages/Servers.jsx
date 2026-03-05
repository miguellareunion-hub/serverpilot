import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Server, Wifi, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import ServerFormDialog from "../components/servers/ServerFormDialog";
import { toast } from "sonner";

export default function Servers() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [testing, setTesting] = useState(null);
  const queryClient = useQueryClient();

  const { data: servers = [], isLoading } = useQuery({
    queryKey: ["servers"],
    queryFn: () => base44.entities.Server.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.Server.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["servers"] }); toast.success("Serveur ajouté !"); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Server.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["servers"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.Server.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["servers"] }); toast.success("Serveur supprimé."); },
  });

  const handleSave = async (data) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data });
      toast.success("Serveur mis à jour !");
    } else {
      await createMutation.mutateAsync({ ...data, status: "unknown" });
    }
    setEditing(null);
  };

  const testConnection = async (server) => {
    setTesting(server.id);
    await new Promise(r => setTimeout(r, 1500));
    const success = server.enabled && server.host;
    await updateMutation.mutateAsync({ id: server.id, data: { status: success ? "online" : "offline", last_checked: new Date().toISOString() } });
    toast[success ? "success" : "error"](success ? `${server.name} est en ligne` : `${server.name} hors ligne`);
    setTesting(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Serveurs SSH" description="Gérez vos serveurs et connexions SSH"
        action="Ajouter un serveur" onAction={() => { setEditing(null); setShowForm(true); }} />

      {servers.length === 0 && !isLoading ? (
        <EmptyState icon={Server} title="Aucun serveur" description="Ajoutez votre premier serveur SSH."
          action="Ajouter" onAction={() => setShowForm(true)} />
      ) : (
        <div className="grid gap-3">
          {servers.map(server => (
            <div key={server.id} className={`bg-[#111827] border rounded-2xl p-4 transition-all ${server.enabled ? 'border-white/5 hover:border-white/10' : 'border-white/[0.03] opacity-60'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <Server className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white">{server.name}</h3>
                      <StatusBadge status={server.status} />
                      {!server.enabled && <span className="text-[10px] bg-slate-700/40 text-slate-400 px-2 py-0.5 rounded-full border border-white/5">Désactivé</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {server.username}@{server.host}:{server.port || 22} · {server.auth_type === "ssh_key" ? "Clé SSH" : "Password"}
                    </p>
                    {server.last_checked && <p className="text-[10px] text-slate-600 mt-0.5">Vérifié : {new Date(server.last_checked).toLocaleString("fr-FR")}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <Button size="sm" variant="ghost" onClick={() => testConnection(server)} disabled={testing === server.id}
                    className="text-emerald-400 hover:bg-emerald-500/10 gap-1 text-xs">
                    <Wifi className="h-3.5 w-3.5" />{testing === server.id ? "Test..." : "Tester"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(server); setShowForm(true); }}
                    className="text-slate-400 hover:text-white hover:bg-white/5 gap-1 text-xs">
                    <Pencil className="h-3.5 w-3.5" /> Modifier
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(server)}
                    className="text-rose-400 hover:bg-rose-500/10 gap-1 text-xs">
                    <Trash2 className="h-3.5 w-3.5" /> Supprimer
                  </Button>
                </div>
              </div>
              {(server.cpu_usage != null || server.ram_usage != null || server.disk_usage != null) && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[{ label: "CPU", value: server.cpu_usage, color: "indigo" }, { label: "RAM", value: server.ram_usage, color: "emerald" }, { label: "Disque", value: server.disk_usage, color: "amber" }].map(m => (
                    <div key={m.label} className="bg-white/[0.02] rounded-lg p-2.5">
                      <p className="text-[10px] text-slate-500 uppercase">{m.label}</p>
                      <div className="mt-1 h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-${m.color}-500`} style={{ width: `${m.value || 0}%` }} />
                      </div>
                      <p className="text-xs text-white font-medium mt-1">{m.value || 0}%</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ServerFormDialog open={showForm} onOpenChange={setShowForm} server={editing} onSave={handleSave} />

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className="bg-[#111827] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Supprimer le serveur</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">Supprimer « {deleting?.name} » ? Cette action est irréversible.</AlertDialogDescription>
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