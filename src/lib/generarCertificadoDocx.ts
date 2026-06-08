import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
} from 'docx';
import { firmaB64 } from "./firmaB64";
import { logoB64 } from "./logoB64";

export async function generarCertificadoDocx(cert: any): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,
              right: 1440,
              bottom: 720,
              left: 1440,
            },
          },
        },
        children: [
          // Espacio inicial
          new Paragraph({ text: "" }),

          // Logo and Folio Header
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE, size: 0, color: "auto" },
              bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
              left: { style: BorderStyle.NONE, size: 0, color: "auto" },
              right: { style: BorderStyle.NONE, size: 0, color: "auto" },
              insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
              insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new ImageRun({
                            data: Buffer.from(logoB64.split(',')[1], 'base64'),
                            transformation: {
                              width: 250,
                              height: 60
                            },
                            type: 'jpg'
                          })
                        ]
                      })
                    ]
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [
                          new TextRun({ text: "FOLIO N° ", bold: true, font: "Arial", size: 22 }),
                          new TextRun({ text: cert.folio || "_______", bold: true, font: "Arial", size: 22, underline: {} })
                        ]
                      })
                    ],
                    verticalAlign: "bottom"
                  })
                ]
              })
            ]
          }),

          // Título
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ 
                text: "Certificado de Anclaje de Cajero Automático", 
                bold: true,
                font: "Arial",
                size: 36 // 18pt
              })
            ],
            spacing: { before: 100, after: 100 }
          }),
          
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ 
                text: `ATM ${cert.numeroCajero || ""}`, 
                bold: true,
                font: "Arial",
                size: 36 // 18pt
              })
            ],
            spacing: { after: 100 }
          }),

          // Tabla de datos técnicos en tabla
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              createRow("Marca / Modelo MMBB", cert.marcaModeloMMBB),
              createRow("Serie MMBB", cert.serieMMBB),
              createRow("Marca / Modelo ATM", cert.marcaModeloATM),
              createRow("Serie ATM", cert.serieATM),
              createRow("Tipo de Bóveda", cert.tipoBoveda),
              createRow("Banco", cert.banco),
              createRow("Ubicación", cert.ubicacion),
              createRow("Dirección", cert.direccion),
              createRow("Comuna", cert.comuna),
              createRow("Región", cert.region),
            ]
          }),

          // Párrafo legal 1
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: "De acuerdo a lo establecido en el Decreto Exento No. 222 de fecha 07 de Marzo del 2013, con toma de razón por la Contraloría General de la República con fecha 04 de Julio del 2013 del Ministerio del Interior y Seguridad Pública, Articulo 6 letra (a), respecto a los dispuesto por la Subsecretaría de Prevención del Delito,  la cual regula  las medidas mínimas aplicables a la instalación y operación  de cajeros automáticos  dispensadores o contenedores de dinero de cualquier especie, instalados al interior o exterior de locales, establecimientos y/o recintos bancarios.",
                font: "Bookman Old Style",
                size: 20
              })
            ],
            spacing: { before: 100, after: 100, line: 240 }
          }),

          // Párrafo técnico 2
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: `El Ingeniero que suscribe, certifica que el Protector individualizado precedentemente, ha sido anclado a la base existente mediante el uso de 1 varilla roscada Ø7/8” x 160MM de longitud, con rosca interior Ø9/16” con 7 pernos de acero SAE 1045 de Ø9/16”. De diámetro y largo 60 mm., utilizando para ello resina epóxica dimafi, que le otorga una resistencia mínima de 100 kilonewton a fuerza de tracción o empuje, conforme al grado de seguridad CEN IV o superior indicado en la norma Europea EN-1143-1, así mismo certifica que el cajero automático individualizado precedentemente, ha sido anclado a la base existente mediante el uso de 1 varilla roscada Ø7/8” x 160MM de longitud, con rosca interior Ø9/16” con 4 pernos de acero SAE 1045 de Ø9/16”. De diámetro y largo 60 mm., utilizando para ello resina epóxica dimafi, que le otorga una resistencia mínima de 100 kilonewton a fuerza de tracción o empuje, conforme al grado de seguridad CEN IV o superior indicado en la norma Europea EN-1143-1.`,
                font: "Bookman Old Style",
                size: 20
              })
            ],
            spacing: { after: 100, line: 240 }
          }),

          // Párrafo final 3
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: `Los materiales utilizados están en conformidad a la norma chilena Nch 300 y Nch 301 relacionadas con el anclaje de este mueble blindado y cajero automático. Siendo realizado por la Empresa Servicios ATMs Ltda representada por la Señora Gloria Raquel Fuentes Flores RUT 11.788.661-1 con fecha de anclaje `,
                font: "Bookman Old Style",
                size: 20
              }),
              new TextRun({
                text: formatFechaCompleta(cert.fechaAnclaje) + ".",
                bold: true,
                font: "Bookman Old Style",
                size: 20
              })
            ],
            spacing: { after: 100, line: 240 }
          }),

          // Firma Imagen
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new ImageRun({
                type: 'jpg',
                data: Buffer.from(firmaB64.split(',')[1], 'base64'),
                transformation: {
                  width: 150,
                  height: 100
                }
              })
            ],
            spacing: { after: 50 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Jorge Moreno Sepúlveda", bold: true, font: "Bookman Old Style", size: 20 }),
            ]
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

function createRow(label: string, value: string) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 40, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: label, font: "Calibri", size: 24 })] })],
        margins: { top: 10, bottom: 10, left: 100, right: 100 }
      }),
      new TableCell({
        width: { size: 60, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: `: ${value || ''}`, bold: true, font: "Calibri", size: 24 })] })],
        margins: { top: 10, bottom: 10, left: 100, right: 100 }
      })
    ]
  });
}

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
