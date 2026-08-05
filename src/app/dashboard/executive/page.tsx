"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
} from "recharts";
import { 
  TrendingUp, Clock, Target, AlertTriangle, Download, FileSpreadsheet,
  Search, Zap, MapPin, Activity, Calculator, User, Calendar
} from "lucide-react";
import { mockATMs, mockTechnicians, mockWorkOrders, monthlyData } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";

const slaByBank = [
  { bank: "BancoEstado", sla: 94, ordenes: 87 },
  { bank: "Santander", sla: 88, ordenes: 62 },
  { bank: "BCI", sla: 91, ordenes: 48 },
  { bank: "Itaú", sla: 97, ordenes: 35 },
  { bank: "B. Chile", sla: 85, ordenes: 71 },
  { bank: "Scotiabank", sla: 92, ordenes: 41 },
];

const costData = [
  { month: "Ene", preventivo: 2800000, correctivo: 1200000, total: 4000000 },
  { month: "Feb", preventivo: 2600000, correctivo: 900000, total: 3500000 },
  { month: "Mar", preventivo: 3100000, correctivo: 1500000, total: 4600000 },
  { month: "Abr", preventivo: 2900000, correctivo: 800000, total: 3700000 },
  { month: "May", preventivo: 2700000, correctivo: 1100000, total: 3800000 },
];

const fmtCLP = (v: number) => `$${(v / 1000000).toFixed(1)}M`;

const COLORS = ["#72b01d", "#3b82f6", "#f59e0b", "#a78bfa", "#ec4899", "#14b8a6", "#e2e8f0"];

export default function ExecutivePage() {
  const [techProductivity, setTechProductivity] = useState<any[]>([]);
  const [atmFaults, setAtmFaults] = useState<any[]>([]);
  const [comunasData, setComunasData] = useState<any[]>([]);
  const [electricData, setElectricData] = useState<any[]>([]);
  
  // ATM analysis states
  const [allServices, setAllServices] = useState<any[]>([]);
  const [allAtms, setAllAtms] = useState<string[]>([]);
  const [searchAtmInput, setSearchAtmInput] = useState("");
  const [selectedAtm, setSelectedAtm] = useState("");
  const [showAtmSuggestions, setShowAtmSuggestions] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch needed fields from services (coordinations)
      const { data: serviciosData } = await supabase
        .from('servicios')
        .select('atm, asignado_a, banco_empresa, tipo_de_trabajo, comuna, fecha');

      const servicios = serviciosData || [];
      setAllServices(servicios);

      // Collect unique ATMs
      const uniqueAtms = Array.from(new Set(servicios.map(s => s.atm).filter(Boolean))) as string[];
      setAllAtms(uniqueAtms.sort());

      // ── Gráfico 1: Técnicos más activos ─────────────────────────────────
      const normalize = (s: string) =>
        s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();

      const techMap: Record<string, { displayName: string; ordenes: number }> = {};
      servicios.forEach(s => {
        if (!s.asignado_a) return;
        const names = String(s.asignado_a)
          .split(/,/)
          .map(n => n.trim())
          .filter(Boolean);
        names.forEach(raw => {
          const key = normalize(raw);
          if (!techMap[key]) {
            const parts = raw.trim().split(/\s+/);
            techMap[key] = {
              displayName: parts.slice(0, 2).join(" "),
              ordenes: 0,
            };
          }
          techMap[key].ordenes += 1;
        });
      });

      const techCounts = Object.values(techMap)
        .map(t => ({ name: t.displayName, ordenes: t.ordenes }))
        .filter(t => t.ordenes > 0)
        .sort((a, b) => b.ordenes - a.ordenes);
      setTechProductivity(techCounts);

      // ── Gráfico 2: ATMs con más intervenciones ───────────────────────────
      const atmGroups: Record<string, { code: string; fallas: number; cliente: string }> = {};
      servicios.forEach(s => {
        if (!s.atm || s.atm.trim() === "") return;
        const code = s.atm.trim();
        if (!atmGroups[code]) {
          atmGroups[code] = { code, fallas: 0, cliente: s.banco_empresa || "Desconocido" };
        }
        atmGroups[code].fallas += 1;
      });
      const atmCounts = Object.values(atmGroups).sort((a, b) => b.fallas - a.fallas);
      setAtmFaults(atmCounts);

      // ── Gráfico 3: Comunas con más servicios ───────────────────────────
      const comunaGroups: Record<string, number> = {};
      servicios.forEach(s => {
        if (!s.comuna || s.comuna.trim() === "") return;
        const name = s.comuna.trim().toUpperCase();
        comunaGroups[name] = (comunaGroups[name] || 0) + 1;
      });
      const comunaCounts = Object.entries(comunaGroups)
        .map(([name, total]) => ({ 
          name: name.split(" ").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" "), 
          total 
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8);
      setComunasData(comunaCounts);

      // ── Gráfico 4: Servicios Eléctricos por Mes ──────────────────────────
      const getMonthName = (dateStr: string | null) => {
        if (!dateStr) return null;
        const parts = dateStr.split('-');
        if (parts.length !== 3) return null;
        const monthNum = parseInt(parts[1], 10);
        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        return months[monthNum - 1] || null;
      };

      const electricMonths: Record<string, number> = {
        "Ene": 0, "Feb": 0, "Mar": 0, "Abr": 0, "May": 0, "Jun": 0, "Jul": 0, "Ago": 0, "Sep": 0, "Oct": 0, "Nov": 0, "Dic": 0
      };

      servicios.forEach(s => {
        const workType = String(s.tipo_de_trabajo || "").toLowerCase();
        if (workType.includes("elec") || workType.includes("cable") || workType.includes("enchufe") || workType.includes("lumin")) {
          const m = getMonthName(s.fecha);
          if (m && electricMonths[m] !== undefined) {
            electricMonths[m] += 1;
          }
        }
      });
      const electricCounts = Object.entries(electricMonths).map(([month, total]) => ({ month, total }));
      setElectricData(electricCounts);
    };

    fetchData();
  }, []);

  // Filter ATM suggestions
  const suggestions = allAtms.filter(a => 
    a.toLowerCase().includes(searchAtmInput.toLowerCase()) && a !== searchAtmInput
  ).slice(0, 5);

  const handleSelectAtm = (code: string) => {
    setSelectedAtm(code);
    setSearchAtmInput(code);
    setShowAtmSuggestions(false);
  };

  // Selected ATM services
  const selectedAtmServices = allServices.filter(s => s.atm === selectedAtm);

  // Group service types for selected ATM
  const selectedAtmTypesMap: Record<string, number> = {};
  selectedAtmServices.forEach(s => {
    const type = s.tipo_de_trabajo || "General";
    selectedAtmTypesMap[type] = (selectedAtmTypesMap[type] || 0) + 1;
  });
  const selectedAtmTypesData = Object.entries(selectedAtmTypesMap).map(([name, value]) => ({ name, value }));

  const avgSLA = Math.round(slaByBank.reduce((s, b) => s + b.sla, 0) / slaByBank.length);
  const avgResponse = 2.4;
  const totalOrders = mockWorkOrders.length;
  const closedOrders = mockWorkOrders.filter(o => o.status === "finalizada").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title">Reportes Ejecutivos</h2>
          <p className="section-subtitle">KPIs y métricas estratégicas de operaciones</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary text-xs py-1.5 px-3"><FileSpreadsheet size={13} /> Excel</button>
          <button className="btn-primary text-xs py-1.5 px-3"><Download size={13} /> PDF Ejecutivo</button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Cumplimiento SLA", value: `${avgSLA}%`, icon: Target, color: "#72b01d", sub: "Promedio todos los bancos", trend: "+2.1%" },
          { label: "Tiempo de Respuesta", value: `${avgResponse}h`, icon: Clock, color: "#93c947", sub: "Promedio histórico", trend: "-0.3h" },
          { label: "Órdenes Cerradas", value: closedOrders, icon: TrendingUp, color: "#f59e0b", sub: `de ${totalOrders} totales`, trend: null },
          { label: "Incidencias Activas", value: mockATMs.filter(a => a.status === "falla").length, icon: AlertTriangle, color: "#ef4444", sub: "ATMs con falla activa", trend: null },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="stat-card">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${k.color}18` }}>
                  <Icon size={20} style={{ color: k.color }} />
                </div>
                {k.trend && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(114,176,29,0.1)", color: "#93c947" }}>{k.trend}</span>
                )}
              </div>
              <div className="text-3xl font-bold mb-1" style={{ color: "#f1f5f9" }}>{k.value}</div>
              <div className="text-sm font-semibold" style={{ color: "#94a3b8" }}>{k.label}</div>
              <div className="text-xs mt-0.5" style={{ color: "#475569" }}>{k.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Interactive ATM Analyzer Section */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="absolute -right-24 -top-24 w-48 h-48 rounded-full blur-[120px]" style={{ background: "rgba(114,176,29,0.12)" }} />

        <div className="flex items-center gap-2 pb-4 mb-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Activity className="text-[#93c947]" size={20} />
          <div>
            <h3 className="text-md font-bold text-slate-100">Análisis Técnico por Cajero (ATM)</h3>
            <p className="text-xs text-slate-400">Busca cualquier cajero para ver su historial acumulado de servicios y tipos de trabajo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selector / Search Box */}
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-[11px] font-bold text-slate-400 uppercase pl-1">Buscar Código de ATM</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej: ATM 100, ATI 20..."
                  className="ops-input pl-10"
                  value={searchAtmInput}
                  onChange={(e) => {
                    setSearchAtmInput(e.target.value);
                    setShowAtmSuggestions(true);
                  }}
                  onFocus={() => setShowAtmSuggestions(true)}
                />
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>

              {showAtmSuggestions && suggestions.length > 0 && (
                <div className="absolute z-20 top-[60px] left-0 right-0 rounded-lg border border-slate-700 bg-[#161a22] shadow-xl overflow-hidden">
                  {suggestions.map(s => (
                    <button
                      key={s}
                      onClick={() => handleSelectAtm(s)}
                      className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-[#72b01d]/10 hover:text-white transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedAtm ? (
              <div className="p-4 rounded-xl space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)" }}>
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Cajero Seleccionado</div>
                  <div className="text-xl font-bold text-[#93c947] font-mono">{selectedAtm}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Total de Servicios</div>
                  <div className="text-3xl font-extrabold text-slate-100">{selectedAtmServices.length}</div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase">Cliente Principal</div>
                  <div className="text-xs text-slate-300 font-semibold">{selectedAtmServices[0]?.banco_empresa || "Desconocido"}</div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 rounded-xl border border-dashed border-slate-800">
                Selecciona un cajero para ver el desglose detallado.
              </div>
            )}
          </div>

          {/* Chart breakdown */}
          <div className="lg:col-span-2 space-y-4">
            {selectedAtm && selectedAtmTypesData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Pie Chart */}
                <div className="flex flex-col items-center">
                  <div className="text-xs font-bold text-slate-400 mb-2">Tipos de Servicio Realizados</div>
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie
                        data={selectedAtmTypesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {selectedAtmTypesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: "rgba(22, 26, 34, 0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend & List */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-400">Detalle de Tipos de Trabajo</div>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {selectedAtmTypesData.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-1.5 rounded" style={{ background: "rgba(255,255,255,0.01)" }}>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                          <span className="text-slate-300 font-medium">{item.name}</span>
                        </div>
                        <span className="font-bold text-slate-100">{item.value} ({Math.round((item.value / selectedAtmServices.length) * 100)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : selectedAtm ? (
              <div className="flex items-center justify-center h-48 text-xs text-slate-500">
                No se registraron trabajos para este cajero.
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Esperando selección de cajero...
              </div>
            )}
          </div>
        </div>

        {/* Selected ATM History Table */}
        {selectedAtm && selectedAtmServices.length > 0 && (
          <div className="mt-6 pt-4" style={{ borderTop: "1px dashed rgba(255,255,255,0.06)" }}>
            <div className="text-xs font-bold text-slate-400 mb-3">Historial Reciente de Servicios</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr className="text-slate-500 font-bold" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <th className="py-2 px-3">Fecha</th>
                    <th className="py-2 px-3">Cliente</th>
                    <th className="py-2 px-3">Tipo de Trabajo</th>
                    <th className="py-2 px-3">Comuna</th>
                    <th className="py-2 px-3">Asignado A</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAtmServices.slice(0, 5).map((s, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.01]" style={{ borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
                      <td className="py-2 px-3 text-slate-400">{s.fecha || "Sin Fecha"}</td>
                      <td className="py-2 px-3 text-slate-200 font-semibold">{s.banco_empresa}</td>
                      <td className="py-2 px-3 text-slate-200">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: "rgba(114,176,29,0.08)", color: "#93c947", border: "1px solid rgba(114,176,29,0.15)" }}>
                          {s.tipo_de_trabajo || "General"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-400">{s.comuna}</td>
                      <td className="py-2 px-3 text-slate-300">{s.asignado_a || "No Asignado"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Comunas Chart & Electric Services Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Comunas */}
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute -left-24 -bottom-24 w-48 h-48 rounded-full blur-[100px]" style={{ background: "rgba(59,130,246,0.08)" }} />
          
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={18} className="text-blue-400" />
            <h3 className="font-semibold text-sm text-slate-100">Comunas con Mayor Demanda de Servicios</h3>
          </div>
          <div className="text-xs mb-4 text-slate-500">Distribución de servicios por ubicación de comunas</div>
          
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={comunasData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
              <Tooltip 
                contentStyle={{ background: "rgba(22, 26, 34, 0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}
                itemStyle={{ color: "#f1f5f9", fontWeight: 600 }}
              />
              <Bar dataKey="total" radius={[0, 6, 6, 0]} fill="#3b82f6" name="Total Servicios" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Electric Services */}
        <div className="glass-card p-5 relative overflow-hidden">
          <div className="absolute -right-24 -bottom-24 w-48 h-48 rounded-full blur-[100px]" style={{ background: "rgba(245,158,11,0.08)" }} />

          <div className="flex items-center gap-2 mb-1">
            <Zap size={18} className="text-[#f59e0b]" />
            <h3 className="font-semibold text-sm text-slate-100">Tendencia de Servicios Eléctricos</h3>
          </div>
          <div className="text-xs mb-4 text-slate-500">Servicios eléctricos, cableados e iluminación mensuales</div>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={electricData}>
              <defs>
                <linearGradient id="elecGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ background: "rgba(22, 26, 34, 0.95)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8 }}
                itemStyle={{ color: "#f1f5f9", fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="total" stroke="#f59e0b" fill="url(#elecGrad)" strokeWidth={2.5} name="S. Eléctricos" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SLA by bank + Cost breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="font-semibold text-sm mb-1" style={{ color: "#f1f5f9" }}>Cumplimiento SLA por Banco</div>
          <div className="text-xs mb-4" style={{ color: "#475569" }}>% de órdenes cerradas en plazo</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={slaByBank} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" domain={[70, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
              <YAxis type="category" dataKey="bank" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip 
                contentStyle={{ background: "rgba(255,255,255,0.95)", border: "none", borderRadius: 8, color: "#0f172a", fontSize: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}
                itemStyle={{ color: "#334155", fontWeight: 600 }}
                labelStyle={{ color: "#64748b", marginBottom: 4 }}
              />
              <Bar dataKey="sla" radius={[0, 6, 6, 0]} name="SLA %" fill="#72b01d">
                {slaByBank.map((entry, i) => (
                  <Cell key={i} fill={entry.sla >= 95 ? "#72b01d" : entry.sla >= 90 ? "#93c947" : entry.sla >= 85 ? "#f59e0b" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <div className="font-semibold text-sm mb-1" style={{ color: "#f1f5f9" }}>Costos Operativos 2025</div>
          <div className="text-xs mb-4" style={{ color: "#475569" }}>Preventivo vs Correctivo (CLP)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={costData}>
              <defs>
                <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#72b01d" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#72b01d" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="corrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtCLP} />
              <Tooltip 
                contentStyle={{ background: "rgba(255,255,255,0.95)", border: "none", borderRadius: 8, color: "#0f172a", fontSize: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }} 
                itemStyle={{ color: "#334155", fontWeight: 600 }}
                labelStyle={{ color: "#64748b", marginBottom: 4 }}
                formatter={(v: any) => [`$${(Number(v) / 1000).toFixed(0)}k`, ""]} 
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="preventivo" stroke="#72b01d" fill="url(#prevGrad)" strokeWidth={2} name="Preventivo" />
              <Area type="monotone" dataKey="correctivo" stroke="#ef4444" fill="url(#corrGrad)" strokeWidth={2} name="Correctivo" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tech productivity + ATM faults */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="font-semibold text-sm mb-1" style={{ color: "#f1f5f9" }}>Técnicos más Activos</div>
          <div className="text-xs mb-4" style={{ color: "#475569" }}>Por órdenes completadas</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={techProductivity.slice(0, 6)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip 
                contentStyle={{ background: "rgba(255,255,255,0.95)", border: "none", borderRadius: 8, color: "#0f172a", fontSize: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}
                itemStyle={{ color: "#334155", fontWeight: 600 }}
                labelStyle={{ color: "#64748b", marginBottom: 4 }}
              />
              <Bar dataKey="ordenes" radius={[0, 6, 6, 0]} fill="#72b01d" name="Órdenes" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <div className="font-semibold text-sm mb-1" style={{ color: "#f1f5f9" }}>ATMs con más Intervenciones</div>
          <div className="text-xs mb-4" style={{ color: "#475569" }}>Historial técnico acumulado</div>
          <div className="space-y-3">
            {atmFaults.slice(0, 5).map((a, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-xs mb-1">
                  <div>
                    <span className="font-mono font-semibold" style={{ color: "#93c947" }}>{a.code}</span>
                    <span style={{ color: "#475569" }}> — {a.cliente}</span>
                  </div>
                  <span style={{ color: "#94a3b8" }}>{a.fallas} intervenciones</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-2 rounded-full" style={{
                    width: `${Math.min((a.fallas / 5) * 100, 100)}%`,
                    background: "#72b01d"
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Monthly overview */}
          <div className="mt-4">
            <div className="text-xs font-semibold mb-3" style={{ color: "#64748b" }}>Trend mensual</div>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={monthlyData}>
                <Line type="monotone" dataKey="incidencias" stroke="#ef4444" strokeWidth={2} dot={false} name="Incidencias" />
                <Tooltip 
                  contentStyle={{ background: "rgba(255,255,255,0.95)", border: "none", borderRadius: 8, color: "#0f172a", fontSize: 11, boxShadow: "0 10px 25px rgba(0,0,0,0.5)" }}
                  itemStyle={{ color: "#334155", fontWeight: 600 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
