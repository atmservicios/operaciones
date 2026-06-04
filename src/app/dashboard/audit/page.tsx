"use client";

import { Search, Filter } from "lucide-react";
import { mockActivityLogs } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/utils";
import { useState } from "react";

const ACTION_COLOR: Record<string, string> = {
  "Cierre de OT": "#72b01d",
  "Actualización de estado": "#93c947",
  "Creación de OT": "#72b01d",
  "Asignación de técnico": "#f59e0b",
  "Subida de evidencia": "#93c947",
  "Modificación de inventario": "#f59e0b",
  "Reprogramación de OT": "#f97316",
  Login: "#64748b",
};

const ENTITY_ICONS: Record<string, string> = {
  WorkOrder: "📋",
  Evidence: "📷",
  Inventory: "📦",
  Auth: "🔐",
};

export default function AuditPage() {
  const [search, setSearch] = useState("");

  const filtered = mockActivityLogs.filter((l) =>
    search === "" ||
    [l.userName, l.action, l.details, l.entityType].some((f) =>
      f.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Auditoría del Sistema</h2>
          <p className="section-subtitle">Registro completo de actividad y cambios</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(114,176,29,0.08)", border: "1px solid rgba(114,176,29,0.2)", color: "#93c947" }}>
          {mockActivityLogs.length} eventos registrados
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total eventos", value: mockActivityLogs.length, color: "#93c947" },
          { label: "Usuarios activos", value: new Set(mockActivityLogs.map(l => l.userId)).size, color: "#72b01d" },
          { label: "Cambios OT", value: mockActivityLogs.filter(l => l.entityType === "WorkOrder").length, color: "#72b01d" },
          { label: "Logins hoy", value: mockActivityLogs.filter(l => l.action === "Login").length, color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} className="stat-card py-3">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs" style={{ color: "#64748b" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="glass-card p-4 flex gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
          <input className="ops-input pl-9" placeholder="Buscar por usuario, acción, entidad…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Filter size={14} style={{ color: "#475569" }} />
        <span className="text-xs" style={{ color: "#475569" }}>{filtered.length} registros</span>
      </div>

      {/* Log table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Fecha / Hora</th><th>Usuario</th><th>Acción</th>
                <th>Entidad</th><th>Detalle</th><th>IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div className="font-mono text-xs" style={{ color: "#64748b" }}>{formatDateTime(log.createdAt)}</div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="tech-avatar" style={{ width: 26, height: 26, fontSize: 10 }}>{log.userName.charAt(0)}</div>
                      <span style={{ color: "#e2e8f0", fontSize: 13 }}>{log.userName}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                      background: `${ACTION_COLOR[log.action] ?? "#64748b"}15`,
                      color: ACTION_COLOR[log.action] ?? "#64748b",
                      border: `1px solid ${ACTION_COLOR[log.action] ?? "#64748b"}25`,
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 14 }}>{ENTITY_ICONS[log.entityType]}</span>
                    <span className="text-xs ml-1.5" style={{ color: "#94a3b8" }}>{log.entityType}</span>
                  </td>
                  <td style={{ color: "#94a3b8", fontSize: 12, maxWidth: 250 }}>
                    <div className="truncate">{log.details}</div>
                  </td>
                  <td>
                    <span className="font-mono text-xs" style={{ color: "#334155" }}>{log.ipAddress}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
