import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Brain, FileText, Code, Search, Globe, ToggleLeft, ToggleRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";

const categoryIcons = {
  file: FileText,
  code: Code,
  analysis: Search,
  api: Globe,
};

const DEFAULT_TOOLS = [
  { name: "read_file", description: "Lire le contenu d'un fichier", category: "file", enabled: true },
  { name: "write_file", description: "Écrire du contenu dans un fichier", category: "file", enabled: true },
  { name: "list_files", description: "Lister les fichiers d'un répertoire", category: "file", enabled: true },
  { name: "generate_code", description: "Générer du code avec l'IA", category: "code", enabled: true },
  { name: "analyze_project", description: "Analyser la structure d'un projet", category: "analysis", enabled: true },
  { name: "call_api", description: "Appeler une API externe", category: "api", enabled: false },
  { name: "analyze_logs", description: "Analyser les logs du système", category: "analysis", enabled: true },
];

export default function AITools() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", category: "file", enabled: true });
  const queryClient = useQueryClient();

  const { data: tools = [], isLoading } = useQuery({
    queryKey: ["ai-tools"],
    queryFn: () => base44.entities.AITool.list(),
  });

  const createMutation = useMutation({
    mutationFn: data => base44.entities.AITool.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-tools"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AITool.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-tools"] }),
  });

  const initDefaultTools = async () => {
    for (const tool of DEFAULT_TOOLS) {
      await createMutation.mutateAsync(tool);
    }
  };

  const displayTools = tools.length > 0 ? tools : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outils IA"
        description="Configurez les outils disponibles pour l'agent IA"
        action={tools.length === 0 ? "Initialiser les outils" : "Ajouter un outil"}
        icon={tools.length === 0 ? Brain : Plus}
        onAction={tools.length === 0 ? initDefaultTools : () => { setForm({ name: "", description: "", category: "file", enabled: true }); setShowForm(true); }}
      />

      {displayTools.length === 0 && !isLoading ? (
        <EmptyState icon={Brain} title="Aucun outil IA"
          description="Initialisez les outils par défaut ou ajoutez-en manuellement."
          action="Initialiser" onAction={initDefaultTools} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayTools.map(tool => {
            const IconComp = categoryIcons[tool.category] || Brain;
            return (
              <div key={tool.id} className="bg-[#111827] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <IconComp className="h-5 w-5 text-violet-400" />
                  </div>
                  <Switch
                    checked={tool.enabled}
                    onCheckedChange={(v) => updateMutation.mutate({ id: tool.id, data: { enabled: v } })}
                  />
                </div>
                <h3 className="text-sm font-semibold text-white font-mono">{tool.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{tool.description}</p>
                <div className="mt-3">
                  <span className="text-[10px] uppercase text-slate-500 bg-white/5 px-2 py-0.5 rounded-md">
                    {tool.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-[#111827] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Ajouter un outil IA</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-300 text-xs">Nom de la fonction</Label>
              <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="bg-white/5 border-white/10 text-white mt-1 font-mono" placeholder="my_tool" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Description</Label>
              <Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className="bg-white/5 border-white/10 text-white mt-1 h-20" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Catégorie</Label>
              <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-white/10">
                  <SelectItem value="file" className="text-white">Fichier</SelectItem>
                  <SelectItem value="code" className="text-white">Code</SelectItem>
                  <SelectItem value="analysis" className="text-white">Analyse</SelectItem>
                  <SelectItem value="api" className="text-white">API</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">Annuler</Button>
            <Button onClick={async () => { await createMutation.mutateAsync(form); setShowForm(false); }}
              disabled={!form.name} className="bg-indigo-600 hover:bg-indigo-500 text-white">Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}