import React, { useState } from 'react';
import {
  SlidersHorizontal,
  CreditCard,
  Package,
  Star,
  Calendar,
  Search,
  Users,
  Coffee,
  CheckCircle2,
  AlertCircle,
  Zap,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Check,
} from 'lucide-react';
import { BusinessSettings } from '../types.ts';

interface ShopModulesManagerProps {
  settings: BusinessSettings;
  onSaveSettings: (newSettings: Partial<BusinessSettings>) => Promise<boolean> | boolean | void;
  isSaving?: boolean;
}

interface ModuleDefinition {
  key: keyof BusinessSettings;
  title: string;
  tag: string;
  description: string;
  clientImpact: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  category: 'Comercial' | 'Experiencia de Reserva' | 'Operativo';
}

export const ShopModulesManager: React.FC<ShopModulesManagerProps> = ({
  settings,
  onSaveSettings,
  isSaving = false,
}) => {
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);
  const [localSavingKey, setLocalSavingKey] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  const handleToggle = async (key: keyof BusinessSettings, currentValue: boolean | undefined, title: string) => {
    const newValue = currentValue === undefined ? false : !currentValue;
    setLocalSavingKey(key);
    try {
      await onSaveSettings({ [key]: newValue });
      showToast(
        newValue ? `✅ "${title}" activado con éxito` : `⏸️ "${title}" desactivado (oculto para clientes)`,
        newValue ? 'success' : 'info'
      );
    } catch {
      showToast(`Error al guardar cambios de ${title}`, 'info');
    } finally {
      setLocalSavingKey(null);
    }
  };

  const applyPreset = async (presetName: string, updates: Partial<BusinessSettings>) => {
    setLocalSavingKey('preset');
    try {
      await onSaveSettings(updates);
      showToast(`⚡ Plantilla "${presetName}" aplicada con éxito`, 'success');
    } catch {
      showToast('Error al aplicar plantilla', 'info');
    } finally {
      setLocalSavingKey(null);
    }
  };

  const modules: ModuleDefinition[] = [
    {
      key: 'enableMonthlyPlans',
      title: 'Planes Mensuales 4x3 (Suscripciones)',
      tag: 'Membresías',
      category: 'Comercial',
      description: 'Ofrece membresías con débito automático donde el cliente paga 3 cortes y recibe 4 por mes.',
      clientImpact: 'Al desactivar: Se oculta la pestaña de planes 4x3. El catálogo mostrará únicamente servicios individuales.',
      icon: CreditCard,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      key: 'enableProducts',
      title: 'Venta y Stock de Productos',
      tag: 'Tienda & Stock',
      category: 'Comercial',
      description: 'Catálogo de ceras, pomadas, aceites y venta cruzada sugerida tras confirmar un turno.',
      clientImpact: 'Al desactivar: Se oculta la pestaña "Productos" de la barra de navegación y la sugerencia en la reserva.',
      icon: Package,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      key: 'enableReviews',
      title: 'Muro de Reseñas y Calificaciones',
      tag: 'Opiniones',
      category: 'Experiencia de Reserva',
      description: 'Sistema de opiniones con estrellas (1 a 5) y testimonios reales con respuestas del dueño.',
      clientImpact: 'Al desactivar: Se oculta la pestaña "Reseñas" y la insignia de valoración en la pantalla de inicio.',
      icon: Star,
      iconColor: 'text-yellow-400',
      iconBg: 'bg-yellow-500/10 border-yellow-500/20',
    },
    {
      key: 'enablePublicCalendar',
      title: 'Calendario Visual Público',
      tag: 'Disponibilidad',
      category: 'Experiencia de Reserva',
      description: 'Permite a los clientes explorar la disponibilidad mensual completa en un calendario interactivo.',
      clientImpact: 'Al desactivar: Se oculta el botón "Disponibilidad" del menú. Los clientes agendan por la vista rápida directa.',
      icon: Calendar,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      key: 'enableLookupMyTurn',
      title: 'Buscador de Turnos ("Mi Turno")',
      tag: 'Autogestión',
      category: 'Experiencia de Reserva',
      description: 'Permite a los clientes consultar los datos de su cita colocando su código o número de teléfono.',
      clientImpact: 'Al desactivar: Se oculta el botón "Mi Turno" en la cabecera para los visitantes.',
      icon: Search,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20',
    },
    {
      key: 'enableBarberSelection',
      title: 'Selección de Barbero por el Cliente',
      tag: 'Staff / Equipo',
      category: 'Operativo',
      description: 'Permite que el cliente escoja con qué profesional atenderse (Alex, Martín, Camila, etc.).',
      clientImpact: 'Al desactivar: Ideal para locales con un solo sillón o que atienden de forma rotativa. Reserva más rápida en 1 paso.',
      icon: Users,
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      key: 'enableLunchBreak',
      title: 'Pausa de Almuerzo / Descanso',
      tag: 'Horarios',
      category: 'Operativo',
      description: `Bloquea automáticamente los turnos entre ${settings.lunchBreakStart || '13:30'} y ${settings.lunchBreakEnd || '14:30'}.`,
      clientImpact: 'Al desactivar: Habilita turnos corridos durante el mediodía sin pausas intermedias.',
      icon: Coffee,
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/10 border-orange-500/20',
    },
  ];

  // Count active modules
  const activeCount = modules.filter((m) => settings[m.key] !== false).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 rounded-2xl border border-zinc-800 relative overflow-hidden shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-zinc-100">
                Módulos y Opciones del Local
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {activeCount} de {modules.length} activos
              </span>
            </div>
            <p className="text-sm text-zinc-400">
              ¿No vendes productos o no ofreces suscripciones en tu local? Apágalos aquí con un solo clic para que tu web muestre exactamente lo que necesitas.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                applyPreset('Barbería Completa', {
                  enableMonthlyPlans: true,
                  enableProducts: true,
                  enableReviews: true,
                  enablePublicCalendar: true,
                  enableLookupMyTurn: true,
                  enableBarberSelection: true,
                  enableLunchBreak: true,
                })
              }
              disabled={isSaving || localSavingKey !== null}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Activar todas las funciones disponibles"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Activar Todo</span>
            </button>

            <button
              type="button"
              onClick={() =>
                applyPreset('Solo Turnos (Esencial)', {
                  enableMonthlyPlans: false,
                  enableProducts: false,
                  enableReviews: true,
                  enablePublicCalendar: true,
                  enableLookupMyTurn: true,
                  enableBarberSelection: true,
                  enableLunchBreak: true,
                })
              }
              disabled={isSaving || localSavingKey !== null}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Oculta planes y productos para dejar reservas limpias"
            >
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>Solo Turnos (Sin Planes ni Stock)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                applyPreset('Barbero Único', {
                  enableMonthlyPlans: false,
                  enableProducts: false,
                  enableReviews: true,
                  enablePublicCalendar: true,
                  enableLookupMyTurn: true,
                  enableBarberSelection: false,
                  enableLunchBreak: true,
                })
              }
              disabled={isSaving || localSavingKey !== null}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Para barberos independientes o de 1 solo sillón"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Modo Barbero Único</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating feedback message */}
      {feedbackMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-sm transition-all duration-200 shadow-md ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-600/40 text-emerald-200'
              : 'bg-zinc-800 border-zinc-700 text-zinc-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMessage.text}</span>
          </div>
          <span className="text-xs opacity-75">Actualizado en vivo</span>
        </div>
      )}

      {/* Grid of Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((mod) => {
          const isEnabled = settings[mod.key] !== false;
          const Icon = mod.icon;
          const isChanging = localSavingKey === mod.key;

          return (
            <div
              key={mod.key}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between gap-4 ${
                isEnabled
                  ? 'bg-zinc-900/90 border-zinc-800/90 shadow-md hover:border-zinc-700'
                  : 'bg-zinc-950/60 border-zinc-900 opacity-80 hover:opacity-100 hover:border-zinc-800'
              }`}
            >
              <div>
                {/* Top card bar: icon, tag, toggle switch */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border ${mod.iconBg} ${mod.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                          {mod.tag}
                        </span>
                        <span
                          className={`text-[11px] font-medium flex items-center gap-1 ${
                            isEnabled ? 'text-emerald-400' : 'text-zinc-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'
                            }`}
                          />
                          {isEnabled ? 'Activo en web' : 'Desactivado'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-zinc-100 mt-1">
                        {mod.title}
                      </h3>
                    </div>
                  </div>

                  {/* iOS Style Toggle Switch Button */}
                  <button
                    type="button"
                    onClick={() => handleToggle(mod.key, isEnabled, mod.title)}
                    disabled={isSaving || isChanging}
                    aria-label={`Alternar ${mod.title}`}
                    className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${
                      isEnabled ? 'bg-amber-500' : 'bg-zinc-800'
                    } ${isChanging ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-zinc-950 shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                        isEnabled ? 'translate-x-6 bg-zinc-950' : 'translate-x-0 bg-zinc-400'
                      }`}
                    >
                      {isEnabled ? (
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <span className="w-2 h-0.5 bg-zinc-700 rounded-full" />
                      )}
                    </span>
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-300 leading-relaxed mb-2">
                  {mod.description}
                </p>

                {/* Impact Info */}
                <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/70 text-[11px] text-zinc-400 leading-normal flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                  <span>{mod.clientImpact}</span>
                </div>
              </div>

              {/* Footer status button */}
              <div className="pt-2 border-t border-zinc-800/50 flex items-center justify-between text-xs">
                <span className="text-zinc-500">
                  Categoría: <strong className="text-zinc-400">{mod.category}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleToggle(mod.key, isEnabled, mod.title)}
                  disabled={isSaving || isChanging}
                  className={`text-xs font-semibold hover:underline cursor-pointer ${
                    isEnabled ? 'text-rose-400 hover:text-rose-300' : 'text-amber-400 hover:text-amber-300'
                  }`}
                >
                  {isEnabled ? 'Desactivar opción' : 'Activar opción'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
