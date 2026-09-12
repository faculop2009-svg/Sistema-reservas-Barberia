import React from 'react';
import { User, Phone, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';
import { BarberService } from '../types.ts';

interface ClientFormProps {
  clientName: string;
  setClientName: (name: string) => void;
  clientPhone: string;
  setClientPhone: (phone: string) => void;
  clientNotes: string;
  setClientNotes: (notes: string) => void;
  selectedService: BarberService;
  selectedDate: string;
  selectedTime: string;
  barberName: string;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  errorMessage?: string | null;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  clientName,
  setClientName,
  clientPhone,
  setClientPhone,
  clientNotes,
  setClientNotes,
  selectedService,
  selectedDate,
  selectedTime,
  barberName,
  onSubmit,
  isSubmitting,
  errorMessage,
}) => {
  const formatDateDisplay = (ymd: string) => {
    try {
      const [year, month, day] = ymd.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    } catch {
      return ymd;
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <span>3. Tus datos de contacto</span>
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Para asociar tu reserva y enviarte el recordatorio automático por WhatsApp
        </p>
      </div>

      {/* Summary Box */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/90 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Resumen de tu Cita</span>
            </div>
            <div className="text-base sm:text-lg font-black text-zinc-100 font-display">
              {selectedService.name}
            </div>
            <div className="text-xs sm:text-sm text-zinc-300 capitalize flex items-center gap-1.5 font-medium">
              <span>{formatDateDisplay(selectedDate)}</span>
              <span className="text-zinc-500">•</span>
              <span className="text-amber-400 font-bold">{selectedTime ? `${selectedTime} hs` : 'Horario pendiente'}</span>
            </div>
            <div className="text-xs text-zinc-400">
              Profesional asignado: <span className="text-zinc-200 font-semibold">{barberName}</span>
            </div>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800/80 flex sm:flex-col justify-between items-end">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-zinc-400">Total a abonar en el local</div>
              <div className="text-2xl font-black text-amber-400 font-display tracking-tight">
                ${selectedService.price.toLocaleString('es-AR')}
              </div>
            </div>
            <div className="text-[11px] text-zinc-400 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/60 border border-zinc-700/50 mt-1">
              <span>Duración est.: {selectedService.durationMinutes} min</span>
            </div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-950/50 border border-red-500/40 rounded-xl flex items-center gap-2.5 text-xs text-red-300 shadow-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Fields */}
      <div className="space-y-4 bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-2xl">
        <div>
          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-500" />
            Nombre y Apellido <span className="text-amber-500">*</span>
          </label>
          <input
            type="text"
            id="client-name-input"
            required
            placeholder="Ej: Facundo Gómez"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-inner"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              Teléfono WhatsApp <span className="text-amber-500">*</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Avisos directos al WhatsApp
            </span>
          </label>
          <input
            type="tel"
            id="client-phone-input"
            required
            placeholder="Ej: 11 2345-6789 o +54 9 11 2345-6789"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
          />
          <p className="text-[11px] text-zinc-400 mt-1.5">
            Incluye código de área sin el 0 ni el 15. Te enviaremos la confirmación oficial con el enlace directo al salón.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
            Notas o aclaraciones para el barbero (opcional)
          </label>
          <input
            type="text"
            id="client-notes-input"
            placeholder="Ej: Corte con degradé medio / diseño de barba con toalla caliente"
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Submit Button & Salon Guarantee */}
      <div className="space-y-3">
        <button
          type="submit"
          id="submit-booking-btn"
          disabled={isSubmitting || !selectedTime || !clientName || !clientPhone}
          className={`w-full py-4 px-6 rounded-xl font-extrabold text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-xl ${
            isSubmitting || !selectedTime || !clientName || !clientPhone
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-zinc-950 shadow-amber-500/25 active:scale-[0.99] font-display'
          }`}
        >
          {isSubmitting ? (
            <span>Agendando tu turno...</span>
          ) : !selectedTime ? (
            <span>Elige un horario en el Paso 2 para continuar</span>
          ) : !clientName || !clientPhone ? (
            <span>Completa tu nombre y WhatsApp para confirmar</span>
          ) : (
            <span>Confirmar Turno y Recibir WhatsApp ➔</span>
          )}
        </button>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-center text-[11px] text-zinc-400">
          <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
            💳 <strong className="text-zinc-300">Pago en el local:</strong> Efectivo, Débito o Mercado Pago
          </div>
          <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
            ⚡ <strong className="text-zinc-300">Confirmación instantánea:</strong> Sin demoras
          </div>
          <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
            🛡️ <strong className="text-zinc-300">Reserva 100% segura:</strong> Cancela sin penalidad
          </div>
        </div>
      </div>
    </form>
  );
};
