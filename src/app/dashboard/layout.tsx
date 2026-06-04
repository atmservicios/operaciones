"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Cpu, LayoutDashboard, ClipboardList, Monitor, Users, MapPin,
  Package, FileText, FolderOpen, BarChart3, ScrollText, Settings,
  Bell, Search, ChevronDown, LogOut, Menu, X, Circle, Zap, CalendarDays,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Rol = 'administrador' | 'supervisor' | 'operaria';

interface UserProfile {
  nombre: string;
  correo: string;
  rol: Rol;
}

// Menú completo con restricciones por rol
const navItems = [
  { href: "/dashboard",              icon: LayoutDashboard, label: "Dashboard",           badge: null,  roles: ['administrador','supervisor','operaria'] },
  { href: "/dashboard/coordinacion", icon: CalendarDays,    label: "Coordinación",        badge: null,  roles: ['administrador','supervisor','operaria'] },
  { href: "/dashboard/technicians",  icon: Users,           label: "Técnicos",            badge: null,  roles: ['administrador','supervisor','operaria'] },
  { href: "/dashboard/atms",         icon: Monitor,         label: "Cajeros ATM",         badge: null,  roles: ['administrador','supervisor'] },
  { href: "/dashboard/reports",      icon: FileText,        label: "Informes Técnicos",   badge: null,  roles: ['administrador','supervisor','operaria'] },
  { href: "/dashboard/orders",       icon: ClipboardList,   label: "Órdenes de Trabajo",  badge: null,  roles: ['administrador','supervisor'] },
  { href: "/dashboard/map",          icon: MapPin,          label: "Mapa Operacional",    badge: null,  roles: ['administrador','supervisor'] },
  { href: "/dashboard/inventory",    icon: Package,         label: "Inventario",          badge: null,  roles: ['administrador','supervisor'] },
  { href: "/dashboard/documents",    icon: FolderOpen,      label: "Documentos",          badge: null,  roles: ['administrador','supervisor'] },
  { href: "/dashboard/executive",    icon: BarChart3,       label: "Reportes Ejecutivos", badge: null,  roles: ['administrador'] },
  { href: "/dashboard/audit",        icon: ScrollText,      label: "Auditoría",           badge: null,  roles: ['administrador'] },
  { href: "/dashboard/settings",     icon: Settings,        label: "Configuración",       badge: null,  roles: ['administrador'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, unread: true, color: "#ef4444", title: "SLA Vencido — OT-2025-1840", time: "hace 2h", sub: "Banco de Chile — Antofagasta" },
    { id: 2, unread: true, color: "#f59e0b", title: "Stock bajo: Router Mikrotik", time: "hace 3h", sub: "Solo 2 unidades disponibles" },
    { id: 3, unread: true, color: "#ef4444", title: "ATM fuera de servicio", time: "hace 4h", sub: "BE-IQUI-001 — Iquique" },
    { id: 4, unread: true, color: "#72b01d", title: "OT-2025-1844 Finalizada", time: "ayer", sub: "Carlos Muñoz — Banco Itaú" },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n));
  };

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from('profiles')
        .select('nombre, correo, rol')
        .eq('id', user.id)
        .single();

      if (data) setProfile(data as UserProfile);
    };
    loadProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Filtrar menú según el rol del usuario
  const visibleNav = profile
    ? navItems.filter(item => item.roles.includes(profile.rol))
    : [];

  const currentPage = navItems.find((n) => pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href)));

  // Iniciales del nombre
  const initiales = profile?.nombre
    ? profile.nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : "U";

  const rolLabel = profile?.rol === 'administrador' ? 'Administrador'
    : profile?.rol === 'supervisor' ? 'Supervisor'
    : 'Operaria';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#121418" }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative z-50 lg:z-auto flex flex-col h-full transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ width: "240px", background: "linear-gradient(180deg, #1b1e24 0%, #121418 100%)", borderRight: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <Link href="/dashboard" className="flex items-center gap-3">
            <img src="/Imagen1.jpg" alt="OpsATM Logo" style={{ height: "36px", width: "auto", objectFit: "contain", borderRadius: "4px" }} />
            <div>
              <div className="font-bold text-sm" style={{ color: "#f1f5f9" }}>OpsATM</div>
              <div className="text-[10px] font-semibold" style={{ color: "#72b01d" }}>v2025.1</div>
            </div>
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)} style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {/* Live status */}
        <div className="mx-4 mt-4 p-3 rounded-lg flex items-center gap-2" style={{ background: "rgba(114,176,29,0.08)", border: "1px solid rgba(114,176,29,0.15)" }}>
          <div className="w-2 h-2 rounded-full bg-brand-500 pulse-live" style={{ color: "#72b01d" }} />
          <span style={{ color: "#93c947", fontSize: "11px", fontWeight: 600 }}>SISTEMA EN LÍNEA</span>
          <Zap size={11} style={{ color: "#72b01d", marginLeft: "auto" }} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 mt-2">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", minWidth: "20px", textAlign: "center" }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-3">
            <div className="tech-avatar w-9 h-9 text-sm">
              {initiales}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: "#e2e8f0" }}>{profile?.nombre ?? "Cargando..."}</div>
              <div className="text-xs truncate" style={{ color: "#475569" }}>{rolLabel}</div>
            </div>
            <button onClick={handleLogout} title="Cerrar sesión" style={{ color: "#475569", background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-3 flex-shrink-0 relative z-50" style={{ background: "rgba(27,30,36,0.95)", borderBottom: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-4">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)} style={{ color: "#64748b", background: "none", border: "none", cursor: "pointer" }}>
              <Menu size={20} />
            </button>
            <div>
              <h1 className="font-bold text-base" style={{ color: "#f1f5f9" }}>{currentPage?.label ?? "Dashboard"}</h1>
              <p style={{ color: "#475569", fontSize: "12px" }}>
                {new Date().toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", width: "220px" }}>
              <Search size={14} style={{ color: "#475569" }} />
              <input placeholder="Buscar OT, ATM, técnico…" style={{ background: "transparent", border: "none", outline: "none", color: "#94a3b8", fontSize: "13px", width: "100%", fontFamily: "inherit" }} />
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                id="notif-btn"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative flex items-center justify-center w-9 h-9 rounded-lg"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", color: "#94a3b8" }}
              >
                <Bell size={16} />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-12 w-80 rounded-xl shadow-2xl z-50 overflow-hidden" style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <div className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>Notificaciones</div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => setNotifications(prev => prev.map(n => ({ ...n, unread: false })))}
                        className="text-xs"
                        style={{ color: "#72b01d", background: "none", border: "none", cursor: "pointer" }}
                      >
                        Marcar todas leídas
                      </button>
                    )}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`p-3 cursor-pointer transition-colors ${n.unread ? "bg-white/5 hover:bg-white/10" : "hover:bg-white/5"}`}
                        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                      >
                        <div className="flex items-start gap-3">
                          <Circle size={8} style={{ color: n.unread ? n.color : "#475569", flexShrink: 0, marginTop: 5 }} fill={n.unread ? n.color : "transparent"} />
                          <div className={n.unread ? "opacity-100" : "opacity-60"}>
                            <div className="text-xs font-semibold" style={{ color: "#e2e8f0" }}>{n.title}</div>
                            <div className="text-xs" style={{ color: "#475569" }}>{n.sub}</div>
                          </div>
                          <span className={`text-[10px] ml-auto flex-shrink-0 ${n.unread ? "font-bold" : ""}`} style={{ color: n.unread ? "#94a3b8" : "#334155" }}>{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User dropdown */}
            <div className="relative">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition-colors hover:bg-white/5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="tech-avatar" style={{ width: 26, height: 26, fontSize: 11 }}>
                  {initiales}
                </div>
                <span style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 500 }}>{profile?.nombre?.split(' ')[0] ?? ''}</span>
                <ChevronDown size={13} style={{ color: "#475569" }} />
              </div>

              {userMenuOpen && (
                <div className="absolute right-0 top-12 w-56 rounded-xl shadow-2xl z-50 overflow-hidden" style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="p-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <div className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>{profile?.nombre}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#475569" }}>{profile?.correo}</div>
                    <div className="mt-2 inline-flex px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(114,176,29,0.15)", color: "#93c947" }}>
                      {rolLabel}
                    </div>
                  </div>
                  <div className="p-1">
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-white/5 transition-colors"
                      style={{ color: "#94a3b8", display: "flex" }}
                    >
                      <Settings size={14} />
                      Cambiar contraseña
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-white/5 transition-colors text-red-400"
                    >
                      <LogOut size={14} />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 page-fade">
          {children}
        </main>
      </div>
    </div>
  );
}
