import React from 'react';
import { CheckCircle2, MessageCircle, Calendar as CalendarIcon, Copy, Check, Scissors, MapPin } from 'lucide-react';
import { Appointment, BusinessSettings } from '../types.ts';
import { downloadIcsCalendar } from '../utils/calendar.ts';

interface BookingSuccessModalProps {
  appointment: Appointment;
  whatsappUrl: string;
  settings: BusinessSettings;
  onClose: () => void;
  onNewBooking: () => void;
}

export const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({
  appointment,
  whatsappUrl,
  settings,
  onClose,
  onNewBooking,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appointment.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        id="booking-success-card"
        className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top celebratory banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-center text-white relative">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center mb-3">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            ¡Turno Reservado con Éxito!
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1">
            Tu lugar ya quedó guardado en la agenda de la peluquería
          </p>

          <div className="mt-3 inline-flex items-center gap-2 bg-black/25 px-3 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider">
            <span>Código: {appointment.code}</span>
            <button
              onClick={handleCopyCode}
              className="p-1 hover:text-emerald-200 transition-colors"
              title="Copiar código"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Ticket Content */}
        <div className="p-6 space-y-5">
          {/* Appointment detail rows */}
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <span className="text-zinc-400">Servicio:</span>
              <span className="font-bold text-zinc-100 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-amber-500" />
                {appointment.serviceName}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <span className="text-zinc-400">Fecha y Hora:</span>
              <span className="font-bold text-amber-400 capitalize">
                {formatDateDisplay(appointment.date)} • {appointment.time} hs
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <span className="text-zinc-400">Profesional:</span>
              <span className="font-semibold text-zinc-200">{appointment.barberName}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <span className="text-zinc-400">Cliente:</span>
              <span className="font-semibold text-zinc-200">{appointment.clientName} ({appointment.clientPhone})</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <span className="text-zinc-400">Dirección:</span>
              <span className="font-medium text-zinc-300 flex items-center gap-1 text-right truncate max-w-[240px]">
                <MapPin className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                {settings.address}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1 text-sm">
              <span className="text-zinc-300 font-medium">Total a pagar:</span>
              <span className="font-extrabold text-amber-400">
                ${appointment.servicePrice.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          {/* WhatsApp Notification Action */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                  Recordatorio Automático por WhatsApp
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Haz clic a continuación para abrir WhatsApp y guardar tu recordatorio con todos los datos de tu turno.
                </p>
              </div>
            </div>

            <a
              id="open-whatsapp-btn"
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.01]"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>Abrir WhatsApp y Confirmar Recordatorio</span>
            </a>
          </div>

          {/* Secondary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <button
              id="download-calendar-btn"
              type="button"
              onClick={() => downloadIcsCalendar(appointment, settings.shopName, settings.address)}
              className="py-2.5 px-3 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-750 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-2 transition-colors"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-amber-500" />
              <span>Agregar al Calendario</span>
            </button>

            <button
              id="new-booking-btn"
              type="button"
              onClick={onNewBooking}
              className="py-2.5 px-3 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-750 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-2 transition-colors"
            >
              <Scissors className="w-3.5 h-3.5 text-amber-500" />
              <span>Agendar otro turno</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 flex justify-end">
          <button
            id="close-success-btn"
            type="button"
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-zinc-200 px-4 py-1.5 rounded transition-colors"
          >
            Entendido, volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
};
