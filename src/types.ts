export type ServiceType = 'corte' | 'corte_barba' | 'barba' | 'color' | string;

export interface BarberService {
  id: ServiceType;
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
  description: string;
  includes?: string[];
  includedSteps?: string[];
  imageUrl?: string;
  iconName?: 'Scissors' | 'Sparkles' | 'Flame' | 'Palette' | string;
  popular?: boolean;
}

export interface Barber {
  id: string;
  name: string;
  role: string; // e.g. "Master Barber", "Colorista Senior"
  specialties: string[]; // e.g. ["Degradés modernos", "Navaja tradicional"]
  specialty?: string; // backwards compatibility string
  bio?: string;
  avatarUrl?: string;
  phone?: string;
  availableDays: number[]; // 0=Sunday, 1=Monday, ..., 6=Saturday
  allowedServiceIds: string[]; // List of service IDs this barber can perform
  active: boolean;
}

export interface CalendarBlock {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm (if undefined or 'all-day', entire day is blocked)
  barberId?: string; // 'all' or specific barber id
  reason?: string; // e.g. "Mantenimiento", "Feriado", "Ausencia", "Capacitación"
  createdAt: string;
}

export interface ScheduleSlot {
  slot: string; // HH:mm
  available: boolean;
  status: 'free' | 'booked' | 'blocked' | 'lunch' | 'past';
  reason?: string;
  appointment?: {
    id: string;
    code: string;
    clientName: string;
    clientPhone: string;
    serviceName: string;
    barberId: string;
    barberName: string;
  };
  blockedInfo?: {
    id: string;
    reason?: string;
  };
}

export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled';
export type ReminderStatus = 'pending' | 'sent' | 'failed';

export interface Appointment {
  id: string;
  code: string; // short reference code like BAR-8492
  serviceId: ServiceType;
  serviceName: string;
  servicePrice: number;
  durationMinutes: number;
  barberId: string;
  barberName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  clientName: string;
  clientPhone: string; // with country code
  clientNotes?: string;
  status: AppointmentStatus;
  createdAt: string;
  reminderStatus: ReminderStatus;
  reminderSentAt?: string;
  whatsappMessage?: string;
}

export interface BusinessSettings {
  shopName: string;
  tagline: string;
  phone: string;
  address: string;
  openingHour: string; // "09:00"
  closingHour: string; // "20:00"
  slotDurationMinutes: number; // 30
  lunchBreakStart?: string; // "13:00"
  lunchBreakEnd?: string; // "14:00"
  openDays: number[]; // [1, 2, 3, 4, 5, 6] (Mon-Sat)
  autoRemindHoursBefore: number; // 24
  reminderTemplate: string;
  adminPin?: string; // e.g. "1234"
  currencySymbol?: string; // e.g. "$"
  instagram?: string; // e.g. "@barberiavintage"
  timezone?: string; // e.g. "America/Argentina/Cordoba"
}

export interface BookingPayload {
  serviceId: ServiceType;
  barberId: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  clientNotes?: string;
}

export interface Review {
  id: string;
  clientName: string;
  rating: number; // 1 to 5
  comment: string;
  date: string; // YYYY-MM-DD or readable
  serviceId?: string;
  serviceName?: string;
  barberId?: string;
  barberName?: string;
  verifiedClient?: boolean;
  tags?: string[];
  likesCount?: number;
  ownerReply?: {
    text: string;
    date: string;
    author: string;
  };
}

export interface CreateReviewPayload {
  clientName: string;
  rating: number;
  comment: string;
  serviceId?: string;
  barberId?: string;
  tags?: string[];
}

export interface MonthlyPlan {
  id: 'plan_corte' | 'plan_corte_barba' | string;
  name: string;
  serviceTarget: 'corte' | 'corte_barba';
  targetServiceName: string;
  cutsPerMonth: number; // 4
  cutsPaid: number; // 3
  singleServicePrice: number;
  monthlyPrice: number;
  savingsAmount: number; // monthly savings
  billingCycle: 'debito_automatico_mensual';
  description: string;
  badge: string;
  benefits: string[];
  popular?: boolean;
}

export interface Subscriber {
  id: string;
  clientName: string;
  clientPhone: string;
  planId: 'plan_corte' | 'plan_corte_barba' | string;
  planName: string;
  monthlyFee: number;
  startDate: string; // YYYY-MM-DD
  nextBillingDate: string; // YYYY-MM-DD
  status: 'active' | 'paused' | 'cancelled';
  paymentMethod: 'debito_cbu' | 'debito_tarjeta' | 'debito_mercadopago';
  cutsUsedThisMonth: number;
  maxCutsPerMonth: number; // 4
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  brand?: string;
  category: string;
  price: number;
  stock: number;
  minStockAlert: number;
  description: string;
  imageUrl: string;
  featured?: boolean;
  createdAt?: string;
}

