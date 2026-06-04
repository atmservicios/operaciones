import { NextRequest } from 'next/server';
import { generarDocx } from '@/lib/generarDocx';
import { Informe } from '@/types/informe';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const informe: Informe = body.informe;

    if (!informe) {
      return new Response(JSON.stringify({ error: 'Falta el objeto informe' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const buffer = await generarDocx(informe);
    const uint8 = new Uint8Array(buffer);

    const fileName = `Informe-OT-${informe.numeroATM || 'nuevo'}.docx`;

    return new Response(uint8, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': uint8.byteLength.toString(),
      },
    });
  } catch (error: unknown) {
    console.error('[generar-docx] Error:', error);
    const msg = error instanceof Error ? error.message : 'Error interno';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
