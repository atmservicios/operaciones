"use client";

import { useState } from "react";
import { MapPin, Layers, Filter, Navigation, AlertTriangle, CheckCircle2, Wrench, ArrowUpRight, Info, X, Users, Monitor } from "lucide-react";
import { mockATMs, mockTechnicians } from "@/lib/mock-data";
import { getStatusBg } from "@/lib/utils";
import type { ATMStatus } from "@/types";

const ATM_STATUS_COLOR: Record<ATMStatus, string> = {
  operativo: "#72b01d",
  falla: "#ef4444",
  mantencion: "#f59e0b",
  traslado: "#93c947",
};

const ATM_STATUS_ICON: Record<ATMStatus, React.ReactNode> = {
  operativo: <CheckCircle2 size={11} />,
  falla: <AlertTriangle size={11} />,
  mantencion: <Wrench size={11} />,
  traslado: <ArrowUpRight size={11} />,
};

const TECH_STATUS_COLOR: Record<string, string> = {
  disponible: "#72b01d",
  "en ruta": "#93c947",
  trabajando: "#f59e0b",
  offline: "#64748b",
};

export default function MapPage() {
  const [atmFilter, setAtmFilter] = useState<string>("all");
  const [techFilter, setTechFilter] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<{ type: "atm" | "tech"; id: string } | null>(null);

  const filteredATMs = mockATMs.filter((a) => atmFilter === "all" || a.status === atmFilter);
  const selectedATM = selectedItem?.type === "atm" ? mockATMs.find((a) => a.id === selectedItem.id) : null;
  const selectedTech = selectedItem?.type === "tech" ? mockTechnicians.find((t) => t.id === selectedItem.id) : null;

  // Chile bounding box roughly -17.5 to -55.9 lat, -75.6 to -66.4 lng
  // We'll create a visual SVG map representation
  const mapATMs = filteredATMs.map((a) => ({
    ...a,
    // Map lat/lng to percentage coordinates within a Chile-shaped container
    // lat: -17 to -56, lng: -76 to -66
    x: ((a.lng - (-76)) / ((-66) - (-76))) * 100,
    y: ((a.lat - (-17)) / ((-56) - (-17))) * 100,
  }));

  const mapTechs = techFilter ? mockTechnicians.map((t) => {
    const atm = mockATMs.find((a) => a.region === t.region);
    const baseLat = atm ? atm.lat + (Math.random() - 0.5) * 2 : -33.4;
    const baseLng = atm ? atm.lng + (Math.random() - 0.5) * 2 : -70.6;
    return {
      ...t,
      x: ((baseLng - (-76)) / ((-66) - (-76))) * 100,
      y: ((baseLat - (-17)) / ((-56) - (-17))) * 100,
    };
  }) : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title">Mapa Operacional</h2>
          <p className="section-subtitle">Visión en tiempo real de ATMs y técnicos en campo</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(114,176,29,0.08)", border: "1px solid rgba(114,176,29,0.2)", color: "#93c947" }}>
          <div className="w-2 h-2 rounded-full bg-brand-400" style={{ boxShadow: "0 0 6px #72b01d" }} />
          En vivo
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "ATMs Operativos", value: mockATMs.filter(a => a.status === "operativo").length, color: "#72b01d" },
          { label: "ATMs con Falla", value: mockATMs.filter(a => a.status === "falla").length, color: "#ef4444" },
          { label: "Técnicos En ruta", value: mockTechnicians.filter(t => t.status === "en ruta").length, color: "#93c947" },
          { label: "Técnicos Trabajando", value: mockTechnicians.filter(t => t.status === "trabajando").length, color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} className="stat-card py-3">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs" style={{ color: "#64748b" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" style={{ height: "calc(100vh - 320px)", minHeight: "500px" }}>
        {/* Map */}
        <div className="lg:col-span-3 map-container relative" style={{ minHeight: "500px" }}>
          {/* Map controls */}
          <div className="absolute top-4 left-4 z-10 space-y-2">
            <div className="glass-card p-3 space-y-2" style={{ minWidth: "180px" }}>
              <div className="text-xs font-semibold mb-2" style={{ color: "#94a3b8" }}>
                <Filter size={11} className="inline mr-1" /> Filtros
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: "#475569" }}>Estado ATM</div>
                <select className="ops-select text-xs w-full" value={atmFilter} onChange={(e) => setAtmFilter(e.target.value)}>
                  <option value="all">Todos</option>
                  <option value="operativo">Operativos</option>
                  <option value="falla">Con falla</option>
                  <option value="mantencion">Mantención</option>
                  <option value="traslado">Traslado</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={techFilter} onChange={(e) => setTechFilter(e.target.checked)} style={{ accentColor: "#72b01d" }} />
                <span className="text-xs" style={{ color: "#94a3b8" }}>Mostrar técnicos</span>
              </label>
            </div>

            {/* Legend */}
            <div className="glass-card p-3 space-y-1.5">
              <div className="text-xs font-semibold mb-2" style={{ color: "#94a3b8" }}>
                <Layers size={11} className="inline mr-1" /> Leyenda
              </div>
              {(["operativo", "falla", "mantencion", "traslado"] as ATMStatus[]).map((s) => (
                <div key={s} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ background: ATM_STATUS_COLOR[s] }} />
                  <span style={{ color: "#64748b", textTransform: "capitalize" }}>ATM {s}</span>
                </div>
              ))}
              <div className="divider my-1" />
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full border-2 border-white" style={{ background: "#93c947" }} />
                <span style={{ color: "#64748b" }}>Técnico</span>
              </div>
            </div>
          </div>

          {/* Info card on selection */}
          {(selectedATM || selectedTech) && (
            <div className="absolute top-4 right-4 z-10 w-64 glass-card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="text-xs font-semibold" style={{ color: selectedATM ? "#72b01d" : "#93c947" }}>
                  {selectedATM ? "📍 ATM" : "👤 TÉCNICO"}
                </div>
                <button onClick={() => setSelectedItem(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569" }}>
                  <X size={14} />
                </button>
              </div>
              {selectedATM && (
                <div className="space-y-2">
                  <div className="font-bold text-sm" style={{ color: "#f1f5f9" }}>{selectedATM.code}</div>
                  <div className="text-xs" style={{ color: "#64748b" }}>{selectedATM.brand} {selectedATM.model}</div>
                  <span className={`status-badge ${getStatusBg(selectedATM.status)}`}>{selectedATM.status}</span>
                  <div className="text-xs" style={{ color: "#94a3b8" }}>{selectedATM.address}</div>
                  <div className="text-xs" style={{ color: "#64748b" }}>{selectedATM.clientName} — {selectedATM.city}</div>
                </div>
              )}
              {selectedTech && (
                <div className="space-y-2">
                  <div className="font-bold text-sm" style={{ color: "#f1f5f9" }}>{selectedTech.name}</div>
                  <span className={`status-badge ${getStatusBg(selectedTech.status)}`}>{selectedTech.status}</span>
                  <div className="text-xs" style={{ color: "#94a3b8" }}>{selectedTech.region}</div>
                  <div className="text-xs" style={{ color: "#64748b" }}>{selectedTech.vehicle}</div>
                  <div className="text-xs font-semibold" style={{ color: "#72b01d" }}>{selectedTech.completedOrders} órdenes completadas</div>
                </div>
              )}
            </div>
          )}

          {/* SVG Interactive Map */}
          <div className="w-full h-full relative" style={{ background: "linear-gradient(135deg, #121418 0%, #1b1e24 50%, #121418 100%)" }}>
            {/* Grid lines */}
            <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.04 }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <g key={i}>
                  <line x1={`${i * 10}%`} y1="0" x2={`${i * 10}%`} y2="100%" stroke="#72b01d" strokeWidth="1" />
                  <line x1="0" y1={`${i * 10}%`} x2="100%" y2={`${i * 10}%`} stroke="#72b01d" strokeWidth="1" />
                </g>
              ))}
            </svg>

            {/* Chile outline hint */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: 0.03 }}>
              <div style={{ width: "60%", height: "85%", border: "2px solid #72b01d", borderRadius: "8px" }} />
            </div>

            {/* Region labels */}
            {[
              { name: "Tarapacá", x: 45, y: 8 },
              { name: "Antofagasta", x: 50, y: 20 },
              { name: "Metropolitana", x: 40, y: 50 },
              { name: "Valparaíso", x: 30, y: 48 },
              { name: "Biobío", x: 42, y: 65 },
            ].map((r) => (
              <div key={r.name} className="absolute text-xs font-medium" style={{ left: `${r.x}%`, top: `${r.y}%`, color: "rgba(148,163,184,0.3)", transform: "translate(-50%, -50%)", whiteSpace: "nowrap", pointerEvents: "none" }}>
                {r.name}
              </div>
            ))}

            {/* ATM markers */}
            {mapATMs.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedItem({ type: "atm", id: a.id })}
                title={`${a.code} — ${a.status}`}
                style={{
                  position: "absolute",
                  left: `${Math.max(5, Math.min(95, a.x))}%`,
                  top: `${Math.max(5, Math.min(95, a.y))}%`,
                  transform: "translate(-50%, -50%)",
                  background: ATM_STATUS_COLOR[a.status],
                  width: selectedItem?.id === a.id ? 20 : 14,
                  height: selectedItem?.id === a.id ? 20 : 14,
                  borderRadius: "50%",
                  border: `2px solid ${selectedItem?.id === a.id ? "white" : "rgba(0,0,0,0.4)"}`,
                  cursor: "pointer",
                  boxShadow: `0 0 8px ${ATM_STATUS_COLOR[a.status]}60`,
                  transition: "all 0.2s ease",
                  zIndex: selectedItem?.id === a.id ? 20 : 10,
                }}
              />
            ))}

            {/* Technician markers */}
            {mapTechs.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedItem({ type: "tech", id: t.id })}
                title={`${t.name} — ${t.status}`}
                style={{
                  position: "absolute",
                  left: `${Math.max(5, Math.min(95, t.x + (Math.random() - 0.5) * 8))}%`,
                  top: `${Math.max(5, Math.min(95, t.y + (Math.random() - 0.5) * 5))}%`,
                  transform: "translate(-50%, -50%)",
                  background: TECH_STATUS_COLOR[t.status],
                  width: 10,
                  height: 10,
                  borderRadius: "2px",
                  border: "2px solid rgba(255,255,255,0.6)",
                  cursor: "pointer",
                  boxShadow: `0 0 6px ${TECH_STATUS_COLOR[t.status]}60`,
                  zIndex: 15,
                  transition: "all 0.2s ease",
                }}
              />
            ))}

            {/* Map label */}
            <div className="absolute bottom-4 left-4 text-xs font-semibold" style={{ color: "#475569" }}>
              inetmatica — Mapa Operacional • Chile
            </div>
            <div className="absolute bottom-4 right-4 flex items-center gap-1 text-xs" style={{ color: "#475569" }}>
              <Navigation size={11} />
              {filteredATMs.length} ATMs · {techFilter ? mockTechnicians.length : 0} técnicos
            </div>

            {/* Note */}
            <div className="absolute bottom-8 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: "rgba(114,176,29,0.08)", color: "#94a3b8", border: "1px solid rgba(114,176,29,0.1)" }}>
              <Info size={11} />
              Conecta Google Maps API para mapa completo
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-3 overflow-y-auto">
          {/* ATM list */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Monitor size={14} style={{ color: "#72b01d" }} />
              <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>ATMs</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "rgba(114,176,29,0.1)", color: "#93c947" }}>{filteredATMs.length}</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {filteredATMs.map((a) => (
                <button key={a.id} onClick={() => setSelectedItem({ type: "atm", id: a.id })}
                  className="w-full text-left p-2 rounded-lg transition-colors hover:bg-white/5"
                  style={{ background: selectedItem?.id === a.id ? "rgba(114,176,29,0.08)" : "transparent", border: "none", cursor: "pointer" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ATM_STATUS_COLOR[a.status] }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs font-semibold truncate" style={{ color: "#93c947" }}>{a.code}</div>
                      <div className="text-xs truncate" style={{ color: "#475569" }}>{a.city}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Technician list */}
          {techFilter && (
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} style={{ color: "#93c947" }} />
                <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>Técnicos</span>
                <span className="text-xs px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "rgba(147,201,71,0.1)", color: "#93c947" }}>{mockTechnicians.length}</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {mockTechnicians.filter(t => t.status !== "offline").map((t) => (
                  <button key={t.id} onClick={() => setSelectedItem({ type: "tech", id: t.id })}
                    className="w-full text-left p-2 rounded-lg transition-colors hover:bg-white/5"
                    style={{ background: selectedItem?.id === t.id ? "rgba(147,201,71,0.08)" : "transparent", border: "none", cursor: "pointer" }}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded" style={{ background: TECH_STATUS_COLOR[t.status] }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate" style={{ color: "#e2e8f0" }}>{t.name.split(" ").slice(0, 2).join(" ")}</div>
                        <div className="text-xs capitalize truncate" style={{ color: "#475569" }}>{t.status}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
