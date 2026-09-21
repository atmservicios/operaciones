import type { TechnicalReport } from '@/types';
import { supabaseInforme } from './supabaseInforme';

const TABLE_NAME = 'informes';

export function getReportTime(r: any): number {
  if (!r) return 0;
  if (r.createdAt) {
    const t = new Date(r.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (r.created_at) {
    const t = new Date(r.created_at).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  const digits = (r.id || '').replace(/[^0-9]/g, '');
  if (digits && digits.length >= 10) {
    const t = parseInt(digits, 10);
    if (!isNaN(t) && t > 0) return t;
  }
  return 0;
}

export function sortReportsDescending<T = any>(reports: T[]): T[] {
  return reports.sort((a: any, b: any) => {
    const timeDiff = getReportTime(b) - getReportTime(a);
    if (timeDiff !== 0) return timeDiff;
    return String(b.id || '').localeCompare(String(a.id || ''));
  });
}

export async function saveReportDB(report: TechnicalReport): Promise<void> {
  const { error } = await supabaseInforme
    .from(TABLE_NAME)
    .upsert({ id: report.id, data: report });

  if (error) {
    console.error("Error saving report to Supabase:", error);
    throw new Error(error.message);
  }

  // Update in-memory server cache
  try {
    await fetch('/api/informes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
  } catch (e) {
    // Non-blocking
  }
}

export async function getReportsDB(limit = 10, page = 1): Promise<{ reports: TechnicalReport[]; total: number }> {
  try {
    const res = await fetch(`/api/informes?limit=${limit}&page=${page}`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.reports) && json.reports.length > 0) {
        return { reports: sortReportsDescending(json.reports), total: json.total || json.reports.length };
      }
    }
  } catch (e) {
    console.warn("API /api/informes unreachable, falling back to direct Supabase:", e);
  }

  // Fallback: direct Supabase query
  const { data, error } = await supabaseInforme
    .from(TABLE_NAME)
    .select('id, created_at, data')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching reports from Supabase:", error);
    if (error.code === '42P01') return { reports: [], total: 0 };
    throw new Error(error.message);
  }

  if (!data) return { reports: [], total: 0 };

  const results: TechnicalReport[] = (data as any[]).map(r => {
    const reportData = r.data || {};
    return {
      id: r.id,
      otNumber: reportData.otNumber ?? '',
      clientName: reportData.clientName ?? reportData.destinatario ?? '',
      technicianName: reportData.technicianName ?? reportData.tecnico ?? '',
      technicianId: reportData.technicianId ?? '',
      diagnosis: reportData.diagnosis ?? reportData.detalletrabajo ?? '',
      solution: reportData.solution ?? reportData.resumenTrabajo ?? '',
      createdAt: reportData.createdAt ?? r.created_at ?? '',
      fechaInicio: reportData.fechaInicio ?? '',
      fechaFin: reportData.fechaFin ?? '',
      destinatario: reportData.destinatario ?? '',
      direccion: reportData.direccion ?? '',
      ubicacionRef: reportData.ubicacionRef ?? '',
      comuna: reportData.comuna ?? '',
      numeroATM: reportData.numeroATM ?? '',
      serieATM: reportData.serieATM ?? '',
      modeloMMBB: reportData.modeloMMBB ?? '',
      serieMMBB: reportData.serieMMBB ?? '',
      solicitante: reportData.solicitante ?? '',
      valorServicio: reportData.valorServicio ?? '',
      workOrderId: reportData.workOrderId ?? '',
      materialsUsed: reportData.materialsUsed ?? [],
      images: [], // Strip images in list view to keep memory light
    };
  });

  return { reports: sortReportsDescending(results), total: results.length };
}

export async function searchReportsDB(query: string): Promise<TechnicalReport[]> {
  const q = query.trim();
  if (!q) {
    const initial = await getReportsDB(10, 1);
    return initial.reports;
  }

  try {
    const res = await fetch(`/api/informes?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      return sortReportsDescending(json.reports || []);
    }
  } catch (e) {
    console.error("Error calling /api/informes search:", e);
  }

  return [];
}

export async function getReportByIdDB(id: string): Promise<TechnicalReport | null> {
  const { data, error } = await supabaseInforme
    .from(TABLE_NAME)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching report ${id} from Supabase:`, error);
    return null;
  }

  if (!data) return null;

  const r = data;
  const reportData = r.data || {};
  return {
    id: r.id,
    otNumber: reportData.otNumber ?? '',
    clientName: reportData.clientName ?? reportData.destinatario ?? '',
    technicianName: reportData.technicianName ?? reportData.tecnico ?? '',
    technicianId: reportData.technicianId ?? '',
    diagnosis: reportData.diagnosis ?? reportData.detalletrabajo ?? '',
    solution: reportData.solution ?? reportData.resumenTrabajo ?? '',
    createdAt: reportData.createdAt ?? r.created_at ?? '',
    fechaInicio: reportData.fechaInicio ?? '',
    fechaFin: reportData.fechaFin ?? '',
    destinatario: reportData.destinatario ?? '',
    direccion: reportData.direccion ?? '',
    ubicacionRef: reportData.ubicacionRef ?? '',
    comuna: reportData.comuna ?? '',
    numeroATM: reportData.numeroATM ?? '',
    serieATM: reportData.serieATM ?? '',
    modeloMMBB: reportData.modeloMMBB ?? '',
    serieMMBB: reportData.serieMMBB ?? '',
    solicitante: reportData.solicitante ?? '',
    valorServicio: reportData.valorServicio ?? '',
    workOrderId: reportData.workOrderId ?? '',
    materialsUsed: reportData.materialsUsed ?? [],
    images: reportData.images ?? [],
  };
}

export async function deleteReportDB(id: string): Promise<void> {
  const { error } = await supabaseInforme
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting report from Supabase:", error);
    throw new Error(error.message);
  }

  try {
    await fetch(`/api/informes?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
  } catch (e) {
    // Non-blocking
  }
}
