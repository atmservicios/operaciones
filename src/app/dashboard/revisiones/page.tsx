"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search, Plus, X, Pencil, Trash2, Truck, AlertTriangle, ShieldAlert,
  CalendarCheck, CalendarClock, CarFront, Download
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

interface Revision {
  id: number;
  patente: string;
  marca: string;
  modelo: string;
  chasis: string | null;
  motor: string | null;
  color: string | null;
  anio: number | null;
  kilometraje: number | null;
  sello: string | null;
  vencimiento_seguro: string | null;
  vencimiento_circulacion: string | null;
  vencimiento_gases: string | null;
  vencimiento_revision_tecnica: string | null;
}

type FilterType = 'todos' | 'alertas' | 'vencidos' | 'este_mes';

function getDocStatus(dateString: string | null) {
  if (!dateString) return { text: "N/A", color: "#64748b", bg: "rgba(100,116,139,0.1)", days: 999 };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // parse "YYYY-MM-DD" natively but watch out for timezones.
  const [y, m, d] = dateString.split("-").map(Number);
  const expiry = new Date(y, m - 1, d);
  
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { text: "Vencido", color: "#ef4444", bg: "rgba(239,68,68,0.1)", days: diffDays };
  if (diffDays <= 5) return { text: "Alerta", color: "#f97316", bg: "rgba(249,115,22,0.1)", days: diffDays };
  if (diffDays <= 30) return { text: "Próximo", color: "#eab308", bg: "rgba(234,179,8,0.1)", days: diffDays };
  return { text: "Al día", color: "#22c55e", bg: "rgba(34,197,94,0.1)", days: diffDays };
}

export default function RevisionesPage() {
  const [data, setData] = useState<Revision[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>('todos');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<Partial<Revision>>({});

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('custom-revisiones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'revisiones_tecnicas' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: revisiones, error } = await supabase
      .from("revisiones_tecnicas")
      .select("*")
      .order("id", { ascending: false });
      
    if (error) {
      console.error("Error fetching revisiones:", error);
    } else {
      setData(revisiones || []);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setCurrentRecord({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: Revision) => {
    setCurrentRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que deseas eliminar este vehículo?")) return;
    await supabase.from("revisiones_tecnicas").delete().eq("id", id);
  };

  const handleSave = async () => {
    if (!currentRecord.patente || !currentRecord.marca) {
      alert("Por favor ingresa al menos la Patente y la Marca.");
      return;
    }
    setIsSaving(true);
    
    // Normalize empty strings to null for dates
    const payload = { ...currentRecord };
    ['vencimiento_seguro', 'vencimiento_circulacion', 'vencimiento_gases', 'vencimiento_revision_tecnica'].forEach(key => {
      if (!(payload as any)[key]) (payload as any)[key] = null;
    });

    if (payload.id) {
      const { error } = await supabase
        .from("revisiones_tecnicas")
        .update(payload)
        .eq("id", payload.id);
      if (error) alert("Error: " + error.message);
    } else {
      const { error } = await supabase
        .from("revisiones_tecnicas")
        .insert([payload]);
      if (error) alert("Error: " + error.message);
    }
    
    setIsSaving(false);
    setIsModalOpen(false);
  };

  // Stats & Alerts
  const allAlerts: { patente: string, docName: string, days: number }[] = [];
  
  let countAlDia = 0;
  let countProximos = 0;
  let countVencidosAlertas = 0;

  data.forEach(v => {
    const docs = [
      { name: "Seguro", st: getDocStatus(v.vencimiento_seguro) },
      { name: "Permiso", st: getDocStatus(v.vencimiento_circulacion) },
      { name: "Gases", st: getDocStatus(v.vencimiento_gases) },
      { name: "Rev. Técnica", st: getDocStatus(v.vencimiento_revision_tecnica) }
    ];
    
    docs.forEach(d => {
      if (d.st.days <= 5 && d.st.days !== 999) {
        allAlerts.push({ patente: v.patente, docName: d.name, days: d.st.days });
      }
    });

    const isVencidoOrAlerta = docs.some(d => d.st.days <= 5 && d.st.days !== 999);
    const isProximo = docs.some(d => d.st.days > 5 && d.st.days <= 30 && d.st.days !== 999);
    
    if (isVencidoOrAlerta) countVencidosAlertas++;
    else if (isProximo) countProximos++;
    else countAlDia++;
  });

  const filteredData = useMemo(() => {
    return data.filter(row => {
      const q = search.toLowerCase();
      const matchSearch = !q || [row.patente, row.marca, row.modelo].some(f => (f || "").toLowerCase().includes(q));
      
      const docs = [
        getDocStatus(row.vencimiento_seguro),
        getDocStatus(row.vencimiento_circulacion),
        getDocStatus(row.vencimiento_gases),
        getDocStatus(row.vencimiento_revision_tecnica)
      ];

      let matchFilter = true;
      if (filter === 'alertas') {
        matchFilter = docs.some(d => d.days > 0 && d.days <= 5);
      } else if (filter === 'vencidos') {
        matchFilter = docs.some(d => d.days <= 0);
      } else if (filter === 'este_mes') {
        matchFilter = docs.some(d => d.days >= 0 && d.days <= 30);
      }

      return matchSearch && matchFilter;
    });
  }, [data, search, filter]);

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const downloadExcel = () => {
    if (filteredData.length === 0) {
      alert("No hay datos para exportar.");
      return;
    }
    
    const rows = filteredData.map(r => ({
      "PATENTE": r.patente || "",
      "SEGURO": r.vencimiento_seguro ? formatDate(r.vencimiento_seguro) : "",
      "CIRCULACION": r.vencimiento_circulacion ? formatDate(r.vencimiento_circulacion) : "",
      "GASES": r.vencimiento_gases ? formatDate(r.vencimiento_gases) : "",
      "REVIS TECN": r.vencimiento_revision_tecnica ? formatDate(r.vencimiento_revision_tecnica) : "",
      "MARCA": r.marca || "",
      "MODELO": r.modelo || "",
      "CHASIS": r.chasis || "",
      "MOTOR": r.motor || "",
      "COLOR": r.color || "",
      "KILOMETRAJE": r.kilometraje ? String(r.kilometraje) : "",
      "AÑO": r.anio ? String(r.anio) : "",
      "SELLO": r.sello || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vehiculos");
    
    XLSX.writeFile(workbook, `revisiones_tecnicas_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const StatusBadge = ({ date, label }: { date: string | null, label: string }) => {
    const st = getDocStatus(date);
    return (
      <div className="flex flex-col gap-1 items-start">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</span>
        {date ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{formatDate(date)}</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ color: st.color, backgroundColor: st.bg }}>
              {st.text}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-500 italic">No registrado</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* Alert Banner */}
      {allAlerts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-red-500 font-semibold mb-1">Alertas Críticas de Documentación</h4>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {allAlerts.map((a, i) => (
                <div key={i} className="text-sm text-red-200/80">
                  <span className="font-bold text-red-400">{a.patente}</span>: {a.docName} ({a.days < 0 ? 'Vencido' : `Vence en ${a.days} días`})
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Truck className="text-green-500" />
            Revisiones Técnicas
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {data.length} vehículos registrados en la flota
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadExcel}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }}
          >
            <Download size={14} />
            Exportar Excel
          </button>
          <button onClick={handleOpenCreate} className="btn-primary flex items-center gap-2">
            <Plus size={16} />
            Nuevo Vehículo
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <CarFront size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{data.length}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Total Flota</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
            <CalendarCheck size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{countAlDia}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Al Día</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-500">
            <CalendarClock size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{countProximos}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Próximos (30d)</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{countVencidosAlertas}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider">Alertas/Vencidos</div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-2">
          <button 
            onClick={() => setFilter('todos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'todos' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter('alertas')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'alertas' ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-white'}`}
          >
            Alertas (5d)
          </button>
          <button 
            onClick={() => setFilter('vencidos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'vencidos' ? 'bg-red-500/20 text-red-400' : 'text-slate-400 hover:text-white'}`}
          >
            Vencidos
          </button>
          <button 
            onClick={() => setFilter('este_mes')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'este_mes' ? 'bg-yellow-500/20 text-yellow-400' : 'text-slate-400 hover:text-white'}`}
          >
            Este mes (30d)
          </button>
        </div>
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="ops-input pl-9 w-full"
            placeholder="Buscar patente o marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-800/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/50 text-slate-400">
              <tr>
                <th className="p-4 font-semibold">Vehículo</th>
                <th className="p-4 font-semibold">Seguro Obligatorio</th>
                <th className="p-4 font-semibold">Permiso Circulación</th>
                <th className="p-4 font-semibold">Rev. Técnica / Gases</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading && data.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Cargando...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No hay vehículos registrados o que coincidan con la búsqueda.</td></tr>
              ) : (
                filteredData.map((row) => (
                  <tr 
                    key={row.id} 
                    className="hover:bg-slate-800/20 transition-colors cursor-pointer group"
                    onClick={() => handleOpenEdit(row)}
                  >
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-base">{row.patente}</span>
                        <span className="text-slate-400">{row.marca} {row.modelo}</span>
                        {row.anio && <span className="text-xs text-slate-500">Año {row.anio}</span>}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <StatusBadge date={row.vencimiento_seguro} label="Seguro" />
                    </td>
                    <td className="p-4 align-top">
                      <StatusBadge date={row.vencimiento_circulacion} label="Circulación" />
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-3">
                        <StatusBadge date={row.vencimiento_revision_tecnica} label="Rev. Técnica" />
                        <StatusBadge date={row.vencimiento_gases} label="Gases" />
                      </div>
                    </td>
                    <td className="p-4 text-right align-top">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-300" onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}>
                          <Pencil size={16} />
                        </button>
                        <button className="p-2 hover:bg-red-500/20 rounded-lg text-red-400" onClick={(e) => handleDelete(e, row.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Truck className="text-green-500" />
                {currentRecord.id ? "Editar Vehículo" : "Nuevo Vehículo"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Info General */}
              <div>
                <h3 className="text-sm font-semibold text-green-500 uppercase tracking-wider mb-4">Información del Vehículo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Patente *</label>
                    <input className="ops-input w-full uppercase" value={currentRecord.patente || ''} onChange={e => setCurrentRecord({...currentRecord, patente: e.target.value})} placeholder="Ej: AB1234" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Marca *</label>
                    <input className="ops-input w-full" value={currentRecord.marca || ''} onChange={e => setCurrentRecord({...currentRecord, marca: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Modelo</label>
                    <input className="ops-input w-full" value={currentRecord.modelo || ''} onChange={e => setCurrentRecord({...currentRecord, modelo: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Año</label>
                    <input type="number" className="ops-input w-full" value={currentRecord.anio || ''} onChange={e => setCurrentRecord({...currentRecord, anio: parseInt(e.target.value) || null})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Chasis</label>
                    <input className="ops-input w-full" value={currentRecord.chasis || ''} onChange={e => setCurrentRecord({...currentRecord, chasis: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Motor</label>
                    <input className="ops-input w-full" value={currentRecord.motor || ''} onChange={e => setCurrentRecord({...currentRecord, motor: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Color</label>
                    <input className="ops-input w-full" value={currentRecord.color || ''} onChange={e => setCurrentRecord({...currentRecord, color: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Kilometraje</label>
                    <input type="number" className="ops-input w-full" value={currentRecord.kilometraje || ''} onChange={e => setCurrentRecord({...currentRecord, kilometraje: parseInt(e.target.value) || null})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-400 mb-1">Sello</label>
                    <input className="ops-input w-full" value={currentRecord.sello || ''} onChange={e => setCurrentRecord({...currentRecord, sello: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Documentación */}
              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-green-500 uppercase tracking-wider mb-4">Vencimientos Documentación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Seguro Obligatorio</label>
                    <input type="date" className="ops-input w-full" value={currentRecord.vencimiento_seguro || ''} onChange={e => setCurrentRecord({...currentRecord, vencimiento_seguro: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Permiso de Circulación</label>
                    <input type="date" className="ops-input w-full" value={currentRecord.vencimiento_circulacion || ''} onChange={e => setCurrentRecord({...currentRecord, vencimiento_circulacion: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Revisión Técnica</label>
                    <input type="date" className="ops-input w-full" value={currentRecord.vencimiento_revision_tecnica || ''} onChange={e => setCurrentRecord({...currentRecord, vencimiento_revision_tecnica: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Gases</label>
                    <input type="date" className="ops-input w-full" value={currentRecord.vencimiento_gases || ''} onChange={e => setCurrentRecord({...currentRecord, vencimiento_gases: e.target.value})} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={isSaving} className="btn-primary">
                {isSaving ? "Guardando..." : "Guardar Vehículo"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
