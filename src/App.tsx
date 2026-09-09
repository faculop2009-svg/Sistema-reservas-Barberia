import React, { useState, useEffect } from 'react';
import { Header, AppView } from './components/Header.tsx';
import { ServiceSelector } from './components/ServiceSelector.tsx';
import { DateTimeSelector } from './components/DateTimeSelector.tsx';
import { ClientForm } from './components/ClientForm.tsx';
import { BookingSuccessModal } from './components/BookingSuccessModal.tsx';
import { LookupAppointment } from './components/LookupAppointment.tsx';
import { AdminAgenda } from './components/AdminAgenda.tsx';
import { ShopSettingsModal } from './components/ShopSettingsModal.tsx';
import { ServicesCatalog } from './components/ServicesCatalog.tsx';
import { VisualCalendar } from './components/VisualCalendar.tsx';
import { AdminPinModal } from './components/AdminPinModal.tsx';
import { DEFAULT_SERVICES, DEFAULT_BARBERS, DEFAULT_SETTINGS } from './data/defaults.ts';
import { BarberService, Barber, BusinessSettings, Appointment } from './types.ts';
import { MessageCircle, CheckCircle, Clock, CalendarDays, Sparkles, BookOpen, Lock, Instagram } from 'lucide-react';
import {
  loadClientSettings,
  saveClientSettings,
  loadClientServices,
  loadClientBarbers,
  getClientAvailableSlotsForDate,
  createClientAppointment,
} from './utils/clientStorage.ts';

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('book');
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [services, setServices] = useState<BarberService[]>(DEFAULT_SERVICES);
  const [barbers, setBarbers] = useState<Barber[]>(DEFAULT_BARBERS);

  // Booking Flow State
  const [selectedService, setSelectedService] = useState<BarberService>(DEFAULT_SERVICES[0]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('barber-any');

  // Default to today's date
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
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
      return sessionStorage.getItem('barber_admin_authenticated') === 'true';
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
        const [settRes, servRes, barbRes] = await Promise.all([
          fetch('/api/settings', {
            headers: currentPin ? { 'x-admin-pin': currentPin } : {},
          }).catch(() => null),
          fetch('/api/services').catch(() => null),
          fetch('/api/barbers').catch(() => null),
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
      } catch (err) {
        console.warn('Using client local storage fallback for initial data:', err);
        setSettings(loadClientSettings());
        const cServices = loadClientServices();
        setServices(cServices);
        if (cServices.length > 0) {
          setSelectedService(cServices[0]);
        }
        setBarbers(loadClientBarbers());
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
        const params = new URLSearchParams({
          date: selectedDate,
          serviceId: selectedService.id,
          barberId: selectedBarberId,
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

  const handlePinSuccess = () => {
    setIsAdminAuthenticated(true);
    setShowPinModal(false);
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

  const selectedBarberObj = barbers.find((b) => b.id === selectedBarberId);
  const barberDisplayName = selectedBarberObj ? selectedBarberObj.name : 'Cualquier barbero disponible';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* Top Header */}
      <Header
        settings={settings}
        activeView={activeView}
        setActiveView={handleRequestView}
        pendingRemindersCount={pendingRemindersCount}
        onOpenSettings={handleRequestSettings}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* VIEW 1: CLIENT BOOKING */}
        {activeView === 'book' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Hero Trust Badge */}
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-amber-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 justify-center sm:justify-start">
                  <Sparkles className="w-3.5 h-3.5" />
                  Reserva Online Rápida y Segura
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
                  Agenda tu turno en {settings.shopName}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
                  Selecciona tu corte o barba, el profesional y el horario disponible. Recibirás confirmación y recordatorio automático por WhatsApp.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-zinc-950/80 border border-zinc-800 px-4 py-3 rounded-2xl text-xs text-zinc-300 flex-shrink-0 shadow-md">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <div className="font-bold text-emerald-400 flex items-center gap-1">
                    <span>Recordatorio WhatsApp</span>
                    <CheckCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-[11px] text-zinc-400">Notificación automática sin fallos</div>
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
            />

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

        {/* VIEW 2: SERVICES CATALOG */}
        {activeView === 'catalog' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <ServicesCatalog
              services={services}
              isAdmin={false}
              onSelectServiceAndBook={(serv) => {
                setSelectedService(serv);
                setActiveView('book');
              }}
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

        {/* VIEW 5: BARBER SHOP ADMIN AGENDA */}
        {activeView === 'admin' && (
          <div className="animate-in fade-in duration-200">
            <AdminAgenda
              settings={settings}
              services={services}
              barbers={barbers}
              onOpenSettings={handleRequestSettings}
              onBarbersChange={(updatedBarbers) => setBarbers(updatedBarbers)}
              onServicesChange={(updatedServices) => setServices(updatedServices)}
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
      <footer className="border-t border-zinc-800 bg-zinc-950 mt-12 py-8 text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-zinc-300">{settings.shopName}</span>
            <span>•</span>
            <span>{settings.address}</span>
            {settings.instagram && (
              <>
                <span>•</span>
                <a
                  href={`https://instagram.com/${settings.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-pink-400 hover:text-pink-300 transition-colors"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>{settings.instagram}</span>
                </a>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-zinc-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              {settings.openingHour} - {settings.closingHour} hs
            </span>
            <span>•</span>
            <a
              href={`https://wa.me/${settings.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp: {settings.phone}
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
