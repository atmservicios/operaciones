"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
} from "recharts";
import { TrendingUp, Clock, Target, AlertTriangle, Download, FileSpreadsheet } from "lucide-react";
import { mockATMs, mockTechnicians, mockWorkOrders, monthlyData } from "@/lib/mock-data";

const slaByBank = [
  { bank: "BancoEstado", sla: 94, ordenes: 87 },
  { bank: "Santander", sla: 88, ordenes: 62 },
  { bank: "BCI", sla: 91, ordenes: 48 },
  { bank: "Itaú", sla: 97, ordenes: 35 },
  { bank: "B. Chile", sla: 85, ordenes: 71 },
  { bank: "Scotiabank", sla: 92, ordenes: 41 },
];

const techProductivity = mockTechnicians.map((t) => ({
  name: t.name.split(" ").slice(0, 2).join(" "),
  ordenes: t.completedOrders,
  productividad: t.productivity,
  avgTime: t.avgTime,
})).sort((a, b) => b.ordenes - a.ordenes);

const atmFaults = mockATMs.filter(a => a.status === "falla" || a.technicalHistory?.length).map(a => ({
  code: a.code,
  fallas: a.technicalHistory?.length ?? 1,
  cliente: a.clientName,
})).sort((a, b) => b.fallas - a.fallas);

const costData = [
  { month: "Ene", preventivo: 2800000, correctivo: 1200000, total: 4000000 },
  { month: "Feb", preventivo: 2600000, correctivo: 900000, total: 3500000 },
  { month: "Mar", preventivo: 3100000, correctivo: 1500000, total: 4600000 },
  { month: "Abr", preventivo: 2900000, correctivo: 800000, total: 3700000 },
  { month: "May", preventivo: 2700000, correctivo: 1100000, total: 3800000 },
];

const fmtCLP = (v: number) => `$${(v / 1000000).toFixed(1)}M`;

export default function ExecutivePage() {
  const avgSLA = Math.round(slaByBank.reduce((s, b) => s + b.sla, 0) / slaByBank.length);
  const avgResponse = 2.4;
  const totalOrders = mockWorkOrders.length;
  const closedOrders = mockWorkOrders.filter(o => o.status === "finalizada").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
              <Tooltip contentStyle={{ background: "#1b1e24", border: "1px solid rgba(114,176,29,0.2)", borderRadius: 8, color: "#e2e8f0", fontSize: 12 }} />
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
              <Tooltip contentStyle={{ background: "#1b1e24", border: "1px solid rgba(114,176,29,0.2)", borderRadius: 8, color: "#e2e8f0", fontSize: 12 }} formatter={(v: any) => [`$${(Number(v) / 1000).toFixed(0)}k`, ""]} />
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
              <Tooltip contentStyle={{ background: "#1b1e24", border: "1px solid rgba(114,176,29,0.2)", borderRadius: 8, color: "#e2e8f0", fontSize: 12 }} />
              <Bar dataKey="ordenes" radius={[0, 6, 6, 0]} fill="#72b01d" name="Órdenes" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <div className="font-semibold text-sm mb-1" style={{ color: "#f1f5f9" }}>ATMs con más Intervenciones</div>
          <div className="text-xs mb-4" style={{ color: "#475569" }}>Historial técnico acumulado</div>
          <div className="space-y-3">
            {mockATMs.filter(a => a.technicalHistory && a.technicalHistory.length > 0).map((a) => (
              <div key={a.id}>
                <div className="flex justify-between text-xs mb-1">
                  <div>
                    <span className="font-mono font-semibold" style={{ color: "#93c947" }}>{a.code}</span>
                    <span style={{ color: "#475569" }}> — {a.clientName}</span>
                  </div>
                  <span style={{ color: "#94a3b8" }}>{a.technicalHistory!.length} intervenciones</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-2 rounded-full" style={{
                    width: `${(a.technicalHistory!.length / 5) * 100}%`,
                    background: a.status === "falla" ? "#ef4444" : "#72b01d"
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
                <Tooltip contentStyle={{ background: "#1b1e24", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, fontSize: 11 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
