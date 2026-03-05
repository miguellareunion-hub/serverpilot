import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ScrollText, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "../components/shared/StatusBadge";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";

export default function Logs() {
  const [levelFilter, setLevelFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["logs"],
    queryFn: () => base44.entities.LogEntry.list("-created_date", 100),
  });

  const filtered = logs.filter(log => {
    const levelOk = levelFilter === "all" || log.level === levelFilter;
    const catOk = categoryFilter === "all" || log.category === categoryFilter;
    return levelOk && catOk;
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Logs système" description="Consultez l'historique d'activité de la plateforme" />

      <div className="flex flex-wrap gap-3">
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-40 bg-[#111827] border-white/10 text-white">
            <SelectValue placeholder="Niveau" />
          </SelectTrigger>
          <SelectContent className="bg-[#1e293b] border-white/10">
            <SelectItem value="all" className="text-white">Tous les niveaux</SelectItem>
            <SelectItem value="info" className="text-white">Info</SelectItem>
            <SelectItem value="warning" className="text-white">Warning</SelectItem>
            <SelectItem value="error" className="text-white">Erreur</SelectItem>
            <SelectItem value="success" className="text-white">Succès</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40 bg-[#111827] border-white/10 text-white">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent className="bg-[#1e293b] border-white/10">
            <SelectItem value="all" className="text-white">Toutes</SelectItem>
            <SelectItem value="server" className="text-white">Serveur</SelectItem>
            <SelectItem value="project" className="text-white">Projet</SelectItem>
            <SelectItem value="user" className="text-white">Utilisateur</SelectItem>
            <SelectItem value="system" className="text-white">Système</SelectItem>
            <SelectItem value="installation" className="text-white">Installation</SelectItem>
            <SelectItem value="backup" className="text-white">Sauvegarde</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={ScrollText} title="Aucun log" description="Les logs apparaîtront ici une fois que des événements seront enregistrés." />
      ) : (
        <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Date</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Niveau</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Catégorie</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Message</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => (
                  <tr key={log.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="p-4 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(log.created_date).toLocaleString("fr-FR")}
                    </td>
                    <td className="p-4"><StatusBadge status={log.level} /></td>
                    <td className="p-4">
                      <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded-md">
                        {log.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-white">{log.message}</p>
                      {log.details && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{log.details}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}