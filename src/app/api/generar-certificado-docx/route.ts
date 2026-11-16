import { NextRequest } from 'next/server';
import { generarCertificadoDocx } from '@/lib/generarCertificadoDocx';
import { getCertificadoFileName } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const certificado = body.certificado;

    if (!certificado) {
      return new Response(JSON.stringify({ error: 'Falta el objeto certificado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const buffer = await generarCertificadoDocx(certificado);
    const uint8 = new Uint8Array(buffer);

    const fileName = getCertificadoFileName(certificado, 'docx');
    const asciiFileName = fileName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return new Response(uint8, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${asciiFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Content-Length': uint8.byteLength.toString(),
      },
    });
  } catch (error: unknown) {
    console.error('[generar-certificado-docx] Error:', error);
    const msg = error instanceof Error ? error.message : 'Error interno';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
