import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  if (typeof date === 'string' && date.length === 10 && date.includes('-')) {
    const parts = date.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  const d = new Date(date);
  return d.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC"
  });
}

export function formatDateTime(date: string | Date): string {
  if (!date) return "—";
  let d = new Date(date);
  if (isNaN(d.getTime())) {
    if (typeof date === 'string' && date.startsWith('rep-')) {
      const ts = parseInt(date.replace('rep-', ''), 10);
      if (!isNaN(ts) && ts > 0) d = new Date(ts);
    }
    if (isNaN(d.getTime())) return String(date);
  }
  return d.toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    operativo: "text-brand-400",
    falla: "text-red-400",
    mantencion: "text-amber-400",
    traslado: "text-brand-400",
    creada: "text-slate-400",
    asignada: "text-brand-400",
    "en ruta": "text-brand-400",
    "en proceso": "text-amber-400",
    pausada: "text-orange-400",
    finalizada: "text-brand-400",
    reprogramada: "text-purple-400",
    cancelada: "text-red-400",
    disponible: "text-brand-400",
    offline: "text-slate-500",
    trabajando: "text-amber-400",
  };
  return colors[status.toLowerCase()] ?? "text-slate-400";
}

export function getStatusBg(status: string): string {
  const colors: Record<string, string> = {
    operativo: "bg-brand-500/10 text-brand-400 border-brand-500/20",
    falla: "bg-red-500/10 text-red-400 border-red-500/20",
    mantencion: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    traslado: "bg-brand-400/10 text-brand-400 border-brand-400/20",
    creada: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    asignada: "bg-brand-400/10 text-brand-400 border-brand-400/20",
    "en ruta": "bg-brand-400/10 text-brand-400 border-brand-400/20",
    "en proceso": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    pausada: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    finalizada: "bg-brand-500/10 text-brand-400 border-brand-500/20",
    reprogramada: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    cancelada: "bg-red-500/10 text-red-400 border-red-500/20",
    disponible: "bg-brand-500/10 text-brand-400 border-brand-500/20",
    offline: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    trabajando: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "en ruta (tec)": "bg-brand-400/10 text-brand-400 border-brand-400/20",
    alta: "bg-red-500/10 text-red-400 border-red-500/20",
    media: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    baja: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    critica: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return colors[status.toLowerCase()] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20";
}

export function truncate(str: string, maxLength: number): string {
  return str.length > maxLength ? str.slice(0, maxLength) + "…" : str;
}

/**
 * Genera el nombre del archivo de informe técnico según la estructura solicitada:
 * [Destinatario] Informe_OT_[N° OT] [Ubicación / Referencia] [ATM N°] [Detalle sin precio].[ext]
 * Ejemplo: Santander Informe_OT_11.222 SUCURSAL PRINCIPE DE GALES LA REINA ATM 601 CONEXION DE EQUIPOS.docx
 */
export function getReportFileName(report: any, extension: 'docx' | 'pdf' = 'docx'): string {
  if (!report) return `Informe_OT.${extension}`;

  const sanitize = (str?: string) =>
    (str || '')
      .replace(/[/\\?%*:|"<>]/g, '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // 1. Destinatario
  const destinatario = sanitize(report.destinatario || report.clientName);

  // 2. OT
  const rawOt = String(report.numeroOT || report.otNumber || '').trim();
  const otClean = rawOt
    .replace(/^Informe_OT_/i, '')
    .replace(/^OT[-_\s]*/i, '')
    .replace(/[/\\?%*:|"<>]/g, '')
    .trim();
  const otPart = otClean ? `Informe_OT_${otClean}` : 'Informe_OT';

  // 3. Ubicación / Referencia
  const ubicacion = sanitize(report.ubicacion || report.ubicacionRef || report.direccion);

  // 4. ATM
  let atmPart = '';
  const rawAtm = report.numeroATM !== undefined && report.numeroATM !== null ? String(report.numeroATM).trim() : '';
  if (rawAtm) {
    const cleanAtm = sanitize(rawAtm);
    if (cleanAtm) {
      atmPart = /^ATM\b/i.test(cleanAtm) ? cleanAtm : `ATM ${cleanAtm}`;
    }
  }

  // 5. Detalle (solo detalle sin precio)
  let detalle = sanitize(report.detalle || report.diagnosis || report.detalletrabajo || report.solution || '');
  // Eliminar precios si existiesen en el texto (ej: $ 139.000, + IVA, etc.)
  detalle = detalle.replace(/\$\s*[\d.,]+(?:\s*\+\s*IVA)?/gi, '').trim();
  if (detalle.length > 70) {
    detalle = detalle.substring(0, 70).trim();
  }

  const parts = [destinatario, otPart, ubicacion, atmPart, detalle].filter(Boolean);

  let baseName = parts.join(' ').replace(/\s+/g, ' ').trim();
  if (!baseName) {
    baseName = `Informe_OT_${rawOt || '10895'}`;
  }

  return `${baseName}.${extension}`;
}

/**
 * Genera el nombre del archivo de Certificado de Anclaje según la información ingresada:
 * Certificado De Anclaje [Marca] [Folio-Año] ATM [N° Cajero] [Ubicación].[ext]
 * Ejemplo: Certificado De Anclaje NCR 055-2026 ATM 3416 PRONTO COPEC DOÑIHUE.pdf
 */
export function getCertificadoFileName(cert: any, extension: 'docx' | 'pdf' = 'docx'): string {
  if (!cert) return `Certificado De Anclaje.${extension}`;

  const sanitize = (str?: string) =>
    (str || '')
      .replace(/[/\\?%*:|"<>]/g, '')
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // 1. Marca ATM (ej: NCR, HYOSUNG, DIEBOLD, WINCOR)
  const rawMarca = sanitize(cert.marcaModeloATM).toUpperCase();
  let marca = 'NCR';
  if (rawMarca.includes('HYOSUNG')) {
    marca = 'HYOSUNG';
  } else if (rawMarca.includes('DIEBOLD')) {
    marca = 'DIEBOLD';
  } else if (rawMarca.includes('WINCOR')) {
    marca = 'WINCOR';
  } else if (rawMarca.includes('NCR') || rawMarca.includes('SS') || rawMarca.includes('SELFSERV') || !rawMarca) {
    marca = 'NCR';
  } else {
    marca = rawMarca.split(/[\s-]+/)[0] || 'NCR';
  }

  // 2. Folio + Año (ej: 055-2026)
  let folioPart = sanitize(cert.folio).replace(/\s*-\s*/g, '-');
  const fechaStr = sanitize(cert.fechaAnclaje);
  const yearMatch = fechaStr.match(/^(\d{4})/);
  const year = yearMatch ? yearMatch[1] : String(new Date().getFullYear());

  if (folioPart && !/-\d{4}$/.test(folioPart)) {
    folioPart = `${folioPart}-${year}`;
  }

  // 3. ATM + Número de Cajero (ej: ATM 3416)
  let atmPart = '';
  const rawAtm = sanitize(cert.numeroCajero).toUpperCase();
  if (rawAtm) {
    atmPart = /^ATM\b/i.test(rawAtm) ? rawAtm : `ATM ${rawAtm}`;
  }

  // 4. Ubicación (ej: PRONTO COPEC DOÑIHUE)
  const ubicacionPart = sanitize(cert.ubicacion || cert.comuna || cert.direccion).toUpperCase();

  const parts = [
    'Certificado De Anclaje',
    marca,
    folioPart,
    atmPart,
    ubicacionPart,
  ].filter(Boolean);

  const baseName = parts.join(' ').replace(/\s+/g, ' ').trim();
  return `${baseName}.${extension}`;
}
