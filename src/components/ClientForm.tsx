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
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-amber-500 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Resumen del turno
          </div>
          <div className="text-sm font-bold text-zinc-100 mt-0.5">
            {selectedService.name}
          </div>
          <div className="text-xs text-zinc-400 capitalize mt-0.5">
            {formatDateDisplay(selectedDate)} a las <span className="text-amber-400 font-semibold">{selectedTime} hs</span>
          </div>
          <div className="text-[11px] text-zinc-500">
            Con: {barberName}
          </div>
        </div>

        <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-800">
          <div className="text-xs text-zinc-400">Total a abonar en el local</div>
          <div className="text-lg font-black text-amber-400">
            ${selectedService.price.toLocaleString('es-AR')}
          </div>
          <div className="text-[10px] text-zinc-500">
            Aprox. {selectedService.durationMinutes} minutos
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg flex items-center gap-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
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
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              Teléfono WhatsApp <span className="text-amber-500">*</span>
            </span>
            <span className="text-[11px] text-emerald-400/90 font-normal">
              Recordatorio automático vía WhatsApp
            </span>
          </label>
          <input
            type="tel"
            id="client-phone-input"
            required
            placeholder="Ej: +54 9 11 3456-7890 o 1134567890"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
          <p className="text-[11px] text-zinc-500 mt-1">
            Incluye código de área. Te enviaremos la confirmación y recordatorio automático a este número.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
            Notas o aclaraciones (opcional)
          </label>
          <input
            type="text"
            id="client-notes-input"
            placeholder="Ej: Prefiero degradé bajo con navaja / primera vez en el salón"
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        id="submit-booking-btn"
        disabled={isSubmitting || !selectedTime || !clientName || !clientPhone}
        className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
          isSubmitting || !selectedTime || !clientName || !clientPhone
            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none'
            : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20 active:scale-[0.99]'
        }`}
      >
        {isSubmitting ? (
          <span>Agendando tu turno...</span>
        ) : (
          <span>Confirmar Reserva de Turno</span>
        )}
      </button>
    </form>
  );
};
