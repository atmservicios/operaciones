"use client";

import { useState } from "react";
import {
  Search, Plus, Eye, Wifi, WifiOff, MapPin, Wrench, X, Clock,
  CheckCircle2, AlertTriangle, ArrowUpRight, Calendar,
} from "lucide-react";
import { mockATMs } from "@/lib/mock-data";
import { getStatusBg, formatDate } from "@/lib/utils";
import type { ATM, ATMStatus } from "@/types";

const STATUS_OPTS: ATMStatus[] = ["operativo", "falla", "mantencion", "traslado"];

const STATUS_ICON: Record<ATMStatus, React.ReactNode> = {
  operativo: <CheckCircle2 size={13} />,
  falla: <AlertTriangle size={13} />,
  mantencion: <Wrench size={13} />,
  traslado: <ArrowUpRight size={13} />,
};

// ─── ATM Detail Modal ─────────────────────────────────────────────────────────
function ATMModal({ atm, onClose }: { atm: ATM; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div className="flex items-start justify-between p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: "#72b01d" }}>FICHA ATM</div>
            <h3 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>{atm.code}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`status-badge ${getStatusBg(atm.status)}`}>
                {STATUS_ICON[atm.status]} {atm.status}
              </span>
              <span className="text-xs" style={{ color: "#475569" }}>{atm.brand} — {atm.model}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Número de serie", value: atm.serial },
              { label: "Modelo", value: atm.model },
              { label: "Cliente", value: atm.clientName },
              { label: "Banco", value: atm.bankName },
              { label: "Última mantención", value: formatDate(atm.lastMaintenance) },
              { label: "Próxima revisión", value: formatDate(atm.nextRevision) },
            ].map((f) => (
              <div key={f.label} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="text-xs mb-1" style={{ color: "#475569" }}>{f.label}</div>
                <div className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>{f.value}</div>
              </div>
            ))}
          </div>

          {/* Location */}
          <div className="p-3 rounded-xl flex items-start gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <MapPin size={16} style={{ color: "#72b01d", flexShrink: 0, marginTop: 2 }} />
            <div>
              <div className="text-xs mb-0.5" style={{ color: "#475569" }}>Ubicación</div>
              <div className="text-sm" style={{ color: "#e2e8f0" }}>{atm.address}</div>
              <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>{atm.city} — {atm.region}</div>
              <div className="text-xs mt-0.5 font-mono" style={{ color: "#334155" }}>
                {atm.lat.toFixed(4)}°, {atm.lng.toFixed(4)}°
              </div>
            </div>
          </div>

          {/* Router */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: atm.routerInstalled ? "rgba(114,176,29,0.05)" : "rgba(239,68,68,0.05)", border: `1px solid ${atm.routerInstalled ? "rgba(114,176,29,0.15)" : "rgba(239,68,68,0.15)"}` }}>
            {atm.routerInstalled ? <Wifi size={16} color="#72b01d" /> : <WifiOff size={16} color="#ef4444" />}
            <div>
              <div className="text-sm font-semibold" style={{ color: atm.routerInstalled ? "#10b981" : "#f87171" }}>
                Router {atm.routerInstalled ? "instalado" : "no instalado"}
              </div>
              <div className="text-xs" style={{ color: "#475569" }}>
                {atm.routerInstalled ? "Conectividad remota activa" : "Sin conectividad remota"}
              </div>
            </div>
          </div>

          {/* Technical history */}
          {atm.technicalHistory && atm.technicalHistory.length > 0 && (
            <div>
              <div className="text-sm font-semibold mb-3" style={{ color: "#94a3b8" }}>Historial Técnico</div>
              <div className="space-y-2">
                {atm.technicalHistory.map((ev) => (
                  <div key={ev.id} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color: "#93c947" }}>{ev.type}</span>
                      <span className="text-xs" style={{ color: "#475569" }}>{formatDate(ev.date)}</span>
                    </div>
                    <div className="text-sm" style={{ color: "#e2e8f0" }}>{ev.description}</div>
                    <div className="text-xs mt-1" style={{ color: "#64748b" }}>Técnico: {ev.technicianName}</div>
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

// ─── ATM Card ─────────────────────────────────────────────────────────────────
function ATMCard({ atm, onClick }: { atm: ATM; onClick: () => void }) {
  const STATUS_BG: Record<ATMStatus, string> = {
    operativo: "rgba(114,176,29,0.08)", falla: "rgba(239,68,68,0.08)",
    mantencion: "rgba(245,158,11,0.08)", traslado: "rgba(147,201,71,0.08)",
  };
  const STATUS_BORDER: Record<ATMStatus, string> = {
    operativo: "rgba(114,176,29,0.2)", falla: "rgba(239,68,68,0.2)",
    mantencion: "rgba(245,158,11,0.2)", traslado: "rgba(147,201,71,0.2)",
  };

  return (
    <div className="glass-card-hover p-4 cursor-pointer" onClick={onClick} style={{ borderColor: STATUS_BORDER[atm.status] }}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-mono font-bold text-sm" style={{ color: "#72b01d" }}>{atm.code}</div>
          <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>{atm.brand} {atm.model}</div>
        </div>
        <span className={`status-badge ${getStatusBg(atm.status)}`}>
          {STATUS_ICON[atm.status]} {atm.status}
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-xs" style={{ color: "#94a3b8" }}>
          <MapPin size={11} style={{ color: "#475569" }} />
          <span className="truncate">{atm.city}, {atm.region}</span>
        </div>
        <div className="text-xs truncate" style={{ color: "#64748b" }}>{atm.address}</div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold" style={{ color: "#e2e8f0" }}>{atm.clientName}</span>
          {atm.routerInstalled
            ? <Wifi size={11} color="#72b01d" />
            : <WifiOff size={11} color="#64748b" />}
        </div>
      </div>

      <div className="divider my-2" />
      <div className="flex justify-between text-xs" style={{ color: "#475569" }}>
        <span>Últ. mant: {formatDate(atm.lastMaintenance)}</span>
        <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(atm.nextRevision)}</span>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ATMsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedATM, setSelectedATM] = useState<ATM | null>(null);

  const regions = Array.from(new Set(mockATMs.map((a) => a.region)));

  const filtered = mockATMs.filter((a) => {
    const matchSearch = search === "" || [a.code, a.clientName, a.address, a.city, a.serial, a.model].some(
      (f) => f.toLowerCase().includes(search.toLowerCase())
    );
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const matchRegion = regionFilter === "all" || a.region === regionFilter;
    return matchSearch && matchStatus && matchRegion;
  });

  const statsByStatus = STATUS_OPTS.map((s) => ({
    status: s,
    count: mockATMs.filter((a) => a.status === s).length,
  }));

  const STATUS_COLOR: Record<ATMStatus, string> = {
    operativo: "#72b01d", falla: "#ef4444", mantencion: "#f59e0b", traslado: "#93c947",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title">Cajeros ATM</h2>
          <p className="section-subtitle">Gestión y monitoreo de {mockATMs.length} cajeros registrados</p>
        </div>
        <button className="btn-primary"><Plus size={16} /> Registrar ATM</button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsByStatus.map(({ status, count }) => (
          <button key={status} onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
            className="stat-card text-left transition-all"
            style={{ border: statusFilter === status ? `1px solid ${STATUS_COLOR[status as ATMStatus]}40` : undefined }}>
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: STATUS_COLOR[status as ATMStatus] }}>{STATUS_ICON[status as ATMStatus]}</span>
              <span className="text-xs font-semibold capitalize" style={{ color: "#64748b" }}>{status}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: STATUS_COLOR[status as ATMStatus] }}>{count}</div>
            <div className="text-xs mt-0.5" style={{ color: "#475569" }}>{Math.round(count / mockATMs.length * 100)}% del total</div>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
          <input className="ops-input pl-9" placeholder="Buscar ATM, cliente, dirección, serie…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="ops-select text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Todos los estados</option>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select className="ops-select text-sm" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
          <option value="all">Todas las regiones</option>
          {regions.map(r => <option key={r}>{r}</option>)}
        </select>
        <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
          {(["grid", "table"] as const).map((m) => (
            <button key={m} onClick={() => setViewMode(m)}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={{ background: viewMode === m ? "rgba(114,176,29,0.15)" : "transparent", color: viewMode === m ? "#72b01d" : "#64748b", border: "none", cursor: "pointer" }}>
              {m === "grid" ? "Tarjetas" : "Tabla"}
            </button>
          ))}
        </div>
        <div className="text-xs" style={{ color: "#475569" }}>{filtered.length} ATMs</div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((a) => (
            <ATMCard key={a.id} atm={a} onClick={() => setSelectedATM(a)} />
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="ops-table">
              <thead>
                <tr><th>Código</th><th>Modelo</th><th>Cliente</th><th>Ciudad</th><th>Región</th><th>Router</th><th>Últ. Mantención</th><th>Estado</th><th>Ver</th></tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id}>
                    <td><span className="font-mono font-semibold text-xs" style={{ color: "#72b01d" }}>{a.code}</span></td>
                    <td style={{ color: "#94a3b8", fontSize: 12 }}>{a.brand} {a.model}</td>
                    <td style={{ color: "#cbd5e1" }}>{a.clientName}</td>
                    <td style={{ color: "#94a3b8" }}>{a.city}</td>
                    <td style={{ color: "#64748b", fontSize: 12 }}>{a.region}</td>
                    <td>{a.routerInstalled ? <Wifi size={14} color="#72b01d" /> : <WifiOff size={14} color="#64748b" />}</td>
                    <td style={{ color: "#64748b", fontSize: 12 }}>{formatDate(a.lastMaintenance)}</td>
                    <td><span className={`status-badge ${getStatusBg(a.status)}`}>{STATUS_ICON[a.status]} {a.status}</span></td>
                    <td>
                      <button onClick={() => setSelectedATM(a)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(114,176,29,0.08)", color: "#72b01d", border: "none", cursor: "pointer" }}>
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedATM && <ATMModal atm={selectedATM} onClose={() => setSelectedATM(null)} />}
    </div>
  );
}
