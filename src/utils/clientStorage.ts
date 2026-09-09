import {
  Appointment,
  Barber,
  BarberService,
  BusinessSettings,
  CalendarBlock,
  ScheduleSlot,
} from '../types.ts';
import {
  DEFAULT_BARBERS,
  DEFAULT_SERVICES,
  DEFAULT_SETTINGS,
} from '../data/defaults.ts';

const STORAGE_KEYS = {
  SETTINGS: 'barber_settings_v1',
  SERVICES: 'barber_services_v1',
  BARBERS: 'barber_barbers_v1',
  APPOINTMENTS: 'barber_appointments_v1',
  BLOCKS: 'barber_blocks_v1',
};

// Initial sample appointments if none in localStorage
function getInitialAppointments(): Appointment[] {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = new Date();
  const todayStr = formatYMD(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = formatYMD(tomorrow);

  return [
    {
      id: 'apt-local-1',
      code: 'BAR-1042',
      serviceId: 'corte_barba',
      serviceName: 'Corte + Barba (Combo Completo)',
      servicePrice: 13500,
      durationMinutes: 50,
      barberId: 'barber-1',
      barberName: 'Alejandro "Alex" Silva',
      date: todayStr,
      time: '15:00',
      clientName: 'Facundo López',
      clientPhone: '+5491133221100',
      clientNotes: 'Corte degradé medio en punta.',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      reminderStatus: 'pending',
    },
    {
      id: 'apt-local-2',
      code: 'BAR-2089',
      serviceId: 'corte',
      serviceName: 'Corte de Cabello',
      servicePrice: 9000,
      durationMinutes: 30,
      barberId: 'barber-2',
      barberName: 'Martín Morales',
      date: todayStr,
      time: '17:30',
      clientName: 'Santiago Rossi',
      clientPhone: '+5491144556677',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      reminderStatus: 'pending',
    },
    {
      id: 'apt-local-3',
      code: 'BAR-3301',
      serviceId: 'barba',
      serviceName: 'Arreglo & Perfilado de Barba',
      servicePrice: 6500,
      durationMinutes: 25,
      barberId: 'barber-1',
      barberName: 'Alejandro "Alex" Silva',
      date: tomorrowStr,
      time: '11:00',
      clientName: 'Gonzalo Méndez',
      clientPhone: '+5491177889900',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      reminderStatus: 'pending',
    },
  ];
}

export function loadClientSettings(): BusinessSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveClientSettings(settings: Partial<BusinessSettings>): BusinessSettings {
  const current = loadClientSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  } catch {}
  return updated;
}

export function loadClientServices(): BarberService[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_SERVICES;
}

export function saveClientServices(services: BarberService[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  } catch {}
}

export function loadClientBarbers(): Barber[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BARBERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_BARBERS;
}

export function saveClientBarbers(barbers: Barber[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BARBERS, JSON.stringify(barbers));
  } catch {}
}

export function loadClientAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  const initial = getInitialAppointments();
  try {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(initial));
  } catch {}
  return initial;
}

export function saveClientAppointments(apts: Appointment[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(apts));
  } catch {}
}

export function loadClientBlocks(): CalendarBlock[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BLOCKS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveClientBlocks(blocks: CalendarBlock[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BLOCKS, JSON.stringify(blocks));
  } catch {}
}

export function buildClientWhatsAppUrl(phone: string, text: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
  if (cleaned.startsWith('15') && cleaned.length === 10) cleaned = '9' + cleaned;
  if (!cleaned.startsWith('54') && cleaned.length >= 10) cleaned = '54' + cleaned;
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
}

export function formatClientWhatsAppMessage(
  apt: Appointment,
  settings: BusinessSettings
): string {
  return `¡Hola ${apt.clientName}! 💈✨

Tu turno en *${settings.shopName}* está confirmado:
📍 *Servicio:* ${apt.serviceName}
💈 *Profesional:* ${apt.barberName}
📅 *Fecha:* ${apt.date}
⏰ *Hora:* ${apt.time} hs
💰 *Valor:* $${apt.servicePrice.toLocaleString('es-AR')}
🔖 *Código de reserva:* ${apt.code}

📍 Te esperamos en: ${settings.address}

¡Gracias por elegirnos! Nos vemos pronto.`;
}

export function getClientAvailableSlotsForDate(
  date: string,
  serviceId: string,
  barberId: string = 'barber-any',
  includeMeta: boolean = true
): { date: string; slots: ScheduleSlot[]; dayBlocked?: boolean; dayBlockReason?: string } {
  const settings = loadClientSettings();
  const allBarbers = loadClientBarbers().filter((b) => b.active !== false);
  const appointments = loadClientAppointments();
  const blocks = loadClientBlocks();

  const [year, month, day] = date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();

  const dayBlock = blocks.find(
    (b) =>
      b.date === date &&
      b.time === 'all-day' &&
      (barberId === 'barber-any' || b.barberId === 'all' || b.barberId === barberId)
  );
  const isDayBlocked = !!dayBlock;
  const dayBlockReason = dayBlock?.reason;

  const eligibleBarbers = allBarbers.filter((barber) => {
    const worksOnDay = (barber.availableDays || [1, 2, 3, 4, 5, 6]).includes(dayOfWeek);
    if (!worksOnDay) return false;
    const canDoService = !barber.allowedServiceIds || barber.allowedServiceIds.includes(serviceId);
    if (!canDoService) return false;
    if (barberId !== 'barber-any' && barber.id !== barberId) return false;
    return true;
  });

  const [startHour, startMin] = settings.openingHour.split(':').map(Number);
  const [endHour, endMin] = settings.closingHour.split(':').map(Number);
  const slotInterval = settings.slotDurationMinutes || 30;

  const scheduleSlots: ScheduleSlot[] = [];
  const current = new Date();
  current.setHours(startHour, startMin, 0, 0);
  const end = new Date();
  end.setHours(endHour, endMin, 0, 0);

  const [lunchStartH, lunchStartM] = (settings.lunchBreakStart || '13:30').split(':').map(Number);
  const [lunchEndH, lunchEndM] = (settings.lunchBreakEnd || '14:30').split(':').map(Number);

  const todayDateStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentMinutesToday = now.getHours() * 60 + now.getMinutes();

  const dateBookings = appointments.filter((a) => a.date === date && a.status !== 'cancelled');

  while (current < end) {
    const hour = current.getHours().toString().padStart(2, '0');
    const minute = current.getMinutes().toString().padStart(2, '0');
    const slotTime = `${hour}:${minute}`;

    const slotTotalMinutes = current.getHours() * 60 + current.getMinutes();
    const lunchStartMinutes = lunchStartH * 60 + lunchStartM;
    const lunchEndMinutes = lunchEndH * 60 + lunchEndM;

    let available = true;
    let status: ScheduleSlot['status'] = 'free';
    let reason: string | undefined = undefined;
    let matchedAppointment: ScheduleSlot['appointment'] = undefined;
    let blockedInfo: ScheduleSlot['blockedInfo'] = undefined;

    if (isDayBlocked) {
      available = false;
      status = 'blocked';
      reason = dayBlockReason || 'Día no disponible';
    } else if (slotTotalMinutes >= lunchStartMinutes && slotTotalMinutes < lunchEndMinutes) {
      available = false;
      status = 'lunch';
      reason = 'Receso / Almuerzo';
    } else if (date === todayDateStr && slotTotalMinutes <= currentMinutesToday) {
      available = false;
      status = 'past';
      reason = 'Horario ya transcurrido';
    } else {
      const slotBlock = blocks.find(
        (b) =>
          b.date === date &&
          b.time === slotTime &&
          (barberId === 'barber-any' || b.barberId === 'all' || b.barberId === barberId)
      );

      if (slotBlock) {
        available = false;
        status = 'blocked';
        reason = slotBlock.reason || 'Bloqueado por administración';
        blockedInfo = { id: slotBlock.id, reason: slotBlock.reason };
      } else if (eligibleBarbers.length === 0) {
        available = false;
        status = 'blocked';
        reason = 'No hay profesionales disponibles en este día';
      } else {
        if (barberId !== 'barber-any') {
          const booked = dateBookings.find((b) => b.time === slotTime && b.barberId === barberId);
          if (booked) {
            available = false;
            status = 'booked';
            reason = 'Horario reservado';
            matchedAppointment = {
              id: booked.id,
              code: booked.code,
              clientName: booked.clientName,
              clientPhone: booked.clientPhone,
              serviceName: booked.serviceName,
              barberId: booked.barberId,
              barberName: booked.barberName,
            };
          }
        } else {
          const occupiedBarberIds = dateBookings
            .filter((b) => b.time === slotTime)
            .map((b) => b.barberId);

          const slotBlockedBarberIds = blocks
            .filter((b) => b.date === date && b.time === slotTime)
            .map((b) => b.barberId);

          const freeEligibleBarbers = eligibleBarbers.filter((bar) => {
            if (occupiedBarberIds.includes(bar.id)) return false;
            if (slotBlockedBarberIds.includes(bar.id) || slotBlockedBarberIds.includes('all')) return false;
            return true;
          });

          if (freeEligibleBarbers.length === 0) {
            available = false;
            status = 'booked';
            reason = 'Todos los profesionales ocupados';
          }
        }
      }
    }

    scheduleSlots.push({
      slot: slotTime,
      available,
      status,
      reason,
      appointment: includeMeta ? matchedAppointment : undefined,
      blockedInfo: includeMeta ? blockedInfo : undefined,
    });

    current.setMinutes(current.getMinutes() + slotInterval);
  }

  return {
    date,
    slots: scheduleSlots,
    dayBlocked: isDayBlocked,
    dayBlockReason,
  };
}

export function createClientAppointment(data: {
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  clientNotes?: string;
}): { appointment: Appointment; whatsappUrl: string } {
  const settings = loadClientSettings();
  const services = loadClientServices();
  const barbers = loadClientBarbers();
  const appointments = loadClientAppointments();

  const service = services.find((s) => s.id === data.serviceId) || services[0];
  let assignedBarber: Barber | undefined;

  if (data.barberId && data.barberId !== 'barber-any') {
    assignedBarber = barbers.find((b) => b.id === data.barberId);
  }

  if (!assignedBarber) {
    const dayOfWeek = new Date(`${data.date}T12:00:00`).getDay();
    const availableBarbers = barbers.filter((b) => {
      if (b.active === false) return false;
      const worksToday = (b.availableDays || [1, 2, 3, 4, 5, 6]).includes(dayOfWeek);
      if (!worksToday) return false;
      const canDo = !b.allowedServiceIds || b.allowedServiceIds.includes(service.id);
      if (!canDo) return false;
      const alreadyOccupied = appointments.some(
        (a) => a.date === data.date && a.time === data.time && a.barberId === b.id && a.status !== 'cancelled'
      );
      return !alreadyOccupied;
    });

    assignedBarber = availableBarbers[0] || barbers[0];
  }

  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  const code = `BAR-${randomDigits}`;

  const newAppointment: Appointment = {
    id: `apt-client-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    code,
    serviceId: service.id,
    serviceName: service.name,
    servicePrice: service.price,
    durationMinutes: service.durationMinutes,
    barberId: assignedBarber ? assignedBarber.id : 'barber-1',
    barberName: assignedBarber ? assignedBarber.name : 'Barbero Oficial',
    date: data.date,
    time: data.time,
    clientName: data.clientName.trim(),
    clientPhone: data.clientPhone.trim(),
    clientNotes: data.clientNotes ? data.clientNotes.trim() : undefined,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    reminderStatus: 'pending',
  };

  appointments.push(newAppointment);
  saveClientAppointments(appointments);

  const msg = formatClientWhatsAppMessage(newAppointment, settings);
  const whatsappUrl = buildClientWhatsAppUrl(newAppointment.clientPhone, msg);

  return { appointment: newAppointment, whatsappUrl };
}
