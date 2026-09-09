export type ServiceType = 'corte' | 'corte_barba' | 'barba' | 'color' | string;

export interface BarberService {
  id: ServiceType;
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
  description: string;
  includes?: string[];
  imageUrl?: string;
  iconName: 'Scissors' | 'Sparkles' | 'Flame' | 'Palette' | string;
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
