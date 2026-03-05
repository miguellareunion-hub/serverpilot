import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cpu, HardDrive, Wifi, Activity } from "lucide-react";
import UsageGauge from "../components/dashboard/UsageGauge";
import StatCard from "../components/dashboard/StatCard";
import PageHeader from "../components/shared/PageHeader";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Simulated history data
const generateHistory = () => Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  cpu: Math.floor(20 + Math.random() * 60),
  ram: Math.floor(30 + Math.random() * 50),
  disk: Math.floor(40 + Math.random() * 20),
  network: Math.floor(Math.random() * 100),
}));

export default function Monitoring() {
  const [selectedServer, setSelectedServer] = useState("all");
  const history = generateHistory();

  const { data: servers = [] } = useQuery({
    queryKey: ["servers"],
    queryFn: () => base44.entities.Server.list(),
  });

  const activeServer = selectedServer !== "all"
    ? servers.find(s => s.id === selectedServer)
    : null;

  const avgCpu = activeServer?.cpu_usage || (servers.length
    ? Math.round(servers.reduce((s, sv) => s + (sv.cpu_usage || 0), 0) / servers.length) : 0);
  const avgRam = activeServer?.ram_usage || (servers.length
    ? Math.round(servers.reduce((s, sv) => s + (sv.ram_usage || 0), 0) / servers.length) : 0);
  const avgDisk = activeServer?.disk_usage || (servers.length
    ? Math.round(servers.reduce((s, sv) => s + (sv.disk_usage || 0), 0) / servers.length) : 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-[#1e293b] border border-white/10 rounded-xl p-3 text-xs">
        <p className="text-slate-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}%</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Monitoring" description="Surveillez les performances de vos serveurs en temps réel" />

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

      {/* Gauges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Cpu} label="CPU" value={`${avgCpu}%`} color="indigo" />
        <StatCard icon={HardDrive} label="RAM" value={`${avgRam}%`} color="emerald" />
        <StatCard icon={HardDrive} label="Disque" value={`${avgDisk}%`} color="amber" />
        <StatCard icon={Wifi} label="Réseau" value="45 Mb/s" color="cyan" />
      </div>

      {/* CPU Chart */}
      <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Utilisation CPU (24h)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#475569" fontSize={11} />
              <YAxis stroke="#475569" fontSize={11} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="cpu" name="CPU" stroke="#6366f1" fill="url(#cpuGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RAM + Disk Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">RAM (24h)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="ramGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} domain={[0, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="ram" name="RAM" stroke="#10b981" fill="url(#ramGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Réseau (24h)</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="network" name="Réseau" stroke="#06b6d4" fill="url(#netGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gauges section */}
      <div className="bg-[#111827] border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-6">Vue d'ensemble</h3>
        <div className="flex items-center justify-around flex-wrap gap-6">
          <UsageGauge label="CPU" value={avgCpu} color="#6366f1" />
          <UsageGauge label="RAM" value={avgRam} color="#10b981" />
          <UsageGauge label="Disque" value={avgDisk} color="#f59e0b" />
          <UsageGauge label="Réseau" value={45} color="#06b6d4" />
        </div>
      </div>
    </div>
  );
}