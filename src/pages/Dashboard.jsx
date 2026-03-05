import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Server, FolderGit2, Cpu, HardDrive, Package, Archive } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StatCard from "../components/dashboard/StatCard";
import UsageGauge from "../components/dashboard/UsageGauge";
import StatusBadge from "../components/shared/StatusBadge";

export default function Dashboard() {
  const { data: servers = [] } = useQuery({ queryKey: ["servers"], queryFn: () => base44.entities.Server.list() });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => base44.entities.Project.list() });
  const { data: logs = [] } = useQuery({ queryKey: ["logs-recent"], queryFn: () => base44.entities.LogEntry.list("-created_date", 20) });
  const { data: backups = [] } = useQuery({ queryKey: ["backups-dash"], queryFn: () => base44.entities.Backup.list("-created_date", 5) });
  const { data: deps = [] } = useQuery({ queryKey: ["deps-dash"], queryFn: () => base44.entities.Dependency.list() });

  const onlineServers = servers.filter(s => s.status === "online").length;
  const activeProjects = projects.filter(p => p.status === "running").length;
  const avgCpu = servers.length ? Math.round(servers.reduce((s, sv) => s + (sv.cpu_usage || 0), 0) / servers.length) : 0;
  const avgRam = servers.length ? Math.round(servers.reduce((s, sv) => s + (sv.ram_usage || 0), 0) / servers.length) : 0;
  const avgDisk = servers.length ? Math.round(servers.reduce((s, sv) => s + (sv.disk_usage || 0), 0) / servers.length) : 0;
  const installedDeps = deps.filter(d => d.status === "installed").length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Server} label="Serveurs" value={servers.length} sub={`${onlineServers} en ligne`} color="indigo" />
        <StatCard icon={FolderGit2} label="Projets" value={projects.length} sub={`${activeProjects} actifs`} color="emerald" />
        <StatCard icon={Package} label="Dépendances" value={installedDeps} sub="installées" color="amber" />
        <StatCard icon={Archive} label="Sauvegardes" value={backups.length} sub="total" color="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-5">Utilisation système</h3>
          <div className="flex items-center justify-around">
            <UsageGauge label="CPU" value={avgCpu} color="#6366f1" />
            <UsageGauge label="RAM" value={avgRam} color="#10b981" />
            <UsageGauge label="Disque" value={avgDisk} color="#f59e0b" />
          </div>
        </div>

        <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Serveurs</h3>
            <Link to={createPageUrl("Servers")} className="text-xs text-indigo-400 hover:text-indigo-300">Voir tout →</Link>
          </div>
          <div className="space-y-2">
            {servers.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Aucun serveur</p>
            ) : servers.slice(0, 4).map(s => (
              <div key={s.id} className="flex items-center justify-between p-2.5 bg-white/[0.02] rounded-xl border border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Server className="h-3.5 w-3.5 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white">{s.name}</p>
                    <p className="text-[10px] text-slate-500">{s.host}</p>
                  </div>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Logs récents</h3>
            <Link to={createPageUrl("Logs")} className="text-xs text-indigo-400 hover:text-indigo-300">Voir tout →</Link>
          </div>
          <div className="space-y-2">
            {logs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Aucun log</p>
            ) : logs.slice(0, 6).map(log => (
              <div key={log.id} className="p-2.5 bg-white/[0.02] rounded-lg border border-white/5">
                <div className="flex items-center gap-2 mb-0.5">
                  <StatusBadge status={log.level} />
                  <span className="text-[10px] text-slate-500">{new Date(log.created_date).toLocaleString("fr-FR")}</span>
                </div>
                <p className="text-xs text-slate-300 truncate">{log.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Projets actifs</h3>
          <Link to={createPageUrl("Projects")} className="text-xs text-indigo-400 hover:text-indigo-300">Voir tout →</Link>
        </div>
        {projects.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">Aucun projet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {projects.slice(0, 8).map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.name}</p>
                  <p className="text-[10px] text-slate-500">Port {p.port || "—"} · {p.type}</p>
                </div>
                <div className="ml-2 flex-shrink-0"><StatusBadge status={p.status} /></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}