import { NextResponse } from 'next/server';
import type { TechnicalReport } from '@/types';
import { supabaseInforme } from '@/lib/supabaseInforme';
import { sortReportsDescending } from '@/lib/reportsDb';
import cachedReportsJson from '@/data/informes_cache.json';

// In-memory reports store
let memoryReports: TechnicalReport[] = sortReportsDescending([...(cachedReportsJson as TechnicalReport[])]);
let lastLiveSync = 0;

// Sync latest 50 reports from Supabase if more than 30s elapsed
async function syncLatestFromDB() {
  const now = Date.now();
  if (now - lastLiveSync < 30000) return; // 30s throttle
  lastLiveSync = now;

  try {
    const { data, error } = await supabaseInforme
      .from('informes')
      .select('id, created_at, data')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !data) return;

    let changed = false;
    for (const r of data) {
      const rd = r.data || {};
      const reportItem: TechnicalReport = {
        id: r.id,
        otNumber: rd.otNumber ?? '',
        clientName: rd.clientName ?? rd.destinatario ?? '',
        technicianName: rd.technicianName ?? rd.tecnico ?? '',
        technicianId: rd.technicianId ?? '',
        diagnosis: rd.diagnosis ?? rd.detalletrabajo ?? '',
        solution: rd.solution ?? rd.resumenTrabajo ?? '',
        createdAt: rd.createdAt ?? r.created_at ?? '',
        fechaInicio: rd.fechaInicio ?? '',
        fechaFin: rd.fechaFin ?? '',
        destinatario: rd.destinatario ?? '',
        direccion: rd.direccion ?? '',
        ubicacionRef: rd.ubicacionRef ?? '',
        comuna: rd.comuna ?? '',
        numeroATM: rd.numeroATM ?? '',
        serieATM: rd.serieATM ?? '',
        modeloMMBB: rd.modeloMMBB ?? '',
        serieMMBB: rd.serieMMBB ?? '',
        solicitante: rd.solicitante ?? '',
        valorServicio: rd.valorServicio ?? '',
        workOrderId: rd.workOrderId ?? '',
        materialsUsed: rd.materialsUsed ?? [],
        images: [],
      };

      const existingIndex = memoryReports.findIndex((item) => item.id === r.id);
      if (existingIndex >= 0) {
        memoryReports[existingIndex] = reportItem;
      } else {
        memoryReports.push(reportItem);
      }
      changed = true;
    }

    if (changed) {
      sortReportsDescending(memoryReports);
    }
  } catch (e) {
    console.error('Error syncing live reports:', e);
  }
}

export async function GET(request: Request) {
  await syncLatestFromDB();

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 10;
  const pageParam = searchParams.get('page');
  const page = pageParam ? parseInt(pageParam, 10) : 1;

  if (!q) {
    // Return latest reports according to limit and page
    const start = (page - 1) * limit;
    const paginated = memoryReports.slice(0, start + limit);
    return NextResponse.json({
      total: memoryReports.length,
      page,
      limit,
      hasMore: start + limit < memoryReports.length,
      reports: paginated,
    });
  }

  // Search across ALL reports in database
  // Match with dots or without dots in OT numbers (e.g. "10.928" vs "10928")
  const qClean = q.replace(/[^a-z0-9]/g, '');

  const matches = memoryReports.filter((r) => {
    const ot = (r.otNumber || '').toLowerCase();
    const otClean = ot.replace(/[^a-z0-9]/g, '');
    const atm = ((r as any).numeroATM || '').toLowerCase();
    const client = (r.clientName || '').toLowerCase();
    const tech = (r.technicianName || '').toLowerCase();
    const diag = (r.diagnosis || '').toLowerCase();
    const dir = ((r as any).direccion || '').toLowerCase();
    const com = ((r as any).comuna || '').toLowerCase();
    const sol = ((r as any).solicitante || '').toLowerCase();
    const dest = ((r as any).destinatario || '').toLowerCase();

    return (
      ot.includes(q) ||
      (qClean && otClean.includes(qClean)) ||
      atm.includes(q) ||
      client.includes(q) ||
      tech.includes(q) ||
      diag.includes(q) ||
      dir.includes(q) ||
      com.includes(q) ||
      sol.includes(q) ||
      dest.includes(q)
    );
  });

  sortReportsDescending(matches);

  return NextResponse.json({
    total: memoryReports.length,
    matchCount: matches.length,
    reports: matches,
  });
}

export async function POST(request: Request) {
  try {
    const report = await request.json();
    if (report && report.id) {
      const existingIndex = memoryReports.findIndex((item) => item.id === report.id);
      const cleanItem = { ...report, images: [] };
      if (existingIndex >= 0) {
        memoryReports[existingIndex] = cleanItem;
      } else {
        memoryReports.push(cleanItem);
      }
      sortReportsDescending(memoryReports);
      return NextResponse.json({ success: true, total: memoryReports.length });
    }
  } catch (e) {
    console.error('Error in POST /api/informes:', e);
  }
  return NextResponse.json({ success: false }, { status: 400 });
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (id) {
      memoryReports = memoryReports.filter((r) => r.id !== id);
      return NextResponse.json({ success: true, total: memoryReports.length });
    }
  } catch (e) {
    console.error('Error in DELETE /api/informes:', e);
  }
  return NextResponse.json({ success: false }, { status: 400 });
}
