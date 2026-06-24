"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus, AlertTriangle, Package, MapPin, User, X, RefreshCw, Barcode, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { mockInventory } from "@/lib/mock-data";
import { getStatusBg } from "@/lib/utils";
import type { InventoryItem } from "@/types";

// ─── Tone Synthesizer for Audio Feedback ─────────────────────────────────────
const playBeep = (type: 'success' | 'error') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (type === 'success') {
      osc.frequency.setValueAtTime(950, ctx.currentTime); // Tone pitch (950Hz)
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else {
      osc.frequency.setValueAtTime(220, ctx.currentTime); // Error tone pitch (220Hz)
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    console.error("Audio error:", e);
  }
};

interface ScanHistoryEntry {
  id: string;
  timestamp: string;
  serial: string;
  name: string;
  mode: 'entrada' | 'salida';
  status: 'success' | 'error';
  details: string;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showLowStock, setShowLowStock] = useState(false);
  
  // Scanner state
  const [scanMode, setScanMode] = useState<'entrada' | 'salida'>('salida');
  const [barcode, setBarcode] = useState("");
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);
  const scannerInputRef = useRef<HTMLInputElement>(null);
  
  // Modals state
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Piezas ATM",
    serial: "",
    location: "Bodega Central SCL",
    responsible: "Administrador",
    stock: 0,
    minStock: 2,
    status: "disponible" as any
  });
  
  // Error / Form validation state
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    loadInventory();
  }, []);

  async function loadInventory() {
    setLoading(true);
    const { data, error } = await supabase
      .from("inventario")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading inventory:", error);
      // Fallback in case of fetch error (simulate with mock data)
      setInventory(mockInventory);
    } else if (data && data.length > 0) {
      setInventory(data.map(r => ({
        id: r.id,
        name: r.name,
        category: r.category,
        serial: r.serial,
        location: r.location || "",
        status: r.status || "disponible",
        stock: Number(r.stock) || 0,
        responsible: r.responsible || "",
        minStock: Number(r.min_stock) || 0,
      })));
    } else {
      // Table exists but is empty. Seed it with initial mock items
      const seedItems = mockInventory.map(i => ({
        id: i.id,
        name: i.name,
        category: i.category,
        serial: i.serial,
        location: i.location,
        responsible: i.responsible,
        stock: i.stock,
        min_stock: i.minStock,
        status: i.status,
      }));
      const { error: seedErr } = await supabase.from("inventario").insert(seedItems);
      if (!seedErr) {
        setInventory(mockInventory);
      } else {
        console.error("Error seeding DB:", seedErr);
        setInventory(mockInventory);
      }
    }
    setLoading(false);
  }

  // ─── Honeywell Scanner Submit (Enter key triggered) ────────────────────────
  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcode.trim();
    if (!code) return;

    // Search by serial number (or exact ID match)
    const itemIndex = inventory.findIndex(
      i => i.serial.toLowerCase() === code.toLowerCase() || i.id.toLowerCase() === code.toLowerCase()
    );

    if (itemIndex === -1) {
      playBeep('error');
      setScanHistory(prev => [
        {
          id: `scan-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('es-CL'),
          serial: code,
          name: "Desconocido",
          mode: scanMode,
          status: 'error',
          details: `El código/serie "${code}" no está registrado.`
        },
        ...prev
      ]);
      setBarcode("");
      return;
    }

    const item = inventory[itemIndex];
    let newStock = item.stock;

    if (scanMode === 'salida') {
      if (item.stock <= 0) {
        playBeep('error');
        setScanHistory(prev => [
          {
            id: `scan-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString('es-CL'),
            serial: code,
            name: item.name,
            mode: scanMode,
            status: 'error',
            details: `Sin stock disponible para retirar. (Stock actual: 0)`
          },
          ...prev
        ]);
        setBarcode("");
        return;
      }
      newStock = item.stock - 1;
    } else {
      newStock = item.stock + 1;
    }

    // Update stock in Supabase
    const { error: updateErr } = await supabase
      .from("inventario")
      .update({ stock: newStock })
      .eq("id", item.id);

    if (updateErr) {
      playBeep('error');
      setScanHistory(prev => [
        {
          id: `scan-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('es-CL'),
          serial: code,
          name: item.name,
          mode: scanMode,
          status: 'error',
          details: `Error en base de datos: ${updateErr.message}`
        },
        ...prev
      ]);
    } else {
      playBeep('success');
      // Update local state list
      const updated = [...inventory];
      updated[itemIndex] = { ...item, stock: newStock };
      setInventory(updated);

      setScanHistory(prev => [
        {
          id: `scan-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('es-CL'),
          serial: code,
          name: item.name,
          mode: scanMode,
          status: 'success',
          details: `Stock actualizado a ${newStock} (${scanMode === 'salida' ? '-1' : '+1'})`
        },
        ...prev
      ]);
    }
    setBarcode("");
    // Keep focus on input for sequential scanning
    setTimeout(() => scannerInputRef.current?.focus(), 50);
  };

  // ─── Manual stock updates & item creation ───────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editItem) return;
    const { error } = await supabase
      .from("inventario")
      .update({
        name: editItem.name,
        stock: editItem.stock,
        min_stock: editItem.minStock,
        location: editItem.location,
        status: editItem.status
      })
      .eq("id", editItem.id);

    if (error) {
      alert("Error al actualizar: " + error.message);
    } else {
      setInventory(prev => prev.map(i => i.id === editItem.id ? editItem : i));
      setEditItem(null);
    }
  };

  const handleCreateItem = async () => {
    if (!newItem.name || !newItem.serial) {
      setErrorMsg("Nombre y Número de serie son obligatorios.");
      return;
    }
    setErrorMsg("");

    const itemToInsert = {
      name: newItem.name,
      category: newItem.category,
      serial: newItem.serial,
      location: newItem.location,
      responsible: newItem.responsible,
      stock: Number(newItem.stock) || 0,
      min_stock: Number(newItem.minStock) || 0,
      status: newItem.status
    };

    const { data, error } = await supabase
      .from("inventario")
      .insert([itemToInsert])
      .select();

    if (error) {
      setErrorMsg("Error: " + error.message);
    } else if (data && data[0]) {
      const added = data[0];
      setInventory(prev => [
        {
          id: added.id,
          name: added.name,
          category: added.category,
          serial: added.serial,
          location: added.location || "",
          status: added.status || "disponible",
          stock: Number(added.stock) || 0,
          responsible: added.responsible || "",
          minStock: Number(added.min_stock) || 0,
        },
        ...prev
      ]);
      setShowAddModal(false);
      setNewItem({
        name: "",
        category: "Piezas ATM",
        serial: "",
        location: "Bodega Central SCL",
        responsible: "Administrador",
        stock: 0,
        minStock: 2,
        status: "disponible"
      });
    }
  };

  // Filter computations
  const categories = Array.from(new Set(inventory.map((i) => i.category)));

  const filtered = inventory.filter((i) => {
    const matchSearch = search === "" || [i.name, i.serial, i.category, i.location, i.responsible].some(
      (f) => f.toLowerCase().includes(search.toLowerCase())
    );
    const matchCat = categoryFilter === "all" || i.category === categoryFilter;
    const matchLow = !showLowStock || i.stock <= i.minStock;
    return matchSearch && matchCat && matchLow;
  });

  const lowStockCount = inventory.filter((i) => i.stock <= i.minStock).length;
  const totalItems = inventory.reduce((s, i) => s + i.stock, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title">Inventario</h2>
          <p className="section-subtitle">Control de equipos, piezas y repuestos con soporte para pistola escáner</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={16} /> Agregar ítem manual
        </button>
      </div>

      {/* Barcode Scanner Module Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 border-l-4 border-l-[#72b01d] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Barcode size={20} style={{ color: "#72b01d" }} />
              <h3 className="text-md font-bold text-[#f1f5f9]">Módulo Lector de Códigos (Pistoleo)</h3>
            </div>
            <p className="text-xs text-[#64748b] mb-4">
              Asegúrate de que el cursor esté dentro del campo y escanea la serie del producto. La pistola Honeywell enviará el código y confirmará la acción automáticamente.
            </p>

            {/* Mode selection & barcode scanning form */}
            <form onSubmit={handleScanSubmit} className="space-y-4">
              <div className="flex items-center gap-4 bg-black/20 p-1.5 rounded-lg border border-white/5 w-fit">
                <button
                  type="button"
                  onClick={() => setScanMode('salida')}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: scanMode === 'salida' ? "#ef4444" : "transparent",
                    color: scanMode === 'salida' ? "white" : "#64748b",
                    border: "none"
                  }}
                >
                  🔴 Salida / Retiro (-1)
                </button>
                <button
                  type="button"
                  onClick={() => setScanMode('entrada')}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    background: scanMode === 'entrada' ? "#72b01d" : "transparent",
                    color: scanMode === 'entrada' ? "white" : "#64748b",
                    border: "none"
                  }}
                >
                  🟢 Entrada / Devolución (+1)
                </button>
              </div>

              <div className="relative">
                <input
                  ref={scannerInputRef}
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="ops-input py-3 pl-10 pr-24 font-mono text-sm tracking-wider"
                  placeholder="Escanea el código de barra o serie..."
                  style={{ borderColor: scanMode === 'salida' ? 'rgba(239,68,68,0.25)' : 'rgba(114,176,29,0.25)' }}
                />
                <Barcode size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569]" />
                <button
                  type="submit"
                  className="absolute right-2 top-1.5 bottom-1.5 px-4 rounded-md text-xs font-bold text-white transition-all border-none cursor-pointer"
                  style={{
                    background: scanMode === 'salida' ? "linear-gradient(135deg,#ef4444,#b91c1c)" : "linear-gradient(135deg,#72b01d,#578814)"
                  }}
                >
                  Procesar
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between border-t border-white/5">
            <span className="text-xs text-[#475569]">Foco automático activo</span>
            <button
              onClick={() => scannerInputRef.current?.focus()}
              className="text-xs text-[#72b01d] bg-none border-none font-semibold cursor-pointer hover:underline"
            >
              [ Re-enfocar Escáner ]
            </button>
          </div>
        </div>

        {/* Scan history logs */}
        <div className="glass-card p-5 flex flex-col justify-between max-h-[260px] overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-[#f1f5f9] tracking-wider uppercase">Historial de escaneo</h4>
            {scanHistory.length > 0 && (
              <button
                onClick={() => setScanHistory([])}
                className="text-[10px] text-[#64748b] bg-transparent border-none cursor-pointer hover:text-white"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {scanHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-[#475569] text-xs py-8">
                <Barcode size={24} className="mb-2 opacity-30" />
                Ningún elemento escaneado en esta sesión.
              </div>
            ) : (
              scanHistory.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg text-xs flex flex-col gap-1"
                  style={{
                    background: log.status === 'success' ? 'rgba(114,176,29,0.06)' : 'rgba(239,68,68,0.06)',
                    border: `1px solid ${log.status === 'success' ? 'rgba(114,176,29,0.15)' : 'rgba(239,68,68,0.15)'}`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white truncate max-w-[150px]">{log.name}</span>
                    <span className="text-[10px] text-[#475569]">{log.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-[#64748b]">{log.serial}</span>
                    <span
                      style={{
                        padding: "1px 6px",
                        borderRadius: "4px",
                        fontSize: "9px",
                        fontWeight: 800,
                        color: "white",
                        background: log.mode === 'salida' ? '#ef4444' : '#72b01d'
                      }}
                    >
                      {log.mode === 'salida' ? 'RETIRADO' : 'INGRESADO'}
                    </span>
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: log.status === 'success' ? '#93c947' : '#f87171' }}>
                    {log.details}
                  </p>
                  {log.name === "Desconocido" && (
                    <button
                      onClick={() => {
                        setNewItem(prev => ({ ...prev, serial: log.serial, stock: log.mode === 'entrada' ? 1 : 0 }));
                        setShowAddModal(true);
                      }}
                      className="mt-1 w-full text-center py-1 rounded bg-[#72b01d]/20 hover:bg-[#72b01d]/35 text-[#93c947] border border-[#72b01d]/40 font-bold text-[10px] cursor-pointer transition-all"
                    >
                      🆕 Registrar producto nuevo
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Ítems registrados", value: inventory.length, color: "#93c947" },
          { label: "Unidades totales", value: totalItems, color: "#72b01d" },
          { label: "Stock bajo", value: lowStockCount, color: "#ef4444" },
          { label: "Categorías", value: categories.length, color: "#f59e0b" },
        ].map((s) => (
          <div key={s.label} className="stat-card py-3">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: "#64748b" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Low stock alert banner */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertTriangle size={18} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
          <div>
            <div className="text-sm font-semibold" style={{ color: "#f87171" }}>⚠️ {lowStockCount} ítems con stock bajo el mínimo</div>
            <div className="text-xs mt-0.5" style={{ color: "#ef4444", opacity: 0.7 }}>
              {inventory.filter(i => i.stock <= i.minStock).map(i => i.name).join(" · ")}
            </div>
          </div>
          <button onClick={() => setShowLowStock(!showLowStock)} className="btn-secondary text-xs py-1 px-3 ml-auto">
            {showLowStock ? "Ver todos" : "Filtrar críticos"}
          </button>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setCategoryFilter("all")}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{
            background: categoryFilter === "all" ? "rgba(114,176,29,0.15)" : "rgba(255,255,255,0.03)",
            color: categoryFilter === "all" ? "#93c947" : "#64748b",
            border: `1px solid ${categoryFilter === "all" ? "rgba(114,176,29,0.3)" : "rgba(255,255,255,0.06)"}`,
            cursor: "pointer",
          }}>
          Todos
        </button>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setCategoryFilter(cat)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: categoryFilter === cat ? "rgba(114,176,29,0.15)" : "rgba(255,255,255,0.03)",
              color: categoryFilter === cat ? "#93c947" : "#64748b",
              border: `1px solid ${categoryFilter === cat ? "rgba(114,176,29,0.3)" : "rgba(255,255,255,0.06)"}`,
              cursor: "pointer",
            }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Filters bar */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
          <input className="ops-input pl-9" placeholder="Buscar por nombre, serie, responsable, ubicación…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadInventory} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Recargar
          </button>
          <div className="text-xs" style={{ color: "#475569" }}>{filtered.length} ítems en listado</div>
        </div>
      </div>

      {/* List / Table */}
      {loading ? (
        <div className="glass-card p-12 text-center text-[#64748b]">Cargando inventario de la base de datos...</div>
      ) : (
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
                      <td><span className="font-mono text-xs text-[#a3b3cc] font-semibold">{item.serial}</span></td>
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
                        {/* Progress stock bar */}
                        <div className="h-1 rounded-full mt-1" style={{ background: "rgba(255,255,255,0.06)", width: "80px" }}>
                          <div className="h-1 rounded-full" style={{
                            width: `${Math.min(100, (item.stock / (item.minStock * 2 || 1)) * 100)}%`,
                            background: isLow ? "#ef4444" : "#72b01d"
                          }} />
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBg(item.status)}`}>{item.status}</span>
                      </td>
                      <td>
                        <button onClick={() => setEditItem(item)} className="btn-secondary text-xs py-1 px-2.5">Editar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12" style={{ color: "#475569" }}>
                <Package size={32} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
                <div className="text-sm">No se encontraron ítems en la grilla</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal (Connects to Supabase) */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl" style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="font-bold" style={{ color: "#f1f5f9" }}>Editar Ítem</h3>
              <button onClick={() => setEditItem(null)} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Nombre del producto</label>
                <input className="ops-input" value={editItem.name} onChange={(e) => setEditItem({ ...editItem, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Stock actual</label>
                  <input type="number" className="ops-input" value={editItem.stock} onChange={(e) => setEditItem({ ...editItem, stock: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Stock mínimo</label>
                  <input type="number" className="ops-input" value={editItem.minStock} onChange={(e) => setEditItem({ ...editItem, minStock: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Ubicación</label>
                <input className="ops-input" value={editItem.location} onChange={(e) => setEditItem({ ...editItem, location: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Estado</label>
                <select className="ops-select w-full" value={editItem.status} onChange={(e) => setEditItem({ ...editItem, status: e.target.value as any })}>
                  <option value="disponible">disponible</option>
                  <option value="en uso">en uso</option>
                  <option value="dañado">dañado</option>
                  <option value="en reparacion">en reparacion</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setEditItem(null)} className="btn-secondary">Cancelar</button>
                <button onClick={handleSaveEdit} className="btn-primary">Guardar cambios</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal (Connects to Supabase) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl" style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between p-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="font-bold" style={{ color: "#f1f5f9" }}>Registrar Nuevo Producto</h3>
              <button onClick={() => setShowAddModal(false)} style={{ color: "#475569", background: "none", border: "none", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Nombre del producto *</label>
                <input className="ops-input" placeholder="Ej: Lectora de Tarjetas NCR" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Categoría</label>
                  <input
                    list="categories-list"
                    className="ops-input"
                    placeholder="Escribe o selecciona..."
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                  />
                  <datalist id="categories-list">
                    {categories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                    {!categories.includes("Piezas ATM") && <option value="Piezas ATM" />}
                    {!categories.includes("Routers") && <option value="Routers" />}
                    {!categories.includes("Cerraduras") && <option value="Cerraduras" />}
                    {!categories.includes("Fundas") && <option value="Fundas" />}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>N° Serie / Código *</label>
                  <input className="ops-input font-mono" placeholder="Ej: LEC-NCR-042" value={newItem.serial} onChange={(e) => setNewItem({ ...newItem, serial: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Stock inicial</label>
                  <input type="number" className="ops-input" value={newItem.stock} onChange={(e) => setNewItem({ ...newItem, stock: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Stock mínimo</label>
                  <input type="number" className="ops-input" value={newItem.minStock} onChange={(e) => setNewItem({ ...newItem, minStock: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Ubicación</label>
                  <input className="ops-input" value={newItem.location} onChange={(e) => setNewItem({ ...newItem, location: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#94a3b8" }}>Estado</label>
                  <select className="ops-select w-full" value={newItem.status} onChange={(e) => setNewItem({ ...newItem, status: e.target.value as any })}>
                    <option value="disponible">disponible</option>
                    <option value="en uso">en uso</option>
                    <option value="dañado">dañado</option>
                    <option value="en reparacion">en reparacion</option>
                  </select>
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-400 font-semibold bg-red-950/20 p-2.5 rounded border border-red-900/35">
                  ⚠️ {errorMsg}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowAddModal(false)} className="btn-secondary">Cancelar</button>
                <button onClick={handleCreateItem} className="btn-primary">Registrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
