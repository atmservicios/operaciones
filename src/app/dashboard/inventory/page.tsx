"use client";

import { useState } from "react";
import { Search, Plus, AlertTriangle, Package, MapPin, User, X } from "lucide-react";
import { mockInventory } from "@/lib/mock-data";
import { getStatusBg } from "@/lib/utils";
import type { InventoryItem } from "@/types";

const CATEGORIES = Array.from(new Set(mockInventory.map((i) => i.category)));

const STATUS_COLOR: Record<string, string> = {
  disponible: "#72b01d",
  "en uso": "#93c947",
  dañado: "#ef4444",
  "en reparacion": "#f59e0b",
};

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showLowStock, setShowLowStock] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  const filtered = mockInventory.filter((i) => {
    const matchSearch = search === "" || [i.name, i.serial, i.category, i.location, i.responsible].some(
      (f) => f.toLowerCase().includes(search.toLowerCase())
    );
    const matchCat = categoryFilter === "all" || i.category === categoryFilter;
    const matchLow = !showLowStock || i.stock <= i.minStock;
    return matchSearch && matchCat && matchLow;
  });

  const lowStockCount = mockInventory.filter((i) => i.stock <= i.minStock).length;
  const totalItems = mockInventory.reduce((s, i) => s + i.stock, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Inventario</h2>
          <p className="section-subtitle">Control de equipos, piezas y repuestos</p>
        </div>
        <button className="btn-primary"><Plus size={16} /> Agregar ítem</button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Ítems registrados", value: mockInventory.length, color: "#93c947" },
          { label: "Unidades totales", value: totalItems, color: "#72b01d" },
          { label: "Stock bajo", value: lowStockCount, color: "#ef4444" },
          { label: "Categorías", value: CATEGORIES.length, color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} className="stat-card py-3">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: "#64748b" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertTriangle size={18} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
          <div>
            <div className="text-sm font-semibold" style={{ color: "#f87171" }}>⚠️ {lowStockCount} ítems con stock bajo el mínimo</div>
            <div className="text-xs mt-0.5" style={{ color: "#ef4444", opacity: 0.7 }}>
              {mockInventory.filter(i => i.stock <= i.minStock).map(i => i.name).join(" · ")}
            </div>
          </div>
          <button onClick={() => setShowLowStock(!showLowStock)} className="btn-secondary text-xs py-1 px-3 ml-auto">
            {showLowStock ? "Ver todos" : "Filtrar críticos"}
          </button>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", ...CATEGORIES].map((cat) => (
          <button key={cat} onClick={() => setCategoryFilter(cat)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: categoryFilter === cat ? "rgba(114,176,29,0.15)" : "rgba(255,255,255,0.03)",
              color: categoryFilter === cat ? "#93c947" : "#64748b",
              border: `1px solid ${categoryFilter === cat ? "rgba(114,176,29,0.3)" : "rgba(255,255,255,0.06)"}`,
              cursor: "pointer",
            }}>
            {cat === "all" ? "Todos" : cat}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
          <input className="ops-input pl-9" placeholder="Buscar ítem, serie, responsable…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="text-xs" style={{ color: "#475569" }}>{filtered.length} ítems</div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Ítem</th><th>Categoría</th><th>N° Serie</th><th>Ubicación</th>
                <th>Responsable</th><th>Stock</th><th>Estado</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const isLow = item.stock <= item.minStock;
                return (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(114,176,29,0.08)" }}>
                          <Package size={14} style={{ color: "#72b01d" }} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold" style={{ color: "#e2e8f0" }}>{item.name}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}>{item.category}</span>
                    </td>
                    <td><span className="font-mono text-xs" style={{ color: "#64748b" }}>{item.serial}</span></td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "#94a3b8" }}>
                        <MapPin size={11} style={{ color: "#475569" }} /> {item.location}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "#94a3b8" }}>
                        <User size={11} style={{ color: "#475569" }} /> {item.responsible}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: isLow ? "#ef4444" : "#72b01d" }}>{item.stock}</span>
                        <span className="text-xs" style={{ color: "#334155" }}>/ mín {item.minStock}</span>
                        {isLow && <AlertTriangle size={12} style={{ color: "#ef4444" }} />}
                      </div>
                      {/* Stock bar */}
                      <div className="h-1 rounded-full mt-1" style={{ background: "rgba(255,255,255,0.06)", width: "80px" }}>
                        <div className="h-1 rounded-full" style={{
                          width: `${Math.min(100, (item.stock / (item.minStock * 2)) * 100)}%`,
                          background: isLow ? "#ef4444" : "#72b01d"
                        }} />
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBg(item.status)}`}>{item.status}</span>
                    </td>
                    <td>
                      <button onClick={() => setEditItem(item)} className="btn-secondary text-xs py-1 px-2">Editar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12" style={{ color: "#475569" }}>
              <Package size={32} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
              <div className="text-sm">No se encontraron ítems</div>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl" style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="font-bold" style={{ color: "#f1f5f9" }}>Editar Ítem</h3>
              <button onClick={() => setEditItem(null)} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Nombre</label>
                <input className="ops-input" defaultValue={editItem.name} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Stock actual</label>
                  <input type="number" className="ops-input" defaultValue={editItem.stock} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Stock mínimo</label>
                  <input type="number" className="ops-input" defaultValue={editItem.minStock} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Ubicación</label>
                <input className="ops-input" defaultValue={editItem.location} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Estado</label>
                <select className="ops-select w-full" defaultValue={editItem.status}>
                  <option>disponible</option><option>en uso</option><option>dañado</option><option>en reparacion</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setEditItem(null)} className="btn-secondary">Cancelar</button>
                <button onClick={() => setEditItem(null)} className="btn-primary">Guardar cambios</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
