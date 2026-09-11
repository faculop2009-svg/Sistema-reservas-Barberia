import React, { useState } from 'react';
import { Search, Calendar, Clock, Scissors, MessageCircle, AlertCircle, Trash2, CheckCircle2, User, MapPin } from 'lucide-react';
import { Appointment, BusinessSettings } from '../types.ts';
import { downloadIcsCalendar } from '../utils/calendar.ts';
import { loadClientAppointments, saveClientAppointments } from '../utils/clientStorage.ts';

interface LookupAppointmentProps {
  settings: BusinessSettings;
  onNewBookingClick: () => void;
}

export const LookupAppointment: React.FC<LookupAppointmentProps> = ({
  settings,
  onNewBookingClick,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setSearched(true);

    try {
      const trimmed = query.trim();
      // First try by code
      if (trimmed.toUpperCase().startsWith('BAR-') || trimmed.length <= 8) {
        const res = await fetch(`/api/appointments/by-code/${trimmed}`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          setAppointments([data.appointment]);
          setLoading(false);
          return;
        }
      }

      // Search by phone or name
      const res2 = await fetch(`/api/appointments?search=${encodeURIComponent(trimmed)}`).catch(() => null);
      if (res2 && res2.ok) {
        const list = await res2.json();
        setAppointments(list);
      } else {
        // Local fallback search
        const allApts = loadClientAppointments();
        const q = trimmed.toLowerCase();
        const filtered = allApts.filter(
          (a) =>
            a.code.toLowerCase().includes(q) ||
            a.clientName.toLowerCase().includes(q) ||
            a.clientPhone.includes(q)
        );
        setAppointments(filtered);
        if (filtered.length === 0) {
          setError('No encontramos reservas con ese código o teléfono.');
        }
      }
    } catch (err) {
      console.warn('Search fallback error:', err);
      const allApts = loadClientAppointments();
      const q = query.trim().toLowerCase();
      const filtered = allApts.filter(
        (a) =>
          a.code.toLowerCase().includes(q) ||
          a.clientName.toLowerCase().includes(q) ||
          a.clientPhone.includes(q)
      );
      setAppointments(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar este turno?')) return;

    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
      }).catch(() => null);

      if (res && res.ok) {
        setSuccessMsg('Tu turno ha sido cancelado con éxito.');
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a))
        );
      } else {
        // Client cancel fallback
        const allApts = loadClientAppointments();
        const target = allApts.find((a) => a.id === id);
        if (target) {
          target.status = 'cancelled';
          saveClientAppointments(allApts);
          setSuccessMsg('Tu turno ha sido cancelado con éxito.');
          setAppointments((prev) =>
            prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a))
          );
        }
      }
    } catch {
      const allApts = loadClientAppointments();
      const target = allApts.find((a) => a.id === id);
      if (target) {
        target.status = 'cancelled';
        saveClientAppointments(allApts);
        setSuccessMsg('Tu turno ha sido cancelado con éxito.');
        setAppointments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'cancelled' } : a))
        );
      } else {
        setError('No se pudo cancelar el turno.');
      }
    }
  };

  const formatDateDisplay = (ymd: string) => {
    try {
      const [year, month, day] = ymd.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return ymd;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-zinc-100">
          Consulta y Gestión de tu Turno
        </h2>
        <p className="text-xs text-zinc-400">
          Ingresa tu código de reserva (Ej: BAR-1042) o tu número de teléfono celular
        </p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            id="lookup-input"
            required
            placeholder="Ej: BAR-1042 o tu número de teléfono"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          id="lookup-submit-btn"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-md shadow-amber-500/10 whitespace-nowrap flex items-center justify-center gap-1.5"
        >
          {loading ? 'Buscando...' : 'Buscar Turno'}
        </button>
      </form>

      {successMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-8 text-center space-y-3">
              <Calendar className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm text-zinc-300">
                No encontramos ningún turno activo con ese código o número de teléfono.
              </p>
              <button
                type="button"
                onClick={onNewBookingClick}
                className="px-4 py-2 rounded-lg bg-amber-500 text-zinc-950 text-xs font-bold hover:bg-amber-400 transition-colors"
              >
                Reservar un nuevo turno ahora
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Turnos encontrados ({appointments.length})
              </h3>

              {appointments.map((apt) => {
                const isCancelled = apt.status === 'cancelled';
                const isCompleted = apt.status === 'completed';

                return (
                  <div
                    key={apt.id}
                    className={`bg-zinc-900 border rounded-2xl p-5 space-y-4 transition-all ${
                      isCancelled
                        ? 'border-red-950/60 opacity-70 bg-zinc-950'
                        : 'border-zinc-800 shadow-md'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-amber-400 font-bold border border-zinc-700">
                            {apt.code}
                          </span>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
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
                        <h4 className="text-sm sm:text-base font-bold text-zinc-100 mt-1 flex items-center gap-1.5">
                          <Scissors className="w-4 h-4 text-amber-500" />
                          {apt.serviceName}
                        </h4>
                      </div>

                      <div className="text-sm font-bold text-amber-400">
                        ${apt.servicePrice.toLocaleString('es-AR')}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span className="capitalize">{formatDateDisplay(apt.date)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-zinc-300">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{apt.time} hs ({apt.durationMinutes} min)</span>
                      </div>

                      <div className="flex items-center gap-2 text-zinc-300">
                        <User className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Atiende: {apt.barberName}</span>
                      </div>

                      <div className="flex items-center gap-2 text-zinc-400">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="truncate">{settings.address}</span>
                      </div>
                    </div>

                    {!isCancelled && (
                      <div className="pt-2 border-t border-zinc-800/80 flex flex-wrap items-center gap-2">
                        {apt.whatsappMessage && (
                          <a
                            href={`https://wa.me/${apt.clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                              apt.whatsappMessage
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Abrir Recordatorio WhatsApp</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => downloadIcsCalendar(apt, settings.shopName, settings.address)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>Guardar en Calendario</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCancelAppointment(apt.id)}
                          className="ml-auto px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Cancelar Turno</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
