import React, { useState, useEffect, useMemo } from 'react';
import { Header, AppView } from './components/Header.tsx';
import { ServiceSelector } from './components/ServiceSelector.tsx';
import { DateTimeSelector } from './components/DateTimeSelector.tsx';
import { ClientForm } from './components/ClientForm.tsx';
import { BookingSuccessModal } from './components/BookingSuccessModal.tsx';
import { LookupAppointment } from './components/LookupAppointment.tsx';
import { AdminAgenda } from './components/AdminAgenda.tsx';
import { ShopSettingsModal } from './components/ShopSettingsModal.tsx';
import { ServicesCatalog } from './components/ServicesCatalog.tsx';
import { ProductsSection } from './components/ProductsSection.tsx';
import { VisualCalendar } from './components/VisualCalendar.tsx';
import { AdminPinModal } from './components/AdminPinModal.tsx';
import { ReviewsSection } from './components/ReviewsSection.tsx';
import { DEFAULT_SERVICES, DEFAULT_BARBERS, DEFAULT_SETTINGS, DEFAULT_REVIEWS } from './data/defaults.ts';
import { BarberService, Barber, BusinessSettings, Appointment, Review } from './types.ts';
import { MessageCircle, CheckCircle, Clock, CalendarDays, Sparkles, BookOpen, Lock, Instagram, Star, Scissors } from 'lucide-react';
import {
  loadClientSettings,
  saveClientSettings,
  loadClientServices,
  saveClientServices,
  loadClientBarbers,
  saveClientBarbers,
  getClientAvailableSlotsForDate,
  createClientAppointment,
  loadClientReviews,
  addClientReview,
  likeClientReview,
  deleteClientReview,
  replyClientReview,
  deleteClientReviewReply,
  getMyCreatedReviewIds,
  addMyCreatedReviewId,
} from './utils/clientStorage.ts';

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('book');
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [services, setServices] = useState<BarberService[]>(DEFAULT_SERVICES);
  const [barbers, setBarbers] = useState<Barber[]>(DEFAULT_BARBERS);
  const [reviews, setReviews] = useState<Review[]>(DEFAULT_REVIEWS);


  // Booking Flow State
  const [selectedService, setSelectedService] = useState<BarberService>(DEFAULT_SERVICES[0]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('barber-any');

  // Default to today's date (or tomorrow if today is Sunday or after closing)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const currentMins = now.getHours() * 60 + now.getMinutes();
    if (now.getDay() === 0 || currentMins >= 19 * 60 + 30) {
      const nextDay = new Date(now);
      nextDay.setDate(now.getDate() + 1);
      if (nextDay.getDay() === 0) {
        nextDay.setDate(nextDay.getDate() + 1);
      }
      return `${nextDay.getFullYear()}-${pad(nextDay.getMonth() + 1)}-${pad(nextDay.getDate())}`;
    }
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  });

  const [selectedTime, setSelectedTime] = useState<string>('');
  const [slots, setSlots] = useState<{ slot: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Client info state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Success modal state
  const [createdAppointment, setCreatedAppointment] = useState<Appointment | null>(null);
  const [createdWhatsappUrl, setCreatedWhatsappUrl] = useState<string>('');

  // Settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [pendingRemindersCount, setPendingRemindersCount] = useState(0);

  // Admin Security PIN state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      const isAuth = sessionStorage.getItem('barber_admin_authenticated') === 'true';
      const pin = sessionStorage.getItem('barber_admin_pin');
      return isAuth && !!pin;
    } catch {
      return false;
    }
  });
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAdminAction, setPendingAdminAction] = useState<'admin_view' | 'settings_modal' | null>(null);

  // Fetch initial data
  useEffect(() => {
    const initData = async () => {
      try {
        const currentPin = sessionStorage.getItem('barber_admin_pin') || '';
        const [settRes, servRes, barbRes, revRes] = await Promise.all([
          fetch('/api/settings', {
            headers: currentPin ? { 'x-admin-pin': currentPin } : {},
          }).catch(() => null),
          fetch('/api/services').catch(() => null),
          fetch('/api/barbers').catch(() => null),
          fetch('/api/reviews').catch(() => null),
        ]);

        if (settRes && settRes.ok) {
          const data = await settRes.json();
          setSettings(data);
        } else {
          setSettings(loadClientSettings());
        }

        if (servRes && servRes.ok) {
          const data = await servRes.json();
          setServices(data);
          if (data.length > 0) {
            setSelectedService(data[0]);
          }
        } else {
          const cServices = loadClientServices();
          setServices(cServices);
          if (cServices.length > 0) {
            setSelectedService(cServices[0]);
          }
        }

        if (barbRes && barbRes.ok) {
          const data = await barbRes.json();
          setBarbers(data);
        } else {
          setBarbers(loadClientBarbers());
        }

        if (revRes && revRes.ok) {
          const data = await revRes.json();
          setReviews(data.reviews || []);
        } else {
          setReviews(loadClientReviews());
        }
      } catch (err) {
        console.warn('Using client local storage fallback for initial data:', err);
        setSettings(loadClientSettings());
        const cServices = loadClientServices();
        setServices(cServices);
        if (cServices.length > 0) {
          setSelectedService(cServices[0]);
        }
        setBarbers(loadClientBarbers());
        setReviews(loadClientReviews());
      }
    };
    initData();
  }, []);

  // Check pending reminders for badge
  useEffect(() => {
    const checkReminders = async () => {
      const pin = sessionStorage.getItem('barber_admin_pin');
      if (!pin) {
        setPendingRemindersCount(0);
        return;
      }
      try {
        const res = await fetch('/api/reminders/due', {
          headers: { 'x-admin-pin': pin },
        }).catch(() => null);
        if (res && res.ok) {
          const list = await res.json();
          setPendingRemindersCount(list.length);
        }
      } catch {
        // quiet catch
      }
    };
    checkReminders();
    const timer = setInterval(checkReminders, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch available slots when date, service or barber changes
  useEffect(() => {
    let isCancelled = false;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const clientTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
        const clientDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

        const params = new URLSearchParams({
          date: selectedDate,
          serviceId: selectedService.id,
          barberId: selectedBarberId,
          clientTime,
          clientDate,
        });
        const res = await fetch(`/api/slots?${params.toString()}`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          if (!isCancelled) {
            setSlots(data.slots || []);
            const matching = (data.slots || []).find(
              (s: any) => s.slot === selectedTime && s.available
            );
            if (!matching) {
              setSelectedTime('');
            }
          }
        } else {
          // Client fallback calculation (guaranteed to work on Vercel / offline)
          const fallbackData = getClientAvailableSlotsForDate(
            selectedDate,
            selectedService.id,
            selectedBarberId
          );
          if (!isCancelled) {
            setSlots(fallbackData.slots || []);
            const matching = (fallbackData.slots || []).find(
              (s: any) => s.slot === selectedTime && s.available
            );
            if (!matching) {
              setSelectedTime('');
            }
          }
        }
      } catch (err) {
        console.warn('Falling back to client slot calculation:', err);
        const fallbackData = getClientAvailableSlotsForDate(
          selectedDate,
          selectedService.id,
          selectedBarberId
        );
        if (!isCancelled) {
          setSlots(fallbackData.slots || []);
        }
      } finally {
        if (!isCancelled) setLoadingSlots(false);
      }
    };

    fetchSlots();
    return () => {
      isCancelled = true;
    };
  }, [selectedDate, selectedService.id, selectedBarberId]);

  // Handle Booking Submit
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTime) {
      setBookingError('Por favor selecciona un horario disponible.');
      return;
    }
    if (!clientName.trim() || !clientPhone.trim()) {
      setBookingError('El nombre y el teléfono celular de WhatsApp son obligatorios.');
      return;
    }

    setIsSubmitting(true);
    setBookingError(null);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          barberId: selectedBarberId,
          date: selectedDate,
          time: selectedTime,
          clientName,
          clientPhone,
          clientNotes,
        }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        setCreatedAppointment(data.appointment);
        setCreatedWhatsappUrl(data.whatsappUrl);
        // Reset form
        setClientName('');
        setClientPhone('');
        setClientNotes('');
        setSelectedTime('');
      } else {
        // Standalone client booking fallback for Vercel
        const clientResult = createClientAppointment({
          serviceId: selectedService.id,
          barberId: selectedBarberId,
          date: selectedDate,
          time: selectedTime,
          clientName,
          clientPhone,
          clientNotes,
        });
        setCreatedAppointment(clientResult.appointment);
        setCreatedWhatsappUrl(clientResult.whatsappUrl);
        setClientName('');
        setClientPhone('');
        setClientNotes('');
        setSelectedTime('');
      }
    } catch (err) {
      console.warn('Using client fallback for booking submission:', err);
      const clientResult = createClientAppointment({
        serviceId: selectedService.id,
        barberId: selectedBarberId,
        date: selectedDate,
        time: selectedTime,
        clientName,
        clientPhone,
        clientNotes,
      });
      setCreatedAppointment(clientResult.appointment);
      setCreatedWhatsappUrl(clientResult.whatsappUrl);
      setClientName('');
      setClientPhone('');
      setClientNotes('');
      setSelectedTime('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveSettings = async (updated: BusinessSettings) => {
    try {
      const pin = sessionStorage.getItem('barber_admin_pin') || updated.adminPin || '';
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': pin,
        },
        body: JSON.stringify(updated),
      }).catch(() => null);
      if (res && res.ok) {
        const saved = await res.json();
        setSettings(saved);
        saveClientSettings(saved);
      } else {
        const saved = saveClientSettings(updated);
        setSettings(saved);
      }
    } catch {
      const saved = saveClientSettings(updated);
      setSettings(saved);
    }
  };

  const handleRequestView = (view: AppView) => {
    if (view === 'admin') {
      if (!isAdminAuthenticated) {
        setPendingAdminAction('admin_view');
        setShowPinModal(true);
        return;
      }
    }
    if (view === 'products' && settings.enableProducts === false) {
      setActiveView('book');
      return;
    }
    if (view === 'calendar' && settings.enablePublicCalendar === false) {
      setActiveView('book');
      return;
    }
    if (view === 'reviews' && settings.enableReviews === false) {
      setActiveView('book');
      return;
    }
    if (view === 'my-turns' && settings.enableLookupMyTurn === false) {
      setActiveView('book');
      return;
    }
    setActiveView(view);
  };

  const handleRequestSettings = () => {
    if (!isAdminAuthenticated) {
      setPendingAdminAction('settings_modal');
      setShowPinModal(true);
      return;
    }
    setShowSettingsModal(true);
  };

  const handleBarbersChange = (updatedBarbers: Barber[]) => {
    setBarbers(updatedBarbers);
    saveClientBarbers(updatedBarbers);
  };

  const handleServicesChange = (updatedServices: BarberService[]) => {
    setServices(updatedServices);
    saveClientServices(updatedServices);
  };

  const handlePinSuccess = (verifiedSettings?: BusinessSettings) => {
    setIsAdminAuthenticated(true);
    setShowPinModal(false);
    if (verifiedSettings) {
      setSettings(verifiedSettings);
      saveClientSettings(verifiedSettings);
    }
    if (pendingAdminAction === 'admin_view') {
      setActiveView('admin');
    } else if (pendingAdminAction === 'settings_modal') {
      setShowSettingsModal(true);
    }
    setPendingAdminAction(null);
  };

  const handleLockAdminPanel = () => {
    try {
      sessionStorage.removeItem('barber_admin_authenticated');
      sessionStorage.removeItem('barber_admin_pin');
    } catch {}
    setIsAdminAuthenticated(false);
    setActiveView('book');
  };

  const handleAddReview = async (payload: {
    clientName: string;
    rating: number;
    comment: string;
    serviceId?: string;
    barberId?: string;
    tags?: string[];
  }) => {
    let created: Review | null = null;
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.review) {
          created = data.review;
        }
      }
    } catch (err) {
      console.warn('Backend unavailable, saving review locally:', err);
    }
    if (!created) {
      created = addClientReview(payload);
    }
    if (created) {
      addMyCreatedReviewId(created.id);
      setReviews((prev) => [created!, ...prev.filter((r) => r.id !== created!.id)]);
    }
  };

  const handleLikeReview = async (reviewId: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, likesCount: (r.likesCount || 0) + 1 } : r))
    );

    try {
      const res = await fetch(`/api/reviews/${reviewId}/like`, { method: 'POST' });
      if (!res.ok) {
        likeClientReview(reviewId);
      }
    } catch {
      likeClientReview(reviewId);
    }
  };

  const handleReplyReview = async (reviewId: string, replyText: string, providedPin?: string) => {
    const currentPin = providedPin || sessionStorage.getItem('barber_admin_pin') || (isAdminAuthenticated ? settings.adminPin : '');
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': currentPin,
        },
        body: JSON.stringify({ replyText, author: settings.shopName }),
      });
      if (res.ok) {
        const updated = await res.json();
        setReviews((prev) => prev.map((r) => (r.id === reviewId ? updated : r)));
        replyClientReview(reviewId, replyText, settings.shopName);
        return;
      }
    } catch (e) {
      console.error('Error sending reply:', e);
    }

    const updated = replyClientReview(reviewId, replyText, settings.shopName);
    if (updated) {
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? updated : r)));
    }
  };

  const handleDeleteReviewReply = async (reviewId: string, providedPin?: string) => {
    const currentPin = providedPin || sessionStorage.getItem('barber_admin_pin') || (isAdminAuthenticated ? settings.adminPin : '');
    deleteClientReviewReply(reviewId);
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          const clone = { ...r };
          delete clone.ownerReply;
          return clone;
        }
        return r;
      })
    );

    try {
      await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': currentPin },
      });
    } catch (e) {
      console.warn('Backend delete reply warning:', e);
    }
  };

  const handleDeleteReview = async (reviewId: string, providedPin?: string): Promise<boolean> => {
    const pin = providedPin || sessionStorage.getItem('barber_admin_pin') || (isAdminAuthenticated ? settings.adminPin : '');
    const myIds = getMyCreatedReviewIds();
    const isMyReview = myIds.includes(reviewId) || reviewId.startsWith('rev-local-');

    // Optimistically remove from state & local storage immediately
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    deleteClientReview(reviewId);

    try {
      const headers: Record<string, string> = {};
      if (pin) headers['x-admin-pin'] = pin;
      if (isMyReview) headers['x-client-author'] = 'true';

      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers,
      });
      if (res.ok) {
        return true;
      }
    } catch (e) {
      console.warn('Backend unavailable, deleted review locally:', e);
    }
    return true;
  };

  const reviewsAverage = useMemo(() => {
    if (reviews.length === 0) return 5.0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  }, [reviews]);

  const selectedBarberObj = barbers.find((b) => b.id === selectedBarberId);
  const barberDisplayName = selectedBarberObj ? selectedBarberObj.name : 'Cualquier barbero disponible';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950 w-full">
      {/* Top Header */}
      <Header
        settings={settings}
        activeView={activeView}
        setActiveView={handleRequestView}
        pendingRemindersCount={pendingRemindersCount}
        onOpenSettings={handleRequestSettings}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {/* VIEW 1: CLIENT BOOKING */}
        {activeView === 'book' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Hero Studio Banner */}
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-2 text-center sm:text-left relative z-10">
                <span className="text-amber-400 text-xs font-extrabold uppercase tracking-widest flex items-center gap-2 justify-center sm:justify-start">
                  <Sparkles className="w-3.5 h-3.5" />
                  Sistema de Citas &amp; Turnos Oficial
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight font-display">
                  Agenda tu turno en {settings.shopName}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
                  Reserva tu corte o diseño de barba en segundos. Selecciona el profesional, la fecha y el horario. Recibirás confirmación y recordatorio automático directo a tu WhatsApp.
                </p>

                {/* Trust Rating Badge (Shown only if reviews are enabled) */}
                {settings.enableReviews !== false && (
                  <div className="pt-2 flex items-center gap-2 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={() => setActiveView('reviews')}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950/80 border border-zinc-800 hover:border-amber-500/50 text-xs text-zinc-300 transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="font-extrabold text-zinc-100">{reviewsAverage.toFixed(1)}</span>
                      </div>
                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-400 group-hover:text-amber-300 transition-colors">
                        {reviews.length} clientes satisfechos
                      </span>
                      <span className="text-amber-400 font-semibold underline text-[11px] ml-1">Ver Reseñas</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3.5 bg-zinc-950/90 border border-zinc-800/90 px-4 py-3.5 rounded-2xl text-xs text-zinc-300 flex-shrink-0 shadow-lg relative z-10">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                  <MessageCircle className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <div className="font-extrabold text-emerald-400 flex items-center gap-1.5 text-xs">
                    <span>Recordatorio WhatsApp</span>
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] text-zinc-400">Te avisamos 2 hs antes de tu visita</div>
                </div>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="bg-zinc-900/90 border border-zinc-800/90 p-2 sm:p-3 rounded-2xl shadow-lg">
              <div className="grid grid-cols-3 gap-2 text-xs">
                {/* Step 1 */}
                <div className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${
                  selectedService ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' : 'bg-zinc-950/40 text-zinc-400 border border-zinc-800'
                }`}>
                  <div className="w-6 h-6 rounded-lg bg-amber-500 text-zinc-950 font-black flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                    ✓
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider truncate">1. Servicio</div>
                    <div className="text-[11px] sm:text-xs text-zinc-300 font-semibold truncate">{selectedService.name}</div>
                  </div>
                </div>
                {/* Step 2 */}
                <div className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${
                  selectedTime ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' : 'bg-zinc-950/40 text-zinc-400 border border-zinc-800'
                }`}>
                  <div className={`w-6 h-6 rounded-lg font-black flex items-center justify-center text-xs flex-shrink-0 shadow-sm ${
                    selectedTime ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {selectedTime ? '✓' : '2'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider truncate">2. Horario</div>
                    <div className="text-[11px] sm:text-xs text-zinc-300 font-semibold truncate">{selectedTime ? `${selectedTime} hs` : 'Seleccionar hora'}</div>
                  </div>
                </div>
                {/* Step 3 */}
                <div className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${
                  clientName && clientPhone ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-zinc-950/40 text-zinc-400 border border-zinc-800'
                }`}>
                  <div className={`w-6 h-6 rounded-lg font-black flex items-center justify-center text-xs flex-shrink-0 shadow-sm ${
                    clientName && clientPhone ? 'bg-emerald-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {clientName && clientPhone ? '✓' : '3'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider truncate">3. Confirmar</div>
                    <div className="text-[11px] sm:text-xs text-zinc-300 font-semibold truncate">{clientName ? clientName : 'Tus datos'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 1: Services (corte, corte + barba, barba, color) */}
            <ServiceSelector
              services={services}
              selectedServiceId={selectedService.id}
              onSelectService={(serv) => setSelectedService(serv)}
              onViewCatalog={() => setActiveView('catalog')}
            />

            {/* Step 2: Date, Barber, Time with Visual Calendar option */}
            <DateTimeSelector
              selectedDate={selectedDate}
              onSelectDate={(date) => setSelectedDate(date)}
              selectedTime={selectedTime}
              onSelectTime={(time) => setSelectedTime(time)}
              slots={slots}
              loadingSlots={loadingSlots}
              barbers={barbers}
              selectedBarberId={selectedBarberId}
              onSelectBarber={(id) => setSelectedBarberId(id)}
              selectedServiceId={selectedService.id}
              services={services}
              enableBarberSelection={settings.enableBarberSelection !== false}
              enablePublicCalendar={settings.enablePublicCalendar !== false}
            />

            {/* Confirmed Slot Selection Feedback */}
            {selectedTime && (
              <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-zinc-900 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-bottom-2 shadow-lg">
                <div className="flex items-center gap-3 text-zinc-200">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-zinc-950 font-extrabold flex items-center justify-center text-xs flex-shrink-0 shadow-md shadow-amber-500/20">
                    ✓
                  </div>
                  <div>
                    <div className="font-extrabold text-amber-300 text-xs sm:text-sm">
                      {selectedService.name} • {selectedDate} a las {selectedTime} hs
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Profesional: <span className="text-zinc-200 font-medium">{barberDisplayName}</span> • Abonas en el local al atenderte
                    </div>
                  </div>
                </div>
                <a
                  href="#client-name-input"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs flex-shrink-0 transition-all text-center shadow-md shadow-amber-500/15"
                >
                  Continuar al Paso 3 ↓
                </a>
              </div>
            )}

            {/* Step 3: Client Info & Submit */}
            <ClientForm
              clientName={clientName}
              setClientName={setClientName}
              clientPhone={clientPhone}
              setClientPhone={setClientPhone}
              clientNotes={clientNotes}
              setClientNotes={setClientNotes}
              selectedService={selectedService}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              barberName={barberDisplayName}
              onSubmit={handleBookingSubmit}
              isSubmitting={isSubmitting}
              errorMessage={bookingError}
            />
          </div>
        )}

        {/* VIEW 2: SERVICES CATALOG & MONTHLY PLANS */}
        {activeView === 'catalog' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ServicesCatalog
              services={services}
              settings={settings}
              isAdmin={isAdminAuthenticated}
              onSelectServiceAndBook={(serv) => {
                setSelectedService(serv);
                setActiveView('book');
              }}
              onServicesChange={handleServicesChange}
            />
          </div>
        )}

        {/* VIEW: STOCK DE PRODUCTOS */}
        {activeView === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ProductsSection
              isAdmin={isAdminAuthenticated}
              settings={settings}
              whatsappNumber={settings.whatsappNumber}
            />
          </div>
        )}

        {/* VIEW 3: FULL VISUAL CALENDAR */}
        {activeView === 'calendar' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800 space-y-1">
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-amber-500" />
                <span>Calendario de Disponibilidad</span>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Visualiza los días libres y ocupados en tiempo real. Haz clic en un turno disponible para reservarlo inmediatamente.
              </p>
            </div>

            <VisualCalendar
              mode="client"
              selectedDate={selectedDate}
              onSelectDate={(date) => setSelectedDate(date)}
              selectedTime={selectedTime}
              onSelectTime={(time) => {
                setSelectedTime(time);
                setActiveView('book');
              }}
              selectedBarberId={selectedBarberId}
              onSelectBarberId={(bId) => setSelectedBarberId(bId)}
              selectedServiceId={selectedService.id}
              barbers={barbers}
              services={services}
            />
          </div>
        )}

        {/* VIEW 4: CLIENT MY-TURNS LOOKUP */}
        {activeView === 'my-turns' && (
          <div className="animate-in fade-in duration-200">
            <LookupAppointment
              settings={settings}
              onNewBookingClick={() => setActiveView('book')}
            />
          </div>
        )}

        {/* VIEW: REVIEWS & TESTIMONIALS */}
        {activeView === 'reviews' && (
          <div className="animate-in fade-in duration-200">
            <ReviewsSection
              reviews={reviews}
              services={services}
              barbers={barbers}
              settings={settings}
              isAdmin={isAdminAuthenticated}
              onAddReview={handleAddReview}
              onLikeReview={handleLikeReview}
              onReplyReview={handleReplyReview}
              onDeleteReviewReply={handleDeleteReviewReply}
              onDeleteReview={handleDeleteReview}
              onBookClick={() => setActiveView('book')}
            />
          </div>
        )}

        {/* VIEW 5: BARBER SHOP ADMIN AGENDA */}
        {activeView === 'admin' && (
          <div className="animate-in fade-in duration-200">
            <AdminAgenda
              settings={settings}
              services={services}
              barbers={barbers}
              onOpenSettings={handleRequestSettings}
              onSaveSettings={handleSaveSettings}
              onBarbersChange={handleBarbersChange}
              onServicesChange={handleServicesChange}
              onLockPanel={handleLockAdminPanel}
            />
          </div>
        )}
      </main>

      {/* Admin PIN Security Modal */}
      {showPinModal && (
        <AdminPinModal
          correctPin={settings.adminPin || '1234'}
          onSuccess={handlePinSuccess}
          onClose={() => {
            setShowPinModal(false);
            setPendingAdminAction(null);
          }}
        />
      )}

      {/* Success Modal */}
      {createdAppointment && (
        <BookingSuccessModal
          appointment={createdAppointment}
          whatsappUrl={createdWhatsappUrl}
          settings={settings}
          onClose={() => setCreatedAppointment(null)}
          onNewBooking={() => {
            setCreatedAppointment(null);
            setActiveView('book');
          }}
          onNavigateToProducts={() => {
            setCreatedAppointment(null);
            setActiveView('products');
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <ShopSettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-800/90 bg-zinc-950 mt-16 py-10 text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-zinc-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Scissors className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-zinc-200 text-sm font-display tracking-tight">{settings.shopName}</span>
                <p className="text-[11px] text-zinc-400">{settings.tagline}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <button
                onClick={() => setActiveView('book')}
                className="text-zinc-400 hover:text-amber-400 transition-colors font-medium"
              >
                Reservar
              </button>
              <span className="text-zinc-700">•</span>
              <button
                onClick={() => setActiveView('catalog')}
                className="text-zinc-400 hover:text-amber-400 transition-colors font-medium"
              >
                Catálogo
              </button>
              {settings.enableLookupMyTurn !== false && (
                <>
                  <span className="text-zinc-700">•</span>
                  <button
                    onClick={() => setActiveView('my-turns')}
                    className="text-zinc-400 hover:text-amber-400 transition-colors font-medium"
                  >
                    Buscar Mi Turno
                  </button>
                </>
              )}
              <span className="text-zinc-700">•</span>
              <button
                onClick={() => setActiveView('admin')}
                className="text-zinc-400 hover:text-amber-400 transition-colors font-medium"
              >
                Acceso Personal
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-zinc-400">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Lun a Sáb {settings.openingHour} - {settings.closingHour} hs
              </span>
              <span className="text-zinc-700">•</span>
              <span className="text-zinc-400">{settings.address}</span>
            </div>

            <div className="flex items-center gap-3">
              {settings.instagram && (
                <a
                  href={`https://instagram.com/${settings.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-pink-400/90 hover:text-pink-300 transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>{settings.instagram}</span>
                </a>
              )}
              <a
                href={`https://wa.me/${settings.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp {settings.phone}</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
