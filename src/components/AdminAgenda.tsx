import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MessageCircle,
  CheckCircle,
  XCircle,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Scissors,
  DollarSign,
  AlertCircle,
  CheckCheck,
  Send,
  Sparkles,
  Users,
  CalendarDays,
  BookOpen,
  Download,
  Lock,
  FolderDown,
} from 'lucide-react';
import { Appointment, BusinessSettings, BarberService, Barber } from '../types.ts';
import { StaffManagement } from './StaffManagement.tsx';
import { VisualCalendar } from './VisualCalendar.tsx';
import { ServicesCatalog } from './ServicesCatalog.tsx';
import {
  loadClientAppointments,
  saveClientAppointments,
  createClientAppointment,
  buildClientWhatsAppUrl,
  formatClientWhatsAppMessage,
} from '../utils/clientStorage.ts';

interface AdminAgendaProps {
  settings: BusinessSettings;
  services: BarberService[];
  barbers: Barber[];
  onOpenSettings: () => void;
  onBarbersChange: (barbers: Barber[]) => void;
  onServicesChange: (services: BarberService[]) => void;
  onLockPanel?: () => void;
  initialTab?: 'agenda' | 'calendar' | 'staff' | 'catalog';
}

export const AdminAgenda: React.FC<AdminAgendaProps> = ({
  settings,
  services,
  barbers,
  onOpenSettings,
  onBarbersChange,
  onServicesChange,
  onLockPanel,
  initialTab = 'agenda',
}) => {
  const [activeTab, setActiveTab] = useState<'agenda' | 'calendar' | 'staff' | 'catalog'>(initialTab);
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [calendarSelectedBarberId, setCalendarSelectedBarberId] = useState<string>('barber-any');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<string>('today');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Manual booking modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualClientName, setManualClientName] = useState('');
  const [manualClientPhone, setManualClientPhone] = useState('');
  const [manualServiceId, setManualServiceId] = useState<string>(services[0]?.id || 'corte');
  const [manualBarberId, setManualBarberId] = useState<string>(barbers[0]?.id || 'barber-1');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualTime, setManualTime] = useState('16:00');
  const [manualNotes, setManualNotes] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t.toISOString().split('T')[0];
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let url = '/api/appointments';
      const params = new URLSearchParams();

      if (filterDate === 'today') {
        params.append('date', todayStr);
      } else if (filterDate === 'tomorrow') {
        params.append('date', tomorrowStr);
      } else if (filterDate !== 'all') {
        params.append('date', filterDate);
      }

      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const adminPin = sessionStorage.getItem('barber_admin_pin') || '';
      const res = await fetch(url, {
        headers: { 'x-admin-pin': adminPin },
      }).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        setAppointments(data);
      } else {
        // Client-side fallback for Vercel
        let list = loadClientAppointments();
        if (filterDate === 'today') {
          list = list.filter((a) => a.date === todayStr);
        } else if (filterDate === 'tomorrow') {
          list = list.filter((a) => a.date === tomorrowStr);
        } else if (filterDate !== 'all') {
          list = list.filter((a) => a.date === filterDate);
        }

        if (filterStatus !== 'all') {
          list = list.filter((a) => a.status === filterStatus);
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          list = list.filter(
            (a) =>
              a.clientName.toLowerCase().includes(q) ||
              a.clientPhone.includes(q) ||
              a.code.toLowerCase().includes(q) ||
              a.serviceName.toLowerCase().includes(q) ||
              a.barberName.toLowerCase().includes(q)
          );
        }

        list.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
        setAppointments(list);
      }
    } catch (err) {
      console.warn('Error fetching appointments, using client local storage:', err);
      let list = loadClientAppointments();
      setAppointments(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [filterDate, filterStatus, searchQuery]);

  const handleUpdateStatus = async (id: string, newStatus: 'confirmed' | 'completed' | 'cancelled') => {
    try {
      const adminPin = sessionStorage.getItem('barber_admin_pin') || '';
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin,
        },
        body: JSON.stringify({ status: newStatus }),
      }).catch(() => null);

      if (res && res.ok) {
        const updated = await res.json();
        setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      } else {
        // Update client-side
        const allApts = loadClientAppointments();
        const target = allApts.find((a) => a.id === id);
        if (target) {
          target.status = newStatus;
          saveClientAppointments(allApts);
          setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
        }
      }
      const labels: Record<string, string> = {
        completed: 'Turno marcado como completado',
        cancelled: 'Turno cancelado',
        confirmed: 'Turno reactivado como confirmado',
      };
      showToast(labels[newStatus] || 'Estado actualizado');
    } catch (err) {
      console.error(err);
      showToast('Error al actualizar el estado');
    }
  };

  const handleSendWhatsAppReminder = async (appointment: Appointment) => {
    setSendingReminderId(appointment.id);
    try {
      const adminPin = sessionStorage.getItem('barber_admin_pin') || '';
      const res = await fetch(`/api/appointments/${appointment.id}/reminder`, {
        method: 'POST',
        headers: {
          'x-admin-pin': adminPin,
        },
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === appointment.id
              ? {
                  ...a,
                  reminderStatus: 'sent',
                  reminderSentAt: new Date().toISOString(),
                }
              : a
          )
        );
        window.open(data.whatsappUrl, '_blank');
        showToast(`Recordatorio WhatsApp listo y marcado como enviado a ${appointment.clientName}`);
      } else {
        // Client fallback
        const allApts = loadClientAppointments();
        const target = allApts.find((a) => a.id === appointment.id);
        if (target) {
          target.reminderStatus = 'sent';
          target.reminderSentAt = new Date().toISOString();
          saveClientAppointments(allApts);
        }
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === appointment.id
              ? {
                  ...a,
                  reminderStatus: 'sent',
                  reminderSentAt: new Date().toISOString(),
                }
              : a
          )
        );
        const msg = formatClientWhatsAppMessage(appointment, settings);
        const waUrl = buildClientWhatsAppUrl(appointment.clientPhone, msg);
        window.open(waUrl, '_blank');
        showToast(`Recordatorio WhatsApp listo para enviar a ${appointment.clientName}`);
      }
    } catch (err) {
      console.error(err);
      showToast('Error al despachar el recordatorio de WhatsApp');
    } finally {
      setSendingReminderId(null);
    }
  };

  const handleSendBatchTodayReminders = () => {
    const pendingToday = appointments.filter(
      (a) => a.date === todayStr && a.status === 'confirmed' && a.reminderStatus === 'pending'
    );

    if (pendingToday.length === 0) {
      showToast('No hay turnos pendientes de recordatorio para hoy');
      return;
    }

    // Open first one and mark all
    pendingToday.forEach((apt, idx) => {
      setTimeout(() => {
        handleSendWhatsAppReminder(apt);
      }, idx * 600);
    });
  };

  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualClientName || !manualClientPhone || !manualDate || !manualTime) return;

    setManualSubmitting(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: manualClientName,
          clientPhone: manualClientPhone,
          serviceId: manualServiceId,
          barberId: manualBarberId,
          date: manualDate,
          time: manualTime,
          clientNotes: manualNotes,
        }),
      }).catch(() => null);

      if (res && res.ok) {
        setShowManualModal(false);
        setManualClientName('');
        setManualClientPhone('');
        setManualNotes('');
        showToast('Turno manual agendado correctamente');
        fetchAppointments();
      } else {
        // Fallback to client appointment creation
        createClientAppointment({
          serviceId: manualServiceId,
          barberId: manualBarberId,
          date: manualDate,
          time: manualTime,
          clientName: manualClientName,
          clientPhone: manualClientPhone,
          clientNotes: manualNotes,
        });
        setShowManualModal(false);
        setManualClientName('');
        setManualClientPhone('');
        setManualNotes('');
        showToast('Turno manual agendado en memoria local');
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión');
    } finally {
      setManualSubmitting(false);
    }
  };

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleExportCsv = () => {
    if (!appointments.length) {
      showToast('No hay turnos para exportar en este filtro');
      return;
    }
    const headers = ['Código', 'Fecha', 'Hora', 'Cliente', 'Teléfono', 'Servicio', 'Barbero', 'Precio', 'Estado', 'Notas'];
    const rows = appointments.map((a) => [
      `"${a.code}"`,
      `"${a.date}"`,
      `"${a.time}"`,
      `"${(a.clientName || '').replace(/"/g, '""')}"`,
      `"${(a.clientPhone || '').replace(/"/g, '""')}"`,
      `"${(a.serviceName || '').replace(/"/g, '""')}"`,
      `"${(a.barberName || '').replace(/"/g, '""')}"`,
      `"${a.servicePrice}"`,
      `"${a.status}"`,
      `"${(a.clientNotes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `turnos-${settings.shopName.replace(/\s+/g, '-').toLowerCase()}-${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Base de clientes y turnos descargada en CSV');
  };

  // KPIs
  const todayTurnos = appointments.filter((a) => a.date === todayStr && a.status !== 'cancelled');
  const todayConfirmed = todayTurnos.filter((a) => a.status === 'confirmed').length;
  const todayCompleted = todayTurnos.filter((a) => a.status === 'completed').length;
  const todayRevenue = todayTurnos.reduce((sum, a) => sum + (a.status !== 'cancelled' ? a.servicePrice : 0), 0);
  const pendingRemindersToday = todayTurnos.filter((a) => a.reminderStatus === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Toast notice */}
      {actionNotice && (
        <div className="fixed bottom-5 right-5 z-50 bg-amber-500 text-zinc-950 px-4 py-2.5 rounded-xl shadow-2xl font-semibold text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Top Banner / Agenda Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
              Panel Administrativo de la Barbería
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
              Gestión Integral
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Control de reservas, bloqueo de horarios, administración de personal y catálogo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/download-zip"
            target="_blank"
            rel="noopener noreferrer"
            download="barberia-turnos-completo.zip"
            id="admin-download-zip-btn"
            className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/40 hover:border-amber-500 text-amber-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            title="Descargar todo el código del proyecto en un archivo .ZIP listo para subir a GitHub o Render"
          >
            <FolderDown className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Descargar ZIP (GitHub)</span>
            <span className="sm:hidden">ZIP</span>
          </a>

          <button
            type="button"
            id="admin-export-csv-btn"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Exportar clientes y turnos a Excel / CSV"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Exportar Excel</span>
            <span className="md:hidden">CSV</span>
          </button>

          <button
            type="button"
            id="admin-settings-btn"
            onClick={onOpenSettings}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            <span>Configuración</span>
          </button>

          <button
            type="button"
            id="admin-manual-btn"
            onClick={() => setShowManualModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/10 transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nuevo Turno</span>
          </button>

          {onLockPanel && (
            <button
              type="button"
              id="admin-lock-btn"
              onClick={onLockPanel}
              className="px-2.5 py-2 rounded-xl bg-zinc-900 border border-red-500/20 hover:border-red-500/50 text-zinc-400 hover:text-red-400 text-xs font-semibold flex items-center gap-1 transition-colors ml-1"
              title="Cerrar sesión y proteger el panel"
            >
              <Lock className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Bloquear</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tab Selector */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-x-auto text-xs scrollbar-none shadow-md">
        <button
          type="button"
          id="admin-tab-agenda"
          onClick={() => setActiveTab('agenda')}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'agenda'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Agenda & Turnos</span>
        </button>

        <button
          type="button"
          id="admin-tab-calendar"
          onClick={() => setActiveTab('calendar')}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'calendar'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Calendario Visual & Bloqueos</span>
        </button>

        <button
          type="button"
          id="admin-tab-staff"
          onClick={() => setActiveTab('staff')}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'staff'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Personal & Especialidades ({barbers.filter((b) => b.id !== 'barber-any').length})</span>
        </button>

        <button
          type="button"
          id="admin-tab-catalog"
          onClick={() => setActiveTab('catalog')}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'catalog'
              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Catálogo & Precios</span>
        </button>
      </div>

      {/* TAB 1: VISUAL CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <VisualCalendar
            mode="admin"
            selectedDate={calendarSelectedDate}
            onSelectDate={(d) => setCalendarSelectedDate(d)}
            selectedBarberId={calendarSelectedBarberId}
            onSelectBarberId={(id) => setCalendarSelectedBarberId(id)}
            barbers={barbers}
            services={services}
            onSlotModified={() => fetchAppointments()}
          />
        </div>
      )}

      {/* TAB 2: STAFF MANAGEMENT */}
      {activeTab === 'staff' && (
        <div className="animate-in fade-in duration-200">
          <StaffManagement
            barbers={barbers}
            services={services}
            onBarbersChange={onBarbersChange}
            onNavigateToCalendar={(barberId) => {
              if (barberId) setCalendarSelectedBarberId(barberId);
              setActiveTab('calendar');
            }}
          />
        </div>
      )}

      {/* TAB 3: SERVICES CATALOG */}
      {activeTab === 'catalog' && (
        <div className="animate-in fade-in duration-200">
          <ServicesCatalog
            services={services}
            isAdmin={true}
            onSelectServiceAndBook={(s) => {
              setManualServiceId(s.id);
              setShowManualModal(true);
            }}
            onUpdateService={(updated) => {
              onServicesChange(services.map((s) => (s.id === updated.id ? updated : s)));
            }}
            onServicesChange={onServicesChange}
          />
        </div>
      )}

      {/* TAB 4: APPOINTMENTS AGENDA (ORIGINAL VIEW) */}
      {activeTab === 'agenda' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Turnos Hoy</span>
            <Calendar className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-zinc-100">
            {todayTurnos.length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            {todayConfirmed} confirmados • {todayCompleted} completados
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>WhatsApp Recordatorios</span>
            <MessageCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400">
            {pendingRemindersToday === 0 ? 'Al día' : `${pendingRemindersToday} pend.`}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            {pendingRemindersToday > 0 ? 'Listos para enviar' : 'Todos los de hoy notificados'}
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Facturación Hoy</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400">
            ${todayRevenue.toLocaleString('es-AR')}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            Estimado turnos activos
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span>Mantenimiento</span>
            <CheckCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-sky-400">
            100%
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            Autónomo y sin costos de API
          </div>
        </div>
      </div>

      {/* WhatsApp Automation Callout for Today */}
      {pendingRemindersToday > 0 && filterDate === 'today' && (
        <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-emerald-300">
                Hay {pendingRemindersToday} recordatorio(s) de WhatsApp listos para enviar hoy
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Envía las notificaciones de cortesía para asegurar la puntualidad y evitar ausencias.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="batch-whatsapp-today-btn"
            onClick={handleSendBatchTodayReminders}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all flex-shrink-0"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Enviar recordatorios de hoy</span>
          </button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Date pill tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              id="filter-date-today"
              onClick={() => setFilterDate('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterDate === 'today'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Hoy
            </button>

            <button
              type="button"
              id="filter-date-tomorrow"
              onClick={() => setFilterDate('tomorrow')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterDate === 'tomorrow'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Mañana
            </button>

            <button
              type="button"
              id="filter-date-all"
              onClick={() => setFilterDate('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterDate === 'all'
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Todos los turnos
            </button>

            <input
              type="date"
              id="filter-custom-date"
              value={filterDate !== 'today' && filterDate !== 'tomorrow' && filterDate !== 'all' ? filterDate : ''}
              onChange={(e) => e.target.value && setFilterDate(e.target.value)}
              className="bg-zinc-800 text-xs text-zinc-200 border border-zinc-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <select
              id="filter-status-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-zinc-800 text-xs text-zinc-200 border border-zinc-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Todos los estados</option>
              <option value="confirmed">Confirmados</option>
              <option value="completed">Completados</option>
              <option value="cancelled">Cancelados</option>
            </select>

            <button
              type="button"
              onClick={fetchAppointments}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Refrescar lista"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search row */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por cliente, teléfono, servicio o código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/70 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            Cargando agenda de turnos...
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-12 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl text-center space-y-2">
            <Calendar className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400">
              No hay turnos registrados para el filtro seleccionado.
            </p>
          </div>
        ) : (
          appointments.map((apt) => {
            const isCancelled = apt.status === 'cancelled';
            const isCompleted = apt.status === 'completed';
            const isReminderSent = apt.reminderStatus === 'sent';

            return (
              <div
                key={apt.id}
                id={`appointment-row-${apt.id}`}
                className={`bg-zinc-900 border rounded-xl p-4 transition-all ${
                  isCancelled
                    ? 'border-zinc-800/40 opacity-60 bg-zinc-950'
                    : isCompleted
                    ? 'border-zinc-800 bg-zinc-900/60'
                    : 'border-zinc-800 hover:border-zinc-700 shadow-sm'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left: Time, Client, Service */}
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex flex-col items-center justify-center text-center flex-shrink-0">
                      <span className="text-sm font-black text-amber-400">{apt.time}</span>
                      <span className="text-[10px] text-zinc-400">{apt.date.slice(5)}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-zinc-100">
                          {apt.clientName}
                        </span>
                        <span className="font-mono text-[11px] text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                          {apt.code}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isCancelled
                              ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                              : isCompleted
                              ? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isCancelled ? 'Cancelado' : isCompleted ? 'Completado' : 'Confirmado'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                        <span className="flex items-center gap-1 text-zinc-300 font-medium">
                          <Scissors className="w-3 h-3 text-amber-500" />
                          {apt.serviceName}
                        </span>
                        <span>•</span>
                        <span>Barbero: <strong className="text-zinc-300 font-semibold">{apt.barberName}</strong></span>
                        <span>•</span>
                        <span className="text-amber-400 font-bold">${apt.servicePrice.toLocaleString('es-AR')}</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span>WhatsApp: <a href={`tel:${apt.clientPhone}`} className="text-emerald-400 hover:underline">{apt.clientPhone}</a></span>
                        {apt.clientNotes && (
                          <span className="text-zinc-500 italic truncate max-w-xs">
                            — "{apt.clientNotes}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-wrap pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-800">
                    {/* WhatsApp notification button */}
                    {!isCancelled && (
                      <button
                        type="button"
                        id={`whatsapp-btn-${apt.id}`}
                        onClick={() => handleSendWhatsAppReminder(apt)}
                        disabled={sendingReminderId === apt.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isReminderSent
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/50'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-900/30'
                        }`}
                        title="Enviar recordatorio automático por WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-current" />
                        <span>{isReminderSent ? 'Reenviar WhatsApp' : 'Enviar WhatsApp'}</span>
                      </button>
                    )}

                    {/* Status actions */}
                    {!isCancelled && !isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(apt.id, 'completed')}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-medium flex items-center gap-1 transition-colors"
                        title="Marcar como atendido / completado"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Completar</span>
                      </button>
                    )}

                    {!isCancelled && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-950/60 hover:text-red-400 text-zinc-400 text-xs font-medium flex items-center gap-1 transition-colors"
                        title="Cancelar turno"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Cancelar</span>
                      </button>
                    )}

                    {isCancelled && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(apt.id, 'confirmed')}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
                      >
                        Reactivar
                      </button>
                    )}
                  </div>
                </div>

                {/* Reminder status stamp */}
                {isReminderSent && (
                  <div className="mt-2 pt-2 border-t border-zinc-800/60 text-[11px] text-emerald-400/90 flex items-center gap-1.5">
                    <CheckCheck className="w-3 h-3 text-emerald-400" />
                    <span>
                      Recordatorio WhatsApp enviado {apt.reminderSentAt ? `el ${new Date(apt.reminderSentAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} hs` : ''}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
        </div>
      )}

      {/* Manual Booking Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" />
                <span>Agendar Turno Manual (Mostrador / Teléfono)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualBooking} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Nombre del Cliente *</label>
                <input
                  type="text"
                  required
                  value={manualClientName}
                  onChange={(e) => setManualClientName(e.target.value)}
                  placeholder="Ej: Marcelo Castro"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Teléfono WhatsApp *</label>
                <input
                  type="tel"
                  required
                  value={manualClientPhone}
                  onChange={(e) => setManualClientPhone(e.target.value)}
                  placeholder="Ej: +5491144556677"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Servicio *</label>
                  <select
                    value={manualServiceId}
                    onChange={(e) => setManualServiceId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (${s.price})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Barbero *</label>
                  <select
                    value={manualBarberId}
                    onChange={(e) => setManualBarberId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Hora *</label>
                  <input
                    type="time"
                    required
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Notas / Observaciones</label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="Cliente habitual / corte con tijera"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-3 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
                >
                  {manualSubmitting ? 'Guardando...' : 'Agendar Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
