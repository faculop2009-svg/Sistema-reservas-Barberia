import React, { useState } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  FolderDown,
  Lock,
  KeyRound,
  SlidersHorizontal,
  CreditCard,
  Package,
  Star,
  Calendar,
  Search,
  Users,
  Coffee,
} from 'lucide-react';
import { BusinessSettings } from '../types.ts';
import { DEFAULT_SETTINGS } from '../data/defaults.ts';

interface ShopSettingsModalProps {
  settings: BusinessSettings;
  onSave: (updated: BusinessSettings) => Promise<void>;
  onClose: () => void;
}

export const ShopSettingsModal: React.FC<ShopSettingsModalProps> = ({
  settings,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<BusinessSettings>({ ...settings });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(formData);
      if (formData.adminPin) {
        sessionStorage.setItem('barber_admin_pin', formData.adminPin.trim());
      }
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 1000);
    } catch {
      setError('No se pudo guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetTemplate = () => {
    setFormData((prev) => ({
      ...prev,
      reminderTemplate: DEFAULT_SETTINGS.reminderTemplate,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                Configuración del Negocio & WhatsApp
              </h3>
              <p className="text-xs text-zinc-400">
                Ajustes de horarios, dirección y plantilla de recordatorio
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 text-sm"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Nombre de la Peluquería / Barbería</label>
              <input
                type="text"
                required
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Teléfono de Contacto</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">PIN de Acceso al Panel</label>
              <input
                type="text"
                required
                maxLength={8}
                value={formData.adminPin || '1234'}
                onChange={(e) => setFormData({ ...formData, adminPin: e.target.value })}
                placeholder="1234"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-zinc-500">Protege el panel de cambios no autorizados</span>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Símbolo de Moneda</label>
              <input
                type="text"
                required
                maxLength={4}
                value={formData.currencySymbol || '$'}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                placeholder="$"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 font-mono focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-zinc-500">Ej: $, €, USD, ARS</span>
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Instagram (@usuario)</label>
              <input
                type="text"
                value={formData.instagram || ''}
                onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                placeholder="@tu_barberia"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-zinc-500">Enlace directo a tus redes</span>
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-semibold mb-1">Dirección del Salón</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Business Hours */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Apertura</label>
              <input
                type="time"
                value={formData.openingHour}
                onChange={(e) => setFormData({ ...formData, openingHour: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Cierre</label>
              <input
                type="time"
                value={formData.closingHour}
                onChange={(e) => setFormData({ ...formData, closingHour: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Almuerzo Inicio</label>
              <input
                type="time"
                value={formData.lunchBreakStart || ''}
                onChange={(e) => setFormData({ ...formData, lunchBreakStart: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-zinc-300 font-semibold mb-1">Almuerzo Fin</label>
              <input
                type="time"
                value={formData.lunchBreakEnd || ''}
                onChange={(e) => setFormData({ ...formData, lunchBreakEnd: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* WhatsApp Reminder Template */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-zinc-200 font-semibold flex items-center gap-1.5">
                <span>Plantilla del Mensaje de WhatsApp</span>
              </label>
              <button
                type="button"
                onClick={handleResetTemplate}
                className="text-[11px] text-amber-500 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Restablecer predeterminado
              </button>
            </div>
            <p className="text-[11px] text-zinc-400">
              Variables disponibles: <code className="text-amber-400">{'{clientName}'}</code>,{' '}
              <code className="text-amber-400">{'{serviceName}'}</code>,{' '}
              <code className="text-amber-400">{'{dateFormatted}'}</code>,{' '}
              <code className="text-amber-400">{'{time}'}</code>,{' '}
              <code className="text-amber-400">{'{barberName}'}</code>,{' '}
              <code className="text-amber-400">{'{address}'}</code>,{' '}
              <code className="text-amber-400">{'{price}'}</code>,{' '}
              <code className="text-amber-400">{'{code}'}</code>.
            </p>
            <textarea
              rows={6}
              value={formData.reminderTemplate}
              onChange={(e) => setFormData({ ...formData, reminderTemplate: e.target.value })}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 font-mono text-xs focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          {/* Modules & Feature Toggles Section */}
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                    <span>Módulos y Opciones del Local</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Personalización
                    </span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Desmarca las opciones que no utilices para ocultarlas de la web de tus clientes.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Toggle Planes Mensuales */}
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.enableMonthlyPlans !== false}
                  onChange={(e) => setFormData({ ...formData, enableMonthlyPlans: e.target.checked })}
                  className="mt-0.5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                    <span>Planes Mensuales 4x3</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight">
                    Suscripciones con débito automático. Si lo apagas, se oculta del catálogo.
                  </p>
                </div>
              </label>

              {/* Toggle Productos */}
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.enableProducts !== false}
                  onChange={(e) => setFormData({ ...formData, enableProducts: e.target.checked })}
                  className="mt-0.5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                    <Package className="w-3.5 h-3.5 text-blue-400" />
                    <span>Stock & Tienda de Productos</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight">
                    Venta de ceras, aceites y sugerencias tras reservar turnos.
                  </p>
                </div>
              </label>

              {/* Toggle Reseñas */}
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.enableReviews !== false}
                  onChange={(e) => setFormData({ ...formData, enableReviews: e.target.checked })}
                  className="mt-0.5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                    <Star className="w-3.5 h-3.5 text-yellow-400" />
                    <span>Muro de Reseñas</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight">
                    Calificaciones de estrellas y opiniones de clientes en la web.
                  </p>
                </div>
              </label>

              {/* Toggle Calendario Público */}
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.enablePublicCalendar !== false}
                  onChange={(e) => setFormData({ ...formData, enablePublicCalendar: e.target.checked })}
                  className="mt-0.5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Calendario Visual Público</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight">
                    Grilla interactiva mensual de disponibilidad para clientes.
                  </p>
                </div>
              </label>

              {/* Toggle Mi Turno */}
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.enableLookupMyTurn !== false}
                  onChange={(e) => setFormData({ ...formData, enableLookupMyTurn: e.target.checked })}
                  className="mt-0.5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                    <Search className="w-3.5 h-3.5 text-purple-400" />
                    <span>Buscador "Mi Turno"</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight">
                    Consulta rápida de turnos por código o celular para clientes.
                  </p>
                </div>
              </label>

              {/* Toggle Selección de Barbero */}
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.enableBarberSelection !== false}
                  onChange={(e) => setFormData({ ...formData, enableBarberSelection: e.target.checked })}
                  className="mt-0.5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Selección de Barbero</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight">
                    Desactívalo si tienes 1 solo barbero para agendar en 1 clic.
                  </p>
                </div>
              </label>

              {/* Toggle Almuerzo */}
              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors sm:col-span-2">
                <input
                  type="checkbox"
                  checked={formData.enableLunchBreak !== false}
                  onChange={(e) => setFormData({ ...formData, enableLunchBreak: e.target.checked })}
                  className="mt-0.5 rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                    <Coffee className="w-3.5 h-3.5 text-orange-400" />
                    <span>Pausa de Almuerzo en Turnos</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight">
                    Bloquea los horarios de {formData.lunchBreakStart || '13:30'} a {formData.lunchBreakEnd || '14:30'}.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Security & Access PIN Section */}
          <div className="p-4 bg-zinc-950 border border-amber-500/30 rounded-xl space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                  <span>PIN Secreto de Administrador</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Seguridad Privada
                  </span>
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Protege tu panel para que solo tú y tus barberos puedan ver la agenda de clientes y editar precios.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Tu PIN de Acceso (4 a 8 caracteres)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={8}
                    value={formData.adminPin || ''}
                    onChange={(e) => setFormData({ ...formData, adminPin: e.target.value.trim() })}
                    placeholder="Ej: 1234"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg py-2 pl-8 pr-3 font-mono text-sm tracking-widest text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div className="text-[11px] text-zinc-400 flex items-center bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800">
                <span>
                  🔒 <strong>Privado:</strong> Los clientes que visiten la web <strong>nunca podrán ver este PIN ni entrar a tu panel</strong> sin saber este código.
                </span>
              </div>
            </div>
          </div>

          {/* Export Code for GitHub & Render */}
          <div className="p-4 bg-amber-500/5 border border-amber-500/30 rounded-xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <FolderDown className="w-4 h-4 text-amber-500" />
                  Descargar Código para GitHub & Render
                </h4>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Descarga todo el proyecto en un archivo comprimido <strong>.ZIP</strong> limpio (sin carpetas pesadas innecesarias), listo para subirlo directamente a tu repositorio de GitHub y conectarlo a Render.
                </p>
              </div>
              <a
                href="/api/download-zip"
                target="_blank"
                rel="noopener noreferrer"
                download="barberia-turnos-completo.zip"
                className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold whitespace-nowrap shadow transition-colors flex items-center gap-1.5 flex-shrink-0"
              >
                <FolderDown className="w-3.5 h-3.5" />
                <span>Descargar .ZIP</span>
              </a>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>¡Guardado!</span>
                </>
              ) : saving ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
