export interface TariffItem {
  nombre: string;
  monto: number;
}

export const ITEMS_SERVICIOS: TariffItem[] = [
  { nombre: "Visita de eléctrico (Inspectiva u otros tipos)", monto: 66774.59 },
  { nombre: "Visita Fallida de eléctrico", monto: 33821.69 },
  { nombre: "Metro de tendido cable eléctrico libre de alógeno (desde el punto eléctrico del local al mueble de comunicación)", monto: 27728.93 },
  { nombre: "Zapatilla eléctrica magic y/o normal con caja chuqui", monto: 37924.06 },
  { nombre: "Metro de Instalación tubería PVC", monto: 12851.17 },
  { nombre: "Cableado para la tubería, cable libre de halógeno", monto: 20208.94 },
  { nombre: "Automáticos 16 amperes", monto: 18095.19 },
  { nombre: "Cambio de rieles de módulo Bticino", monto: 15317.63 },
  { nombre: "Enchufes magic macho 16 amperes", monto: 46482.74 },
  { nombre: "Tendido cables de comunicaciones", monto: 42282.46 },
  { nombre: "Cable UTP (conectores RJ 45)", monto: 27498.62 },
  { nombre: "Reposición de cableado interno cobre con roseta modular", monto: 30309.58 },
  { nombre: "Reposición cable de enlace", monto: 37404.69 },
  { nombre: "Conector RJ45 de cable UTP", monto: 18074.43 },
  { nombre: "Cable Powers", monto: 20112.09 },
  { nombre: "Tubería Corrugada Antivandálica", monto: 19558.05 },
  { nombre: "Barra Cooper Weld (problema de tierra)", monto: 256836.63 },
  { nombre: "Desanclaje de ATM (dispensador y/o depositario)", monto: 85950.23 },
  { nombre: "Desanclaje de Funda ATM (dispensador y/o depositario)", monto: 95077.06 },
  { nombre: "Anclaje de ATM (dispensador y/o depositario)", monto: 163825.07 },
  { nombre: "Anclaje de Funda ATM (dispensador y/o depositario)", monto: 154992.47 },
  { nombre: "Desconexión de Alarmas", monto: 82152.91 },
  { nombre: "Embalaje y desconexión Embozadora", monto: 84599.17 },
  { nombre: "Desanclaje Tótem (administrador de números)", monto: 57359.39 },
  { nombre: "Desanclaje de Teleconsulta", monto: 72323.28 },
  { nombre: "UPS", monto: 359475.70 },
  { nombre: "Estabilizador de Voltaje", monto: 236757.45 },
  { nombre: "Acondicionador de línea", monto: 350141.19 },
  { nombre: "Extractores de Aire", monto: 73584.66 },
  { nombre: "Reemplazo de transformador de equipo de comunicación de 24 volt o 12 volt", monto: 56984.65 },
  { nombre: "Servicio de limpieza por activación de gavetas entintadas", monto: 172452.76 },
  { nombre: "Servicio de pulido de piso por activación de gavetas entintadas", monto: 110232.07 },
  { nombre: "Supervisión de Actividades", monto: 67502.50 },
  { nombre: "Servicio de recepción o entrega de llaves del ATM", monto: 59837.88 },
  { nombre: "Pintura parcial de funda blindada", monto: 93747.55 },
  { nombre: "Pintura total de funda blindada", monto: 169230.00 },
  { nombre: "Papeleros", monto: 45436.28 },
  { nombre: "Custodia de Router", monto: 58977.70 },
  { nombre: "Desratización", monto: 198309.16 },
  { nombre: "Pintura muros (m2)", monto: 7095.74 },
  { nombre: "Pavimentos (m2)", monto: 58726.71 },
  { nombre: "Cerámica (m2)", monto: 50113.11 },
  { nombre: "Cielos americanos (ML)", monto: 47586.62 },
  { nombre: "Vacio", monto: 0 },
];

export function getSuggestedTariffItem(tipoTrabajo: string | null | undefined): string {
  if (!tipoTrabajo) return "Visita de eléctrico (Inspectiva u otros tipos)";
  const w = tipoTrabajo.toUpperCase().trim();

  if (w.includes("DESANCLAJE") && w.includes("FUNDA")) {
    return "Desanclaje de Funda ATM (dispensador y/o depositario)";
  }
  if (w.includes("DESANCLAJE")) {
    return "Desanclaje de ATM (dispensador y/o depositario)";
  }
  if (w.includes("ANCLAJE") && w.includes("FUNDA")) {
    return "Anclaje de Funda ATM (dispensador y/o depositario)";
  }
  if (w.includes("ANCLAJE")) {
    return "Anclaje de ATM (dispensador y/o depositario)";
  }
  if (w.includes("DESRATIZA")) {
    return "Desratización";
  }
  if (w.includes("LLAVE") || w.includes("LLAVES")) {
    return "Servicio de recepción o entrega de llaves del ATM";
  }
  if (w.includes("DESCONEXION DE ALARMA") || w.includes("ALARMA")) {
    return "Desconexión de Alarmas";
  }
  if (w.includes("SUPERVISION") || w.includes("SUPERVISAR")) {
    return "Supervisión de Actividades";
  }
  if (w.includes("ENLACE")) {
    return "Reposición cable de enlace";
  }
  if (w.includes("UTP") || (w.includes("CABLE") && !w.includes("ELECTRICO"))) {
    return "Cable UTP (conectores RJ 45)";
  }
  if (w.includes("EXTRACTOR")) {
    return "Extractores de Aire";
  }
  if (w.includes("ACONDICIONADOR")) {
    return "Acondicionador de línea";
  }
  if (w.includes("UPS")) {
    return "UPS";
  }
  if (w.includes("PINTURA")) {
    return "Pintura parcial de funda blindada";
  }
  if (w.includes("ELEC") || w.includes("ENCHUFE") || w.includes("LUMIN") || w.includes("INSPECT")) {
    return "Visita de eléctrico (Inspectiva u otros tipos)";
  }

  // Fallback directo si el texto coincide exactamente con algún ítem
  const exact = ITEMS_SERVICIOS.find(item => item.nombre.toUpperCase() === w);
  if (exact) return exact.nombre;

  return "Visita de eléctrico (Inspectiva u otros tipos)";
}

export function getTariffAmount(nombreItem: string): number {
  const item = ITEMS_SERVICIOS.find(i => i.nombre === nombreItem);
  return item ? item.monto : 0;
}
