import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cpu, HardDrive, Wifi, Activity } from "lucide-react";
import UsageGauge from "../components/dashboard/UsageGauge";
import StatCard from "../components/dashboard/StatCard";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const genPoint = (prev) => ({
  time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  cpu: Math.max(5, Math.min(95, (prev?.cpu || 30) + (Math.random() - 0.5) * 15)),
  ram: Math.max(10, Math.min(90, (prev?.ram || 40) + (Math.random() - 0.5) * 8)),
  disk: Math.max(20, Math.min(85, (prev?.disk || 50) + (Math.random() - 0.5) * 3)),
  network: Math.max(0, Math.min(100, (prev?.network || 20) + (Math.random() - 0.5) * 20)),
});

const init24h = () => Array.from({ length: 24 }, (_, i) => {
  const d = new Date(); d.setHours(d.getHours() - 23 + i);
  return { time: `${d.getHours()}:00`, cpu: 20 + Math.random() * 60, ram: 30 + Math.random() * 50, disk: 40 + Math.random() * 20, network: Math.random() * 100 };
});

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#1e293b] border border-white/10 rounded-xl p-3 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {Math.round(p.value)}%</p>)}
    </div>
  );
};

export default function Monitoring() {
  const [selectedServer, setSelectedServer] = useState("all");
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [history, setHistory] = useState(init24h);
  const [live, setLive] = useState(() => genPoint(null));
  const intervalRef = useRef(null);

  const { data: servers = [] } = useQuery({ queryKey: ["servers"], queryFn: () => base44.entities.Server.list() });

  const activeServer = selectedServer !== "all" ? servers.find(s => s.id === selectedServer) : null;
  const avgCpu = activeServer?.cpu_usage ?? (servers.length ? Math.round(servers.reduce((s, sv) => s + (sv.cpu_usage || 0), 0) / servers.length) : Math.round(live.cpu));
  const avgRam = activeServer?.ram_usage ?? (servers.length ? Math.round(servers.reduce((s, sv) => s + (sv.ram_usage || 0), 0) / servers.length) : Math.round(live.ram));
  const avgDisk = activeServer?.disk_usage ?? (servers.length ? Math.round(servers.reduce((s, sv) => s + (sv.disk_usage || 0), 0) / servers.length) : Math.round(live.disk));

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setLive(prev => {
        const next = genPoint(prev);
        setHistory(h => [...h.slice(-47), next]);
        return next;
      });
    }, refreshInterval * 1000);
    return () => clearInterval(intervalRef.current);
  }, [refreshInterval]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Monitoring</h2>
          <p className="text-sm text-slate-400 mt-0.5">Performances en temps réel</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedServer} onValueChange={setSelectedServer}>
            <SelectTrigger className="w-44 bg-[#111827] border-white/10 text-white text-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-white/10">
              <SelectItem value="all" className="text-white">Tous les serveurs</SelectItem>
              {servers.map(s => <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(refreshInterval)} onValueChange={v => setRefreshInterval(Number(v))}>
            <SelectTrigger className="w-28 bg-[#111827] border-white/10 text-white text-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-white/10">
              <SelectItem value="2" className="text-white">2 sec</SelectItem>
              <SelectItem value="5" className="text-white">5 sec</SelectItem>
              <SelectItem value="10" className="text-white">10 sec</SelectItem>
              <SelectItem value="30" className="text-white">30 sec</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Cpu} label="CPU" value={`${avgCpu}%`} color="indigo" />
        <StatCard icon={Activity} label="RAM" value={`${avgRam}%`} color="emerald" />
        <StatCard icon={HardDrive} label="Disque" value={`${avgDisk}%`} color="amber" />
        <StatCard icon={Wifi} label="Réseau" value={`${Math.round(live.network)} Mb/s`} color="cyan" />
      </div>

      <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-white">Vue temps réel</h3>
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
          </span>
        </div>
        <div className="flex items-center justify-around flex-wrap gap-4">
          <UsageGauge label="CPU" value={Math.round(live.cpu)} color="#6366f1" />
          <UsageGauge label="RAM" value={Math.round(live.ram)} color="#10b981" />
          <UsageGauge label="Disque" value={Math.round(live.disk)} color="#f59e0b" />
          <UsageGauge label="Réseau" value={Math.round(live.network)} color="#06b6d4" />
        </div>
      </div>

      <div className="bg-[#111827] border border-white/5 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Historique</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                {[["cpu", "#6366f1"], ["ram", "#10b981"], ["disk", "#f59e0b"]].map(([k, c]) => (
                  <linearGradient key={k} id={`${k}G`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={c} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={c} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#475569" fontSize={10} interval="preserveStartEnd" />
              <YAxis stroke="#475569" fontSize={10} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} />
              <Area type="monotone" dataKey="cpu" name="CPU" stroke="#6366f1" fill="url(#cpuG)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="ram" name="RAM" stroke="#10b981" fill="url(#ramG)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="disk" name="Disque" stroke="#f59e0b" fill="url(#diskG)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}