import { NextRequest } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';
import XlsxPopulate from 'xlsx-populate';
import { getTariffAmount } from '@/lib/prefacturaTarifas';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { periodo, banco, servicios } = body;

    if (!servicios || !Array.isArray(servicios) || servicios.length === 0) {
      return new Response(JSON.stringify({ error: 'No se enviaron servicios para prefacturar' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Locate template
    let templatePath = path.join(process.cwd(), 'prefactura.xlsx');
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(process.cwd(), 'public', 'prefactura.xlsx');
    }

    if (!fs.existsSync(templatePath)) {
      return new Response(JSON.stringify({ error: 'Plantilla prefactura.xlsx no encontrada en el servidor' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Load workbook using xlsx-populate to preserve styles, fonts, borders and formulas
    const workbook = await XlsxPopulate.fromFileAsync(templatePath);

    // 1. Configure Sheet "RESUMEN PRE FACTURA" (Sheet 0)
    const sheetResumen = workbook.sheet('RESUMEN PRE FACTURA') || workbook.sheet(0);
    const titleParts = ['PREFACTURA ATM SERVICIOS'];
    if (banco && banco !== 'TODOS') titleParts.push(banco.toUpperCase());
    if (periodo) titleParts.push(periodo.toUpperCase());
    sheetResumen.cell('A1').value(titleParts.join(' - '));

    // Ensure servicios are sorted from first day of month to last day (chronological ascending: 1 al 31)
    servicios.sort((a: any, b: any) => {
      const parseD = (d: string | null) => {
        if (!d) return 0;
        const p = String(d).trim().split('-');
        if (p.length === 3) {
          let y = p[2];
          if (y.length === 2) y = `20${y}`;
          const day = p[0].padStart(2, '0');
          const month = p[1].padStart(2, '0');
          return new Date(`${y}-${month}-${day}`).getTime() || 0;
        }
        return 0;
      };
      const dateA = parseD(a.fecha);
      const dateB = parseD(b.fecha);
      if (dateA !== dateB) return dateA - dateB;
      return (a.id || 0) - (b.id || 0);
    });

    // Limit to 250 sheets maximum (the template has sheets "1" through "250")
    const maxServices = Math.min(servicios.length, 250);

    for (let i = 0; i < maxServices; i++) {
      const serv = servicios[i];
      const sheetName = String(i + 1);
      const sheetNum = workbook.sheet(sheetName);
      if (!sheetNum) continue;

      const fechaStr = serv.fecha || '';
      const otStr = serv.ot || '';
      const ticketStr = serv.ticket || '';
      const atmStr = serv.atm || '';
      const localStr = serv.local || '';
      const tipoTrabajoStr = serv.tipo_trabajo || '';
      const solicitanteStr = serv.solicitante || serv.solicitado_por || '';
      const categoriaStr = serv.categoria || 'CONTINUIDAD OPERATIVA';
      const tipoMaquinaStr = serv.tipo_maquina || 'ATM';
      const servicioTarifado = serv.servicio_tarifado || 'Visita de eléctrico (Inspectiva u otros tipos)';
      const cantidad = Number(serv.cantidad) > 0 ? Number(serv.cantidad) : 1;
      const unidad = serv.unidad || 'GL';
      const valorUnitario = serv.valorUnitario !== undefined && serv.valorUnitario !== null 
        ? Number(serv.valorUnitario) 
        : getTariffAmount(servicioTarifado);
      const totalNeto = cantidad * valorUnitario;

      // ── Populate Header in Numbered Sheet ─────────────────────────
      sheetNum.cell('B1').value(tipoTrabajoStr);
      sheetNum.cell('B2').value(solicitanteStr);
      sheetNum.cell('B3').value(categoriaStr);
      sheetNum.cell('B4').value(atmStr);
      sheetNum.cell('B5').value(localStr);
      sheetNum.cell('B6').value(ticketStr);
      sheetNum.cell('B7').value(''); // Celda B7 (OT) vacía según solicitud
      sheetNum.cell('B8').value(tipoMaquinaStr);
      sheetNum.cell('B9').value(fechaStr);

      // ── Populate Item 1 (Row 12) ──────────────────────────────────
      sheetNum.cell('B12').value(fechaStr);
      sheetNum.cell('C12').value(servicioTarifado);
      sheetNum.cell('D12').value(cantidad);
      sheetNum.cell('E12').value(unidad);
      if (valorUnitario > 0) {
        sheetNum.cell('F12').value(valorUnitario);
      }
      sheetNum.cell('G12').value(totalNeto);

      // ── Total Neto Celda G24 ──────────────────────────────────────
      sheetNum.cell('G24').value(totalNeto);

      // ── Populate corresponding row in "RESUMEN PRE FACTURA" ────────
      const resumenRow = 4 + i;
      sheetResumen.cell(`B${resumenRow}`).value(''); // Columna OT vacía
      sheetResumen.cell(`C${resumenRow}`).value(ticketStr);
      sheetResumen.cell(`F${resumenRow}`).value(tipoMaquinaStr);
      sheetResumen.cell(`G${resumenRow}`).value(atmStr);
      sheetResumen.cell(`H${resumenRow}`).value(localStr);
      sheetResumen.cell(`I${resumenRow}`).value(tipoTrabajoStr);
      sheetResumen.cell(`J${resumenRow}`).value(totalNeto);
      sheetResumen.cell(`K${resumenRow}`).value(fechaStr);
      sheetResumen.cell(`L${resumenRow}`).value(solicitanteStr);
    }

    // Generate output file buffer
    const wbuf = await workbook.outputAsync();

    const cleanBanco = (banco && banco !== 'TODOS') ? banco.replace(/[^a-zA-Z0-9_-]/g, '_') : 'General';
    const cleanPeriodo = periodo ? periodo.replace(/[^a-zA-Z0-9_-]/g, '_') : 'Periodo';
    const fileName = `Prefactura_${cleanBanco}_${cleanPeriodo}.xlsx`;

    return new Response(new Uint8Array(wbuf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': wbuf.byteLength.toString(),
      },
    });
  } catch (error: unknown) {
    console.error('[generar-prefactura] Error:', error);
    const msg = error instanceof Error ? error.message : 'Error interno al generar prefactura';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
