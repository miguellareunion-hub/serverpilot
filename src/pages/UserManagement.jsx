import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, UserPlus, Pencil, Trash2, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import { toast } from "sonner";

export default function UserManagement() {
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [inviting, setInviting] = useState(false);

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: () => base44.entities.User.list(),
  });

  const handleInvite = async () => {
    setInviting(true);
    await base44.users.inviteUser(email, role);
    toast.success("Invitation envoyée !");
    setEmail("");
    setShowInvite(false);
    setInviting(false);
    refetch();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des utilisateurs"
        description="Gérez les accès à la plateforme"
        action="Inviter un utilisateur"
        icon={UserPlus}
        onAction={() => setShowInvite(true)}
      />

      {users.length === 0 && !isLoading ? (
        <EmptyState icon={Users} title="Aucun utilisateur" description="Invitez le premier utilisateur."
          action="Inviter" onAction={() => setShowInvite(true)} />
      ) : (
        <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Utilisateur</th>
                <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Rôle</th>
                <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Créé le</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                        {user.role === "admin" ? (
                          <Shield className="h-4 w-4 text-indigo-400" />
                        ) : (
                          <User className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{user.full_name || "—"}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      user.role === "admin"
                        ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
                        : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                    }`}>
                      {user.role === "admin" ? "Admin" : "Utilisateur"}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-400">
                    {user.created_date ? new Date(user.created_date).toLocaleDateString("fr-FR") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="bg-[#111827] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Inviter un utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-300 text-xs">Email</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white mt-1" placeholder="user@example.com" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs">Rôle</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-white/10">
                  <SelectItem value="user" className="text-white">Utilisateur</SelectItem>
                  <SelectItem value="admin" className="text-white">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowInvite(false)} className="text-slate-400 hover:text-white">Annuler</Button>
            <Button onClick={handleInvite} disabled={inviting || !email} className="bg-indigo-600 hover:bg-indigo-500 text-white">
              {inviting ? "Envoi..." : "Envoyer l'invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}