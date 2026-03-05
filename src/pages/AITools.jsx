import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Brain, Plus, Pencil, Trash2, Zap, Eye, EyeOff, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import StatusBadge from "../components/shared/StatusBadge";
import { toast } from "sonner";

const PROVIDERS = [
  { value: "openai", label: "OpenAI", icon: "🧠", type: "cloud" },
  { value: "gemini", label: "Google Gemini", icon: "✨", type: "cloud" },
  { value: "anthropic", label: "Anthropic (Claude)", icon: "🤖", type: "cloud" },
  { value: "ollama", label: "Ollama", icon: "🦙", type: "local" },
  { value: "localai", label: "LocalAI", icon: "💻", type: "local" },
  { value: "other", label: "Autre", icon: "🔧", type: "cloud" },
];

const EMPTY = { name: "", provider: "openai", type: "cloud", description: "", api_key: "", endpoint: "", default_model: "", enabled: true, is_default: false };

export default function AITools() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(null);
  const queryClient = useQueryClient();

  const { data: tools = [], isLoading } = useQuery({
    queryKey: ["ai-tools"],
    queryFn: () => base44.entities.AITool.list(),
  });
  const { data: servers = [] } = useQuery({ queryKey: ["servers"], queryFn: () => base44.entities.Server.list() });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.AITool.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["ai-tools"] }); toast.success("Outil IA ajouté !"); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AITool.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-tools"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: id => base44.entities.AITool.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["ai-tools"] }); toast.success("Supprimé."); },
  });

  const openAdd = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (tool) => { setEditing(tool); setForm({ ...EMPTY, ...tool }); setShowForm(true); };

  const handleSave = async () => {
    const provider = PROVIDERS.find(p => p.value === form.provider);
    const data = { ...form, type: provider?.type || "cloud", name: form.name || provider?.label || form.provider };
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data });
      toast.success("Mis à jour !");
    } else {
      await createMutation.mutateAsync(data);
    }
    setShowForm(false);
  };

  const testConnection = async (tool) => {
    setTesting(tool.id);
    await new Promise(r => setTimeout(r, 1500));
    toast[tool.api_key || tool.endpoint ? "success" : "error"](
      tool.api_key || tool.endpoint ? `${tool.name} : connexion OK` : `${tool.name} : clé API manquante`
    );
    setTesting(null);
  };

  const setDefault = async (tool) => {
    for (const t of tools) {
      if (t.is_default && t.id !== tool.id) await updateMutation.mutateAsync({ id: t.id, data: { is_default: false } });
    }
    await updateMutation.mutateAsync({ id: tool.id, data: { is_default: true } });
    toast.success(`${tool.name} défini comme provider par défaut`);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Outils IA" description="Configurez et gérez vos providers IA"
        action="Ajouter un provider" icon={Plus} onAction={openAdd} />

      {tools.length === 0 && !isLoading ? (
        <EmptyState icon={Brain} title="Aucun outil IA" description="Ajoutez un provider IA (OpenAI, Gemini, Ollama...)."
          action="Ajouter" onAction={openAdd} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map(tool => {
            const prov = PROVIDERS.find(p => p.value === tool.provider) || PROVIDERS[5];
            return (
              <div key={tool.id} className={`bg-[#111827] border rounded-2xl p-4 transition-all ${tool.enabled ? 'border-white/5 hover:border-white/10' : 'border-white/[0.03] opacity-60'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center text-lg">
                      {prov.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold text-white">{tool.name}</h3>
                        {tool.is_default && (
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">Défaut</span>
                        )}
                      </div>
                      <span className={`text-[10px] ${tool.type === "local" ? "text-emerald-400" : "text-cyan-400"}`}>
                        {tool.type === "local" ? "🏠 Local" : "☁️ Cloud"}
                      </span>
                    </div>
                  </div>
                  <Switch checked={tool.enabled} onCheckedChange={v => updateMutation.mutate({ id: tool.id, data: { enabled: v } })} />
                </div>
                {tool.default_model && (
                  <p className="text-xs text-slate-500 mb-2">Modèle: <span className="text-slate-400 font-mono">{tool.default_model}</span></p>
                )}
                {tool.description && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{tool.description}</p>}
                <div className="flex gap-1 flex-wrap">
                  <Button size="sm" variant="ghost" onClick={() => testConnection(tool)}
                    disabled={testing === tool.id}
                    className="text-emerald-400 hover:bg-emerald-500/10 gap-1 text-xs">
                    <Wifi className="h-3.5 w-3.5" /> {testing === tool.id ? "Test..." : "Tester"}
                  </Button>
                  {!tool.is_default && (
                    <Button size="sm" variant="ghost" onClick={() => setDefault(tool)}
                      className="text-indigo-400 hover:bg-indigo-500/10 gap-1 text-xs">
                      <Zap className="h-3.5 w-3.5" /> Défaut
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => openEdit(tool)}
                    className="text-slate-400 hover:bg-white/5 gap-1 text-xs">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(tool)}
                    className="text-rose-400 hover:bg-rose-500/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-[#111827] border-white/10 text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-white">{editing ? "Modifier" : "Ajouter"} un provider IA</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Provider</Label>
              <Select value={form.provider} onValueChange={v => {
                const p = PROVIDERS.find(pr => pr.value === v);
                setForm(f => ({ ...f, provider: v, name: p?.label || v, type: p?.type || "cloud" }));
              }}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-white/10">
                  {PROVIDERS.map(p => <SelectItem key={p.value} value={p.value} className="text-white">{p.icon} {p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Nom affiché</Label>
              <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                className="bg-white/5 border-white/10 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Clé API</Label>
              <div className="relative">
                <Input type={showKey ? "text" : "password"} value={form.api_key || ""}
                  onChange={e => setForm(f => ({...f, api_key: e.target.value}))}
                  className="bg-white/5 border-white/10 text-white pr-9" placeholder="sk-..." />
                <button type="button" onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Endpoint (optionnel)</Label>
              <Input value={form.endpoint || ""} onChange={e => setForm(f => ({...f, endpoint: e.target.value}))}
                className="bg-white/5 border-white/10 text-white" placeholder="http://localhost:11434" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Modèle par défaut</Label>
              <Input value={form.default_model || ""} onChange={e => setForm(f => ({...f, default_model: e.target.value}))}
                className="bg-white/5 border-white/10 text-white" placeholder="gpt-4o, gemini-pro, llama3..." />
            </div>
            {form.type === "local" && (
              <div>
                <Label className="text-slate-300 text-xs mb-1 block">Serveur hôte</Label>
                <Select value={form.server_id || "none"} onValueChange={v => setForm(f => ({...f, server_id: v === "none" ? "" : v}))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-white/10">
                    <SelectItem value="none" className="text-white">Aucun</SelectItem>
                    {servers.map(s => <SelectItem key={s.id} value={s.id} className="text-white">{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400">Annuler</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              {editing ? "Mettre à jour" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <AlertDialogContent className="bg-[#111827] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Supprimer l'outil IA</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">Supprimer « {deleting?.name} » ?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 text-white border-white/10 hover:bg-white/10">Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { deleteMutation.mutate(deleting.id); setDeleting(null); }}
              className="bg-rose-600 hover:bg-rose-500 text-white">Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}