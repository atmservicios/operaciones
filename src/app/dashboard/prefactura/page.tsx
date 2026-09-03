"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  FileSpreadsheet, Download, Search, Filter, RefreshCw,
  CheckSquare, Square, Eye, X, Check, Building2, Calendar,
  Hash, DollarSign, Layers, ShieldAlert, ChevronRight, HelpCircle
} from "lucide-react";
import {
  ITEMS_SERVICIOS,
  getSuggestedTariffItem,
  getTariffAmount
} from "@/lib/prefacturaTarifas";

interface ServicioRow {
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
  ticket?: string | null;
}

interface ServiceCustomization {
  servicio_tarifado: string;
  cantidad: number;
  unidad: string;
  categoria: string;
  tipo_maquina: string;
}

const MESES = [
  { value: "ALL", label: "Todos los Meses" },
  { value: "01", label: "Enero" },
  { value: "02", label: "Febrero" },
  { value: "03", label: "Marzo" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Mayo" },
  { value: "06", label: "Junio" },
  { value: "07", label: "Julio" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

export default function PrefacturaPage() {
  const [data, setData] = useState<ServicioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterMes, setFilterMes] = useState("ALL");
  const [filterAnio, setFilterAnio] = useState("2026");

  // Selection & customization
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [customizations, setCustomizations] = useState<Record<number, ServiceCustomization>>({});
  const [previewRow, setPreviewRow] = useState<{ row: ServicioRow; index: number } | null>(null);

  const fetchServicios = async () => {
    setLoading(true);
    const { data: servicios, error } = await supabase
      .from("servicios")
      .select("*")
      .ilike("banco_empresa", "%santander%");

    if (error) {
      console.error("Error fetching servicios:", error.message);
    } else if (servicios) {
      // Sort: newest to oldest by date
      servicios.sort((a, b) => {
        const parseD = (d: string | null) => {
          if (!d) return 0;
          const p = d.split('-');
          if (p.length === 3) {
            let y = p[2];
            if (y.length === 2) y = `20${y}`;
            return new Date(`${y}-${p[1]}-${p[0]}`).getTime();
          }
          return 0;
        };
        const dateA = parseD(a.fecha);
        const dateB = parseD(b.fecha);
        if (dateB !== dateA) return dateB - dateA;
        return b.id - a.id;
      });
      setData(servicios);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServicios();
  }, []);

  // Filtered rows (strictly Santander)
  const filtered = useMemo(() => {
    return data.filter((row) => {
      // Solo los que dicen Santander
      const isSantander = (row.banco_empresa || "").toUpperCase().includes("SANTANDER");
      if (!isSantander) return false;

      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        [row.fecha, row.tipo_trabajo, row.local, row.direccion, row.atm, row.comuna,
          row.asignado_a, row.nombre_solicitante, row.banco_empresa, row.ot, row.ticket]
          .some((f) => (f || "").toLowerCase().includes(q));

      let matchFecha = true;
      if (row.fecha) {
        const parts = row.fecha.split('-');
        if (parts.length === 3) {
          const m = parts[1];
          let y = parts[2];
          if (y.length === 2) y = `20${y}`;

          if (filterMes !== "ALL" && m !== filterMes) matchFecha = false;
          if (filterAnio !== "ALL" && y !== filterAnio) matchFecha = false;
        }
      } else if (filterMes !== "ALL" || filterAnio !== "ALL") {
        matchFecha = false;
      }

      return matchSearch && matchFecha;
    });
  }, [data, search, filterMes, filterAnio]);

  // When filtered changes, by default select all filtered rows
  useEffect(() => {
    const newSet = new Set<number>();
    filtered.forEach((r) => newSet.add(r.id));
    setSelectedIds(newSet);
  }, [filtered]);

  // Helper to get customization or default for a row
  const getRowCustomization = (row: ServicioRow): ServiceCustomization => {
    if (customizations[row.id]) return customizations[row.id];
    return {
      servicio_tarifado: getSuggestedTariffItem(row.tipo_trabajo),
      cantidad: 1,
      unidad: "GL",
      categoria: "CONTINUIDAD OPERATIVA",
      tipo_maquina: "ATM",
    };
  };

  const updateRowCustomization = (rowId: number, patch: Partial<ServiceCustomization>, defaultRow: ServicioRow) => {
    setCustomizations(prev => {
      const base = prev[rowId] || {
        servicio_tarifado: getSuggestedTariffItem(defaultRow.tipo_trabajo),
        cantidad: 1,
        unidad: "GL",
        categoria: "CONTINUIDAD OPERATIVA",
        tipo_maquina: "ATM",
      };
      return { ...prev, [rowId]: { ...base, ...patch } };
    });
  };

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set<number>();
      filtered.forEach((r) => newSet.add(r.id));
      setSelectedIds(newSet);
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Rows that are actively selected for prefactura (max 250 sheets)
  const selectedRows = useMemo(() => {
    return filtered.filter(r => selectedIds.has(r.id));
  }, [filtered, selectedIds]);

  // Financial summary
  const totalNetoEstimado = useMemo(() => {
    return selectedRows.reduce((sum, r) => {
      const cust = getRowCustomization(r);
      const amount = getTariffAmount(cust.servicio_tarifado);
      return sum + (amount * cust.cantidad);
    }, 0);
  }, [selectedRows, customizations]);

  const uniqueAtms = useMemo(() => {
    return new Set(selectedRows.map(r => r.atm).filter(Boolean)).size;
  }, [selectedRows]);

  const withTicketCount = useMemo(() => {
    return selectedRows.filter(r => !!r.ticket).length;
  }, [selectedRows]);

  // Export to Excel handler
  const handleDescargarExcel = async () => {
    if (selectedRows.length === 0) {
      alert("Debes seleccionar al menos un servicio para generar la prefactura.");
      return;
    }

    if (selectedRows.length > 250) {
      alert("La plantilla prefactura.xlsx soporta hasta 250 cajeros/hojas por archivo. Se generarán las primeras 250 hojas.");
    }

    setIsGenerating(true);

    try {
      const mesObj = MESES.find(m => m.value === filterMes);
      const mesName = mesObj && mesObj.value !== "ALL" ? mesObj.label : "";
      const anioName = filterAnio !== "ALL" ? filterAnio : "";
      const periodoTexto = [mesName, anioName].filter(Boolean).join(" ") || "General";

      const payload = {
        periodo: periodoTexto,
        banco: "SANTANDER",
        servicios: selectedRows.slice(0, 250).map((r, idx) => {
          const cust = getRowCustomization(r);
          return {
            hojaIndex: idx + 1,
            atm: r.atm || "",
            local: r.local || "",
            ot: r.ot || "",
            ticket: r.ticket || "",
            fecha: r.fecha || "",
            tipo_trabajo: r.tipo_trabajo || "",
            solicitante: r.nombre_solicitante || "",
            solicitado_por: r.solicitado_por || "",
            categoria: cust.categoria,
            tipo_maquina: cust.tipo_maquina,
            servicio_tarifado: cust.servicio_tarifado,
            cantidad: cust.cantidad,
            unidad: cust.unidad,
            valorUnitario: getTariffAmount(cust.servicio_tarifado),
          };
        }),
      };

      const res = await fetch("/api/generar-prefactura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Error ${res.status} al generar prefactura`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const mesTitle = filterMes !== "ALL" ? `_${filterMes}` : "";
      a.download = `Prefactura_SANTANDER${mesTitle}_${filterAnio}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al generar la prefactura");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: "rgba(114,176,29,0.15)", border: "1px solid rgba(114,176,29,0.3)" }}>
              <FileSpreadsheet size={24} style={{ color: "#93c947" }} />
            </div>
            <div>
              <h2 className="section-title text-xl font-bold">Prefactura Santander</h2>
              <p className="section-subtitle text-xs text-slate-400">
                Generador de prefactura multi-hoja por cajero exclusivo para Banco Santander (adhesión)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchServicios}
            disabled={loading}
            className="btn-secondary flex items-center gap-2 text-xs py-2 px-3"
            title="Recargar datos de coordinación"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>

          <button
            onClick={handleDescargarExcel}
            disabled={isGenerating || selectedRows.length === 0}
            className="btn-primary flex items-center gap-2 text-xs py-2 px-4 shadow-lg"
            style={{ background: "#72b01d" }}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Generando Excel ({selectedRows.length} hojas)...
              </>
            ) : (
              <>
                <Download size={15} />
                Descargar Prefactura Excel ({selectedRows.length})
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg" style={{ background: "rgba(114,176,29,0.12)", color: "#93c947" }}>
            <Layers size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hojas / Servicios</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {selectedRows.length} <span className="text-xs font-normal text-slate-400">/ {filtered.length}</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg" style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa" }}>
            <DollarSign size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Neto Estimado</div>
            <div className="text-xl font-bold text-white mt-0.5">
              ${Math.round(totalNetoEstimado).toLocaleString("es-CL")}
            </div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg" style={{ background: "rgba(245,158,11,0.12)", color: "#fbbf24" }}>
            <Building2 size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cajeros Únicos</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {uniqueAtms}
            </div>
          </div>
        </div>

        <div className="glass-card p-4 rounded-xl flex items-center gap-4">
          <div className="p-3 rounded-lg" style={{ background: "rgba(168,85,247,0.12)", color: "#c084fc" }}>
            <Hash size={20} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Con Ticket BCM</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {withTicketCount} <span className="text-xs font-normal text-slate-400">({selectedRows.length ? Math.round((withTicketCount / selectedRows.length) * 100) : 0}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-card p-4 rounded-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por ATM, OT, Ticket, local..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ops-input pl-9 text-xs w-full"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Banco Santander Exclusivo */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl ops-input text-xs" style={{ background: "rgba(236,0,0,0.08)", border: "1px solid rgba(236,0,0,0.25)" }}>
            <Building2 size={15} style={{ color: "#ec0000" }} />
            <span className="font-bold text-white">Banco Santander</span>
            <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(236,0,0,0.2)", color: "#ff8787" }}>
              Exclusivo
            </span>
          </div>

          {/* Mes */}
          <div>
            <select
              className="ops-select text-xs w-full"
              value={filterMes}
              onChange={(e) => setFilterMes(e.target.value)}
            >
              {MESES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Año */}
          <div>
            <select
              className="ops-select text-xs w-full"
              value={filterAnio}
              onChange={(e) => setFilterAnio(e.target.value)}
            >
              <option value="2026">Año 2026</option>
              <option value="2025">Año 2025</option>
              <option value="ALL">Todos los Años</option>
            </select>
          </div>
        </div>

        {/* Selection Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
            >
              {selectedIds.size === filtered.length && filtered.length > 0 ? (
                <CheckSquare size={14} style={{ color: "#72b01d" }} />
              ) : (
                <Square size={14} />
              )}
              <span>Seleccionar todos ({filtered.length})</span>
            </button>

            <span>•</span>
            <span>{selectedRows.length} seleccionados para exportar</span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <HelpCircle size={13} />
            <span>Cada servicio seleccionado generará una hoja numerada en el Excel</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "rgba(27,30,36,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th style={{ padding: "10px 12px", width: 40, textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    style={{ cursor: "pointer", accentColor: "#72b01d" }}
                  />
                </th>
                <th style={{ padding: "10px 12px", textAlign: "center", color: "#64748b", fontWeight: 700, width: 60 }}>
                  HOJA
                </th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 700 }}>
                  ATM
                </th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 700 }}>
                  NOMBRE / LOCAL
                </th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 700 }}>
                  OT
                </th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 700 }}>
                  TICKET BCM
                </th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 700 }}>
                  FECHA
                </th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 700 }}>
                  SERVICIO COORDINACIÓN
                </th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#64748b", fontWeight: 700, minWidth: 280 }}>
                  ÍTEM TARIFADO ASIGNADO
                </th>
                <th style={{ padding: "10px 12px", textAlign: "right", color: "#64748b", fontWeight: 700 }}>
                  TOTAL NETO
                </th>
                <th style={{ padding: "10px 12px", textAlign: "center", color: "#64748b", fontWeight: 700, width: 60 }}>
                  VER
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                    Cargando coordinaciones desde Supabase...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: 40, color: "#64748b" }}>
                    No se encontraron servicios para los filtros seleccionados
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => {
                  const isSelected = selectedIds.has(row.id);
                  const cust = getRowCustomization(row);
                  const amount = getTariffAmount(cust.servicio_tarifado);
                  const totalNeto = amount * cust.cantidad;

                  return (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        background: isSelected ? "transparent" : "rgba(0,0,0,0.2)",
                        opacity: isSelected ? 1 : 0.5,
                        transition: "background 0.12s",
                      }}
                      className="hover:bg-white/[0.02]"
                    >
                      {/* Checkbox */}
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(row.id)}
                          style={{ cursor: "pointer", accentColor: "#72b01d" }}
                        />
                      </td>

                      {/* Hoja Number */}
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span
                          className="px-2 py-0.5 rounded text-[11px] font-bold"
                          style={{
                            background: isSelected ? "rgba(114,176,29,0.15)" : "rgba(255,255,255,0.05)",
                            color: isSelected ? "#93c947" : "#64748b",
                            border: `1px solid ${isSelected ? "rgba(114,176,29,0.3)" : "rgba(255,255,255,0.05)"}`
                          }}
                        >
                          #{idx + 1}
                        </span>
                      </td>

                      {/* ATM */}
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        <span style={{ fontFamily: "monospace", color: "#f1f5f9", fontWeight: 700 }}>
                          {row.atm || "—"}
                        </span>
                      </td>

                      {/* Local / Nombre */}
                      <td style={{ padding: "10px 12px", maxWidth: 180 }}>
                        <div style={{ color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.local || ""}>
                          {row.local || "—"}
                        </div>
                        {row.comuna && <div style={{ color: "#64748b", fontSize: 11 }}>{row.comuna}</div>}
                      </td>

                      {/* OT */}
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        <span style={{ color: "#93c947", fontWeight: 600 }}>
                          {row.ot || "—"}
                        </span>
                      </td>

                      {/* Ticket BCM */}
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                        <span style={{ color: row.ticket ? "#f59e0b" : "#475569", fontWeight: row.ticket ? 600 : 400 }}>
                          {row.ticket || "—"}
                        </span>
                      </td>

                      {/* Fecha */}
                      <td style={{ padding: "10px 12px", whiteSpace: "nowrap", color: "#cbd5e1" }}>
                        {row.fecha || "—"}
                      </td>

                      {/* Servicio Coordinación */}
                      <td style={{ padding: "10px 12px", maxWidth: 180 }}>
                        <span style={{ color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block", maxWidth: 170 }} title={row.tipo_trabajo || ""}>
                          {row.tipo_trabajo || "—"}
                        </span>
                      </td>

                      {/* Ítem Tarifado Asignado */}
                      <td style={{ padding: "8px 12px" }}>
                        <select
                          className="ops-select text-xs w-full py-1"
                          style={{
                            background: "#1e2229",
                            border: "1px solid rgba(255,255,255,0.08)",
                            color: "#e2e8f0",
                          }}
                          value={cust.servicio_tarifado}
                          onChange={(e) => updateRowCustomization(row.id, { servicio_tarifado: e.target.value }, row)}
                        >
                          {ITEMS_SERVICIOS.map((item) => (
                            <option key={item.nombre} value={item.nombre}>
                              {item.nombre} (${Math.round(item.monto).toLocaleString("es-CL")})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Total Neto */}
                      <td style={{ padding: "10px 12px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <span style={{ color: "#f1f5f9", fontWeight: 600 }}>
                          ${Math.round(totalNeto).toLocaleString("es-CL")}
                        </span>
                      </td>

                      {/* Action: Preview */}
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <button
                          onClick={() => setPreviewRow({ row, index: idx + 1 })}
                          className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                          title="Previsualizar hoja de este cajero"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewRow && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {/* Modal Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/5 bg-black/20">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-[#72b01d]/20 text-[#93c947] border border-[#72b01d]/30">
                  Hoja #{previewRow.index}
                </span>
                <span className="font-bold text-white text-sm">
                  ATM: {previewRow.row.atm || "—"} ({previewRow.row.local || "Sin nombre"})
                </span>
              </div>
              <button
                onClick={() => setPreviewRow(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body: Facsimile of Sheet X */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Datos de Cabecera (Hoja &quot;{previewRow.index}&quot;)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-500 block">B1 (SERVICIO):</span>
                    <span className="text-white font-medium">{previewRow.row.tipo_trabajo || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">B2 (SOLICITANTE):</span>
                    <span className="text-white font-medium">{previewRow.row.nombre_solicitante || previewRow.row.solicitado_por || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">B3 (CATEGORÍA):</span>
                    <span className="text-white font-medium">{getRowCustomization(previewRow.row).categoria}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">B4 (ATM):</span>
                    <span className="text-white font-medium font-mono">{previewRow.row.atm || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">B5 (NOMBRE):</span>
                    <span className="text-white font-medium">{previewRow.row.local || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">B6 (TICKET BCM):</span>
                    <span className="text-amber-400 font-medium">{previewRow.row.ticket || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">B7 (OT):</span>
                    <span className="text-[#93c947] font-medium">{previewRow.row.ot || "—"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">B8 (TIPO MÁQUINA):</span>
                    <span className="text-white font-medium">{getRowCustomization(previewRow.row).tipo_maquina}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">B9 (FECHA EJECUCIÓN):</span>
                    <span className="text-white font-medium">{previewRow.row.fecha || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Items Tarifados Table Preview */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Detalle del Ítem Tarifado (Fila 12)
                </div>
                <div className="overflow-x-auto">
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr className="border-b border-white/5 text-slate-500 text-[11px]">
                        <th className="py-1.5 text-left">ITEM</th>
                        <th className="py-1.5 text-left">Fecha</th>
                        <th className="py-1.5 text-left">SERVICIO TARIFADO</th>
                        <th className="py-1.5 text-center">CANT.</th>
                        <th className="py-1.5 text-center">UNIDAD</th>
                        <th className="py-1.5 text-right">VALOR UNIT.</th>
                        <th className="py-1.5 text-right">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-white/5 text-white">
                        <td className="py-2">1</td>
                        <td className="py-2">{previewRow.row.fecha || "—"}</td>
                        <td className="py-2 font-medium">{getRowCustomization(previewRow.row).servicio_tarifado}</td>
                        <td className="py-2 text-center">{getRowCustomization(previewRow.row).cantidad}</td>
                        <td className="py-2 text-center">{getRowCustomization(previewRow.row).unidad}</td>
                        <td className="py-2 text-right">
                          ${Math.round(getTariffAmount(getRowCustomization(previewRow.row).servicio_tarifado)).toLocaleString("es-CL")}
                        </td>
                        <td className="py-2 text-right font-bold text-[#93c947]">
                          ${Math.round(getTariffAmount(getRowCustomization(previewRow.row).servicio_tarifado) * getRowCustomization(previewRow.row).cantidad).toLocaleString("es-CL")}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={6} className="py-3 text-right text-slate-400 font-bold uppercase text-[11px]">
                          VALOR NETO DE SERVICIO (G24):
                        </td>
                        <td className="py-3 text-right text-base font-bold text-white">
                          ${Math.round(getTariffAmount(getRowCustomization(previewRow.row).servicio_tarifado) * getRowCustomization(previewRow.row).cantidad).toLocaleString("es-CL")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
                <ShieldAlert size={16} className="shrink-0" />
                <span>
                  Al generar el archivo Excel, esta información se volcará en la hoja <b>&quot;{previewRow.index}&quot;</b> y se enlazará automáticamente en la hoja <b>RESUMEN PRE FACTURA</b>.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end">
              <button
                onClick={() => setPreviewRow(null)}
                className="btn-secondary text-xs py-1.5 px-4"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
