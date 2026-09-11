import React, { useState, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  AlertCircle,
  Loader2,
  CalendarDays,
  LayoutGrid,
  Check,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Barber, BarberService } from '../types.ts';
import { VisualCalendar } from './VisualCalendar.tsx';

interface SlotItem {
  slot: string;
  available: boolean;
}

interface DateTimeSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  selectedTime: string;
  onSelectTime: (time: string) => void;
  slots: SlotItem[];
  loadingSlots: boolean;
  barbers: Barber[];
  selectedBarberId: string;
  onSelectBarber: (barberId: string) => void;
  selectedServiceId?: string;
  services?: BarberService[];
}

export const DateTimeSelector: React.FC<DateTimeSelectorProps> = ({
  selectedDate,
  onSelectDate,
  selectedTime,
  onSelectTime,
  slots,
  loadingSlots,
  barbers,
  selectedBarberId,
  onSelectBarber,
  selectedServiceId = 'corte',
  services = [],
}) => {
  const [viewMode, setViewMode] = useState<'quick' | 'full_calendar'>('quick');
  const datesContainerRef = useRef<HTMLDivElement>(null);
  const barbersContainerRef = useRef<HTMLDivElement>(null);

  const scrollDates = (direction: 'left' | 'right') => {
    if (datesContainerRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      datesContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleHorizontalWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  // Generate next 14 days for quick strip
  const quickDates = React.useMemo(() => {
    const dates = [];
    const today = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const ymd = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

      // Spanish weekday
      let dayName = d.toLocaleDateString('es-ES', { weekday: 'short' });
      dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1).replace('.', '');

      if (i === 0) dayName = 'Hoy';
      if (i === 1) dayName = 'Mañana';

      const dayNumber = d.getDate();
      const monthName = d.toLocaleDateString('es-ES', { month: 'short' });

      dates.push({
        ymd,
        dayName,
        dayNumber,
        monthName,
        isSunday: d.getDay() === 0,
      });
    }
    return dates;
  }, []);

  // Filter barbers eligible for this service and currently active
  const activeBarbers = barbers.filter((b) => b.active !== false);

  const eligibleBarbers = activeBarbers.filter((b) => {
    if (b.id === 'barber-any') return true;
    if (!b.allowedServiceIds || b.allowedServiceIds.length === 0) return true;
    return b.allowedServiceIds.includes(selectedServiceId);
  });

  // Separate morning and afternoon slots
  const morningSlots = slots.filter((s) => {
    const hour = parseInt(s.slot.split(':')[0], 10);
    return hour < 14;
  });

  const afternoonSlots = slots.filter((s) => {
    const hour = parseInt(s.slot.split(':')[0], 10);
    return hour >= 14;
  });

  const availableCount = slots.filter((s) => s.available).length;

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <span>2. Fecha, profesional y horario</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Elige el día y la hora que mejor te acomode en nuestro calendario interactivo
          </p>
        </div>

        {/* Calendar View Toggle */}
        <div className="inline-flex rounded-xl bg-zinc-900 p-1 border border-zinc-800 self-start sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setViewMode('quick')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'quick'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Vista Rápida</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('full_calendar')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'full_calendar'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Calendario Mensual</span>
          </button>
        </div>
      </div>

      {/* Barber selection */}
      <div className="bg-zinc-900/70 p-4 rounded-2xl border border-zinc-800 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-500" />
            Profesional / Barbero asignado
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-amber-500/80 font-medium sm:hidden flex items-center gap-1">
              Desliza para elegir ➔
            </span>
            <span className="text-[11px] text-zinc-500 hidden sm:inline">
              {eligibleBarbers.length} disponibles para este servicio
            </span>
          </div>
        </div>

        <div
          ref={barbersContainerRef}
          onWheel={handleHorizontalWheel}
          className="flex sm:grid sm:grid-cols-2 md:grid-cols-4 gap-2.5 overflow-x-auto pb-2 sm:pb-0 horizontal-scroll-container snap-x snap-mandatory -mx-1 px-1"
        >
          {activeBarbers.map((barber) => {
            const isSelected = selectedBarberId === barber.id;
            const canDoService =
              barber.id === 'barber-any' ||
              !barber.allowedServiceIds ||
              barber.allowedServiceIds.includes(selectedServiceId);

            return (
              <button
                key={barber.id}
                type="button"
                id={`barber-btn-${barber.id}`}
                disabled={!canDoService}
                onClick={() => canDoService && onSelectBarber(barber.id)}
                className={`p-3 rounded-xl border text-left transition-all text-xs flex items-center gap-3 relative flex-shrink-0 w-[240px] sm:w-auto snap-start ${
                  !canDoService
                    ? 'opacity-40 bg-zinc-950/40 border-zinc-800 cursor-not-allowed text-zinc-600'
                    : isSelected
                    ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 hover:bg-zinc-900'
                }`}
              >
                {barber.avatarUrl ? (
                  <img
                    src={barber.avatarUrl}
                    alt={barber.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-zinc-700"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 font-bold ${
                      isSelected ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-bold text-zinc-100">{barber.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />}
                  </div>
                  <span className="text-[10px] text-zinc-400 truncate block">
                    {barber.role || barber.specialty}
                  </span>
                  {!canDoService && (
                    <span className="text-[9px] text-rose-400 block mt-0.5">
                      No realiza este servicio
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW 1: Full Month Visual Calendar */}
      {viewMode === 'full_calendar' ? (
        <VisualCalendar
          mode="client"
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          selectedTime={selectedTime}
          onSelectTime={onSelectTime}
          selectedBarberId={selectedBarberId}
          onSelectBarberId={onSelectBarber}
          selectedServiceId={selectedServiceId}
          barbers={barbers}
          services={services}
        />
      ) : (
        /* VIEW 2: Quick Dates Selector + Time Slots Grid */
        <div className="space-y-4">
          {/* Quick Date Strip */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-500" />
                  Selecciona el día
                </label>
                <div className="flex items-center gap-1 ml-1">
                  <button
                    type="button"
                    onClick={() => scrollDates('left')}
                    aria-label="Ver días anteriores"
                    title="Deslizar días a la izquierda"
                    className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-zinc-400 hover:text-amber-400 flex items-center justify-center transition-colors shadow-sm"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollDates('right')}
                    aria-label="Ver siguientes días"
                    title="Deslizar días a la derecha"
                    className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-zinc-400 hover:text-amber-400 flex items-center justify-center transition-colors shadow-sm"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-amber-500/80 font-medium sm:hidden">Desliza ➔</span>
                <span className="text-[11px] text-zinc-500 hidden sm:inline">Otra fecha:</span>
                <input
                  type="date"
                  id="custom-date-input"
                  value={selectedDate}
                  min={quickDates[0]?.ymd}
                  onChange={(e) => e.target.value && onSelectDate(e.target.value)}
                  className="bg-zinc-900 text-xs text-zinc-300 border border-zinc-700 rounded-lg px-2.5 py-1 hover:border-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div
              ref={datesContainerRef}
              onWheel={handleHorizontalWheel}
              className="flex gap-2 overflow-x-auto pb-2.5 horizontal-scroll-container snap-x snap-mandatory -mx-1 px-1"
            >
              {quickDates.map((item) => {
                const isSelected = selectedDate === item.ymd;
                return (
                  <button
                    key={item.ymd}
                    type="button"
                    id={`quick-date-${item.ymd}`}
                    disabled={item.isSunday}
                    onClick={() => onSelectDate(item.ymd)}
                    className={`flex-shrink-0 w-20 py-2.5 px-2 rounded-xl border flex flex-col items-center justify-center transition-all snap-start ${
                      item.isSunday
                        ? 'opacity-40 bg-zinc-900/30 border-zinc-800/50 cursor-not-allowed text-zinc-600'
                        : isSelected
                        ? 'bg-amber-500 text-zinc-950 font-bold border-amber-500 shadow-md shadow-amber-500/20 scale-[1.02]'
                        : 'bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/70'
                    }`}
                  >
                    <span className="text-[11px] font-medium uppercase tracking-tight">
                      {item.dayName}
                    </span>
                    <span className="text-lg font-extrabold my-0.5">{item.dayNumber}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-zinc-900' : 'text-zinc-500'}`}>
                      {item.isSunday ? 'Cerrado' : item.monthName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Available Time Slots */}
          <div className="bg-zinc-900/70 p-5 rounded-2xl border border-zinc-800 space-y-4 shadow-md">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Horarios Disponibles
              </label>
              <span className="text-xs text-zinc-400">
                {loadingSlots ? (
                  <span className="flex items-center gap-1 text-amber-400 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verificando turnos...
                  </span>
                ) : (
                  `${availableCount} ${availableCount === 1 ? 'turno libre' : 'turnos libres'} para ${
                    quickDates[0]?.ymd === selectedDate
                      ? 'hoy'
                      : quickDates[1]?.ymd === selectedDate
                      ? 'mañana'
                      : 'la fecha seleccionada'
                  }`
                )}
              </span>
            </div>

            {/* Notice if Today has 0 remaining slots */}
            {quickDates[0]?.ymd === selectedDate && availableCount === 0 && !loadingSlots && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-amber-200">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-amber-300 text-sm">
                      No quedan más turnos disponibles para hoy
                    </p>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      Los horarios de la jornada ya concluyeron o están completos. ¡Te invitamos a agendar para mañana!
                    </p>
                  </div>
                </div>
                {quickDates[1] && (
                  <button
                    type="button"
                    id="btn-switch-tomorrow"
                    onClick={() => onSelectDate(quickDates[1].ymd)}
                    className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 flex-shrink-0"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    <span>Ver turnos para Mañana</span>
                  </button>
                )}
              </div>
            )}

            {loadingSlots ? (
              <div className="py-10 flex items-center justify-center text-zinc-400 gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                Cargando disponibilidad actualizada...
              </div>
            ) : slots.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 text-xs flex flex-col items-center gap-2">
                <AlertCircle className="w-6 h-6 text-amber-500/80" />
                <span className="font-semibold text-zinc-300">
                  No hay turnos disponibles para la fecha o barbero seleccionado.
                </span>
                <span className="text-zinc-500">
                  Prueba cambiando de profesional o seleccionando otro día en el calendario.
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Morning */}
                {morningSlots.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-zinc-400 mb-2 flex items-center gap-1">
                      <span>Turnos Mañana (09:00 - 13:30)</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {morningSlots.map(({ slot, available }) => {
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            id={`slot-btn-${slot.replace(':', '-')}`}
                            disabled={!available}
                            onClick={() => onSelectTime(slot)}
                            className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                              !available
                                ? 'bg-zinc-950/40 border-zinc-800/40 text-zinc-600 line-through cursor-not-allowed'
                                : isSelected
                                ? 'bg-amber-500 text-zinc-950 border-amber-500 font-extrabold shadow-md shadow-amber-500/20 scale-105'
                                : 'bg-zinc-900 border-zinc-700/80 text-zinc-200 hover:border-amber-500/60 hover:text-amber-400'
                            }`}
                          >
                            {slot} hs
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Afternoon */}
                {afternoonSlots.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-zinc-400 mb-2 flex items-center gap-1">
                      <span>Turnos Tarde (14:30 - 20:00)</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {afternoonSlots.map(({ slot, available }) => {
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            id={`slot-btn-${slot.replace(':', '-')}`}
                            disabled={!available}
                            onClick={() => onSelectTime(slot)}
                            className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all ${
                              !available
                                ? 'bg-zinc-950/40 border-zinc-800/40 text-zinc-600 line-through cursor-not-allowed'
                                : isSelected
                                ? 'bg-amber-500 text-zinc-950 border-amber-500 font-extrabold shadow-md shadow-amber-500/20 scale-105'
                                : 'bg-zinc-900 border-zinc-700/80 text-zinc-200 hover:border-amber-500/60 hover:text-amber-400'
                            }`}
                          >
                            {slot} hs
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
