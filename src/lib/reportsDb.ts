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
  const { data, error } = await supabaseInforme
    .from(TABLE_NAME)
    .select('data')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching reports from Supabase:", error);
    // Return empty array as fallback if table isn't created yet instead of crashing
    if (error.code === '42P01') return []; // undefined_table
    throw new Error(error.message);
  }

  if (!data) return [];

  const results = data.map(r => r.data as TechnicalReport);
  
  // Enforce sorting by createdAt just in case
  results.sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  return results;
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
