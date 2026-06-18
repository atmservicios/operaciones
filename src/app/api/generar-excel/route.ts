import { NextRequest } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';
import XlsxPopulate from 'xlsx-populate';

export const runtime = 'nodejs';

function calcTotals(items: any[]) {
  const neto = items.reduce((sum, item) => sum + (Number(item.cantidad || 0) * Number(item.valorUnit || 0)), 0);
  const iva = Math.round(neto * 0.19);
  const bruto = neto + iva;
  return { neto, iva, bruto };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cot = body.cotizacion;

    if (!cot) {
      return new Response(JSON.stringify({ error: 'Falta el objeto cotizacion' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Load template
    let templatePath = path.join(process.cwd(), 'public', 'COTIZACION.xlsx');
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(process.cwd(), 'COTIZACION.xlsx');
    }

    if (!fs.existsSync(templatePath)) {
      return new Response(JSON.stringify({ error: `Plantilla COTIZACION.xlsx no encontrada` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Load workbook using xlsx-populate to preserve styles and images
    const workbook = await XlsxPopulate.fromFileAsync(templatePath);
    const sheet = workbook.sheet(0);

    const { neto, iva, bruto } = calcTotals(cot.items);

    // Fill metadata
    sheet.cell('C11').value(cot.fecha || '');
    sheet.cell('I11').value(cot.numero || '');
    sheet.cell('C13').value(cot.cliente || '');
    sheet.cell('I13').value(cot.rut || '');
    sheet.cell('C15').value(cot.atencion || '');
    sheet.cell('I15').value(cot.emailContacto || '');

    // Fill description of service (D21)
    if (cot.descripcionServicio) {
      sheet.cell('D21').value(cot.descripcionServicio);
    } else {
      sheet.cell('D21').value('');
    }
    sheet.cell('D22').value('');
    sheet.cell('D23').value('');

    // Clear item cells in template from row 25 to 33 (default 5 rows)
    for (let i = 0; i < 5; i++) {
      const row = 25 + i * 2;
      sheet.cell(`B${row}`).value('');
      sheet.cell(`C${row}`).value('');
      sheet.cell(`H${row}`).value('');
      sheet.cell(`I${row}`).value('');
      sheet.cell(`K${row}`).value('');
    }

    // Fill items (odd rows starting from 25, max 5 items to avoid overlapping notes)
    const itemsToRender = cot.items.slice(0, 5);
    itemsToRender.forEach((item: any, idx: number) => {
      const row = 25 + idx * 2;
      sheet.cell(`B${row}`).value(idx + 1);
      sheet.cell(`C${row}`).value(item.descripcion || '');
      sheet.cell(`H${row}`).value(Number(item.cantidad || 0));
      sheet.cell(`I${row}`).value(Number(item.valorUnit || 0));
      sheet.cell(`K${row}`).value(Number(item.cantidad || 0) * Number(item.valorUnit || 0));
    });

    // Fill address
    sheet.cell('C35').value(`DIRECCIÓN: ${cot.direccion || ''}`);

    // Fill note data
    sheet.cell('F38').value(cot.validacion || '5 dias');
    sheet.cell('F39').value(cot.plazoEntrega || '3 dias');

    // Fill totals
    sheet.cell('J38').value(neto);
    sheet.cell('J39').value(iva);
    sheet.cell('J40').value(bruto);

    // Generate output file buffer
    const wbuf = await workbook.outputAsync();

    const fileName = `Cotizacion_${cot.numero || cot.id}.xlsx`;

    return new Response(new Uint8Array(wbuf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': wbuf.byteLength.toString(),
      },
    });
  } catch (error: unknown) {
    console.error('[generar-excel] Error:', error);
    const msg = error instanceof Error ? error.message : 'Error interno';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
