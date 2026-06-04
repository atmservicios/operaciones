"use client";

import { useState, useEffect } from "react";
import { Save, Bell, Shield, Database, Mail, Globe, Palette, User, Key, Lock } from "lucide-react";

const tabs = [
  { id: "general", label: "General", icon: Globe },
  { id: "notifications", label: "Notificaciones", icon: Bell },
  { id: "security", label: "Seguridad", icon: Shield },
  { id: "integrations", label: "Integraciones", icon: Database },
  { id: "email", label: "Correos", icon: Mail },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);
  const [userRole, setUserRole] = useState("Usuario");

  const [formData, setFormData] = useState({
    nombre: "OpsATM",
    empresa: "OpsATM Chile SpA",
    correo: "contacto@opsatm.cl",
    zona: "America/Santiago (CLT)",
    formato: "DD/MM/YYYY",
    sla_1: "4",
    sla_2: "8",
    sla_3: "24",
    sla_4: "72"
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("opsatm_user");
    if (storedUser) {
      setUserRole(JSON.parse(storedUser).role);
    }
    const storedSettings = localStorage.getItem("opsatm_settings");
    if (storedSettings) {
      setFormData(JSON.parse(storedSettings));
    }
  }, []);

  const isAdmin = userRole === "Administrador";

  const handleSave = () => {
    if (!isAdmin) return;
    localStorage.setItem("opsatm_settings", JSON.stringify(formData));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChange = (field: string, value: string) => {
    if (!isAdmin) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Configuración</h2>
          <p className="section-subtitle">Ajustes del sistema y preferencias</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={!isAdmin}
          className="btn-primary" 
          style={{
            background: saved ? "linear-gradient(135deg, #72b01d, #578814)" : "",
            opacity: isAdmin ? 1 : 0.5,
            cursor: isAdmin ? "pointer" : "not-allowed"
          }}
        >
          {saved ? (
            <><Save size={16} /> ¡Guardado!</>
          ) : !isAdmin ? (
            <><Lock size={16} /> Solo Administrador</>
          ) : (
            <><Save size={16} /> Guardar cambios</>
          )}
        </button>
      </div>

      {!isAdmin && (
        <div className="p-4 rounded-xl flex items-center gap-3" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <Lock size={18} style={{ color: "#ef4444" }} />
          <div>
            <div className="text-sm font-bold" style={{ color: "#f87171" }}>Acceso Restringido</div>
            <div className="text-xs" style={{ color: "#fca5a5" }}>Tu perfil actual ({userRole}) no tiene permisos para modificar la configuración. Cambia a Administrador.</div>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`sidebar-link w-full ${activeTab === t.id ? "active" : ""}`}
                style={{ justifyContent: "flex-start" }}>
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {activeTab === "general" && (
            <>
              <div className="glass-card p-6">
                <h3 className="font-bold mb-4" style={{ color: "#f1f5f9" }}>Información de la Empresa</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Nombre del sistema</label>
                      <input className="ops-input" value={formData.nombre} onChange={(e) => handleChange("nombre", e.target.value)} disabled={!isAdmin} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Empresa</label>
                      <input className="ops-input" value={formData.empresa} onChange={(e) => handleChange("empresa", e.target.value)} disabled={!isAdmin} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Correo de contacto</label>
                    <input className="ops-input" value={formData.correo} onChange={(e) => handleChange("correo", e.target.value)} disabled={!isAdmin} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Zona horaria</label>
                      <select className="ops-select w-full" value={formData.zona} onChange={(e) => handleChange("zona", e.target.value)} disabled={!isAdmin}>
                        <option>America/Santiago (CLT)</option>
                        <option>America/Punta_Arenas (CLT-3)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Formato de fecha</label>
                      <select className="ops-select w-full" value={formData.formato} onChange={(e) => handleChange("formato", e.target.value)} disabled={!isAdmin}>
                        <option>DD/MM/YYYY</option>
                        <option>YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="font-bold mb-4" style={{ color: "#f1f5f9" }}>SLA y Plazos</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "SLA urgente (horas)", field: "sla_1" },
                    { label: "SLA alta prioridad (horas)", field: "sla_2" },
                    { label: "SLA media prioridad (horas)", field: "sla_3" },
                    { label: "SLA baja prioridad (horas)", field: "sla_4" },
                  ].map((f) => (
                    <div key={f.label}>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>{f.label}</label>
                      <input type="number" className="ops-input" value={formData[f.field as keyof typeof formData]} onChange={(e) => handleChange(f.field, e.target.value)} disabled={!isAdmin} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "notifications" && (
            <div className="glass-card p-6">
              <h3 className="font-bold mb-4" style={{ color: "#f1f5f9" }}>Alertas y Notificaciones</h3>
              <div className="space-y-4">
                {[
                  { label: "SLA vencido", sub: "Alerta cuando una OT supera el plazo", enabled: true },
                  { label: "ATM fuera de servicio", sub: "Notificación inmediata ante falla de ATM", enabled: true },
                  { label: "Stock bajo", sub: "Cuando inventario cae bajo el mínimo", enabled: true },
                  { label: "Técnico sin asignar", sub: "Órdenes creadas sin técnico por más de 1h", enabled: false },
                  { label: "Resumen diario", sub: "Email con resumen de operaciones a las 8:00", enabled: true },
                ].map((n) => (
                  <div key={n.label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>{n.label}</div>
                      <div className="text-xs" style={{ color: "#475569" }}>{n.sub}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={n.enabled} className="sr-only peer" />
                      <div className="w-9 h-5 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-all" style={{ background: n.enabled ? "#72b01d" : "rgba(255,255,255,0.1)" }} />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold mb-4" style={{ color: "#f1f5f9" }}>Seguridad y Accesos</h3>
              {[
                { label: "Autenticación de dos factores (MFA)", sub: "Requiere código adicional al iniciar sesión", icon: Shield, enabled: false },
                { label: "Sesión automática (minutos de inactividad)", sub: "Cierra sesión automáticamente", icon: Key, enabled: true, input: "30" },
                { label: "Log de accesos", sub: "Registra todos los inicios de sesión", icon: Shield, enabled: true },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-3">
                    <s.icon size={16} style={{ color: "#72b01d" }} />
                    <div>
                      <div className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>{s.label}</div>
                      <div className="text-xs" style={{ color: "#475569" }}>{s.sub}</div>
                    </div>
                  </div>
                  {s.input ? (
                    <input type="number" className="ops-input w-20 text-right" defaultValue={s.input} />
                  ) : (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={s.enabled} className="sr-only peer" />
                      <div className="w-9 h-5 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-all" style={{ background: s.enabled ? "#72b01d" : "rgba(255,255,255,0.1)" }} />
                    </label>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="glass-card p-6 space-y-4">
              <h3 className="font-bold mb-4" style={{ color: "#f1f5f9" }}>Integraciones</h3>
              {[
                { name: "Supabase", status: "pending", icon: "🗄️", desc: "Base de datos PostgreSQL + Auth + Storage", inputLabel: "URL del Proyecto", inputPlaceholder: "https://xxxx.supabase.co" },
                { name: "Google Maps API", status: "pending", icon: "🗺️", desc: "Mapas operacionales y geolocalización", inputLabel: "API Key", inputPlaceholder: "AIzaSy…" },
                { name: "Resend", status: "pending", icon: "📧", desc: "Envío de correos automáticos transaccionales", inputLabel: "API Key", inputPlaceholder: "re_…" },
              ].map((int) => (
                <div key={int.name} className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <span style={{ fontSize: 24 }}>{int.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold" style={{ color: "#f1f5f9" }}>{int.name}</div>
                      <div className="text-xs" style={{ color: "#475569" }}>{int.desc}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                      Pendiente
                    </span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#64748b" }}>{int.inputLabel}</label>
                    <input className="ops-input" placeholder={int.inputPlaceholder} type="password" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "email" && (
            <div className="glass-card p-6">
              <h3 className="font-bold mb-4" style={{ color: "#f1f5f9" }}>Plantillas de Correo</h3>
              <div className="space-y-3">
                {[
                  "Informe técnico al cliente",
                  "Confirmación de retiro de equipo",
                  "Solicitud de visita inspectiva",
                  "Cotización de servicio",
                  "Evidencia fotográfica para cliente",
                  "Notificación de reprogramación",
                ].map((t) => (
                  <div key={t} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center gap-2">
                      <Mail size={14} style={{ color: "#72b01d" }} />
                      <span className="text-sm" style={{ color: "#e2e8f0" }}>{t}</span>
                    </div>
                    <button className="btn-secondary text-xs py-1 px-2.5">Editar plantilla</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
