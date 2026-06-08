import { NextRequest } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';
import { firmaB64 } from '@/lib/firmaB64';
import { logoB64 } from '@/lib/logoB64';

export const runtime = 'nodejs';

function formatFechaCompleta(dateString: string): string {
  if (!dateString) return '';
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  try {
    const parts = dateString.split("-");
    if (parts.length === 3) {
      // YYYY-MM-DD
      const year = parts[0];
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return `${day} de ${meses[month]} de ${year}`;
    }
  } catch (e) {
    return dateString;
  }
  return dateString;
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const cert = body.certificado;

    if (!cert) {
      return new Response(JSON.stringify({ error: 'Falta el certificado' }), { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfmake = require('pdfmake');

    // Register Roboto fonts
    const robotoDir = path.join(process.cwd(), 'node_modules', 'pdfmake', 'fonts', 'Roboto');
    pdfmake.addFonts({
      Roboto: {
        normal: path.join(robotoDir, 'Roboto-Regular.ttf'),
        bold: path.join(robotoDir, 'Roboto-Medium.ttf'),
        italics: path.join(robotoDir, 'Roboto-Italic.ttf'),
        bolditalics: path.join(robotoDir, 'Roboto-MediumItalic.ttf'),
      },
    });

    const docDefinition = {
      pageSize: 'LETTER',
      pageMargins: [60, 60, 60, 60],
      content: [
        { text: '\n', margin: [0, 0, 0, 10] },
        {
          columns: [
            {
              image: logoB64,
              width: 150
            },
            {
              text: [
                { text: 'FOLIO N° ', bold: true, fontSize: 11 },
                { text: cert.folio || "_______", decoration: 'underline', bold: true, fontSize: 11 }
              ],
              alignment: 'right',
              margin: [0, 20, 0, 0]
            }
          ],
          margin: [0, 0, 0, 30]
        },
        { 
          text: 'Certificado de Anclaje de Cajero Automático', 
          style: 'header',
          alignment: 'center',
          margin: [0, 0, 0, 5]
        },
        { 
          text: `ATM ${cert.numeroCajero || ""}`, 
          style: 'header',
          alignment: 'center',
          margin: [0, 0, 0, 30]
        },
        {
          table: {
            widths: ['40%', '60%'],
            body: [
              ['Marca / Modelo MMBB', { text: `: ${cert.marcaModeloMMBB || ''}`, bold: true }],
              ['Serie MMBB', { text: `: ${cert.serieMMBB || ''}`, bold: true }],
              ['Marca / Modelo ATM', { text: `: ${cert.marcaModeloATM || ''}`, bold: true }],
              ['Serie ATM', { text: `: ${cert.serieATM || ''}`, bold: true }],
              ['Tipo de Bóveda', { text: `: ${cert.tipoBoveda || ''}`, bold: true }],
              ['Banco', { text: `: ${cert.banco || ''}`, bold: true }],
              ['Ubicación', { text: `: ${cert.ubicacion || ''}`, bold: true }],
              ['Dirección', { text: `: ${cert.direccion || ''}`, bold: true }],
              ['Comuna', { text: `: ${cert.comuna || ''}`, bold: true }],
              ['Región', { text: `: ${cert.region || ''}`, bold: true }]
            ]
          },
          layout: {
            hLineWidth: () => 1,
            vLineWidth: () => 1,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000',
            paddingLeft: () => 5,
            paddingRight: () => 5,
            paddingTop: () => 5,
            paddingBottom: () => 5,
          },
          margin: [0, 0, 0, 30]
        },
        {
          text: "De acuerdo a lo establecido en el Decreto Exento No. 222 de fecha 07 de Marzo del 2013, con toma de razón por la Contraloría General de la República con fecha 04 de Julio del 2013 del Ministerio del Interior y Seguridad Pública, Articulo 6 letra (a), respecto a los dispuesto por la Subsecretaría de Prevención del Delito,  la cual regula  las medidas mínimas aplicables a la instalación y operación  de cajeros automáticos  dispensadores o contenedores de dinero de cualquier especie, instalados al interior o exterior de locales, establecimientos y/o recintos bancarios.",
          alignment: 'justify',
          lineHeight: 1.5,
          margin: [0, 0, 0, 20],
          fontSize: 10
        },
        {
          text: `El Ingeniero que suscribe, certifica que el Protector individualizado precedentemente, ha sido anclado a la base existente mediante el uso de 1 varilla roscada Ø7/8” x 160MM de longitud, con rosca interior Ø9/16” con 7 pernos de acero SAE 1045 de Ø9/16”. De diámetro y largo 60 mm., utilizando para ello resina epóxica dimafi, que le otorga una resistencia mínima de 100 kilonewton a fuerza de tracción o empuje, conforme al grado de seguridad CEN IV o superior indicado en la norma Europea EN-1143-1, así mismo certifica que el cajero automático individualizado precedentemente, ha sido anclado a la base existente mediante el uso de 1 varilla roscada Ø7/8” x 160MM de longitud, con rosca interior Ø9/16” con 4 pernos de acero SAE 1045 de Ø9/16”. De diámetro y largo 60 mm., utilizando para ello resina epóxica dimafi, que le otorga una resistencia mínima de 100 kilonewton a fuerza de tracción o empuje, conforme al grado de seguridad CEN IV o superior indicado en la norma Europea EN-1143-1.`,
          alignment: 'justify',
          lineHeight: 1.5,
          margin: [0, 0, 0, 20],
          fontSize: 10
        },
        {
          text: [
            "Los materiales utilizados están en conformidad a la norma chilena Nch 300 y Nch 301 relacionadas con el anclaje de este mueble blindado y cajero automático. Siendo realizado por la Empresa Servicios ATMs Ltda representada por la Señora Gloria Raquel Fuentes Flores RUT 11.788.661-1 con fecha de anclaje ",
            { text: formatFechaCompleta(cert.fechaAnclaje) + ".", bold: true }
          ],
          alignment: 'justify',
          lineHeight: 1.5,
          margin: [0, 0, 0, 60],
          fontSize: 10
        },
        {
          image: firmaB64,
          width: 150,
          alignment: 'center',
          margin: [0, 0, 0, 5]
        },
        {
          text: "Jorge Moreno Sepúlveda",
          alignment: 'center',
          bold: true,
          fontSize: 10
        }
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true
        }
      },
      defaultStyle: {
        fontSize: 12,
        color: '#000000'
      }
    };

    const pdfDoc = pdfmake.createPdf(docDefinition);

    return new Promise<Response>((resolve, reject) => {
      pdfDoc.getBuffer((buffer: Buffer) => {
        try {
          const uint8 = new Uint8Array(buffer);
          const fileName = `Certificado_Anclaje_${cert.folio || 'nuevo'}.pdf`;
          resolve(
            new Response(uint8, {
              status: 200,
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': uint8.byteLength.toString(),
              },
            })
          );
        } catch (e) {
          reject(e);
        }
      });
    });

  } catch (error: any) {
    console.error('[generar-certificado-pdf] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Error interno' }), { status: 500 });
  }
}
