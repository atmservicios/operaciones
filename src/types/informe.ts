export interface Informe {
  id?: string;
  numeroOT: string;
  destinatario: string; // Para la línea "Estimados ..."
  direccion: string;
  ubicacion: string;
  comuna: string;

  numeroATM: string;
  serieATM: string;

  modeloMMBB: string;
  serieMMBB: string;

  solicitante: string;
  tecnicoSupervisor: string;

  fechaInicio: string;
  fechaFin: string;

  valorServicio: string;

  detalle: string;
  resumenTrabajo: string;

  imagenes: string[]; // URLs o Data URLs en base64
}
