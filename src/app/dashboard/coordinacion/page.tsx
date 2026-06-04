"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search, Calendar, Clock, MapPin, User, Building2, FileText,
  Hash, ChevronLeft, ChevronRight, X, Plus, Save, Check
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { mockTechnicians } from "@/lib/mock-data";
import type { Technician } from "@/types";

interface ProgramacionRow {
  id: number;
  fecha: string | null;
  hora_inicio: string | null;
  hora_termino: string | null;
  tipo_trabajo: string | null;
  local: string | null;
  direccion: string | null;
  atm: string | null;
  comuna: string | null;
  asignado_a: string | null;
  nombre_solicitante: string | null;
  solicitado_por: string | null;
  banco_empresa: string | null;
  informe: string | null;
  ot: string | null;
}

const ROWS_PER_PAGE = 25;

const BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  SI:  { bg: "rgba(114,176,29,0.12)", color: "#93c947" },
  NO:  { bg: "rgba(239,68,68,0.12)",  color: "#f87171" },
  "": { bg: "rgba(100,116,139,0.12)", color: "#64748b" },
};

const TIPO_COLOR = (tipo: string) => {
  const t = tipo?.toLowerCase() || "";
  if (t.includes("instalacion") || t.includes("anclaje")) return { bg: "rgba(59,130,246,0.12)", color: "#60a5fa" };
  if (t.includes("supervision") || t.includes("supervisión")) return { bg: "rgba(245,158,11,0.12)", color: "#fbbf24" };
  if (t.includes("servicio") || t.includes("mantencion") || t.includes("mantención")) return { bg: "rgba(114,176,29,0.12)", color: "#93c947" };
  if (t.includes("visita")) return { bg: "rgba(139,92,246,0.12)", color: "#a78bfa" };
  return { bg: "rgba(100,116,139,0.1)", color: "#94a3b8" };
};

export default function CoordinacionPage() {
  const [data, setData] = useState<ProgramacionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBanco, setFilterBanco] = useState("all");
  const [filterInforme, setFilterInforme] = useState("all");
  const [page, setPage] = useState(1);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ProgramacionRow | null>(null);
  const [formData, setFormData] = useState<Partial<ProgramacionRow>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Technician MultiSelect State
  const [techs, setTechs] = useState<Technician[]>(mockTechnicians);
  const [techSearch, setTechSearch] = useState("");
  const [showTechDropdown, setShowTechDropdown] = useState(false);

  const toggleTech = (name: string) => {
    let current = formData.asignado_a ? formData.asignado_a.split(",").map(s => s.trim()).filter(Boolean) : [];
    if (current.includes(name)) {
      current = current.filter(n => n !== name);
    } else {
      current.push(name);
    }
    setFormData({ ...formData, asignado_a: current.join(", ") });
  };

  const createNewTech = () => {
    if (!techSearch.trim()) return;
    const newName = techSearch.trim();

    // Determine next techNumber
    let maxNum = 0;
    techs.forEach(t => {
      if (t.techNumber) {
        const num = parseInt(t.techNumber, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextTechNumber = String(maxNum + 1).padStart(2, '0');

    const newTech: Technician = {
      id: `tech-${Date.now()}`,
      techNumber: nextTechNumber,
      name: newName,
      rut: "—", phone: "—", email: "", region: "Metropolitana", vehicle: "", certifications: [], status: "disponible", completedOrders: 0, avgTime: 0, productivity: 0
    };
    setTechs([...techs, newTech]);
    toggleTech(newName);
    setTechSearch("");
    setShowTechDropdown(false);
  };

  const fetchServicios = async () => {
    setLoading(true);
    const { data: servicios, error } = await supabase
      .from("servicios")
      .select("*");
      
    if (error) {
      console.error("Error fetching servicios:", error.message);
    } else if (servicios) {
      // Ordenar: del más nuevo al más antiguo según fecha (DD-MM-YYYY)
      servicios.sort((a, b) => {
        const parseD = (d: string | null) => {
          if (!d) return 0;
          const p = d.split('-');
          if (p.length === 3) {
            // Convierte DD-MM-YYYY a YYYY-MM-DD para obtener getTime() correcto
            let year = p[2];
            if (year.length === 2) year = `20${year}`;
            return new Date(`${year}-${p[1]}-${p[0]}`).getTime();
          }
          return 0;
        };
        const dateA = parseD(a.fecha);
        const dateB = parseD(b.fecha);
        if (dateB !== dateA) return dateB - dateA;
        return b.id - a.id; // Fallback a ID más reciente si tienen misma fecha
      });
      setData(servicios);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServicios();
  }, []);

  const bancos = useMemo(() => {
    const set = new Set(data.map((r) => r.banco_empresa).filter(Boolean));
    return Array.from(set).sort() as string[];
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((row) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        [row.fecha, row.tipo_trabajo, row.local, row.direccion, row.atm, row.comuna,
          row.asignado_a, row.nombre_solicitante, row.banco_empresa, row.ot]
          .some((f) => (f || "").toLowerCase().includes(q));
      const matchBanco = filterBanco === "all" || row.banco_empresa === filterBanco;
      const matchInf = filterInforme === "all" || row.informe === filterInforme;
      return matchSearch && matchBanco && matchInf;
    });
  }, [data, search, filterBanco, filterInforme]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  const resetFilters = () => {
    setSearch("");
    setFilterBanco("all");
    setFilterInforme("all");
    setPage(1);
  };

  const hasFilters = search || filterBanco !== "all" || filterInforme !== "all";

  const displayDate = (d: string | null) => {
    if (!d) return "—";
    return d;
  };

  const handleOpenCreate = () => {
    setEditingRow(null);
    setFormData({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (row: ProgramacionRow) => {
    setEditingRow(row);
    setFormData(row);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    if (editingRow) {
      // Editar
      const { error } = await supabase
        .from("servicios")
        .update(formData)
        .eq("id", editingRow.id);
      
      if (error) {
        alert(`Error al actualizar: ${error.message}`);
      } else {
        setIsModalOpen(false);
        fetchServicios();
      }
    } else {
      // Crear nuevo
      const { error } = await supabase
        .from("servicios")
        .insert([formData]);
      
      if (error) {
        alert(`Error al crear: ${error.message}`);
      } else {
        setIsModalOpen(false);
        fetchServicios();
        setPage(1); // Volver a primera página para ver el nuevo registro
      }
    }
    setIsSaving(false);
  };

  // Mapeo de campos para el formulario
  const formFields = [
    { key: "ot", label: "OT" },
    { key: "fecha", label: "Fecha (DD-MM-YYYY)" },
    { key: "hora_inicio", label: "Hora Inicio" },
    { key: "hora_termino", label: "Hora Término" },
    { key: "tipo_trabajo", label: "Tipo de Trabajo" },
    { key: "local", label: "Local" },
    { key: "direccion", label: "Dirección" },
    { key: "comuna", label: "Comuna" },
    { key: "atm", label: "ATM" },
    { key: "asignado_a", label: "Asignado a" },
    { key: "nombre_solicitante", label: "Solicitante" },
    { key: "solicitado_por", label: "Solicitado por" },
    { key: "banco_empresa", label: "Banco/Empresa" },
    { key: "informe", label: "Informe (SI / NO)" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="section-title">Coordinación (Supabase)</h2>
          <p className="section-subtitle">
            {loading ? "Cargando datos desde la nube..." : `${filtered.length} de ${data.length} registros (Ordenados del más reciente al más antiguo)`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(114,176,29,0.1)", color: "#72b01d", border: "1px solid rgba(114,176,29,0.2)" }}>
            {data.length} registros totales
          </div>
          <button
            onClick={handleOpenCreate}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} />
            Nueva Coordinación
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-56">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
          <input
            className="ops-input pl-9"
            placeholder="Buscar OT, local, ATM, técnico, banco..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Banco filter */}
        <select
          className="ops-select text-sm"
          value={filterBanco}
          onChange={(e) => { setFilterBanco(e.target.value); setPage(1); }}
        >
          <option value="all">Todos los bancos</option>
          {bancos.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>

        {/* Informe filter */}
        <select
          className="ops-select text-sm"
          value={filterInforme}
          onChange={(e) => { setFilterInforme(e.target.value); setPage(1); }}
        >
          <option value="all">Con / Sin informe</option>
          <option value="SI">Con informe</option>
          <option value="NO">Sin informe</option>
        </select>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg"
            style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <X size={12} /> Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(27,30,36,0.9)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {[
                  { label: "OT", icon: Hash },
                  { label: "Fecha", icon: Calendar },
                  { label: "Hora Inicio", icon: Clock },
                  { label: "Hora Término", icon: Clock },
                  { label: "Tipo de Trabajo", icon: FileText },
                  { label: "Local", icon: MapPin },
                  { label: "Dirección", icon: MapPin },
                  { label: "Comuna", icon: MapPin },
                  { label: "ATM", icon: null },
                  { label: "Asignado a", icon: User },
                  { label: "Solicitante", icon: User },
                  { label: "Solicitado Por", icon: User },
                  { label: "Banco/Empresa", icon: Building2 },
                  { label: "Informe", icon: null },
                ].map(({ label, icon: Icon }) => (
                  <th
                    key={label}
                    style={{
                      padding: "12px 14px",
                      textAlign: "left",
                      color: "#64748b",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      {Icon && <Icon size={11} />}
                      {label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={14} style={{ textAlign: "center", padding: 40, color: "#475569" }}>
                    Conectando con Supabase...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={14} style={{ textAlign: "center", padding: 40, color: "#475569" }}>
                    No se encontraron registros
                  </td>
                </tr>
              ) : (
                paginated.map((row) => {
                  const tipoBadge = TIPO_COLOR(row.tipo_trabajo || "");
                  const informeBadge = BADGE_COLORS[row.informe?.toUpperCase() || ""] || BADGE_COLORS[""];

                  return (
                    <tr
                      key={row.id}
                      onClick={() => handleOpenEdit(row)}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        cursor: "pointer",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(114,176,29,0.04)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      title="Haz clic para editar este registro"
                    >
                      {/* OT */}
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                        <span style={{ fontWeight: 700, color: "#72b01d", fontSize: 12 }}>
                          {row.ot || "—"}
                        </span>
                      </td>
                      {/* Fecha */}
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap", color: "#cbd5e1", fontSize: 12 }}>
                        {displayDate(row.fecha)}
                      </td>
                      {/* Hora Inicio */}
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ color: "#94a3b8", fontSize: 11 }}>
                          {row.hora_inicio || "—"}
                        </div>
                      </td>
                      {/* Hora Termino */}
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                        <div style={{ color: "#94a3b8", fontSize: 11 }}>
                          {row.hora_termino || "—"}
                        </div>
                      </td>
                      {/* Tipo */}
                      <td style={{ padding: "10px 14px", maxWidth: 220 }}>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          background: tipoBadge.bg,
                          color: tipoBadge.color,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: 210,
                        }}>
                          {row.tipo_trabajo || "—"}
                        </span>
                      </td>
                      {/* Local */}
                      <td style={{ padding: "10px 14px", maxWidth: 180 }}>
                        <div style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row.local || "—"}
                        </div>
                      </td>
                      {/* Dirección */}
                      <td style={{ padding: "10px 14px", maxWidth: 180 }}>
                        <div style={{ color: "#94a3b8", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row.direccion || "—"}
                        </div>
                      </td>
                      {/* Comuna */}
                      <td style={{ padding: "10px 14px", maxWidth: 120 }}>
                        <div style={{ color: "#94a3b8", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row.comuna || "—"}
                        </div>
                      </td>
                      {/* ATM */}
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                        <span style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: 12 }}>
                          {row.atm || "—"}
                        </span>
                      </td>
                      {/* Asignado */}
                      <td style={{ padding: "10px 14px", maxWidth: 160 }}>
                        <div style={{ color: "#e2e8f0", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row.asignado_a || "—"}
                        </div>
                      </td>
                      {/* Solicitante */}
                      <td style={{ padding: "10px 14px", maxWidth: 150 }}>
                        <div style={{ color: "#94a3b8", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row.nombre_solicitante || "—"}
                        </div>
                      </td>
                      {/* Solicitado Por */}
                      <td style={{ padding: "10px 14px", maxWidth: 120 }}>
                        <div style={{ color: "#94a3b8", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row.solicitado_por || "—"}
                        </div>
                      </td>
                      {/* Banco */}
                      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
                        <span style={{ color: "#94a3b8", fontSize: 12 }}>{row.banco_empresa || "—"}</span>
                      </td>
                      {/* Informe */}
                      <td style={{ padding: "10px 14px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                          background: informeBadge.bg,
                          color: informeBadge.color,
                        }}>
                          {row.informe || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <span style={{ color: "#475569", fontSize: 12 }}>
            Página {page} de {totalPages} · {filtered.length} registros
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: "6px 10px",
                borderRadius: 7,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                color: page === 1 ? "#334155" : "#94a3b8",
                cursor: page === 1 ? "not-allowed" : "pointer",
                fontSize: 12,
              }}
            >
              <ChevronLeft size={14} />
            </button>
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 7,
                    border: `1px solid ${p === page ? "rgba(114,176,29,0.4)" : "rgba(255,255,255,0.08)"}`,
                    background: p === page ? "rgba(114,176,29,0.12)" : "rgba(255,255,255,0.03)",
                    color: p === page ? "#93c947" : "#64748b",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: p === page ? 700 : 400,
                  }}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: "6px 10px",
                borderRadius: 7,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.03)",
                color: page === totalPages ? "#334155" : "#94a3b8",
                cursor: page === totalPages ? "not-allowed" : "pointer",
                fontSize: 12,
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
            style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div>
                <div style={{ color: "#f1f5f9", fontSize: 16, fontWeight: 700 }}>
                  {editingRow ? `Editar Coordinación #${editingRow.ot || editingRow.id}` : "Nueva Coordinación"}
                </div>
                <div style={{ color: "#475569", fontSize: 12, marginTop: 2 }}>
                  {editingRow ? "Modifica los campos del registro seleccionado." : "Ingresa los datos para el nuevo registro."}
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569" }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal body (scrollable) */}
            <div className="p-5 overflow-y-auto" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {formFields.map(f => (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">
                    {f.label}
                  </label>
                  {f.key === "asignado_a" ? (
                    <div className="relative">
                      <div 
                        className="ops-input min-h-[42px] flex flex-wrap gap-2 items-center cursor-text"
                        onClick={() => setShowTechDropdown(true)}
                      >
                        {formData.asignado_a && formData.asignado_a.split(",").map(s => s.trim()).filter(Boolean).map(t => (
                          <span key={t} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold" style={{ background: "rgba(114,176,29,0.15)", color: "#93c947", border: "1px solid rgba(114,176,29,0.3)" }}>
                            {t}
                            <button onClick={(e) => { e.stopPropagation(); toggleTech(t); }} style={{ background: "none", border: "none", color: "#93c947", cursor: "pointer", display: "flex", alignItems: "center" }}>
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                        <input 
                          placeholder={formData.asignado_a ? "" : "Buscar o crear..."}
                          value={techSearch}
                          onChange={(e) => { setTechSearch(e.target.value); setShowTechDropdown(true); }}
                          onFocus={() => setShowTechDropdown(true)}
                          style={{ background: "transparent", border: "none", outline: "none", color: "#e2e8f0", fontSize: 13, flex: 1, minWidth: 100 }}
                        />
                      </div>
                      
                      {showTechDropdown && (
                        <div className="mt-1 rounded-xl shadow-xl max-h-48 overflow-y-auto w-full" style={{ background: "#23272f", border: "1px solid rgba(255,255,255,0.1)" }}>
                          <div className="flex justify-end p-1 sticky top-0 bg-[#23272f]">
                            <button onClick={() => setShowTechDropdown(false)} className="text-slate-400 hover:text-white"><X size={14} /></button>
                          </div>
                          {techs.filter(t => t.name.toLowerCase().includes(techSearch.toLowerCase()) || t.techNumber?.includes(techSearch)).map(tech => {
                            const isSelected = (formData.asignado_a || "").includes(tech.name);
                            return (
                              <button
                                key={tech.id}
                                type="button"
                                onClick={() => { toggleTech(tech.name); setTechSearch(""); }}
                                className="w-full flex items-center justify-between px-3 py-2 text-left text-xs hover:bg-white/5 transition-colors"
                                style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                              >
                                <div className="flex items-center gap-2">
                                  {tech.techNumber && <span style={{ color: "#72b01d", fontWeight: 700 }}>#{tech.techNumber}</span>}
                                  <span style={{ color: isSelected ? "#93c947" : "#e2e8f0" }}>{tech.name}</span>
                                </div>
                                {isSelected && <Check size={14} style={{ color: "#93c947" }} />}
                              </button>
                            );
                          })}
                          {techSearch.trim() !== "" && !techs.some(t => t.name.toLowerCase() === techSearch.trim().toLowerCase()) && (
                            <button
                              type="button"
                              onClick={createNewTech}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-white/5 transition-colors"
                              style={{ color: "#f59e0b", borderTop: "1px solid rgba(255,255,255,0.06)" }}
                            >
                              <Plus size={14} /> Crear nuevo: <b>{techSearch.trim()}</b>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <input
                      className="ops-input"
                      placeholder={`Ingresa ${f.label.toLowerCase()}`}
                      value={formData[f.key as keyof ProgramacionRow] || ""}
                      onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Modal footer */}
            <div className="p-5 shrink-0 flex justify-end gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.2)" }}>
              <button
                className="btn-secondary"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                className="btn-primary flex items-center gap-2"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  "Guardando..."
                ) : (
                  <>
                    <Save size={16} />
                    {editingRow ? "Guardar Cambios" : "Crear Registro"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
