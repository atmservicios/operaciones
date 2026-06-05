"use client";

import { useState, useEffect } from "react";
import {
  Search, Phone, Mail, MapPin, Award, X, TrendingUp, Clock,
  CheckCircle2, Plus, Save, User, Truck,
} from "lucide-react";
import { mockTechnicians } from "@/lib/mock-data";
import { getStatusBg } from "@/lib/utils";
import type { Technician, TechnicianStatus } from "@/types";
import { supabase } from "@/lib/supabase";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";

const normalizeString = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();

const STATUS_OPTS: TechnicianStatus[] = ["disponible", "en ruta", "trabajando", "offline"];
const STATUS_COLOR: Record<TechnicianStatus, string> = {
  disponible: "#93c947", "en ruta": "#72b01d", trabajando: "#f59e0b", offline: "#64748b",
};

// ─── Add Technician Modal ───────────────────────────────────────────────────────
function AddTechModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (tech: Technician) => void;
}) {
  // supabase is imported at top level
  const [form, setForm] = useState({
    techNumber: "",
    name: "",
    rut: "",
    phone: "",
    email: "",
    region: "Metropolitana",
    vehicle: "",
    status: "disponible" as TechnicianStatus,
    certInput: "",
  });
  const [certifications, setCertifications] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const addCert = () => {
    const c = form.certInput.trim();
    if (c && !certifications.includes(c)) {
      setCertifications((prev) => [...prev, c]);
      setForm((f) => ({ ...f, certInput: "" }));
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "El nombre es obligatorio";
    if (!form.rut.trim()) e.rut = "El RUT es obligatorio";
    if (!form.phone.trim()) e.phone = "El teléfono es obligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const newId = `tech-${Date.now()}`;
    const newTech: Technician = {
      id: newId,
      techNumber: form.techNumber.trim(),
      name: form.name.trim(),
      rut: form.rut.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      region: form.region.trim(),
      vehicle: form.vehicle.trim(),
      certifications,
      status: form.status,
      completedOrders: 0,
      avgTime: 0,
      productivity: 0,
    };
    // Guardar en Supabase
    const { error: insertError } = await supabase.from('tecnicos').insert({
      id: newId,
      tech_number: newTech.techNumber,
      name: newTech.name,
      rut: newTech.rut,
      phone: newTech.phone,
      email: newTech.email,
      region: newTech.region,
      vehicle: newTech.vehicle,
      certifications: newTech.certifications,
      status: newTech.status,
      completed_orders: 0,
      avg_time: 0,
      productivity: 0,
    });
    if (insertError) {
      setSaveError('Error al guardar: ' + insertError.message);
      return;
    }
    setSaved(true);
    setTimeout(() => {
      onAdd(newTech);
      onClose();
    }, 900);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(27,30,36,0.95)",
    border: "1px solid rgba(255,255,255,0.09)",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13.5,
    color: "#e2e8f0",
    outline: "none",
    fontFamily: "inherit",
  };

  const errStyle: React.CSSProperties = { color: "#f87171", fontSize: 11, marginTop: 3 };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}>
      <div className="min-h-screen py-8 px-4 flex items-start justify-center">
        <div className="w-full max-w-xl rounded-2xl overflow-hidden" style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.08)" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: "1px solid rgba(114,176,29,0.12)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(114,176,29,0.12)" }}>
                <User size={18} style={{ color: "#72b01d" }} />
              </div>
              <div>
                <div className="font-bold text-lg" style={{ color: "#f1f5f9" }}>Agregar Técnico</div>
                <div className="text-xs" style={{ color: "#475569" }}>Completa los datos del nuevo técnico</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569" }}>
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-4">

            {/* Número y Nombre */}
            <div className="grid grid-cols-[100px_1fr] gap-3">
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  N° Asoc.
                </label>
                <input style={inputStyle} placeholder="Ej: 01" value={form.techNumber} onChange={set("techNumber")} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Nombre completo <span style={{ color: "#72b01d" }}>*</span>
                </label>
                <input style={inputStyle} placeholder="Ej: Juan Pérez González" value={form.name} onChange={set("name")} />
                {errors.name && <div style={errStyle}>{errors.name}</div>}
              </div>
            </div>

            {/* RUT / Teléfono */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  RUT <span style={{ color: "#72b01d" }}>*</span>
                </label>
                <input style={inputStyle} placeholder="Ej: 12.345.678-9" value={form.rut} onChange={set("rut")} />
                {errors.rut && <div style={errStyle}>{errors.rut}</div>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Teléfono <span style={{ color: "#72b01d" }}>*</span>
                </label>
                <input style={inputStyle} placeholder="Ej: 56944771425" value={form.phone} onChange={set("phone")} />
                {errors.phone && <div style={errStyle}>{errors.phone}</div>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                Correo electrónico
              </label>
              <input style={inputStyle} type="email" placeholder="nombre@atmservicios.cl" value={form.email} onChange={set("email")} />
            </div>

            {/* Región / Estado */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  <MapPin size={12} style={{ display: "inline", marginRight: 4 }} />Región
                </label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.region}
                  onChange={set("region")}
                >
                  {["Metropolitana","Valparaíso","Biobío","Tarapacá","Antofagasta","Araucanía","Los Lagos","O'Higgins","Maule","Ñuble","Los Ríos","Arica y Parinacota","Atacama","Coquimbo","Aysén","Magallanes"].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                  Estado inicial
                </label>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TechnicianStatus }))}
                >
                  {STATUS_OPTS.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vehículo */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                <Truck size={12} style={{ display: "inline", marginRight: 4 }} />Vehículo
              </label>
              <input style={inputStyle} placeholder="Ej: Camioneta Hilux TJ-4521" value={form.vehicle} onChange={set("vehicle")} />
            </div>

            {/* Certificaciones */}
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#94a3b8", marginBottom: 6 }}>
                <Award size={12} style={{ display: "inline", marginRight: 4 }} />Certificaciones
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  style={{ ...inputStyle, flex: 1 }}
                  placeholder="Ej: NCR Certificado"
                  value={form.certInput}
                  onChange={set("certInput")}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCert())}
                />
                <button
                  type="button"
                  onClick={addCert}
                  style={{ padding: "10px 16px", background: "rgba(114,176,29,0.15)", border: "1px solid rgba(114,176,29,0.3)", borderRadius: 8, color: "#72b01d", cursor: "pointer" }}
                >
                  <Plus size={16} />
                </button>
              </div>
              {certifications.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {certifications.map((c) => (
                    <span
                      key={c}
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(114,176,29,0.1)", border: "1px solid rgba(114,176,29,0.2)", color: "#93c947", borderRadius: 999, padding: "3px 10px", fontSize: 12 }}
                    >
                      {c}
                      <button
                        type="button"
                        onClick={() => setCertifications((prev) => prev.filter((x) => x !== c))}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#93c947", padding: 0, lineHeight: 1 }}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button onClick={onClose} className="btn-secondary text-sm">Cancelar</button>
              <button
                onClick={handleSave}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "10px 24px",
                  background: saved ? "#578814" : "linear-gradient(135deg, #72b01d, #578814)",
                  color: "white", borderRadius: 9, fontSize: 14, fontWeight: 700,
                  border: "none", cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(114,176,29,0.35)", fontFamily: "inherit",
                }}
              >
                {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                {saved ? "¡Guardado!" : "Guardar Técnico"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tech Detail Modal ─────────────────────────────────────────────────────────
function TechModal({ tech, onClose, onUpdateStatus }: { tech: Technician; onClose: () => void; onUpdateStatus: (id: string, s: TechnicianStatus) => void }) {
  const radarData = [
    { subject: "Productividad", value: tech.productivity },
    { subject: "Velocidad", value: tech.avgTime > 0 ? Math.min(100, Math.round(100 / tech.avgTime * 2)) : 0 },
    { subject: "Experiencia", value: Math.min(100, Math.round(tech.completedOrders / 3)) },
    { subject: "Disponib.", value: tech.status === "disponible" ? 100 : tech.status === "offline" ? 20 : 60 },
    { subject: "Calidad", value: Math.round(tech.productivity * 0.95) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold" style={{ background: "linear-gradient(135deg, #72b01d, #2d343f)", color: "white" }}>
              {tech.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>
                {tech.techNumber ? <span style={{ color: "#72b01d", marginRight: 8 }}>#{tech.techNumber}</span> : null}
                {tech.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <select
                  value={tech.status}
                  onChange={(e) => onUpdateStatus(tech.id, e.target.value as TechnicianStatus)}
                  className={`status-badge ${getStatusBg(tech.status)} outline-none cursor-pointer`}
                  style={{ 
                    border: "none", 
                    appearance: "none", 
                    paddingRight: "12px", // make room for dropdown arrow conceptually, though appearance:none removes it
                    textTransform: "capitalize"
                  }}
                >
                  <option value="disponible" className="bg-[#1b1e24] text-[#93c947]">Disponible</option>
                  <option value="en ruta" className="bg-[#1b1e24] text-[#72b01d]">En ruta</option>
                  <option value="trabajando" className="bg-[#1b1e24] text-[#f59e0b]">Trabajando</option>
                  <option value="offline" className="bg-[#1b1e24] text-[#64748b]">Offline</option>
                </select>
                <span className="text-xs" style={{ color: "#475569" }}>RUT: {tech.rut}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left col */}
            <div className="space-y-4">
              {/* Contact */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#475569" }}>Contacto</div>
                {[
                  { icon: Phone, value: tech.phone },
                  { icon: Mail, value: tech.email || "—" },
                  { icon: MapPin, value: tech.region },
                ].map(({ icon: Icon, value }) => (
                  <div key={value} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <Icon size={14} style={{ color: "#72b01d", flexShrink: 0 }} />
                    <span className="text-sm" style={{ color: "#e2e8f0" }}>{value}</span>
                  </div>
                ))}
                {tech.vehicle && (
                  <div className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
                    <TrendingUp size={14} style={{ color: "#72b01d" }} />
                    <span className="text-sm" style={{ color: "#e2e8f0" }}>{tech.vehicle}</span>
                  </div>
                )}
              </div>

              {/* KPIs */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#475569" }}>KPIs</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Coordinaciones", value: tech.completedOrders, color: "#72b01d", icon: CheckCircle2 },
                    { label: "Productividad", value: `${tech.productivity}%`, color: "#93c947", icon: TrendingUp },
                  ].map((k) => (
                    <div key={k.label} className="p-3 rounded-xl text-center" style={{ background: `${k.color}10`, border: `1px solid ${k.color}20` }}>
                      <k.icon size={16} style={{ color: k.color, margin: "0 auto 4px" }} />
                      <div className="text-lg font-bold" style={{ color: k.color }}>{k.value}</div>
                      <div className="text-xs" style={{ color: "#475569" }}>{k.label}</div>
                    </div>
                  ))}
                </div>

                {/* Productivity bar */}
                <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                  <div className="flex justify-between text-xs mb-2" style={{ color: "#64748b" }}>
                    <span>Productividad</span><span>{tech.productivity}%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-2 rounded-full" style={{ width: `${tech.productivity}%`, background: "linear-gradient(90deg, #72b01d, #93c947)", transition: "width 0.5s ease" }} />
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#475569" }}>Certificaciones</div>
                <div className="flex flex-wrap gap-2">
                  {tech.certifications.length > 0 ? tech.certifications.map((c) => (
                    <div key={c} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(114,176,29,0.1)", color: "#93c947", border: "1px solid rgba(114,176,29,0.2)" }}>
                      <Award size={11} /> {c}
                    </div>
                  )) : (
                    <span style={{ color: "#475569", fontSize: 13 }}>Sin certificaciones registradas</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right col — Radar */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#475569" }}>Perfil de Rendimiento</div>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <Radar name={tech.name} dataKey="value" stroke="#72b01d" fill="#72b01d" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tech Card ─────────────────────────────────────────────────────────────────
function TechCard({ tech, onClick }: { tech: Technician; onClick: () => void }) {
  return (
    <div className="glass-card-hover p-5 cursor-pointer" onClick={onClick}>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #72b01d, #2d343f)", color: "white" }}>
          {tech.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate" style={{ color: "#f1f5f9" }}>
            {tech.techNumber ? <span style={{ color: "#72b01d", marginRight: 6 }}>#{tech.techNumber}</span> : null}
            {tech.name}
          </div>
          <div className="text-xs truncate" style={{ color: "#475569" }}>{tech.rut}</div>
        </div>
        <span className={`status-badge text-xs ${getStatusBg(tech.status)}`}>{tech.status}</span>
      </div>

      {/* Contact info */}
      <div className="space-y-1 mb-3">
        <div className="flex items-center gap-2 text-xs" style={{ color: "#64748b" }}>
          <Phone size={11} style={{ color: "#72b01d", flexShrink: 0 }} />
          <span className="truncate">{tech.phone}</span>
        </div>
        {tech.email && (
          <div className="flex items-center gap-2 text-xs" style={{ color: "#64748b" }}>
            <Mail size={11} style={{ color: "#72b01d", flexShrink: 0 }} />
            <span className="truncate">{tech.email}</span>
          </div>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { label: "Coord.", value: tech.completedOrders, color: "#72b01d" },
          { label: "Produc.", value: `${tech.productivity}%`, color: "#93c947" },
        ].map((k) => (
          <div key={k.label} className="text-center p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="text-sm font-bold" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs" style={{ color: "#475569" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Productivity bar */}
      <div className="h-1.5 rounded-full mb-3" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-1.5 rounded-full" style={{ width: `${tech.productivity}%`, background: STATUS_COLOR[tech.status] }} />
      </div>

      {/* Certs */}
      <div className="flex flex-wrap gap-1">
        {tech.certifications.slice(0, 2).map((c) => (
          <span key={c} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(114,176,29,0.08)", color: "#93c947" }}>{c}</span>
        ))}
        {tech.certifications.length > 2 && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.04)", color: "#475569" }}>+{tech.certifications.length - 2}</span>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [coordinacionesCount, setCoordinacionesCount] = useState<Record<string, number>>({});
  const [loadingTechs, setLoadingTechs] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      // Cargar técnicos desde Supabase
      const { data: techData } = await supabase
        .from('tecnicos')
        .select('*')
        .order('tech_number', { ascending: true });
      if (techData) {
        setTechnicians(techData.map(t => ({
          id: t.id,
          techNumber: t.tech_number ?? '',
          name: t.name,
          rut: t.rut ?? '',
          phone: t.phone ?? '',
          email: t.email ?? '',
          region: t.region ?? '',
          vehicle: t.vehicle ?? '',
          certifications: t.certifications ?? [],
          status: t.status as TechnicianStatus,
          completedOrders: t.completed_orders ?? 0,
          avgTime: t.avg_time ?? 0,
          productivity: t.productivity ?? 0,
        })));
      }
      setLoadingTechs(false);

      // Cargar conteo de coordinaciones
      const { data: coordData } = await supabase.from('servicios').select('asignado_a');
      if (coordData) {
        const counts: Record<string, number> = {};
        coordData.forEach(row => {
          if (row.asignado_a) {
            const names = String(row.asignado_a).split(/[,\-]+/).map(normalizeString).filter(Boolean);
            names.forEach(name => { counts[name] = (counts[name] || 0) + 1; });
          }
        });
        setCoordinacionesCount(counts);
      }
    }
    fetchAll();
  }, []);

  const enrichedTechnicians = technicians.map(t => ({
    ...t,
    completedOrders: coordinacionesCount[normalizeString(t.name)] || 0
  }));

  const filtered = enrichedTechnicians.filter((t) => {
    const matchSearch = search === "" || [t.name, t.email, t.region, t.phone, t.rut].some(
      (f) => (f || "").toLowerCase().includes(search.toLowerCase())
    );
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statsByStatus = STATUS_OPTS.map((s) => ({
    status: s,
    count: technicians.filter((t) => t.status === s).length,
  }));

  const handleAdd = (newTech: Technician) => {
    setTechnicians((prev) => [newTech, ...prev]);
  };

  const handleUpdateStatus = (id: string, newStatus: TechnicianStatus) => {
    setTechnicians((prev) => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    if (selectedTech && selectedTech.id === id) {
      setSelectedTech({ ...selectedTech, status: newStatus });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Técnicos</h2>
          <p className="section-subtitle">{technicians.length} técnicos registrados en el sistema</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <Plus size={16} /> Agregar técnico
        </button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsByStatus.map(({ status, count }) => (
          <button key={status} onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
            className="stat-card text-left"
            style={{ border: statusFilter === status ? `1px solid ${STATUS_COLOR[status as TechnicianStatus]}40` : undefined }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLOR[status as TechnicianStatus] }} />
              <span className="text-xs font-semibold capitalize" style={{ color: "#64748b" }}>{status}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: STATUS_COLOR[status as TechnicianStatus] }}>{count}</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
          <input className="ops-input pl-9" placeholder="Buscar por nombre, RUT, teléfono, correo…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="ops-select text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Todos los estados</option>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <div className="text-xs" style={{ color: "#475569" }}>{filtered.length} técnicos</div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((tech) => (
          <TechCard key={tech.id} tech={tech} onClick={() => setSelectedTech(tech)} />
        ))}
      </div>

      {selectedTech && <TechModal tech={selectedTech} onClose={() => setSelectedTech(null)} onUpdateStatus={handleUpdateStatus} />}
      {showAddModal && (
        <AddTechModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
