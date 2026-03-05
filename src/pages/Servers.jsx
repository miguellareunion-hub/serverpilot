import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Server, Wifi, WifiOff, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import ServerFormDialog from "../components/servers/ServerFormDialog";

export default function Servers() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const queryClient = useQueryClient();

  const { data: servers = [], isLoading } = useQuery({
    queryKey: ["servers"],
    queryFn: () => base44.entities.Server.list("-created_date"),
  });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.Server.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["servers"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Server.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["servers"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.Server.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["servers"] }),
  });

  const handleSave = async (data) => {
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data });
    } else {
      await createMutation.mutateAsync({ ...data, status: "unknown" });
    }
    setEditing(null);
  };

  const testConnection = async (server) => {
    await updateMutation.mutateAsync({
      id: server.id,
      data: { ...server, status: "online", last_checked: new Date().toISOString() }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des serveurs"
        description="Gérez vos serveurs et testez les connexions"
        action="Ajouter un serveur"
        onAction={() => { setEditing(null); setShowForm(true); }}
      />

      {servers.length === 0 && !isLoading ? (
        <EmptyState
          icon={Server}
          title="Aucun serveur"
          description="Commencez par ajouter votre premier serveur pour le gérer."
          action="Ajouter un serveur"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid gap-4">
          {servers.map(server => (
            <div key={server.id} className="bg-[#111827] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <Server className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">{server.name}</h3>
                      <StatusBadge status={server.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {server.host}:{server.port} · {server.username} · {server.auth_type === "ssh_key" ? "SSH Key" : "Password"}
                    </p>
                    {server.uptime && <p className="text-xs text-slate-500">Uptime: {server.uptime}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => testConnection(server)}
                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1.5 text-xs">
                    <Wifi className="h-3.5 w-3.5" /> Tester
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(server); setShowForm(true); }}
                    className="text-slate-400 hover:text-white hover:bg-white/5 gap-1.5 text-xs">
                    <Pencil className="h-3.5 w-3.5" /> Modifier
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(server)}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 gap-1.5 text-xs">
                    <Trash2 className="h-3.5 w-3.5" /> Supprimer
                  </Button>
                </div>
              </div>

              {(server.cpu_usage != null || server.ram_usage != null || server.disk_usage != null) && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "CPU", value: server.cpu_usage, color: "indigo" },
                    { label: "RAM", value: server.ram_usage, color: "emerald" },
                    { label: "Disque", value: server.disk_usage, color: "amber" },
                  ].map(m => (
                    <div key={m.label} className="bg-white/[0.02] rounded-xl p-3">
                      <p className="text-[10px] text-slate-500 uppercase">{m.label}</p>
                      <div className="mt-1.5 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-${m.color}-500 transition-all`} style={{ width: `${m.value || 0}%` }} />
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

      <ServerFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        server={editing}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className="bg-[#111827] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Voulez-vous vraiment supprimer le serveur « {deleting?.name} » ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 text-white border-white/10 hover:bg-white/10">Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { deleteMutation.mutate(deleting.id); setDeleting(null); }}
              className="bg-rose-600 hover:bg-rose-500 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}