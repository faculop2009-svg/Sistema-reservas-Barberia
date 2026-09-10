import fs from 'fs';
import path from 'path';
import {
  Appointment,
  BookingPayload,
  BusinessSettings,
  BarberService,
  Barber,
  CalendarBlock,
  ScheduleSlot,
  Review,
  CreateReviewPayload,
} from '../src/types.ts';
import { DEFAULT_SERVICES, DEFAULT_BARBERS, DEFAULT_SETTINGS, DEFAULT_REVIEWS } from '../src/data/defaults.ts';

const DATA_DIR = path.join(process.cwd(), 'data');
const APPOINTMENTS_FILE = path.join(DATA_DIR, 'appointments.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const BARBERS_FILE = path.join(DATA_DIR, 'barbers.json');
const SERVICES_FILE = path.join(DATA_DIR, 'services.json');
const BLOCKS_FILE = path.join(DATA_DIR, 'calendar_blocks.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');


function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function formatDateDisplay(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function loadSettings(): BusinessSettings {
  ensureDataDir();
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8');
    return DEFAULT_SETTINGS;
  }
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Error loading settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(updates: Partial<BusinessSettings>): BusinessSettings {
  ensureDataDir();
  const current = loadSettings();
  const updated = { ...current, ...updates };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

// -------------------------------------------------------------
// BARBERS MANAGEMENT
// -------------------------------------------------------------
export function loadBarbers(): Barber[] {
  ensureDataDir();
  if (!fs.existsSync(BARBERS_FILE)) {
    fs.writeFileSync(BARBERS_FILE, JSON.stringify(DEFAULT_BARBERS, null, 2), 'utf-8');
    return DEFAULT_BARBERS;
  }
  try {
    const raw = fs.readFileSync(BARBERS_FILE, 'utf-8');
    const parsed: Barber[] = JSON.parse(raw);
    if (!parsed || parsed.length === 0) {
      return DEFAULT_BARBERS;
    }
    return parsed;
  } catch (err) {
    console.error('Error loading barbers:', err);
    return DEFAULT_BARBERS;
  }
}

export function saveBarbers(barbers: Barber[]): void {
  ensureDataDir();
  fs.writeFileSync(BARBERS_FILE, JSON.stringify(barbers, null, 2), 'utf-8');
}

export function createBarber(barberData: Omit<Barber, 'id'>): Barber {
  const barbers = loadBarbers();
  const newBarber: Barber = {
    ...barberData,
    id: `barber-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    active: barberData.active ?? true,
    specialties: barberData.specialties || (barberData.specialty ? [barberData.specialty] : ['Estilismo general']),
    allowedServiceIds: barberData.allowedServiceIds || ['corte', 'corte_barba', 'barba'],
    availableDays: barberData.availableDays || [1, 2, 3, 4, 5, 6],
  };
  barbers.push(newBarber);
  saveBarbers(barbers);
  return newBarber;
}

export function updateBarber(id: string, updates: Partial<Barber>): Barber {
  const barbers = loadBarbers();
  const index = barbers.findIndex((b) => b.id === id);
  if (index === -1) {
    throw new Error('Peluquero no encontrado');
  }
  barbers[index] = { ...barbers[index], ...updates };
  saveBarbers(barbers);
  return barbers[index];
}

export function deleteBarber(id: string): void {
  let barbers = loadBarbers();
  if (id === 'barber-any') {
    throw new Error('No se puede eliminar la opción genérica');
  }
  // Soft delete or remove
  barbers = barbers.filter((b) => b.id !== id);
  saveBarbers(barbers);
}

// -------------------------------------------------------------
// SERVICES CATALOG MANAGEMENT
// -------------------------------------------------------------
export function loadServices(): BarberService[] {
  ensureDataDir();
  if (!fs.existsSync(SERVICES_FILE)) {
    fs.writeFileSync(SERVICES_FILE, JSON.stringify(DEFAULT_SERVICES, null, 2), 'utf-8');
    return DEFAULT_SERVICES;
  }
  try {
    const raw = fs.readFileSync(SERVICES_FILE, 'utf-8');
    const parsed: BarberService[] = JSON.parse(raw);
    if (!parsed || parsed.length === 0) {
      return DEFAULT_SERVICES;
    }
    return parsed;
  } catch (err) {
    console.error('Error loading services:', err);
    return DEFAULT_SERVICES;
  }
}

export function saveServices(services: BarberService[]): void {
  ensureDataDir();
  fs.writeFileSync(SERVICES_FILE, JSON.stringify(services, null, 2), 'utf-8');
}

export function updateService(id: string, updates: Partial<BarberService>): BarberService {
  const services = loadServices();
  const index = services.findIndex((s) => s.id === id);
  if (index === -1) {
    throw new Error('Servicio no encontrado');
  }
  services[index] = { ...services[index], ...updates };
  saveServices(services);
  return services[index];
}

export function createService(serviceData: Omit<BarberService, 'id'>): BarberService {
  const services = loadServices();
  const slug = serviceData.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const id = `${slug || 'servicio'}_${Date.now().toString(36)}`;
  const newService: BarberService = {
    ...serviceData,
    id: id as any,
    popular: serviceData.popular ?? false,
    imageUrl: serviceData.imageUrl || 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&auto=format&fit=crop&q=80',
    includedSteps: serviceData.includedSteps || ['Atención personalizada', 'Finalización con producto premium'],
  };
  services.push(newService);
  saveServices(services);
  return newService;
}

export function deleteService(id: string): void {
  let services = loadServices();
  if (services.length <= 1) {
    throw new Error('Debe existir al menos un servicio en el catálogo');
  }
  services = services.filter((s) => s.id !== id);
  saveServices(services);
}

// -------------------------------------------------------------
// REVIEWS & TESTIMONIALS
// -------------------------------------------------------------
export function loadReviews(): Review[] {
  ensureDataDir();
  if (!fs.existsSync(REVIEWS_FILE)) {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(DEFAULT_REVIEWS, null, 2), 'utf-8');
    return DEFAULT_REVIEWS;
  }
  try {
    const raw = fs.readFileSync(REVIEWS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.length === 0) {
      return DEFAULT_REVIEWS;
    }
    return parsed;
  } catch (err) {
    console.error('Error loading reviews:', err);
    return DEFAULT_REVIEWS;
  }
}

export function saveReviews(reviews: Review[]): void {
  ensureDataDir();
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
}

export function getReviewsSummary(): {
  averageRating: number;
  totalCount: number;
  distribution: Record<number, number>;
  percentRecommended: number;
} {
  const reviews = loadReviews();
  const totalCount = reviews.length;
  if (totalCount === 0) {
    return {
      averageRating: 5.0,
      totalCount: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      percentRecommended: 100,
    };
  }

  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sum = 0;
  let positiveCount = 0;

  for (const r of reviews) {
    const star = Math.max(1, Math.min(5, Math.round(r.rating)));
    distribution[star] = (distribution[star] || 0) + 1;
    sum += r.rating;
    if (r.rating >= 4) {
      positiveCount++;
    }
  }

  const averageRating = Number((sum / totalCount).toFixed(1));
  const percentRecommended = Math.round((positiveCount / totalCount) * 100);

  return {
    averageRating,
    totalCount,
    distribution,
    percentRecommended,
  };
}

export function createReview(payload: CreateReviewPayload): Review {
  const reviews = loadReviews();
  const services = loadServices();
  const barbers = loadBarbers();

  const service = payload.serviceId ? services.find((s) => s.id === payload.serviceId) : undefined;
  const barber = payload.barberId ? barbers.find((b) => b.id === payload.barberId) : undefined;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const newReview: Review = {
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    clientName: payload.clientName.trim(),
    rating: Math.max(1, Math.min(5, payload.rating)),
    comment: payload.comment.trim(),
    date: todayStr,
    serviceId: service ? service.id : undefined,
    serviceName: service ? service.name : undefined,
    barberId: barber ? barber.id : undefined,
    barberName: barber ? barber.name : undefined,
    verifiedClient: true,
    tags: payload.tags && payload.tags.length > 0 ? payload.tags : ['Atención de 10', 'Puntualidad'],
    likesCount: 0,
  };

  reviews.unshift(newReview);
  saveReviews(reviews);
  return newReview;
}

export function likeReview(id: string): Review | null {
  const reviews = loadReviews();
  const review = reviews.find((r) => r.id === id);
  if (!review) return null;
  review.likesCount = (review.likesCount || 0) + 1;
  saveReviews(reviews);
  return review;
}

export function replyToReview(id: string, replyText: string, author: string = 'La Docta Barbería'): Review | null {
  const reviews = loadReviews();
  const review = reviews.find((r) => r.id === id);
  if (!review) return null;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  review.ownerReply = {
    text: replyText.trim(),
    date: todayStr,
    author: author.trim() || 'La Docta Barbería',
  };

  saveReviews(reviews);
  return review;
}

export function deleteReviewReply(id: string): Review | null {
  const reviews = loadReviews();
  const review = reviews.find((r) => r.id === id);
  if (!review) return null;
  delete review.ownerReply;
  saveReviews(reviews);
  return review;
}

export function deleteReview(id: string): boolean {
  let reviews = loadReviews();
  const initialLength = reviews.length;
  reviews = reviews.filter((r) => r.id !== id);
  if (reviews.length === initialLength) return false;
  saveReviews(reviews);
  return true;
}


// -------------------------------------------------------------
// CALENDAR BLOCKS & AVAILABILITY
// -------------------------------------------------------------
export function loadCalendarBlocks(): CalendarBlock[] {
  ensureDataDir();
  if (!fs.existsSync(BLOCKS_FILE)) {
    const seed: CalendarBlock[] = [
      {
        id: 'block-seed-1',
        date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
        time: '12:00',
        barberId: 'all',
        reason: 'Mantenimiento de sillones & desinfección',
        createdAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(BLOCKS_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(BLOCKS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading calendar blocks:', err);
    return [];
  }
}

export function saveCalendarBlocks(blocks: CalendarBlock[]): void {
  ensureDataDir();
  fs.writeFileSync(BLOCKS_FILE, JSON.stringify(blocks, null, 2), 'utf-8');
}

export function toggleSlotBlock(
  date: string,
  time: string,
  barberId: string = 'all',
  reason: string = 'Bloqueado por administración'
): { blocked: boolean; block?: CalendarBlock } {
  let blocks = loadCalendarBlocks();
  const existingIdx = blocks.findIndex(
    (b) => b.date === date && b.time === time && (b.barberId === barberId || barberId === 'all' || b.barberId === 'all')
  );

  if (existingIdx !== -1) {
    // Unblock it
    blocks.splice(existingIdx, 1);
    saveCalendarBlocks(blocks);
    return { blocked: false };
  } else {
    // Block it
    const newBlock: CalendarBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date,
      time,
      barberId,
      reason,
      createdAt: new Date().toISOString(),
    };
    blocks.push(newBlock);
    saveCalendarBlocks(blocks);
    return { blocked: true, block: newBlock };
  }
}

export function toggleDayBlock(
  date: string,
  barberId: string = 'all',
  reason: string = 'Día cerrado / No laboral'
): { blocked: boolean; block?: CalendarBlock } {
  let blocks = loadCalendarBlocks();
  const existingIdx = blocks.findIndex(
    (b) => b.date === date && (!b.time || b.time === 'all-day') && (b.barberId === barberId || barberId === 'all' || b.barberId === 'all')
  );

  if (existingIdx !== -1) {
    // Unblock day
    blocks.splice(existingIdx, 1);
    saveCalendarBlocks(blocks);
    return { blocked: false };
  } else {
    // Block whole day
    const newBlock: CalendarBlock = {
      id: `block-day-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date,
      time: 'all-day',
      barberId,
      reason,
      createdAt: new Date().toISOString(),
    };
    blocks.push(newBlock);
    saveCalendarBlocks(blocks);
    return { blocked: true, block: newBlock };
  }
}

function generateInitialSeedAppointments(): Appointment[] {
  const today = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const todayStr = formatYMD(today);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = formatYMD(tomorrow);

  return [
    {
      id: 'apt-seed-1',
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
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      reminderStatus: 'pending',
    },
    {
      id: 'apt-seed-2',
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
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
      reminderStatus: 'pending',
    },
    {
      id: 'apt-seed-3',
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
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      reminderStatus: 'pending',
    },
    {
      id: 'apt-seed-4',
      code: 'BAR-4490',
      serviceId: 'color',
      serviceName: 'Coloración & Tintura',
      servicePrice: 18000,
      durationMinutes: 75,
      barberId: 'barber-3',
      barberName: 'Camila Rostagno',
      date: tomorrowStr,
      time: '16:00',
      clientName: 'Lucas Benítez',
      clientPhone: '+5491199887766',
      clientNotes: 'Platinado ceniza en zona superior.',
      status: 'confirmed',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      reminderStatus: 'pending',
    },
  ];
}

export function loadAppointments(): Appointment[] {
  ensureDataDir();
  if (!fs.existsSync(APPOINTMENTS_FILE)) {
    const seed = generateInitialSeedAppointments();
    fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(APPOINTMENTS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading appointments:', err);
    return [];
  }
}

export function saveAppointments(appointments: Appointment[]): void {
  ensureDataDir();
  fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(appointments, null, 2), 'utf-8');
}

export function formatWhatsAppMessage(appointment: Appointment, settings: BusinessSettings): string {
  const dateFormatted = formatDateDisplay(appointment.date);
  return settings.reminderTemplate
    .replace(/{shopName}/g, settings.shopName)
    .replace(/{clientName}/g, appointment.clientName)
    .replace(/{serviceName}/g, appointment.serviceName)
    .replace(/{dateFormatted}/g, dateFormatted)
    .replace(/{time}/g, appointment.time)
    .replace(/{barberName}/g, appointment.barberName)
    .replace(/{duration}/g, appointment.durationMinutes.toString())
    .replace(/{price}/g, appointment.servicePrice.toLocaleString('es-AR'))
    .replace(/{address}/g, settings.address)
    .replace(/{code}/g, appointment.code);
}

export function buildWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

export function getShopCurrentTime(timezone: string = 'America/Argentina/Cordoba'): {
  todayStr: string;
  currentMinutes: number;
  currentHourStr: string;
} {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const formatted = formatter.format(new Date());
    // "YYYY-MM-DD, HH:mm" or "YYYY-MM-DD HH:mm"
    const clean = formatted.replace(',', '').trim();
    const [datePart, timePart] = clean.split(' ');
    const [h, m] = (timePart || '00:00').split(':').map(Number);
    return {
      todayStr: datePart,
      currentMinutes: (h || 0) * 60 + (m || 0),
      currentHourStr: timePart || '00:00',
    };
  } catch (err) {
    const now = new Date();
    // Default fallback to Argentina UTC-3
    const utcHours = now.getUTCHours();
    const argHours = (utcHours - 3 + 24) % 24;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      todayStr: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
      currentMinutes: argHours * 60 + now.getUTCMinutes(),
      currentHourStr: `${pad(argHours)}:${pad(now.getUTCMinutes())}`,
    };
  }
}

export function getAvailableSlotsForDate(
  date: string,
  serviceId: string = 'corte',
  barberId: string = 'barber-any',
  includeDetails: boolean = false,
  clientTime?: string,
  clientDate?: string
): {
  date: string;
  isDayBlocked: boolean;
  dayBlockReason?: string;
  slots: ScheduleSlot[];
} {
  const settings = loadSettings();
  const appointments = loadAppointments();
  const blocks = loadCalendarBlocks();
  const allBarbers = loadBarbers().filter((b) => b.active !== false && b.id !== 'barber-any');

  // Check day of week (0=Sunday, 6=Saturday)
  const [year, month, day] = date.split('-').map(Number);
  const targetDateObj = new Date(year, month - 1, day);
  const dayOfWeek = targetDateObj.getDay();

  // Check if shop is open on this day of week
  const isOpenDay = (settings.openDays || [1, 2, 3, 4, 5, 6]).includes(dayOfWeek);

  // Check if entire day is blocked
  const dayBlock = blocks.find(
    (b) => b.date === date && (!b.time || b.time === 'all-day') && (barberId === 'barber-any' || b.barberId === 'all' || b.barberId === barberId)
  );

  const isDayBlocked = !isOpenDay || Boolean(dayBlock);
  const dayBlockReason = !isOpenDay ? 'El salón permanece cerrado los domingos' : dayBlock?.reason;

  // Filter eligible barbers for this service and day
  const eligibleBarbers = allBarbers.filter((barber) => {
    // Must work on this day
    const worksOnDay = (barber.availableDays || [1, 2, 3, 4, 5, 6]).includes(dayOfWeek);
    if (!worksOnDay) return false;

    // Must be allowed to perform this service
    const canDoService = !barber.allowedServiceIds || barber.allowedServiceIds.includes(serviceId);
    if (!canDoService) return false;

    // If a specific barber is requested, must match
    if (barberId !== 'barber-any' && barber.id !== barberId) return false;

    return true;
  });

  // Parse open hours
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

  // Determine today date and current time using local shop timezone or client parameters
  const shopTime = getShopCurrentTime(settings.timezone || 'America/Argentina/Cordoba');
  const todayDateStr = clientDate && /^\d{4}-\d{2}-\d{2}$/.test(clientDate) ? clientDate : shopTime.todayStr;

  let currentMinutesToday = shopTime.currentMinutes;
  if (clientTime && /^\d{2}:\d{2}$/.test(clientTime)) {
    const [ch, cm] = clientTime.split(':').map(Number);
    currentMinutesToday = ch * 60 + cm;
  }

  // Bookings for this date that are not cancelled
  const dateBookings = appointments.filter(
    (a) => a.date === date && a.status !== 'cancelled'
  );

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
    } else if (date < todayDateStr) {
      available = false;
      status = 'past';
      reason = 'Fecha ya transcurrida';
    } else if (slotTotalMinutes >= lunchStartMinutes && slotTotalMinutes < lunchEndMinutes) {
      available = false;
      status = 'lunch';
      reason = 'Receso / Almuerzo';
    } else if (date === todayDateStr && slotTotalMinutes <= currentMinutesToday) {
      available = false;
      status = 'past';
      reason = 'Horario ya transcurrido';
    } else {
      // Check admin blocked slot
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
        reason = 'No hay profesionales disponibles para este servicio en este día';
      } else {
        // Check collision with appointments
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
          // If any barber: calculate how many eligible barbers are already occupied or blocked
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
            reason = 'Todos los profesionales ocupados en este turno';
          }
        }
      }
    }

    scheduleSlots.push({
      slot: slotTime,
      available,
      status,
      reason,
      appointment: matchedAppointment,
      blockedInfo,
    });

    current.setMinutes(current.getMinutes() + slotInterval);
  }

  return {
    date,
    isDayBlocked,
    dayBlockReason,
    slots: scheduleSlots,
  };
}

export function createNewAppointment(payload: BookingPayload): { appointment: Appointment; whatsappUrl: string } {
  const appointments = loadAppointments();
  const settings = loadSettings();
  const services = loadServices();
  const barbers = loadBarbers();

  // Find service
  const service = services.find((s) => s.id === payload.serviceId) || services[0];

  // Eligible barbers for this service
  const eligibleBarbers = barbers.filter(
    (b) => b.id !== 'barber-any' && b.active !== false && (!b.allowedServiceIds || b.allowedServiceIds.includes(service.id))
  );

  let barber = barbers.find((b) => b.id === payload.barberId);

  // If barber is not chosen or is 'barber-any', select an eligible free barber
  if (!barber || barber.id === 'barber-any' || !barber.allowedServiceIds?.includes(service.id)) {
    const bookedBarberIds = appointments
      .filter((a) => a.date === payload.date && a.time === payload.time && a.status !== 'cancelled')
      .map((a) => a.barberId);

    const freeBarber = eligibleBarbers.find((b) => !bookedBarberIds.includes(b.id)) || eligibleBarbers[0] || barbers[1];
    barber = freeBarber;
  }

  // Generate random short readable code
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const code = `BAR-${randomNum}`;

  const newApt: Appointment = {
    id: `apt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    code,
    serviceId: service.id,
    serviceName: service.name,
    servicePrice: service.price,
    durationMinutes: service.durationMinutes,
    barberId: barber.id,
    barberName: barber.name,
    date: payload.date,
    time: payload.time,
    clientName: payload.clientName.trim(),
    clientPhone: payload.clientPhone.trim(),
    clientNotes: payload.clientNotes?.trim() || undefined,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    reminderStatus: 'pending',
  };

  // Pre-generate WhatsApp message
  newApt.whatsappMessage = formatWhatsAppMessage(newApt, settings);

  appointments.unshift(newApt);
  saveAppointments(appointments);

  const whatsappUrl = buildWhatsAppUrl(newApt.clientPhone, newApt.whatsappMessage);

  return {
    appointment: newApt,
    whatsappUrl,
  };
}

