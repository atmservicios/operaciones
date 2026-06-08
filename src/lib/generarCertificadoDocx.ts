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
} from 'docx';

export async function generarCertificadoDocx(cert: any): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: [
          // Espacio inicial
          new Paragraph({ text: "", spacing: { after: 400 } }),
          
          // FOLIO N
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: "FOLIO N° ", bold: true }),
              new TextRun({ text: cert.folio || "_______", underline: {} }),
            ],
            spacing: { after: 600 }
          }),

          // Título
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Certificado de Anclaje de Cajero Automático", bold: true, size: 28 }),
            ],
            spacing: { after: 800 }
          }),

          // Datos de los equipos en tabla invisible o texto
          new Paragraph({
            children: [
              new TextRun({ text: "Marca / Modelo MMBB: ", bold: true }),
              new TextRun({ text: cert.marcaModeloMMBB || "" }),
            ],
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Serie MMBB: ", bold: true }),
              new TextRun({ text: cert.serieMMBB || "" }),
            ],
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Marca / Modelo ATM: ", bold: true }),
              new TextRun({ text: cert.marcaModeloATM || "" }),
            ],
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Tipo de Bóveda: ", bold: true }),
              new TextRun({ text: cert.tipoBoveda || "" }),
            ],
            spacing: { after: 800 }
          }),

          // Párrafo legal 1
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: "De acuerdo a lo establecido en el Decreto Exento No. 222 de fecha 07 de Marzo del 2013, con toma de razón por la Contraloría General de la República con fecha 04 de Julio del 2013 del Ministerio del Interior y Seguridad Pública, Articulo 6 letra (a), respecto a los dispuesto por la Subsecretaría de Prevención del Delito,  la cual regula  las medidas mínimas aplicables a la instalación y operación  de cajeros automáticos  dispensadores o contenedores de dinero de cualquier especie, instalados al interior o exterior de locales, establecimientos y/o recintos bancarios."
              })
            ],
            spacing: { after: 400, line: 360 }
          }),

          // Párrafo técnico 2
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: `El Ingeniero que suscribe, certifica que el Protector individualizado precedentemente, ha sido anclado a la base existente mediante el uso de 1 varilla roscada ${cert.medidaVarilla || 'Ø7/8 x 160MM de longitud'}, con rosca interior ${cert.medidaRosca || 'Ø9/16'} con ${cert.pernosMMBB || '7 pernos de acero SAE 1045 de Ø9/16. De diámetro y largo 60 mm.'}, utilizando para ello resina epóxica dimafi, que le otorga una resistencia mínima de 100 kilonewton a fuerza de tracción o empuje, conforme al grado de seguridad CEN IV o superior indicado en la norma Europea EN-1143-1, así mismo certifica que el cajero automático individualizado precedentemente, ha sido anclado a la base existente mediante el uso de 1 varilla roscada ${cert.medidaVarilla || 'Ø7/8 x 160MM de longitud'}, con rosca interior ${cert.medidaRosca || 'Ø9/16'} con ${cert.pernosATM || '4 pernos de acero SAE 1045 de Ø9/16. De diámetro y largo 60 mm.'}, utilizando para ello resina epóxica dimafi, que le otorga una resistencia mínima de 100 kilonewton a fuerza de tracción o empuje, conforme al grado de seguridad CEN IV o superior indicado en la norma Europea EN-1143-1.`
              })
            ],
            spacing: { after: 400, line: 360 }
          }),

          // Párrafo final 3
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: `Los materiales utilizados están en conformidad a la norma chilena Nch 300 y Nch 301 relacionadas con el anclaje de este mueble blindado y cajero automático. Siendo realizado por la Empresa Servicios ATMs Ltda representada por la Señora Gloria Raquel Fuentes Flores RUT 11.788.661-1 con fecha de anclaje `
              }),
              new TextRun({
                text: formatFechaCompleta(cert.fechaAnclaje) + ".",
                bold: true
              })
            ],
            spacing: { after: 1200, line: 360 }
          }),

          // Firma
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "_______________________________________", bold: true }),
            ],
            spacing: { after: 100 }
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Firma Ingeniero Certificador", bold: true }),
            ]
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
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
