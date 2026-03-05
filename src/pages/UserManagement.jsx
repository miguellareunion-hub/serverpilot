import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, UserPlus, Shield, User, Mail, CalendarDays } from "lucide-react";
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
    if (!email) return;
    setInviting(true);
    await base44.users.inviteUser(email, role);
    toast.success(`Invitation envoyée à ${email}`);
    setEmail("");
    setRole("user");
    setShowInvite(false);
    setInviting(false);
    refetch();
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Utilisateurs" description="Gérez les accès à la plateforme"
        action="Inviter un utilisateur" icon={UserPlus} onAction={() => setShowInvite(true)} />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total</p>
          <p className="text-2xl font-bold text-white">{users.length}</p>
        </div>
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Admins</p>
          <p className="text-2xl font-bold text-indigo-400">{users.filter(u => u.role === "admin").length}</p>
        </div>
        <div className="bg-[#111827] border border-white/5 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Utilisateurs</p>
          <p className="text-2xl font-bold text-slate-300">{users.filter(u => u.role !== "admin").length}</p>
        </div>
      </div>

      {users.length === 0 && !isLoading ? (
        <EmptyState icon={Users} title="Aucun utilisateur" description="Invitez le premier utilisateur."
          action="Inviter" onAction={() => setShowInvite(true)} />
      ) : (
        <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Utilisateur</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase">Rôle</th>
                  <th className="text-left p-4 text-xs font-medium text-slate-500 uppercase hidden md:table-cell">Inscrit le</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
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
                    <td className="p-4 text-sm text-slate-400 hidden md:table-cell">
                      {user.created_date ? new Date(user.created_date).toLocaleDateString("fr-FR") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="bg-[#111827] border-white/10 text-white max-w-sm">
          <DialogHeader><DialogTitle className="text-white">Inviter un utilisateur</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Email *</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} type="email"
                className="bg-white/5 border-white/10 text-white" placeholder="user@example.com" />
            </div>
            <div>
              <Label className="text-slate-300 text-xs mb-1 block">Rôle</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1e293b] border-white/10">
                  <SelectItem value="user" className="text-white">Utilisateur</SelectItem>
                  <SelectItem value="admin" className="text-white">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowInvite(false)} className="text-slate-400">Annuler</Button>
            <Button onClick={handleInvite} disabled={inviting || !email}
              className="bg-indigo-600 hover:bg-indigo-500 text-white">
              {inviting ? "Envoi..." : "Envoyer l'invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}