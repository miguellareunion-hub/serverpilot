import React from "react";

const statusStyles = {
  online: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  offline: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  unknown: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  running: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  stopped: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  installing: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  deploying: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  error: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  installed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  not_installed: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  checking: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  updating: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  in_progress: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  failed: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  info: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const statusLabels = {
  online: "En ligne",
  offline: "Hors ligne",
  unknown: "Inconnu",
  running: "En cours",
  stopped: "Arrêté",
  installing: "Installation",
  deploying: "Déploiement",
  error: "Erreur",
  installed: "Installé",
  not_installed: "Non installé",
  checking: "Vérification",
  updating: "Mise à jour",
  pending: "En attente",
  in_progress: "En cours",
  completed: "Terminé",
  failed: "Échoué",
  info: "Info",
  warning: "Attention",
  success: "Succès",
};

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || statusStyles.unknown;
  const label = statusLabels[status] || status;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}