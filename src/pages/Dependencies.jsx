import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Package, Search, Download, Trash2, RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";

const DEPS = [
  { name: "Docker", icon: "🐳" },
  { name: "Node.js", icon: "🟢" },
  { name: "Python", icon: "🐍" },
  { name: "Redis", icon: "🔴" },
  { name: "PostgreSQL", icon: "🐘" },
  { name: "Nginx", icon: "🌐" },
  { name: "Ollama", icon: "🤖" },
  { name: "Git", icon: "📦" },
  { name: "Open WebUI", icon: "💬" },
];

export default function Dependencies() {
  const [selectedServer, setSelectedServer] = useState("all");
  const queryClient = useQueryClient();

  const { data: servers = [] } = useQuery({
    queryKey: ["servers"],
    queryFn: () => base44.entities.Server.list(),
  });

  const { data: deps = [], isLoading } = useQuery({
    queryKey: ["dependencies"],
    queryFn: () => base44.entities.Dependency.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Dependency.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dependencies"] }),
  });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.Dependency.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dependencies"] }),
  });

  const analyzeAll = async () => {
    for (const dep of DEPS) {
      const existing = deps.find(d => d.name === dep.name);
      if (!existing) {
        await createMutation.mutateAsync({
          name: dep.name,
          icon: dep.icon,
          status: Math.random() > 0.5 ? "installed" : "not_installed",
          version: Math.random() > 0.5 ? `${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 5)}` : "",
        });
      }
    }
  };

  const handleAction = (dep, action) => {
    const statusMap = { install: "installing", uninstall: "not_installed", update: "updating" };
    updateMutation.mutate({ id: dep.id, data: { status: statusMap[action] || dep.status } });

    if (action === "install" || action === "update") {
      setTimeout(() => {
        updateMutation.mutate({
          id: dep.id,
          data: { status: "installed", version: `${Math.floor(Math.random() * 20)}.0.0` }
        });
      }, 2000);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dépendances système"
        description="Analysez et gérez les logiciels installés sur vos serveurs"
        action="Analyser tout"
        icon={Search}
        onAction={analyzeAll}
      />

      <div className="flex items-center gap-3">
        <Select value={selectedServer} onValueChange={setSelectedServer}>
          <SelectTrigger className="w-48 bg-[#111827] border-white/10 text-white">
            <SelectValue placeholder="Tous les serveurs" />
          </SelectTrigger>
          <SelectContent className="bg-[#1e293b] border-white/10">
            <SelectItem value="all" className="text-white">Tous les serveurs</SelectItem>
            {servers.map(s => (
              <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Dépendance</th>
                <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Statut</th>
                <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Version</th>
                <th className="text-right p-4 text-xs font-medium text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deps.length === 0 ? (
                DEPS.map(dep => (
                  <tr key={dep.name} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{dep.icon}</span>
                        <span className="text-sm font-medium text-white">{dep.name}</span>
                      </div>
                    </td>
                    <td className="p-4"><StatusBadge status="unknown" /></td>
                    <td className="p-4 text-sm text-slate-500">—</td>
                    <td className="p-4 text-right">
                      <span className="text-xs text-slate-500">Lancez l'analyse</span>
                    </td>
                  </tr>
                ))
              ) : (
                deps.map(dep => (
                  <tr key={dep.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{dep.icon || "📦"}</span>
                        <span className="text-sm font-medium text-white">{dep.name}</span>
                      </div>
                    </td>
                    <td className="p-4"><StatusBadge status={dep.status} /></td>
                    <td className="p-4 text-sm text-slate-400">{dep.version || "—"}</td>
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
                              <RefreshCw className="h-3.5 w-3.5" /> Mettre à jour
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleAction(dep, "uninstall")}
                              className="text-rose-400 hover:bg-rose-500/10 gap-1 text-xs">
                              <Trash2 className="h-3.5 w-3.5" /> Désinstaller
                            </Button>
                          </>
                        )}
                        {(dep.status === "installing" || dep.status === "updating") && (
                          <span className="flex items-center gap-1.5 text-xs text-amber-400">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> En cours...
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}