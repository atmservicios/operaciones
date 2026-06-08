"use client";

import { useState } from "react";
import { Search, Upload, Download, FolderOpen, FileText, Shield, BookOpen, FileCheck, Eye } from "lucide-react";

const documents = [
  { id: "doc-001", name: "Protocolo de Mantención Diebold Nixdorf DN5500", category: "Protocolos", type: "PDF", size: "2.4 MB", date: "2025-03-15", icon: BookOpen, color: "#93c947" },
  { id: "doc-002", name: "Certificación ISO 27001 — OpsATM", category: "Certificaciones", type: "PDF", size: "450 KB", date: "2024-12-01", icon: Shield, color: "#72b01d" },
  { id: "doc-003", name: "Contrato Marco BancoEstado 2025", category: "Contratos", type: "PDF", size: "1.8 MB", date: "2025-01-10", icon: FileCheck, color: "#f59e0b" },
  { id: "doc-004", name: "Manual Técnico NCR SelfServ 84", category: "Manuales", type: "PDF", size: "8.2 MB", date: "2024-11-20", icon: BookOpen, color: "#93c947" },
  { id: "doc-005", name: "Formulario Solicitud Visita Inspectiva v3", category: "Formularios", type: "DOCX", size: "125 KB", date: "2025-02-01", icon: FileText, color: "#72b01d" },
  { id: "doc-006", name: "Protocolo de Traslado de ATMs", category: "Protocolos", type: "PDF", size: "1.1 MB", date: "2025-01-25", icon: BookOpen, color: "#93c947" },
  { id: "doc-007", name: "Contrato Servicio Banco Santander 2025", category: "Contratos", type: "PDF", size: "2.0 MB", date: "2025-01-15", icon: FileCheck, color: "#f59e0b" },
  { id: "doc-008", name: "Certificación Técnica — Carlos Muñoz Vega", category: "Certificaciones", type: "PDF", size: "380 KB", date: "2024-09-10", icon: Shield, color: "#72b01d" },
  { id: "doc-009", name: "Manual Wincor ProCash 2050 — Español", category: "Manuales", type: "PDF", size: "11.4 MB", date: "2024-10-05", icon: BookOpen, color: "#93c947" },
  { id: "doc-010", name: "Formulario Evidencia de Servicio", category: "Formularios", type: "XLSX", size: "85 KB", date: "2025-03-01", icon: FileText, color: "#72b01d" },
];

const CATEGORIES = ["Todos", ...Array.from(new Set(documents.map((d) => d.category)))];

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");

  const filtered = documents.filter((d) => {
    const matchSearch = search === "" || d.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "Todos" || d.category === category;
    return matchSearch && matchCat;
  });

  const byCategory = CATEGORIES.slice(1).map((cat) => ({
    cat,
    count: documents.filter((d) => d.category === cat).length,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="section-title">Repositorio de Documentos</h2>
          <p className="section-subtitle">Certificaciones, protocolos, contratos y manuales</p>
        </div>
        <button className="btn-primary"><Upload size={16} /> Subir documento</button>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {byCategory.map(({ cat, count }) => {
          const icons: Record<string, React.ElementType> = {
            Certificaciones: Shield, Protocolos: BookOpen, Contratos: FileCheck,
            Manuales: BookOpen, Formularios: FileText,
          };
          const colors: Record<string, string> = {
            Certificaciones: "#72b01d", Protocolos: "#93c947", Contratos: "#f59e0b",
            Manuales: "#93c947", Formularios: "#72b01d",
          };
          const Icon = icons[cat] ?? FolderOpen;
          const color = colors[cat] ?? "#64748b";
          return (
            <button key={cat} onClick={() => setCategory(category === cat ? "Todos" : cat)}
              className="p-4 rounded-xl text-left transition-all"
              style={{
                background: category === cat ? `${color}12` : "rgba(255,255,255,0.03)",
                border: `1px solid ${category === cat ? `${color}30` : "rgba(255,255,255,0.06)"}`,
                cursor: "pointer",
              }}>
              <Icon size={20} style={{ color, marginBottom: 8 }} />
              <div className="font-bold text-lg" style={{ color }}>{count}</div>
              <div className="text-xs font-medium" style={{ color: "#64748b" }}>{cat}</div>
            </button>
          );
        })}
      </div>

      {/* Search + category filter */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#475569" }} />
          <input className="ops-input pl-9" placeholder="Buscar documento…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="ops-select text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <div className="text-xs" style={{ color: "#475569" }}>{filtered.length} documentos</div>
      </div>

      {/* Document list */}
      <div className="space-y-2">
        {filtered.map((doc) => {
          const Icon = doc.icon;
          return (
            <div key={doc.id} className="glass-card-hover p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${doc.color}12` }}>
                <Icon size={18} style={{ color: doc.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: "#e2e8f0" }}>{doc.name}</div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "#64748b" }}>{doc.category}</span>
                  <span className="text-xs" style={{ color: "#475569" }}>{doc.type} · {doc.size}</span>
                  <span className="text-xs" style={{ color: "#334155" }}>{doc.date}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button className="btn-secondary text-xs py-1 px-2.5"><Eye size={12} /> Ver</button>
                <button className="btn-secondary text-xs py-1 px-2.5"><Download size={12} /> Descargar</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
