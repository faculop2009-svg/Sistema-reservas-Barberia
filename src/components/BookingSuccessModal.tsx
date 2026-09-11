import React, { useState, useMemo } from 'react';
import { CheckCircle2, MessageCircle, Calendar as CalendarIcon, Copy, Check, Scissors, MapPin, Sparkles, ShoppingBag } from 'lucide-react';
import { Appointment, BusinessSettings, Product } from '../types.ts';
import { downloadIcsCalendar } from '../utils/calendar.ts';
import { PostBookingProductsAd } from './PostBookingProductsAd.tsx';

interface BookingSuccessModalProps {
  appointment: Appointment;
  whatsappUrl: string;
  settings: BusinessSettings;
  onClose: () => void;
  onNewBooking: () => void;
  onNavigateToProducts?: () => void;
}

export const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({
  appointment,
  whatsappUrl,
  settings,
  onClose,
  onNewBooking,
  onNavigateToProducts,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appointment.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleProduct = (product: Product) => {
    setSelectedProducts((prev) =>
      prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product]
    );
  };

  const productsTotal = selectedProducts.reduce((sum, p) => sum + p.price, 0);
  const finalTotalPrice = appointment.servicePrice + productsTotal;

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

  const currentWhatsappUrl = useMemo(() => {
    if (selectedProducts.length === 0) {
      return whatsappUrl;
    }
    const cleanPhone = (settings.phone || '').replace(/[^0-9]/g, '');
    const itemsList = selectedProducts
      .map(
        (p) =>
          `• *${p.name}* (+${settings.currencySymbol || '$'}${p.price.toLocaleString('es-AR')})`
      )
      .join('\n');

    const message = `¡Hola! 💈 Acabo de reservar mi turno en *${settings.shopName}*:\n` +
      `📍 *Servicio:* ${appointment.serviceName} (${settings.currencySymbol || '$'}${appointment.servicePrice.toLocaleString('es-AR')})\n` +
      `💈 *Profesional:* ${appointment.barberName}\n` +
      `📅 *Fecha:* ${formatDateDisplay(appointment.date)} a las ${appointment.time} hs\n` +
      `🔖 *Código:* ${appointment.code}\n\n` +
      `🛍️ *Productos sumados para retirar en mi turno:*\n` +
      `${itemsList}\n\n` +
      `💵 Subtotal Productos: ${settings.currencySymbol || '$'}${productsTotal.toLocaleString('es-AR')}\n` +
      `💰 *TOTAL FINAL A ABONAR EN EL LOCAL:* ${settings.currencySymbol || '$'}${finalTotalPrice.toLocaleString('es-AR')}\n\n` +
      `📍 Dirección: ${settings.address}\n\n` +
      `¿Me guardan los productos para tenerlos listos en mi visita? ¡Muchas gracias!`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }, [selectedProducts, whatsappUrl, settings, appointment, productsTotal, finalTotalPrice]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div 
        id="booking-success-card"
        className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-2xl sm:max-w-3xl max-h-[94vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto"
      >
        {/* Top celebratory banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 text-center text-white relative flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center mb-2">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight">
            ¡Turno Reservado con Éxito!
          </h2>
          <p className="text-xs text-emerald-100 mt-0.5">
            Tu lugar ya quedó guardado en la agenda de la peluquería
          </p>

          <div className="mt-2.5 inline-flex items-center gap-2 bg-black/25 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider">
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

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Appointment detail rows */}
          <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <span className="text-zinc-400">Servicio:</span>
              <span className="font-bold text-zinc-100 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-amber-500" />
                {appointment.serviceName}
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <span className="text-zinc-400">Precio Servicio:</span>
              <span className="font-semibold text-zinc-200">
                {settings.currencySymbol || '$'}{appointment.servicePrice.toLocaleString('es-AR')}
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

            {/* Added products breakdown if any */}
            {selectedProducts.length > 0 && (
              <div className="py-2 px-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center text-xs font-bold text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Productos sumados al turno ({selectedProducts.length}):</span>
                  </span>
                  <span>+{settings.currencySymbol || '$'}{productsTotal.toLocaleString('es-AR')}</span>
                </div>
                <div className="space-y-1 pt-0.5">
                  {selectedProducts.map((prod) => (
                    <div key={prod.id} className="flex justify-between items-center text-[11px] text-zinc-300 pl-2 border-l-2 border-amber-500/40">
                      <span className="truncate max-w-[240px]">📦 {prod.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-semibold text-amber-300">
                          +{settings.currencySymbol || '$'}{prod.price.toLocaleString('es-AR')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleProduct(prod)}
                          className="text-zinc-400 hover:text-red-400 transition-colors px-1 text-xs"
                          title="Quitar este producto"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Final Total row */}
            <div className="flex justify-between items-center pt-2 border-t border-zinc-800 text-sm">
              <div>
                <span className="text-zinc-200 font-bold block">
                  {selectedProducts.length > 0 ? 'Total Final a abonar en el local:' : 'Total a abonar en el local:'}
                </span>
                {selectedProducts.length > 0 && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[3]" />
                    Servicio + {selectedProducts.length} producto{selectedProducts.length > 1 ? 's' : ''} sumado{selectedProducts.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="text-lg sm:text-xl font-black text-amber-400 tracking-tight">
                  {settings.currencySymbol || '$'}{finalTotalPrice.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          </div>

          {/* WhatsApp Notification Action */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageCircle className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                  Recordatorio Automático por WhatsApp
                </h4>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  {selectedProducts.length > 0
                    ? 'Haz clic a continuación para enviar los datos de tu turno junto con los productos sumados y el total final.'
                    : 'Haz clic a continuación para abrir WhatsApp y guardar tu recordatorio con todos los datos de tu turno.'}
                </p>
              </div>
            </div>

            <a
              id="open-whatsapp-btn"
              href={currentWhatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.01]"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>
                {selectedProducts.length > 0
                  ? `Confirmar Turno + Productos (${settings.currencySymbol || '$'}${finalTotalPrice.toLocaleString('es-AR')})`
                  : 'Abrir WhatsApp y Confirmar Recordatorio'}
              </span>
            </a>
          </div>

          {/* ========================================================= */}
          {/* SPECIAL AD: PRODUCTS SHOWCASE POST-BOOKING               */}
          {/* ========================================================= */}
          <PostBookingProductsAd
            appointment={appointment}
            settings={settings}
            selectedProducts={selectedProducts}
            onToggleProduct={handleToggleProduct}
            onNavigateToProducts={onNavigateToProducts}
          />

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
        <div className="p-3.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between flex-shrink-0">
          {onNavigateToProducts && (
            <button
              type="button"
              onClick={onNavigateToProducts}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Ver Catálogo de Productos</span>
            </button>
          )}

          <button
            id="close-success-btn"
            type="button"
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded transition-colors ml-auto"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

