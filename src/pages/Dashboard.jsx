import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Server, FolderGit2, Cpu, HardDrive, MemoryStick, Clock, Activity, Wifi } from "lucide-react";
import StatCard from "../components/dashboard/StatCard";
import UsageGauge from "../components/dashboard/UsageGauge";
import StatusBadge from "../components/shared/StatusBadge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Dashboard() {
  const { data: servers = [] } = useQuery({
    queryKey: ["servers"],
    queryFn: () => base44.entities.Server.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => base44.entities.Project.list(),
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["logs-recent"],
    queryFn: () => base44.entities.LogEntry.list("-created_date", 5),
  });

  const onlineServers = servers.filter(s => s.status === "online").length;
  const activeProjects = projects.filter(p => p.status === "running").length;
  const avgCpu = servers.length ? Math.round(servers.reduce((sum, s) => sum + (s.cpu_usage || 0), 0) / servers.length) : 0;
  const avgRam = servers.length ? Math.round(servers.reduce((sum, s) => sum + (s.ram_usage || 0), 0) / servers.length) : 0;
  const avgDisk = servers.length ? Math.round(servers.reduce((sum, s) => sum + (s.disk_usage || 0), 0) / servers.length) : 0;

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Server} label="Serveurs" value={servers.length} sub={`${onlineServers} en ligne`} color="indigo" />
        <StatCard icon={FolderGit2} label="Projets" value={projects.length} sub={`${activeProjects} actifs`} color="emerald" />
        <StatCard icon={Cpu} label="CPU moyen" value={`${avgCpu}%`} color="amber" />
        <StatCard icon={HardDrive} label="Disque moyen" value={`${avgDisk}%`} color="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usage gauges */}
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-6">Utilisation système</h3>
          <div className="flex items-center justify-around">
            <UsageGauge label="CPU" value={avgCpu} color="#6366f1" />
            <UsageGauge label="RAM" value={avgRam} color="#10b981" />
            <UsageGauge label="Disque" value={avgDisk} color="#f59e0b" />
          </div>
        </div>

        {/* Recent servers */}
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Serveurs récents</h3>
            <Link to={createPageUrl("Servers")} className="text-xs text-indigo-400 hover:text-indigo-300">Voir tout →</Link>
          </div>
          <div className="space-y-3">
            {servers.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Aucun serveur</p>
            ) : (
              servers.slice(0, 4).map(server => (
                <div key={server.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                      <Server className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{server.name}</p>
                      <p className="text-xs text-slate-500">{server.host}</p>
                    </div>
                  </div>
                  <StatusBadge status={server.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent logs */}
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Logs récents</h3>
            <Link to={createPageUrl("Logs")} className="text-xs text-indigo-400 hover:text-indigo-300">Voir tout →</Link>
          </div>
          <div className="space-y-2">
            {logs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Aucun log</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="p-2.5 bg-white/[0.02] rounded-lg border border-white/5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <StatusBadge status={log.level} />
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.created_date).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 truncate">{log.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Active projects */}
      <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Projets actifs</h3>
          <Link to={createPageUrl("Projects")} className="text-xs text-indigo-400 hover:text-indigo-300">Voir tout →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.length === 0 ? (
            <p className="text-sm text-slate-500 col-span-full text-center py-4">Aucun projet</p>
          ) : (
            projects.slice(0, 6).map(project => (
              <div key={project.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <FolderGit2 className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{project.name}</p>
                    <p className="text-xs text-slate-500">Port {project.port || "—"} · {project.type || "—"}</p>
                  </div>
                </div>
                <StatusBadge status={project.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}