import type {
  ATM,
  Technician,
  WorkOrder,
  InventoryItem,
  TechnicalReport,
  ActivityLog,
  DashboardStats,
} from "@/types";

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
export const mockDashboardStats: DashboardStats = {
  atms: { total: 248, operativo: 201, falla: 18, mantencion: 21, traslado: 8 },
  technicians: { total: 34, disponible: 12, enRuta: 9, trabajando: 10, offline: 3 },
  orders: { pendientes: 47, enEjecucion: 22, cerradosHoy: 31, slaVencidos: 6 },
  alerts: { urgencias: 4, incidentesCriticos: 2, stockBajo: 8 },
};

// ─── ATMs ─────────────────────────────────────────────────────────────────────
export const mockATMs: ATM[] = [
  {
    id: "atm-001", code: "BE-SCL-001", model: "Diebold Nixdorf 5500", brand: "Diebold", serial: "DN5500-2021-0047",
    clientId: "c-001", clientName: "BancoEstado", bankId: "b-001", bankName: "BancoEstado",
    address: "Av. Libertador Bernardo O'Higgins 1111, Santiago", city: "Santiago", region: "Metropolitana",
    lat: -33.4489, lng: -70.6693, status: "operativo", routerInstalled: true,
    lastMaintenance: "2025-04-10", nextRevision: "2025-07-10", createdAt: "2021-03-15",
    technicalHistory: [
      { id: "th-1", date: "2025-04-10", type: "Mantención preventiva", description: "Limpieza, calibración y actualización de firmware", technicianName: "Carlos Muñoz" },
      { id: "th-2", date: "2025-01-22", type: "Falla resuelta", description: "Reemplazo de módulo dispensador de billetes", technicianName: "Pedro González" },
    ],
  },
  {
    id: "atm-002", code: "SANT-SCL-021", model: "NCR SelfServ 84", brand: "NCR", serial: "NCR84-2020-0312",
    clientId: "c-002", clientName: "Banco Santander", bankId: "b-002", bankName: "Banco Santander",
    address: "Av. Providencia 1234, Providencia", city: "Providencia", region: "Metropolitana",
    lat: -33.4316, lng: -70.6217, status: "falla", routerInstalled: true,
    lastMaintenance: "2025-03-05", nextRevision: "2025-06-05", createdAt: "2020-08-20",
    technicalHistory: [
      { id: "th-3", date: "2025-05-20", type: "Falla activa", description: "Error en lectora de tarjetas. Técnico en camino.", technicianName: "Ana Torres" },
    ],
  },
  {
    id: "atm-003", code: "BCI-VAL-005", model: "Wincor Nixdorf ProCash 2050", brand: "Wincor", serial: "WN2050-2022-0089",
    clientId: "c-003", clientName: "BCI", bankId: "b-003", bankName: "BCI",
    address: "Av. Brasil 421, Valparaíso", city: "Valparaíso", region: "Valparaíso",
    lat: -33.0472, lng: -71.6127, status: "mantencion", routerInstalled: false,
    lastMaintenance: "2025-05-18", nextRevision: "2025-08-18", createdAt: "2022-01-10",
    technicalHistory: [],
  },
  {
    id: "atm-004", code: "ITAU-SCL-007", model: "NCR SelfServ 23", brand: "NCR", serial: "NCR23-2023-0156",
    clientId: "c-004", clientName: "Banco Itaú", bankId: "b-004", bankName: "Banco Itaú",
    address: "Av. Apoquindo 4501, Las Condes", city: "Las Condes", region: "Metropolitana",
    lat: -33.4107, lng: -70.5785, status: "operativo", routerInstalled: true,
    lastMaintenance: "2025-02-28", nextRevision: "2025-05-28", createdAt: "2023-06-01",
    technicalHistory: [],
  },
  {
    id: "atm-005", code: "CHILE-CON-003", model: "Diebold Nixdorf CS 3000", brand: "Diebold", serial: "DN3000-2021-0203",
    clientId: "c-005", clientName: "Banco de Chile", bankId: "b-005", bankName: "Banco de Chile",
    address: "Av. Concepción 820, Concepción", city: "Concepción", region: "Biobío",
    lat: -36.8201, lng: -73.0444, status: "traslado", routerInstalled: true,
    lastMaintenance: "2025-01-15", nextRevision: "2025-04-15", createdAt: "2021-09-10",
    technicalHistory: [],
  },
  {
    id: "atm-006", code: "SCOTIA-SCL-012", model: "Hyosung MoniMax 7600I", brand: "Hyosung", serial: "HY7600-2022-0445",
    clientId: "c-006", clientName: "Scotiabank", bankId: "b-006", bankName: "Scotiabank",
    address: "Av. Vicuña Mackenna 2150, Macul", city: "Macul", region: "Metropolitana",
    lat: -33.4876, lng: -70.5987, status: "operativo", routerInstalled: true,
    lastMaintenance: "2025-04-20", nextRevision: "2025-07-20", createdAt: "2022-03-14",
    technicalHistory: [],
  },
  {
    id: "atm-007", code: "BE-IQUI-001", model: "NCR SelfServ 68", brand: "NCR", serial: "NCR68-2023-0078",
    clientId: "c-001", clientName: "BancoEstado", bankId: "b-001", bankName: "BancoEstado",
    address: "Av. Arturo Prat 380, Iquique", city: "Iquique", region: "Tarapacá",
    lat: -20.2141, lng: -70.1523, status: "falla", routerInstalled: true,
    lastMaintenance: "2024-12-01", nextRevision: "2025-03-01", createdAt: "2023-02-20",
    technicalHistory: [],
  },
  {
    id: "atm-008", code: "CHILE-ANTO-002", model: "Diebold Nixdorf 5500", brand: "Diebold", serial: "DN5500-2020-0301",
    clientId: "c-005", clientName: "Banco de Chile", bankId: "b-005", bankName: "Banco de Chile",
    address: "Av. Grecia 2800, Antofagasta", city: "Antofagasta", region: "Antofagasta",
    lat: -23.6509, lng: -70.3954, status: "operativo", routerInstalled: false,
    lastMaintenance: "2025-03-10", nextRevision: "2025-06-10", createdAt: "2020-11-05",
    technicalHistory: [],
  },
];

// ─── Technicians ──────────────────────────────────────────────────────────────
export const mockTechnicians: Technician[] = [
  {
    id: "tech-001", techNumber: "01", name: "Jorge Urra Uteau", rut: "10.116.162-5", phone: "56944771425",
    email: "Jorge.urra@atmservicios.cl", region: "Metropolitana", vehicle: "",
    certifications: [], status: "disponible", completedOrders: 0, avgTime: 0, productivity: 0,
  },
  {
    id: "tech-002", techNumber: "02", name: "Jorge Urra Pizarro", rut: "16.954.769-6", phone: "56944771425",
    email: "jorge.urra.p@atmservicios.cl", region: "Valparaíso", vehicle: "Camioneta Hilux TJ-4521",
    certifications: ["Wincor ProCash"], status: "en ruta", completedOrders: 3, avgTime: 4.1, productivity: 88,
  },
  {
    id: "tech-003", techNumber: "03", name: "Jamzhitt Elias Baeza Muñoz", rut: "10.470.128-0", phone: "56986858469",
    email: "jamzhitt.baeza@atmservicios.cl", region: "Metropolitana", vehicle: "",
    certifications: [], status: "disponible", completedOrders: 0, avgTime: 0, productivity: 0,
  },
  {
    id: "tech-004", techNumber: "04", name: "Manuel Morales Lefian", rut: "11.909.657-K", phone: "56944914774",
    email: "manuel.morales@atmservicios.cl", region: "Metropolitana", vehicle: "",
    certifications: [], status: "disponible", completedOrders: 0, avgTime: 0, productivity: 0,
  },
  {
    id: "tech-005", techNumber: "05", name: "Rodolfo Salinas Pizarro", rut: "16.422.586-0", phone: "56944771782",
    email: "rodolfo.salinas@atmservicios.cl", region: "Metropolitana", vehicle: "",
    certifications: [], status: "disponible", completedOrders: 0, avgTime: 0, productivity: 0,
  },
  {
    id: "tech-006", techNumber: "06", name: "Alberto Retamal González", rut: "9.474.636-1", phone: "56982473462",
    email: "alberto.retamal@atmservicios.cl", region: "Metropolitana", vehicle: "",
    certifications: [], status: "disponible", completedOrders: 0, avgTime: 0, productivity: 0,
  },
  {
    id: "tech-007", techNumber: "07", name: "Diego Urra Fuentes", rut: "20.112.340-2", phone: "56944914777",
    email: "diego.urra@atmservicios.cl", region: "Metropolitana", vehicle: "",
    certifications: [], status: "disponible", completedOrders: 0, avgTime: 0, productivity: 0,
  },
  {
    id: "tech-008", techNumber: "08", name: "Mauricio Quiroz Cerda", rut: "10.533.234-3", phone: "56946591040",
    email: "mauricio.quiroz@atmservicios.cl", region: "Metropolitana", vehicle: "",
    certifications: [], status: "disponible", completedOrders: 0, avgTime: 0, productivity: 0,
  },
  {
    id: "tech-009", techNumber: "09", name: "Gustavo Rojas Valverde", rut: "13.447.944-2", phone: "56944771040",
    email: "gustavo.rojas@atmservicios.cl", region: "Metropolitana", vehicle: "",
    certifications: [], status: "disponible", completedOrders: 0, avgTime: 0, productivity: 0,
  },
  {
    id: "tech-010", techNumber: "10", name: "Sergio Contreras Toro", rut: "11.472.971-k", phone: "56931010771",
    email: "", region: "Metropolitana", vehicle: "",
    certifications: [], status: "disponible", completedOrders: 0, avgTime: 0, productivity: 0,
  },
  {
    id: "tech-011", techNumber: "11", name: "Manuel Morales Guzman", rut: "22.096.436-1", phone: "56958572655",
    email: "", region: "Metropolitana", vehicle: "",
    certifications: [], status: "disponible", completedOrders: 0, avgTime: 0, productivity: 0,
  },
  {
    id: "tech-012", techNumber: "12", name: "Cristian Villegas Menanteau", rut: "15.372.957-3", phone: "56944914772",
    email: "", region: "Metropolitana", vehicle: "",
    certifications: [], status: "disponible", completedOrders: 0, avgTime: 0, productivity: 0,
  },
  {
    id: "tech-013", techNumber: "13", name: "Scott Benavides Silva", rut: "17.422.788-8", phone: "56944914773",
    email: "scott.benavides@atmservicios.cl", region: "Metropolitana", vehicle: "",
    certifications: [], status: "disponible", completedOrders: 0, avgTime: 0, productivity: 0,
  },
];


// ─── Work Orders ──────────────────────────────────────────────────────────────
export const mockWorkOrders: WorkOrder[] = [
  {
    id: "wo-001", otNumber: "OT-2025-1847", clientId: "c-001", clientName: "BancoEstado",
    bankId: "b-001", bankName: "BancoEstado", atmId: "atm-007", atmCode: "BE-IQUI-001",
    address: "Av. Arturo Prat 380, Iquique", region: "Tarapacá", city: "Iquique",
    createdAt: "2025-05-20T09:15:00Z", scheduledDate: "2025-05-22T10:00:00Z",
    priority: "alta", technicianId: "tech-005", technicianName: "Rodrigo Herrera Díaz",
    status: "en ruta", observations: "ATM no dispensa billetes. Cliente reporta error E001.",
  },
  {
    id: "wo-002", otNumber: "OT-2025-1846", clientId: "c-002", clientName: "Banco Santander",
    bankId: "b-002", bankName: "Banco Santander", atmId: "atm-002", atmCode: "SANT-SCL-021",
    address: "Av. Providencia 1234, Providencia", region: "Metropolitana", city: "Providencia",
    createdAt: "2025-05-20T08:30:00Z", scheduledDate: "2025-05-22T09:00:00Z",
    priority: "critica", technicianId: "tech-002", technicianName: "Ana Torres Rivas",
    status: "en proceso", observations: "Falla en lectora de tarjetas. ATM fuera de servicio.",
  },
  {
    id: "wo-003", otNumber: "OT-2025-1845", clientId: "c-003", clientName: "BCI",
    bankId: "b-003", bankName: "BCI", atmId: "atm-003", atmCode: "BCI-VAL-005",
    address: "Av. Brasil 421, Valparaíso", region: "Valparaíso", city: "Valparaíso",
    createdAt: "2025-05-19T14:00:00Z", scheduledDate: "2025-05-22T08:00:00Z",
    priority: "media", technicianId: "tech-003", technicianName: "Pedro González Soto",
    status: "asignada", observations: "Mantención preventiva programada. Instalar router.",
  },
  {
    id: "wo-004", otNumber: "OT-2025-1844", clientId: "c-004", clientName: "Banco Itaú",
    bankId: "b-004", bankName: "Banco Itaú", atmId: "atm-004", atmCode: "ITAU-SCL-007",
    address: "Av. Apoquindo 4501, Las Condes", region: "Metropolitana", city: "Las Condes",
    createdAt: "2025-05-19T11:00:00Z", scheduledDate: "2025-05-21T15:00:00Z",
    priority: "baja", technicianId: "tech-001", technicianName: "Carlos Muñoz Vega",
    status: "finalizada", observations: "Revisión periódica. Sin novedades.",
    closureNotes: "ATM operativo. Se realizó limpieza y actualización de software.",
  },
  {
    id: "wo-005", otNumber: "OT-2025-1843", clientId: "c-005", clientName: "Banco de Chile",
    bankId: "b-005", bankName: "Banco de Chile", atmId: "atm-005", atmCode: "CHILE-CON-003",
    address: "Av. Concepción 820, Concepción", region: "Biobío", city: "Concepción",
    createdAt: "2025-05-18T16:00:00Z", scheduledDate: "2025-05-23T09:00:00Z",
    priority: "alta", technicianId: "tech-004", technicianName: "María López Castro",
    status: "creada", observations: "ATM en traslado. Coordinar instalación en nueva sucursal.",
  },
  {
    id: "wo-006", otNumber: "OT-2025-1842", clientId: "c-001", clientName: "BancoEstado",
    bankId: "b-001", bankName: "BancoEstado", atmId: "atm-001", atmCode: "BE-SCL-001",
    address: "Av. Libertador Bernardo O'Higgins 1111, Santiago", region: "Metropolitana", city: "Santiago",
    createdAt: "2025-05-17T10:00:00Z", scheduledDate: "2025-05-20T10:00:00Z",
    priority: "media", status: "cancelada",
    observations: "Cliente canceló visita. Reprogramar próxima semana.",
  },
  {
    id: "wo-007", otNumber: "OT-2025-1841", clientId: "c-006", clientName: "Scotiabank",
    bankId: "b-006", bankName: "Scotiabank", atmId: "atm-006", atmCode: "SCOTIA-SCL-012",
    address: "Av. Vicuña Mackenna 2150, Macul", region: "Metropolitana", city: "Macul",
    createdAt: "2025-05-20T07:00:00Z", scheduledDate: "2025-05-22T11:00:00Z",
    priority: "media", technicianId: "tech-007", technicianName: "Daniela Fuentes Morales",
    status: "en proceso", observations: "Actualización de firmware programada.",
  },
  {
    id: "wo-008", otNumber: "OT-2025-1840", clientId: "c-005", clientName: "Banco de Chile",
    bankId: "b-005", bankName: "Banco de Chile", atmId: "atm-008", atmCode: "CHILE-ANTO-002",
    address: "Av. Grecia 2800, Antofagasta", region: "Antofagasta", city: "Antofagasta",
    createdAt: "2025-05-15T09:00:00Z", scheduledDate: "2025-05-19T09:00:00Z",
    priority: "alta", status: "reprogramada",
    observations: "SLA VENCIDO. Técnico sin disponibilidad. Reprogramar urgente.",
  },
];

// ─── Inventory ────────────────────────────────────────────────────────────────
export const mockInventory: InventoryItem[] = [
  { id: "inv-001", category: "Piezas ATM", name: "Módulo Dispensador Diebold DN5500", serial: "DISP-DN-001", location: "Bodega Central SCL", status: "disponible", stock: 4, responsible: "Carlos Muñoz", minStock: 2 },
  { id: "inv-002", category: "Piezas ATM", name: "Lectora de Tarjetas NCR", serial: "LEC-NCR-042", location: "Bodega Central SCL", status: "disponible", stock: 7, responsible: "Ana Torres", minStock: 3 },
  { id: "inv-003", category: "Routers", name: "Router Mikrotik hAP ac3", serial: "MKT-HAP-0213", location: "Bodega Valparaíso", status: "disponible", stock: 2, responsible: "Pedro González", minStock: 3 },
  { id: "inv-004", category: "Cerraduras", name: "Cerradura Diebold Triton", serial: "CER-DIE-007", location: "Técnico: Carlos Muñoz", status: "en uso", stock: 1, responsible: "Carlos Muñoz", minStock: 2 },
  { id: "inv-005", category: "Fundas", name: "Funda protectora ATM outdoor", serial: "FUN-OUT-033", location: "Bodega Central SCL", status: "disponible", stock: 12, responsible: "Administrador", minStock: 5 },
  { id: "inv-006", category: "Piezas ATM", name: "Teclado PIN Pad Wincor", serial: "PIN-WIN-098", location: "Bodega Central SCL", status: "disponible", stock: 1, responsible: "Administrador", minStock: 2 },
  { id: "inv-007", category: "Routers", name: "Antena LTE Externa", serial: "ANT-LTE-441", location: "Bodega Concepción", status: "disponible", stock: 5, responsible: "María López", minStock: 2 },
  { id: "inv-008", category: "Piezas ATM", name: "Cassette de efectivo NCR", serial: "CAS-NCR-076", location: "En reparación", status: "en reparacion", stock: 0, responsible: "Taller Técnico", minStock: 1 },
  { id: "inv-009", category: "Piezas ATM", name: "Módulo impresora recibo Diebold", serial: "IMP-DIE-055", location: "Técnico: Daniela Fuentes", status: "en uso", stock: 1, responsible: "Daniela Fuentes", minStock: 2 },
  { id: "inv-010", category: "Cerraduras", name: "Cilindro de seguridad Compulock", serial: "CER-CPL-112", location: "Bodega Central SCL", status: "disponible", stock: 8, responsible: "Administrador", minStock: 3 },
];

// ─── Charts data ──────────────────────────────────────────────────────────────
export const productivityData = [
  { day: "Lun", completadas: 12, sla: 95 },
  { day: "Mar", completadas: 18, sla: 91 },
  { day: "Mié", completadas: 15, sla: 88 },
  { day: "Jue", completadas: 22, sla: 97 },
  { day: "Vie", completadas: 19, sla: 93 },
  { day: "Sáb", completadas: 8, sla: 100 },
  { day: "Dom", completadas: 4, sla: 100 },
];

export const monthlyData = [
  { month: "Ene", ordenes: 312, incidencias: 28, sla: 89 },
  { month: "Feb", ordenes: 287, incidencias: 22, sla: 91 },
  { month: "Mar", ordenes: 341, incidencias: 31, sla: 87 },
  { month: "Abr", ordenes: 298, incidencias: 19, sla: 93 },
  { month: "May", ordenes: 264, incidencias: 24, sla: 91 },
];

export const atmStatusData = [
  { name: "Operativo", value: 201, fill: "#72b01d" },
  { name: "Falla", value: 18, fill: "#ef4444" },
  { name: "Mantención", value: 21, fill: "#f59e0b" },
  { name: "Traslado", value: 8, fill: "#93c947" },
];

// ─── Activity Logs ────────────────────────────────────────────────────────────
export const mockActivityLogs: ActivityLog[] = [
  { id: "log-001", userId: "u-001", userName: "Carlos Muñoz", action: "Cierre de OT", entityType: "WorkOrder", entityId: "wo-004", details: "Orden OT-2025-1844 cerrada exitosamente", ipAddress: "192.168.1.45", createdAt: "2025-05-21T16:32:11Z" },
  { id: "log-002", userId: "u-002", userName: "Ana Torres", action: "Actualización de estado", entityType: "WorkOrder", entityId: "wo-002", details: "Estado cambiado de 'En ruta' a 'En proceso'", ipAddress: "10.0.0.23", createdAt: "2025-05-22T09:14:03Z" },
  { id: "log-003", userId: "u-003", userName: "Admin Sistema", action: "Creación de OT", entityType: "WorkOrder", entityId: "wo-001", details: "Nueva OT OT-2025-1847 creada para BancoEstado", ipAddress: "192.168.1.1", createdAt: "2025-05-20T09:15:00Z" },
  { id: "log-004", userId: "u-003", userName: "Admin Sistema", action: "Asignación de técnico", entityType: "WorkOrder", entityId: "wo-001", details: "Técnico Rodrigo Herrera asignado a OT-2025-1847", ipAddress: "192.168.1.1", createdAt: "2025-05-20T09:18:00Z" },
  { id: "log-005", userId: "u-004", userName: "Pedro González", action: "Subida de evidencia", entityType: "Evidence", entityId: "ev-001", details: "3 fotos subidas para OT-2025-1845", ipAddress: "10.0.0.87", createdAt: "2025-05-22T08:45:22Z" },
  { id: "log-006", userId: "u-003", userName: "Admin Sistema", action: "Modificación de inventario", entityType: "Inventory", entityId: "inv-003", details: "Stock de Router Mikrotik actualizado de 3 a 2 unidades", ipAddress: "192.168.1.1", createdAt: "2025-05-21T14:20:00Z" },
  { id: "log-007", userId: "u-005", userName: "Supervisor Ops", action: "Reprogramación de OT", entityType: "WorkOrder", entityId: "wo-008", details: "OT-2025-1840 reprogramada por SLA vencido", ipAddress: "192.168.1.10", createdAt: "2025-05-20T17:00:00Z" },
  { id: "log-008", userId: "u-003", userName: "Admin Sistema", action: "Login", entityType: "Auth", entityId: "u-003", details: "Inicio de sesión exitoso", ipAddress: "192.168.1.1", createdAt: "2025-05-22T08:00:00Z" },
];

// ─── Technical Reports ────────────────────────────────────────────────────────
export const mockReports: TechnicalReport[] = [
  {
    id: "rep-001", workOrderId: "wo-004", otNumber: "OT-2025-1844", clientName: "Banco Itaú",
    diagnosis: "Revisión periódica. El ATM presentaba software desactualizado y polvo acumulado en el interior del gabinete.",
    solution: "Se realizó limpieza interior completa, actualización de firmware a versión 4.2.1 y calibración del dispensador de billetes.",
    materialsUsed: [{ name: "Spray limpiador electrónico", quantity: 1 }, { name: "Paño antiestático", quantity: 2 }],
    technicianId: "tech-001", technicianName: "Carlos Muñoz Vega", createdAt: "2025-05-21T17:00:00Z",
  },
];
