import { NextRequest } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';

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
    let templatePath = path.join(process.cwd(), 'public', 'COTIZACION.xls');
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(process.cwd(), 'COTIZACION.xls');
    }
    
    if (!fs.existsSync(templatePath)) {
      return new Response(JSON.stringify({ error: `Plantilla COTIZACION.xls no encontrada (rutas buscadas: ${path.join(process.cwd(), 'public', 'COTIZACION.xls')} y ${path.join(process.cwd(), 'COTIZACION.xls')})` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fileBuffer = fs.readFileSync(templatePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellStyles: true, cellFormulas: true, cellNF: true });
    const sheetName = workbook.SheetNames[0];
    const ws = workbook.Sheets[sheetName];

    // Helper to modify cell value while keeping styles
    const updateCellValue = (cellRef: string, val: any) => {
      if (!ws[cellRef]) {
        ws[cellRef] = {};
      }
      ws[cellRef].v = val;
      if (typeof val === 'number') {
        ws[cellRef].t = 'n';
        delete ws[cellRef].f;
      } else {
        ws[cellRef].t = 's';
        delete ws[cellRef].f;
      }
      delete ws[cellRef].w; // Force recalculation/rendering of value
    };

    const { neto, iva, bruto } = calcTotals(cot.items);

    // Fill metadata
    updateCellValue('C11', cot.fecha || '');
    updateCellValue('I11', cot.numero || '');
    updateCellValue('C13', cot.cliente || '');
    updateCellValue('I13', cot.rut || '');
    updateCellValue('C15', cot.atencion || '');
    updateCellValue('I15', cot.emailContacto || '');

    // Fill description of service (D21)
    if (cot.descripcionServicio) {
      // Split description if it contains newlines or write as is
      updateCellValue('D21', cot.descripcionServicio);
    } else {
      updateCellValue('D21', '');
    }
    updateCellValue('D22', '');
    updateCellValue('D23', '');

    // Clear item cells in template from row 25 to 33 (default rows)
    for (let i = 0; i < 5; i++) {
      const row = 25 + i * 2;
      updateCellValue(`B${row}`, '');
      updateCellValue(`C${row}`, '');
      updateCellValue(`H${row}`, '');
      updateCellValue(`I${row}`, '');
      updateCellValue(`K${row}`, '');
    }

    // Fill items (odd rows starting from 25)
    cot.items.forEach((item: any, idx: number) => {
      const row = 25 + idx * 2;
      updateCellValue(`B${row}`, idx + 1);
      updateCellValue(`C${row}`, item.descripcion || '');
      updateCellValue(`H${row}`, Number(item.cantidad || 0));
      updateCellValue(`I${row}`, Number(item.valorUnit || 0));
      updateCellValue(`K${row}`, Number(item.cantidad || 0) * Number(item.valorUnit || 0));
    });

    // Fill address
    updateCellValue('C35', `DIRECCIÓN: ${cot.direccion || ''}`);

    // Fill note data
    updateCellValue('F38', cot.validacion || '5 dias');
    updateCellValue('F39', cot.plazoEntrega || '3 dias');

    // Fill totals
    updateCellValue('J38', neto);
    updateCellValue('J39', iva);
    updateCellValue('J40', bruto);

    // Generate output file buffer
    const wbuf = XLSX.write(workbook, { bookType: 'xls', type: 'buffer' });

    const fileName = `Cotizacion_${cot.numero || cot.id}.xls`;

    return new Response(new Uint8Array(wbuf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel',
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
