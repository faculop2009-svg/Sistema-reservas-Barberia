import {
  Appointment,
  Barber,
  BarberService,
  BusinessSettings,
  CalendarBlock,
  ScheduleSlot,
  Review,
  CreateReviewPayload,
  MonthlyPlan,
  Subscriber,
  Product,
} from '../types.ts';
import {
  DEFAULT_BARBERS,
  DEFAULT_SERVICES,
  DEFAULT_SETTINGS,
  DEFAULT_REVIEWS,
  DEFAULT_MONTHLY_PLANS,
  DEFAULT_PRODUCTS,
  DEFAULT_SUBSCRIBERS,
} from '../data/defaults.ts';

const STORAGE_KEYS = {
  SETTINGS: 'barber_settings_v1',
  SERVICES: 'barber_services_v1',
  BARBERS: 'barber_barbers_v1',
  APPOINTMENTS: 'barber_appointments_v1',
  BLOCKS: 'barber_blocks_v1',
  REVIEWS: 'barber_reviews_v1',
  PRODUCTS: 'barber_products_v1',
  SUBSCRIBERS: 'barber_subscribers_v1',
  MONTHLY_PLANS: 'barber_monthly_plans_v1',
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

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const todayDateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
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

// -------------------------------------------------------------
// CLIENT REVIEWS METHODS
// -------------------------------------------------------------
export function loadClientReviews(): Review[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REVIEWS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(DEFAULT_REVIEWS));
      return DEFAULT_REVIEWS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_REVIEWS;
  } catch {
    return DEFAULT_REVIEWS;
  }
}

export function saveClientReviews(reviews: Review[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  } catch (err) {
    console.error('Error saving reviews to localStorage:', err);
  }
}

export function addClientReview(payload: CreateReviewPayload): Review {
  const reviews = loadClientReviews();
  const services = loadClientServices();
  const barbers = loadClientBarbers();

  const service = payload.serviceId ? services.find((s) => s.id === payload.serviceId) : undefined;
  const barber = payload.barberId ? barbers.find((b) => b.id === payload.barberId) : undefined;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const newReview: Review = {
    id: `rev-local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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
  saveClientReviews(reviews);
  return newReview;
}

export function likeClientReview(id: string): Review | null {
  const reviews = loadClientReviews();
  const r = reviews.find((item) => item.id === id);
  if (!r) return null;
  r.likesCount = (r.likesCount || 0) + 1;
  saveClientReviews(reviews);
  return r;
}

export function deleteClientReview(id: string): boolean {
  const reviews = loadClientReviews();
  const initialLen = reviews.length;
  const filtered = reviews.filter((r) => r.id !== id);
  if (filtered.length !== initialLen) {
    saveClientReviews(filtered);
    removeMyCreatedReviewId(id);
    return true;
  }
  return false;
}

export function replyClientReview(id: string, replyText: string, author?: string): Review | null {
  const reviews = loadClientReviews();
  const r = reviews.find((item) => item.id === id);
  if (!r) return null;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  r.ownerReply = {
    text: replyText.trim(),
    date: todayStr,
    author: author || 'La Docta Barbería',
  };
  saveClientReviews(reviews);
  return r;
}

export function deleteClientReviewReply(id: string): Review | null {
  const reviews = loadClientReviews();
  const r = reviews.find((item) => item.id === id);
  if (!r) return null;
  delete r.ownerReply;
  saveClientReviews(reviews);
  return r;
}

const MY_REVIEWS_KEY = 'barber_my_created_reviews';

export function getMyCreatedReviewIds(): string[] {
  try {
    const raw = localStorage.getItem(MY_REVIEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addMyCreatedReviewId(id: string): void {
  try {
    const ids = getMyCreatedReviewIds();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(MY_REVIEWS_KEY, JSON.stringify(ids));
    }
  } catch {}
}

export function removeMyCreatedReviewId(id: string): void {
  try {
    const ids = getMyCreatedReviewIds().filter((i) => i !== id);
    localStorage.setItem(MY_REVIEWS_KEY, JSON.stringify(ids));
  } catch {}
}

// -------------------------------------------------------------
// PRODUCTS & INVENTORY CLIENT STORAGE
// -------------------------------------------------------------
export function loadClientProducts(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_PRODUCTS;
}

export function saveClientProducts(products: Product[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch {}
}

export function addClientProduct(data: Omit<Product, 'id' | 'createdAt'>): Product {
  const products = loadClientProducts();
  const newProd: Product = {
    ...data,
    id: `prod-local-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    price: Number(data.price) || 0,
    stock: Math.max(0, Number(data.stock) || 0),
    minStockAlert: Math.max(0, Number(data.minStockAlert) || 3),
    createdAt: new Date().toISOString().split('T')[0],
  };
  products.unshift(newProd);
  saveClientProducts(products);
  return newProd;
}

export function updateClientProduct(id: string, updates: Partial<Product>): Product | null {
  const products = loadClientProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;
  products[index] = {
    ...products[index],
    ...updates,
    price: updates.price !== undefined ? Number(updates.price) : products[index].price,
    stock: updates.stock !== undefined ? Math.max(0, Number(updates.stock)) : products[index].stock,
  };
  saveClientProducts(products);
  return products[index];
}

export function updateClientProductStock(id: string, delta: number): Product | null {
  const products = loadClientProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;
  products[index].stock = Math.max(0, (products[index].stock || 0) + delta);
  saveClientProducts(products);
  return products[index];
}

export function deleteClientProduct(id: string): void {
  const products = loadClientProducts().filter((p) => p.id !== id);
  saveClientProducts(products);
}

// -------------------------------------------------------------
// MONTHLY PLANS & SUBSCRIBERS CLIENT STORAGE
// -------------------------------------------------------------
export function loadClientMonthlyPlans(): MonthlyPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MONTHLY_PLANS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_MONTHLY_PLANS;
}

export function saveClientMonthlyPlans(plans: MonthlyPlan[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MONTHLY_PLANS, JSON.stringify(plans));
  } catch {}
}

export function updateClientMonthlyPlan(id: string, updates: Partial<MonthlyPlan>): MonthlyPlan | null {
  const plans = loadClientMonthlyPlans();
  const index = plans.findIndex((p) => p.id === id);
  if (index === -1) return null;
  const current = plans[index];
  const updated: MonthlyPlan = {
    ...current,
    ...updates,
    monthlyPrice: updates.monthlyPrice !== undefined ? Number(updates.monthlyPrice) : current.monthlyPrice,
    singleServicePrice: updates.singleServicePrice !== undefined ? Number(updates.singleServicePrice) : current.singleServicePrice,
    cutsPaid: updates.cutsPaid !== undefined ? Number(updates.cutsPaid) : current.cutsPaid,
    cutsPerMonth: updates.cutsPerMonth !== undefined ? Number(updates.cutsPerMonth) : current.cutsPerMonth,
    savingsAmount:
      updates.savingsAmount !== undefined
        ? Number(updates.savingsAmount)
        : (updates.singleServicePrice || current.singleServicePrice) *
          ((updates.cutsPerMonth || current.cutsPerMonth) - (updates.cutsPaid || current.cutsPaid)),
  };
  plans[index] = updated;
  saveClientMonthlyPlans(plans);
  return updated;
}

export function loadClientSubscribers(): Subscriber[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIBERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_SUBSCRIBERS;
}

export function saveClientSubscribers(subscribers: Subscriber[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUBSCRIBERS, JSON.stringify(subscribers));
  } catch {}
}

export function addClientSubscriber(data: Omit<Subscriber, 'id' | 'createdAt'>): Subscriber {
  const subscribers = loadClientSubscribers();
  const newSub: Subscriber = {
    ...data,
    id: `sub-local-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    createdAt: new Date().toISOString(),
  };
  subscribers.unshift(newSub);
  saveClientSubscribers(subscribers);
  return newSub;
}

export function updateClientSubscriber(id: string, updates: Partial<Subscriber>): Subscriber | null {
  const subscribers = loadClientSubscribers();
  const index = subscribers.findIndex((s) => s.id === id);
  if (index === -1) return null;
  subscribers[index] = { ...subscribers[index], ...updates };
  saveClientSubscribers(subscribers);
  return subscribers[index];
}

export function recordClientSubscriberCut(id: string, delta: number = 1): Subscriber | null {
  const subscribers = loadClientSubscribers();
  const index = subscribers.findIndex((s) => s.id === id);
  if (index === -1) return null;
  const current = subscribers[index].cutsUsedThisMonth || 0;
  subscribers[index].cutsUsedThisMonth = Math.min(4, Math.max(0, current + delta));
  saveClientSubscribers(subscribers);
  return subscribers[index];
}

export function deleteClientSubscriber(id: string): void {
  const subscribers = loadClientSubscribers().filter((s) => s.id !== id);
  saveClientSubscribers(subscribers);
}


