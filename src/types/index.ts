export type UserRole = "admin" | "supervisor" | "operaciones" | "tecnico" | "cliente";

export type ATMStatus = "operativo" | "falla" | "mantencion" | "traslado";
export type TechnicianStatus = "disponible" | "en ruta" | "trabajando" | "offline";
export type OrderStatus =
  | "creada"
  | "asignada"
  | "en ruta"
  | "en proceso"
  | "pausada"
  | "finalizada"
  | "reprogramada"
  | "cancelada";
export type Priority = "baja" | "media" | "alta" | "critica";
export type InventoryStatus = "disponible" | "en uso" | "dañado" | "en reparacion";

export interface Region {
  id: string;
  name: string;
}

export interface City {
  id: string;
  name: string;
  regionId: string;
}

export interface Client {
  id: string;
  name: string;
  rut: string;
  contactEmail: string;
  contactPhone: string;
}

export interface Bank {
  id: string;
  name: string;
  clientId: string;
}

export interface ATM {
  id: string;
  code: string;
  model: string;
  brand: string;
  serial: string;
  clientId: string;
  clientName: string;
  bankId: string;
  bankName: string;
  address: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
  status: ATMStatus;
  routerInstalled: boolean;
  lastMaintenance: string;
  nextRevision: string;
  createdAt: string;
  technicalHistory?: TechnicalEvent[];
}

export interface TechnicalEvent {
  id: string;
  date: string;
  type: string;
  description: string;
  technicianName: string;
}

export interface Technician {
  id: string;
  techNumber?: string;
  name: string;
  rut: string;
  phone: string;
  email: string;
  region: string;
  vehicle: string;
  certifications: string[];
  status: TechnicianStatus;
  avatar?: string;
  completedOrders: number;
  avgTime: number;
  productivity: number;
}

export interface WorkOrder {
  id: string;
  otNumber: string;
  clientId: string;
  clientName: string;
  bankId: string;
  bankName: string;
  atmId: string;
  atmCode: string;
  address: string;
  region: string;
  city: string;
  createdAt: string;
  scheduledDate: string;
  priority: Priority;
  technicianId?: string;
  technicianName?: string;
  status: OrderStatus;
  observations?: string;
  closureNotes?: string;
  evidences?: Evidence[];
}

export interface Evidence {
  id: string;
  type: "foto" | "video";
  url: string;
  uploadedAt: string;
}

export interface InventoryItem {
  id: string;
  category: string;
  name: string;
  serial: string;
  location: string;
  status: InventoryStatus;
  stock: number;
  responsible: string;
  minStock: number;
}

export interface TechnicalReport {
  id: string;
  workOrderId: string;
  otNumber: string;
  clientName: string;
  diagnosis: string;
  solution: string;
  materialsUsed: { name: string; quantity: number }[];
  technicianId: string;
  technicianName: string;
  createdAt: string;

  // Extended fields
  direccion?: string;
  ubicacionRef?: string;
  comuna?: string;
  numeroATM?: string;
  serieATM?: string;
  modeloMMBB?: string;
  serieMMBB?: string;
  destinatario?: string;
  solicitante?: string;
  fechaInicio?: string;
  fechaFin?: string;
  valorServicio?: string;
  images?: string[];
  tecnico?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface DashboardStats {
  atms: {
    total: number;
    operativo: number;
    falla: number;
    mantencion: number;
    traslado: number;
  };
  technicians: {
    total: number;
    disponible: number;
    enRuta: number;
    trabajando: number;
    offline: number;
  };
  orders: {
    pendientes: number;
    enEjecucion: number;
    cerradosHoy: number;
    slaVencidos: number;
  };
  alerts: {
    urgencias: number;
    incidentesCriticos: number;
    stockBajo: number;
  };
}
