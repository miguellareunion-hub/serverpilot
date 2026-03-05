import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  LayoutDashboard, Server, FolderGit2, Package, Users, ScrollText,
  Brain, HardDrive, Archive, ChevronLeft, ChevronRight,
  Terminal, Menu, LogOut, Activity
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
  { name: "Serveurs", icon: Server, page: "Servers" },
  { name: "Projets", icon: FolderGit2, page: "Projects" },
  { name: "Dépendances", icon: Package, page: "Dependencies" },
  { name: "Monitoring", icon: Activity, page: "Monitoring" },
  { name: "Utilisateurs", icon: Users, page: "UserManagement" },
  { name: "Logs", icon: ScrollText, page: "Logs" },
  { name: "Outils IA", icon: Brain, page: "AITools" },
  { name: "Sauvegardes", icon: Archive, page: "Backups" },
  { name: "Installation", icon: Terminal, page: "InstallGuide" },
];

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="h-screen bg-[#0a0e1a] text-white flex overflow-hidden">
      <style>{`
        :root {
          --accent: #6366f1;
          --surface: #111827;
          --border: #1e293b;
        }
        * { scrollbar-width: thin; scrollbar-color: #334155 transparent; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
      `}</style>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative top-0 left-0 h-full z-50 flex-shrink-0
        bg-[#111827] border-r border-white/5
        transition-all duration-300 ease-in-out flex flex-col
        ${collapsed ? 'w-[68px]' : 'w-60'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className={`flex items-center h-14 px-3 border-b border-white/5 flex-shrink-0 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Terminal className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              ServerPanel
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.name : undefined}
                className={`
                  flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium
                  transition-all duration-150 group relative
                  ${isActive ? 'bg-indigo-500/15 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}
                  ${collapsed ? 'justify-center' : ''}
                `}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-indigo-400 rounded-r" />}
                <item.icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse button */}
        <div className="hidden lg:flex p-2 border-t border-white/5 flex-shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-2.5 py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all text-xs"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Réduire</span></>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-white/5 bg-[#111827]/80 backdrop-blur flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-semibold text-white">
              {navItems.find(n => n.page === currentPageName)?.name || currentPageName}
            </h1>
          </div>
          <Button
            variant="ghost" size="sm"
            onClick={() => base44.auth.logout()}
            className="text-slate-400 hover:text-white hover:bg-white/5 gap-2 text-xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Déconnexion</span>
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}