import type { TechnicalReport } from '@/types';
import { supabase } from './supabase';

const TABLE_NAME = 'informes';

export async function saveReportDB(report: TechnicalReport): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert({ id: report.id, data: report });
  
  if (error) {
    console.error("Error saving report to Supabase:", error);
    throw new Error(error.message);
  }
}

export async function getReportsDB(): Promise<TechnicalReport[]> {
  // Select only lightweight fields from the data JSONB — exclude heavy base64 images
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select([
      'id',
      'created_at',
      'data->otNumber',
      'data->clientName',
      'data->technicianName',
      'data->technicianId',
      'data->diagnosis',
      'data->solution',
      'data->createdAt',
      'data->fechaInicio',
      'data->fechaFin',
      'data->destinatario',
      'data->direccion',
      'data->ubicacionRef',
      'data->comuna',
      'data->numeroATM',
      'data->serieATM',
      'data->modeloMMBB',
      'data->serieMMBB',
      'data->solicitante',
      'data->valorServicio',
      'data->workOrderId',
      'data->materialsUsed',
    ].join(', '))
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching reports from Supabase:", error);
    if (error.code === '42P01') return [];
    throw new Error(error.message);
  }

  if (!data) return [];

  // Map the jsonb-extracted fields into TechnicalReport shape
  const results: TechnicalReport[] = (data as any[]).map(r => ({
    id: r.id,
    otNumber: r['otNumber'] ?? '',
    clientName: r['clientName'] ?? '',
    technicianName: r['technicianName'] ?? '',
    technicianId: r['technicianId'] ?? '',
    diagnosis: r['diagnosis'] ?? '',
    solution: r['solution'] ?? '',
    createdAt: r['createdAt'] ?? r['created_at'] ?? '',
    fechaInicio: r['fechaInicio'] ?? '',
    fechaFin: r['fechaFin'] ?? '',
    destinatario: r['destinatario'] ?? '',
    direccion: r['direccion'] ?? '',
    ubicacionRef: r['ubicacionRef'] ?? '',
    comuna: r['comuna'] ?? '',
    numeroATM: r['numeroATM'] ?? '',
    serieATM: r['serieATM'] ?? '',
    modeloMMBB: r['modeloMMBB'] ?? '',
    serieMMBB: r['serieMMBB'] ?? '',
    solicitante: r['solicitante'] ?? '',
    valorServicio: r['valorServicio'] ?? '',
    workOrderId: r['workOrderId'] ?? '',
    materialsUsed: r['materialsUsed'] ?? [],
    images: [],
  }));
  
  results.sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  return results;
}

export async function deleteReportDB(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error deleting report from Supabase:", error);
    throw new Error(error.message);
  }
}
