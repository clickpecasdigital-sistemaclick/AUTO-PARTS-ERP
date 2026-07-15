export type ServiceOrderStatus = 'open' | 'diagnosing' | 'awaiting_approval' | 'approved' | 'in_progress' | 'awaiting_parts' | 'completed' | 'delivered' | 'cancelled';
export type ServiceOrderPriority = 'low' | 'normal' | 'high' | 'urgent';

export const serviceOrderStatusLabels: Record<ServiceOrderStatus, string> = {
  open: 'Aberta',
  diagnosing: 'Em diagnóstico',
  awaiting_approval: 'Aguardando aprovação',
  approved: 'Aprovada',
  in_progress: 'Em execução',
  awaiting_parts: 'Aguardando peças',
  completed: 'Finalizada',
  delivered: 'Entregue',
  cancelled: 'Cancelada',
};

export const priorityLabels: Record<ServiceOrderPriority, string> = {
  low: 'Baixa',
  normal: 'Normal',
  high: 'Alta',
  urgent: 'Urgente',
};

export const STATUS_FLOW: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  open: ['diagnosing', 'cancelled'],
  diagnosing: ['awaiting_approval', 'cancelled'],
  awaiting_approval: ['approved', 'cancelled'],
  approved: ['in_progress', 'cancelled'],
  in_progress: ['awaiting_parts', 'completed', 'cancelled'],
  awaiting_parts: ['in_progress', 'cancelled'],
  completed: ['delivered'],
  delivered: [],
  cancelled: [],
};

export interface ServiceOrderServiceItem {
  id: string;
  serviceId: string;
  quantity: number;
  unitPrice: string;
  totalAmount: string;
  service: { id: string; name: string };
}

export interface ServiceOrderPartItem {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
  totalAmount: string;
  product: { id: string; internalCode: string; shortDescription: string };
}

export interface ServiceOrder {
  id: string;
  code: string;
  status: ServiceOrderStatus;
  priority: ServiceOrderPriority;
  complaint?: string | null;
  technicalDiagnosis?: string | null;
  proposedSolution?: string | null;
  estimatedMinutes?: number | null;
  odometerKm?: number | null;
  laborAmount: string;
  partsAmount: string;
  discountAmount: string;
  totalAmount: string;
  expectedDeliveryAt?: string | null;
  openedAt: string;
  isRework: boolean;
  customer: { id: string; name: string; tradeName?: string | null; phone?: string | null };
  vehicle: { id: string; plate?: string | null };
  mechanic?: { id: string; employee: { name: string } } | null;
  consultant?: { id: string; name: string } | null;
  box?: { id: string; name: string } | null;
  services: ServiceOrderServiceItem[];
  parts: ServiceOrderPartItem[];
  checkIn?: { id: string } | null;
  delivery?: { id: string } | null;
}

export interface WorkshopDashboardKpis {
  vehiclesInService: number;
  openOrders: number;
  inProgressOrders: number;
  awaitingApprovalOrders: number;
  completedOrdersToday: number;
  averageOrderDurationHours: number | null;
  averageTicket: number;
  serviceRevenue: number;
  partsRevenue: number;
  availableMechanics: number;
  reworkRate: number;
  openWarranties: number;
}

export type WorkshopAppointmentStatus = 'scheduled' | 'confirmed' | 'waitlisted' | 'checked_in' | 'rescheduled' | 'cancelled' | 'no_show';

export const appointmentStatusLabels: Record<WorkshopAppointmentStatus, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  waitlisted: 'Lista de espera',
  checked_in: 'Check-in feito',
  rescheduled: 'Reagendado',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
};

export interface WorkshopAppointment {
  id: string;
  status: WorkshopAppointmentStatus;
  scheduledAt: string;
  durationMinutes: number;
  notes?: string | null;
  customer: { id: string; name: string; phone?: string | null };
  vehicle?: { id: string; plate?: string | null } | null;
  mechanic?: { id: string; employee: { name: string } } | null;
  box?: { id: string; name: string } | null;
  service?: { id: string; name: string } | null;
}

export interface ServiceCatalogItem {
  id: string;
  code?: string | null;
  name: string;
  description?: string | null;
  category: string;
  specialty?: string | null;
  standardPrice: string;
  estimatedMinutes?: number | null;
  warrantyDays: number;
}
