"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck, Plus, Download, FileText, Calendar,
  Monitor, Box, Save, X, Edit, Trash2, Search
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

// Interface for the certificate data
export interface CertificadoAnclaje {
  id?: string;
  folio: string;
  otNumber: string;
  fechaAnclaje: string;
  marcaModeloMMBB: string;
  serieMMBB: string;
  marcaModeloATM: string;
  serieATM: string;
  tipoBoveda: string;
  banco: string;
  ubicacion: string;
  direccion: string;
  comuna: string;
  region: string;
}

const defaultCert: Partial<CertificadoAnclaje> = {
  folio: "",
  otNumber: "",
  fechaAnclaje: new Date().toISOString().split('T')[0],
  marcaModeloMMBB: "",
  serieMMBB: "",
  marcaModeloATM: "",
  serieATM: "",
  tipoBoveda: "",
  banco: "",
  ubicacion: "",
  direccion: "",
  comuna: "",
  region: ""
};

export default function CertificadosPage() {
  const [certificados, setCertificados] = useState<CertificadoAnclaje[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCert, setEditingCert] = useState<CertificadoAnclaje | null>(null);
  const [formData, setFormData] = useState<Partial<CertificadoAnclaje>>(defaultCert);
  const [search, setSearch] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchCertificados = async () => {
    const { data, error } = await supabase
      .from('certificados_anclaje')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      setCertificados(data as CertificadoAnclaje[]);
    } else if (error) {
      console.error("Error fetching certificados:", error);
    }
  };

  useEffect(() => {
    fetchCertificados();
  }, []);

  const handleSave = async () => {
    if (!formData.marcaModeloMMBB || !formData.fechaAnclaje) return;

    if (editingCert?.id) {
      const { error } = await supabase
        .from('certificados_anclaje')
        .update({
          folio: formData.folio,
          otNumber: formData.otNumber,
          fechaAnclaje: formData.fechaAnclaje,
          marcaModeloMMBB: formData.marcaModeloMMBB,
          serieMMBB: formData.serieMMBB,
          marcaModeloATM: formData.marcaModeloATM,
          serieATM: formData.serieATM,
          tipoBoveda: formData.tipoBoveda,
          banco: formData.banco,
          ubicacion: formData.ubicacion,
          direccion: formData.direccion,
          comuna: formData.comuna,
          region: formData.region
        })
        .eq('id', editingCert.id);

      if (!error) fetchCertificados();
    } else {
      const { error } = await supabase
        .from('certificados_anclaje')
        .insert([{
          folio: formData.folio,
          otNumber: formData.otNumber,
          fechaAnclaje: formData.fechaAnclaje,
          marcaModeloMMBB: formData.marcaModeloMMBB,
          serieMMBB: formData.serieMMBB,
          marcaModeloATM: formData.marcaModeloATM,
          serieATM: formData.serieATM,
          tipoBoveda: formData.tipoBoveda,
          banco: formData.banco,
          ubicacion: formData.ubicacion,
          direccion: formData.direccion,
          comuna: formData.comuna,
          region: formData.region
        }]);
      
      if (!error) fetchCertificados();
    }
    setShowForm(false);
    setEditingCert(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Seguro que deseas eliminar este certificado?")) {
      const { error } = await supabase
        .from('certificados_anclaje')
        .delete()
        .eq('id', id);
      if (!error) fetchCertificados();
    }
  };

  const downloadDocx = async (cert: CertificadoAnclaje) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generar-certificado-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificado: cert }),
      });
      if (!response.ok) throw new Error("Error al generar DOCX");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificado_Anclaje_${cert.folio || cert.otNumber || 'nuevo'}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Error al generar el documento DOCX");
      console.error(error);
    }
    setIsGenerating(false);
  };

  const downloadPdf = async (cert: CertificadoAnclaje) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generar-certificado-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificado: cert }),
      });
      if (!response.ok) throw new Error("Error al generar PDF");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Certificado_Anclaje_${cert.folio || cert.otNumber || 'nuevo'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Error al generar el documento PDF");
      console.error(error);
    }
    setIsGenerating(false);
  };

  const filteredCerts = certificados.filter(c => {
    const q = search.toLowerCase();
    return c.folio?.toLowerCase().includes(q) || 
           c.otNumber?.toLowerCase().includes(q) ||
           c.marcaModeloATM?.toLowerCase().includes(q) ||
           c.marcaModeloMMBB?.toLowerCase().includes(q);
  });

  return (
    <div className="p-4 lg:p-8 w-full max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>Certificados de Anclaje</h2>
          <p className="text-sm" style={{ color: "#94a3b8" }}>Generación y gestión de certificados según Decreto 222</p>
        </div>
        <button
          onClick={() => { setFormData(defaultCert); setEditingCert(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Crear Certificado
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por folio, OT, marca o modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl outline-none"
          style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9" }}
        />
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredCerts.length === 0 ? (
          <div className="text-center py-10 text-slate-500">No hay certificados registrados.</div>
        ) : (
          filteredCerts.map(cert => (
            <div key={cert.id} className="glass-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)" }}>
                  <ShieldCheck size={24} style={{ color: "#60a5fa" }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold" style={{ color: "#f1f5f9" }}>Folio: {cert.folio || "S/N"}</span>
                    {cert.otNumber && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                        OT: {cert.otNumber}
                      </span>
                    )}
                  </div>
                  <div className="text-sm" style={{ color: "#94a3b8" }}>
                    ATM: {cert.marcaModeloATM || "—"} • MMBB: {cert.marcaModeloMMBB || "—"} • Fecha: {formatDate(cert.fechaAnclaje)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadDocx(cert)}
                  disabled={isGenerating}
                  className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                  style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.2)" }}
                >
                  <FileText size={14} /> DOCX
                </button>
                <button
                  onClick={() => downloadPdf(cert)}
                  disabled={isGenerating}
                  className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
                >
                  <FileText size={14} /> PDF
                </button>
                <button
                  onClick={() => { setEditingCert(cert); setFormData(cert); setShowForm(true); }}
                  className="btn-secondary text-xs py-2 px-3"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => cert.id && handleDelete(cert.id)}
                  className="btn-secondary text-xs py-2 px-3 hover:bg-red-900/20 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-6" style={{ background: "#1b1e24", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: "#f1f5f9" }}>{editingCert ? "Editar Certificado" : "Nuevo Certificado de Anclaje"}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/5 rounded-lg"><X size={20} className="text-slate-400" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-400">Folio N°</label>
                <input
                  type="text"
                  value={formData.folio}
                  onChange={(e) => setFormData({ ...formData, folio: e.target.value })}
                  className="w-full p-2.5 rounded-lg outline-none text-sm"
                  style={{ background: "#121418", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9" }}
                  placeholder="Ej: 001"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-400">Número de OT (Opcional)</label>
                <input
                  type="text"
                  value={formData.otNumber}
                  onChange={(e) => setFormData({ ...formData, otNumber: e.target.value })}
                  className="w-full p-2.5 rounded-lg outline-none text-sm"
                  style={{ background: "#121418", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9" }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-400">Marca / Modelo MMBB</label>
                <input
                  type="text"
                  value={formData.marcaModeloMMBB}
                  onChange={(e) => setFormData({ ...formData, marcaModeloMMBB: e.target.value })}
                  className="w-full p-2.5 rounded-lg outline-none text-sm"
                  style={{ background: "#121418", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-400">Serie MMBB</label>
                <input
                  type="text"
                  value={formData.serieMMBB}
                  onChange={(e) => setFormData({ ...formData, serieMMBB: e.target.value })}
                  className="w-full p-2.5 rounded-lg outline-none text-sm"
                  style={{ background: "#121418", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9" }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-400">Marca / Modelo ATM</label>
                <input
                  type="text"
                  value={formData.marcaModeloATM}
                  onChange={(e) => setFormData({ ...formData, marcaModeloATM: e.target.value })}
                  className="w-full p-2.5 rounded-lg outline-none text-sm uppercase"
                  style={{ background: "#121418", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-400">Serie ATM</label>
                <input
                  type="text"
                  value={formData.serieATM}
                  onChange={(e) => setFormData({ ...formData, serieATM: e.target.value })}
                  className="w-full p-2.5 rounded-lg outline-none text-sm uppercase"
                  style={{ background: "#121418", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9" }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-400">Tipo de Bóveda</label>
                <input
                  type="text"
                  value={formData.tipoBoveda}
                  onChange={(e) => setFormData({ ...formData, tipoBoveda: e.target.value })}
                  className="w-full p-2.5 rounded-lg outline-none text-sm uppercase"
                  style={{ background: "#121418", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-400">Banco</label>
                <input
                  type="text"
                  value={formData.banco}
                  onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                  className="w-full p-2.5 rounded-lg outline-none text-sm uppercase"
                  style={{ background: "#121418", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9" }}
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-400">Ubicación</label>
                  <input
                    type="text"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    className="w-full p-2.5 rounded-lg outline-none text-sm uppercase"
                    style={{ background: "#121418", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-400">Dirección</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full p-2.5 rounded-lg outline-none text-sm uppercase"
                    style={{ background: "#121418", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9" }}
                  />
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-400">Comuna</label>
                  <input
                    type="text"
                    value={formData.comuna}
                    onChange={(e) => setFormData({ ...formData, comuna: e.target.value })}
                    className="w-full p-2.5 rounded-lg outline-none text-sm uppercase"
                    style={{ background: "#121418", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-slate-400">Región</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full p-2.5 rounded-lg outline-none text-sm uppercase"
                    style={{ background: "#121418", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9" }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-400">Fecha de Anclaje</label>
                <input
                  type="date"
                  value={formData.fechaAnclaje}
                  onChange={(e) => setFormData({ ...formData, fechaAnclaje: e.target.value })}
                  className="w-full p-2.5 rounded-lg outline-none text-sm"
                  style={{ background: "#121418", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9" }}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/10">
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
              <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                <Save size={16} /> {editingCert ? "Guardar Cambios" : "Crear Certificado"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
