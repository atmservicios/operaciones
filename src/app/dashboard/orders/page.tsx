"use client";

import { useState } from "react";
import {
  Search, Filter, Plus, Eye, Edit2, Clock, CheckCircle2, XCircle,
  AlertTriangle, RotateCcw, ChevronDown, X, CalendarDays, User,
  MapPin, ChevronRight, ClipboardList,
} from "lucide-react";
import { mockWorkOrders } from "@/lib/mock-data";
import { getStatusBg, formatDate, formatDateTime } from "@/lib/utils";
import type { WorkOrder, OrderStatus, Priority } from "@/types";

const STATUS_OPTIONS: OrderStatus[] = [
  "creada", "asignada", "en ruta", "en proceso", "pausada", "finalizada", "reprogramada", "cancelada",
];

const PRIORITY_OPTIONS: Priority[] = ["baja", "media", "alta", "critica"];

const PRIO_COLOR: Record<string, string> = {
  critica: "#ef4444", alta: "#f59e0b", media: "#3b82f6", baja: "#64748b",
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  creada: <Clock size={12} />,
  asignada: <User size={12} />,
  "en ruta": <ChevronRight size={12} />,
  "en proceso": <AlertTriangle size={12} />,
  pausada: <RotateCcw size={12} />,
  finalizada: <CheckCircle2 size={12} />,
  reprogramada: <CalendarDays size={12} />,
  cancelada: <XCircle size={12} />,
};

// ─── Order Detail Modal ────────────────────────────────────────────────────────
function OrderModal({ order, onClose }: { order: WorkOrder; onClose: () => void }) {
  const timeline = [
    { status: "Creada", date: order.createdAt, done: true },
    { status: "Asignada", date: order.scheduledDate, done: ["asignada","en ruta","en proceso","finalizada"].includes(order.status) },
    { status: "En proceso", date: order.scheduledDate, done: ["en proceso","finalizada"].includes(order.status) },
    { status: "Finalizada", date: order.closureNotes ? order.scheduledDate : "", done: order.status === "finalizada" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-2xl rounded-2xl overflow-hidden" style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(27,30,36,0.95)" }}>
          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: "#72b01d" }}>ORDEN DE TRABAJO</div>
            <h3 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>{order.otNumber}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`status-badge ${getStatusBg(order.status)}`}>{order.status}</span>
              <div className="flex items-center gap-1">
                <div className="priority-dot" style={{ background: PRIO_COLOR[order.priority] }} />
                <span style={{ fontSize: 12, color: PRIO_COLOR[order.priority], fontWeight: 600, textTransform: "capitalize" }}>{order.priority}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Cliente", value: order.clientName },
              { label: "Banco", value: order.bankName },
              { label: "Código ATM", value: order.atmCode },
              { label: "Técnico", value: order.technicianName ?? "Sin asignar" },
              { label: "Fecha creación", value: formatDateTime(order.createdAt) },
              { label: "Fecha programada", value: formatDate(order.scheduledDate) },
            ].map((f) => (
              <div key={f.label} className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="text-xs mb-1" style={{ color: "#475569" }}>{f.label}</div>
                <div className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>{f.value}</div>
              </div>
            ))}
          </div>

          {/* Address */}
          <div className="p-3 rounded-xl flex items-start gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <MapPin size={16} style={{ color: "#72b01d", flexShrink: 0, marginTop: 2 }} />
            <div>
              <div className="text-xs mb-1" style={{ color: "#475569" }}>Dirección</div>
              <div className="text-sm" style={{ color: "#e2e8f0" }}>{order.address}</div>
              <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>{order.city} — {order.region}</div>
            </div>
          </div>

          {/* Observations */}
          {order.observations && (
            <div className="p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="text-xs mb-1" style={{ color: "#475569" }}>Observaciones</div>
              <div className="text-sm" style={{ color: "#e2e8f0" }}>{order.observations}</div>
            </div>
          )}

          {/* Closure notes */}
          {order.closureNotes && (
            <div className="p-3 rounded-xl" style={{ background: "rgba(114,176,29,0.05)", border: "1px solid rgba(114,176,29,0.15)" }}>
              <div className="text-xs mb-1" style={{ color: "#93c947" }}>Notas de cierre</div>
              <div className="text-sm" style={{ color: "#e2e8f0" }}>{order.closureNotes}</div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <div className="text-sm font-semibold mb-3" style={{ color: "#94a3b8" }}>Timeline</div>
            <div className="flex items-center gap-2">
              {timeline.map((t, i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: t.done ? "rgba(114,176,29,0.15)" : "rgba(255,255,255,0.05)", border: `2px solid ${t.done ? "#72b01d" : "rgba(255,255,255,0.1)"}` }}>
                      {t.done ? <CheckCircle2 size={14} color="#72b01d" /> : <Clock size={14} color="#475569" />}
                    </div>
                    <div className="text-xs text-center" style={{ color: t.done ? "#93c947" : "#475569" }}>{t.status}</div>
                  </div>
                  {i < timeline.length - 1 && (
                    <div style={{ height: 2, flex: 1, background: t.done ? "#72b01d" : "rgba(255,255,255,0.08)", borderRadius: 1, marginBottom: 20 }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Create Order Modal ────────────────────────────────────────────────────────
function CreateOrderModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ client: "", atm: "", priority: "media", scheduledDate: "", observations: "" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid rgba(114,176,29,0.12)" }}>
          <div>
            <div className="text-xs font-semibold mb-1" style={{ color: "#72b01d" }}>NUEVA</div>
            <h3 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>Crear Orden de Trabajo</h3>
          </div>
          <button onClick={onClose} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Cliente *</label>
              <select className="ops-select w-full" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })}>
                <option value="">Seleccionar…</option>
                {["BancoEstado","Banco Santander","BCI","Banco Itaú","Banco de Chile","Scotiabank"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Prioridad *</label>
              <select className="ops-select w-full" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Código ATM</label>
            <input className="ops-input" placeholder="Ej: BE-SCL-001" value={form.atm} onChange={(e) => setForm({ ...form, atm: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Fecha programada</label>
            <input type="datetime-local" className="ops-input" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Observaciones</label>
            <textarea className="ops-input resize-none" rows={3} placeholder="Descripción del problema o trabajo a realizar…" value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
            <button onClick={onClose} className="btn-primary">
              <Plus size={15} /> Crear Orden
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = mockWorkOrders.filter((o) => {
    const matchSearch = search === "" || [o.otNumber, o.clientName, o.atmCode, o.technicianName, o.address].some(
      (f) => f?.toLowerCase().includes(search.toLowerCase())
    );
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchPriority = priorityFilter === "all" || o.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const stats = {
    total: mockWorkOrders.length,
    pendientes: mockWorkOrders.filter(o => !["finalizada","cancelada"].includes(o.status)).length,
    finalizadas: mockWorkOrders.filter(o => o.status === "finalizada").length,
    criticas: mockWorkOrders.filter(o => o.priority === "critica").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Órdenes de Trabajo</h2>
          <p className="section-subtitle">Gestión completa de órdenes de servicio técnico</p>
        </div>
        <button id="create-order-btn" onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> Nueva OT
        </button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "#72b01d" },
          { label: "Pendientes", value: stats.pendientes, color: "#f59e0b" },
          { label: "Finalizadas", value: stats.finalizadas, color: "#93c947" },
          { label: "Críticas", value: stats.criticas, color: "#ef4444" },
        ].map((s) => (
          <div key={s.label} className="stat-card py-3">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: "#64748b" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
          <input
            id="orders-search"
            className="ops-input pl-9"
            placeholder="Buscar por OT, cliente, ATM…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: "#475569" }} />
          <select id="status-filter" className="ops-select text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Todos los estados</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <select id="priority-filter" className="ops-select text-sm" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">Todas las prioridades</option>
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
        <div className="text-xs" style={{ color: "#475569" }}>{filtered.length} resultados</div>
      </div>

      {/* Orders table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="ops-table">
            <thead>
              <tr>
                <th>OT #</th><th>Cliente / Banco</th><th>ATM</th><th>Dirección</th>
                <th>Técnico</th><th>Programada</th><th>Prioridad</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td>
                    <button onClick={() => setSelectedOrder(o)} className="font-mono font-semibold text-xs" style={{ color: "#93c947", background: "none", border: "none", cursor: "pointer" }}>
                      {o.otNumber}
                    </button>
                  </td>
                  <td>
                    <div style={{ color: "#e2e8f0", fontSize: 13 }}>{o.clientName}</div>
                    <div style={{ color: "#475569", fontSize: 11 }}>{o.bankName}</div>
                  </td>
                  <td><span className="font-mono text-xs" style={{ color: "#94a3b8" }}>{o.atmCode}</span></td>
                  <td>
                    <div style={{ color: "#94a3b8", fontSize: 12, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.address}</div>
                    <div style={{ color: "#475569", fontSize: 11 }}>{o.city}</div>
                  </td>
                  <td>
                    {o.technicianName ? (
                      <div className="flex items-center gap-2">
                        <div className="tech-avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{o.technicianName.charAt(0)}</div>
                        <span style={{ color: "#94a3b8", fontSize: 12 }}>{o.technicianName.split(" ").slice(0, 2).join(" ")}</span>
                      </div>
                    ) : (
                      <span style={{ color: "#334155", fontSize: 12 }}>Sin asignar</span>
                    )}
                  </td>
                  <td style={{ color: "#64748b", fontSize: 12 }}>{formatDate(o.scheduledDate)}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <div className="priority-dot" style={{ background: PRIO_COLOR[o.priority] }} />
                      <span style={{ fontSize: 12, color: PRIO_COLOR[o.priority], fontWeight: 600, textTransform: "capitalize" }}>{o.priority}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBg(o.status)}`}>
                      {STATUS_ICON[o.status]} {o.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelectedOrder(o)} title="Ver detalle" className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" style={{ background: "rgba(114,176,29,0.08)", color: "#93c947", border: "none", cursor: "pointer" }}>
                        <Eye size={13} />
                      </button>
                      <button title="Editar" className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" style={{ background: "rgba(255,255,255,0.04)", color: "#64748b", border: "none", cursor: "pointer" }}>
                        <Edit2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12" style={{ color: "#475569" }}>
              <ClipboardList size={32} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
              <div className="text-sm">No se encontraron órdenes</div>
            </div>
          )}
        </div>
      </div>

      {selectedOrder && <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
