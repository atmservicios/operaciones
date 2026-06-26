import type { TechnicalReport } from '@/types';
import { supabaseInforme } from './supabaseInforme';

const TABLE_NAME = 'informes';

export async function saveReportDB(report: TechnicalReport): Promise<void> {
  const { error } = await supabaseInforme
    .from(TABLE_NAME)
    .upsert({ id: report.id, data: report });
  
  if (error) {
    console.error("Error saving report to Supabase:", error);
    throw new Error(error.message);
  }
}

export async function getReportsDB(): Promise<TechnicalReport[]> {
  // Select ONLY lightweight fields for the list view to prevent TOAST table loading and timeouts
  const { data, error } = await supabaseInforme
    .from(TABLE_NAME)
    .select([
      'id',
      'created_at',
      'data->otNumber',
      'data->clientName',
      'data->technicianName',
      'data->diagnosis',
      'data->materialsUsed',
    ].join(', '))
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching reports from Supabase:", error);
    if (error.code === '42P01') return [];
    throw new Error(error.message);
  }

  if (!data) return [];

  const results: TechnicalReport[] = (data as any[]).map(r => ({
    id: r.id,
    otNumber: r.otNumber ?? '',
    clientName: r.clientName ?? '',
    technicianName: r.technicianName ?? '',
    technicianId: '',
    diagnosis: r.diagnosis ?? '',
    solution: '',
    createdAt: r.created_at ?? '',
    fechaInicio: '',
    fechaFin: '',
    destinatario: '',
    direccion: '',
    ubicacionRef: '',
    comuna: '',
    numeroATM: '',
    serieATM: '',
    modeloMMBB: '',
    serieMMBB: '',
    solicitante: '',
    valorServicio: '',
    workOrderId: '',
    materialsUsed: r.materialsUsed ?? [],
    images: [],
  }));

  return results;
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
    clientName: reportData.clientName ?? '',
    technicianName: reportData.technicianName ?? '',
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
}
