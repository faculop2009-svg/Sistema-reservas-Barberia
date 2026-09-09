import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Coffee,
  User,
  Scissors,
  Check,
  Ban,
  Filter,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Barber, BarberService, ScheduleSlot, CalendarBlock } from '../types.ts';

interface VisualCalendarProps {
  mode?: 'client' | 'admin';
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  selectedTime?: string;
  onSelectTime?: (time: string) => void;
  selectedBarberId?: string;
  onSelectBarberId?: (barberId: string) => void;
  selectedServiceId?: string;
  barbers: Barber[];
  services?: BarberService[];
  onSlotModified?: () => void;
}

export const VisualCalendar: React.FC<VisualCalendarProps> = ({
  mode = 'client',
  selectedDate,
  onSelectDate,
  selectedTime,
  onSelectTime,
  selectedBarberId = 'barber-any',
  onSelectBarberId,
  selectedServiceId = 'corte',
  barbers,
  services = [],
  onSlotModified,
}) => {
  // Parse current viewing month based on selectedDate or today
  const initialDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth()); // 0-indexed

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsData, setSlotsData] = useState<{
    date: string;
    isDayBlocked: boolean;
    dayBlockReason?: string;
    slots: ScheduleSlot[];
  } | null>(null);

  // Admin block modal
  const [blockModalSlot, setBlockModalSlot] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('Bloqueo administrativo');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch slots for current selected date
  const fetchSlots = useCallback(async (dateStr: string, barberIdStr: string, serviceIdStr: string) => {
    setLoadingSlots(true);
    try {
      const res = await fetch(
        `/api/slots?date=${dateStr}&barberId=${barberIdStr}&serviceId=${serviceIdStr}`
      );
      if (res.ok) {
        const data = await res.json();
        setSlotsData(data);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate, selectedBarberId, selectedServiceId);
    }
  }, [selectedDate, selectedBarberId, selectedServiceId, fetchSlots]);

  // Format month and year label in Spanish
  const monthName = new Date(currentYear, currentMonth, 1).toLocaleDateString('es-ES', {
    month: 'long',
  });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Calendar Math
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  // Convert to Monday = 0, ..., Sunday = 6
  const startOffset = (firstDayOfWeek + 6) % 7;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleGoToday = () => {
    const t = new Date();
    setCurrentYear(t.getFullYear());
    setCurrentMonth(t.getMonth());
    onSelectDate(todayStr);
  };

  const formatNaturalDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dObj = new Date(y, m - 1, d);
      return dObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Admin Actions
  const handleToggleDayBlock = async () => {
    if (!selectedDate) return;
    const isCurrentlyBlocked = slotsData?.isDayBlocked;
    const promptReason = isCurrentlyBlocked
      ? undefined
      : window.prompt('Motivo del cierre de día:', 'Feriado / Mantenimiento general') || 'Día no laboral';

    if (!isCurrentlyBlocked && promptReason === null) return; // cancelled

    setActionLoading(true);
    try {
      const res = await fetch('/api/calendar/toggle-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          barberId: selectedBarberId === 'barber-any' ? 'all' : selectedBarberId,
          reason: promptReason,
        }),
      });
      if (res.ok) {
        await fetchSlots(selectedDate, selectedBarberId, selectedServiceId);
        onSlotModified?.();
      }
    } catch (err) {
      console.error('Error toggling day block:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSlotBlock = async (time: string, isCurrentlyBlocked: boolean) => {
    if (!selectedDate) return;

    let reason = 'Bloqueado por administración';
    if (!isCurrentlyBlocked) {
      const inputReason = window.prompt(
        `Motivo de bloqueo para las ${time}:`,
        'Turno reservado telefónicamente / Descanso'
      );
      if (inputReason === null) return;
      reason = inputReason.trim() || reason;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/calendar/toggle-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          time,
          barberId: selectedBarberId === 'barber-any' ? 'all' : selectedBarberId,
          reason,
        }),
      });
      if (res.ok) {
        await fetchSlots(selectedDate, selectedBarberId, selectedServiceId);
        onSlotModified?.();
      }
    } catch (err) {
      console.error('Error toggling slot block:', err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visual Calendar Main Box */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Calendar Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-zinc-100 flex items-center gap-2">
                <span>{capitalizedMonth}</span>
                <span className="text-amber-400 font-semibold">{currentYear}</span>
              </h3>
              <p className="text-xs text-zinc-400">
                {mode === 'admin'
                  ? 'Gestiona la disponibilidad en tiempo real y bloquea franjas horarias'
                  : 'Selecciona una fecha disponible para ver los turnos'}
              </p>
            </div>
          </div>

          {/* Month Navigation Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={handleGoToday}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
            >
              Hoy
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Barber Filter Selector (Both in Client & Admin mode) */}
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-950/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-300 font-medium">
            <User className="w-4 h-4 text-amber-500" />
            <span>Peluquero:</span>
            <select
              value={selectedBarberId}
              onChange={(e) => onSelectBarberId?.(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-2.5 py-1.5 font-semibold focus:border-amber-500 outline-none"
            >
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.role || 'Peluquero'})
                </option>
              ))}
            </select>
          </div>

          {mode === 'admin' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={actionLoading || !selectedDate}
                onClick={handleToggleDayBlock}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all border ${
                  slotsData?.isDayBlocked
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/40 hover:bg-rose-500/20'
                }`}
              >
                {slotsData?.isDayBlocked ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Habilitar Día Completo</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Bloquear Día Completo</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Month Grid */}
        <div className="p-4 sm:p-5">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            <div>Lun</div>
            <div>Mar</div>
            <div>Mié</div>
            <div>Jue</div>
            <div>Vie</div>
            <div>Sáb</div>
            <div className="text-rose-400/80">Dom</div>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty slots for month start offset */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="h-14 sm:h-16 rounded-xl bg-zinc-950/30 border border-zinc-900/40 opacity-30"
              />
            ))}

            {/* Actual Days of Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
                dayNum
              ).padStart(2, '0')}`;

              const dObj = new Date(currentYear, currentMonth, dayNum);
              const dayOfWeek = dObj.getDay(); // 0 is Sunday
              const isSunday = dayOfWeek === 0;

              const isPast = dateStr < todayStr;
              const isToday = dateStr === todayStr;
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  type="button"
                  key={dateStr}
                  onClick={() => onSelectDate(dateStr)}
                  className={`h-14 sm:h-16 rounded-xl p-1.5 sm:p-2 text-left flex flex-col justify-between transition-all relative border group ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20 scale-[1.02] z-10'
                      : isPast
                      ? 'bg-zinc-950/40 border-zinc-800/40 text-zinc-600 hover:text-zinc-400'
                      : isSunday
                      ? 'bg-zinc-950/60 border-zinc-800/60 text-zinc-500 hover:border-zinc-700'
                      : 'bg-zinc-800/40 hover:bg-zinc-800/80 border-zinc-800 text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs sm:text-sm font-bold ${
                        isSelected
                          ? 'text-zinc-950'
                          : isToday
                          ? 'text-amber-400'
                          : isSunday
                          ? 'text-rose-400/80'
                          : 'text-zinc-200'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {isToday && (
                      <span
                        className={`text-[9px] px-1 rounded font-bold uppercase ${
                          isSelected ? 'bg-zinc-950 text-amber-400' : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        Hoy
                      </span>
                    )}
                  </div>

                  {/* Visual Status Indicator */}
                  <div className="flex items-center gap-1 text-[10px]">
                    {isSunday ? (
                      <span className={`text-[10px] ${isSelected ? 'text-zinc-900' : 'text-zinc-500'}`}>
                        Cerrado
                      </span>
                    ) : isPast ? (
                      <span className="text-[10px] text-zinc-600">Pasado</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isSelected ? 'bg-zinc-950' : 'bg-emerald-400'
                          }`}
                        />
                        <span
                          className={`hidden sm:inline text-[10px] font-medium ${
                            isSelected ? 'text-zinc-950' : 'text-emerald-400'
                          }`}
                        >
                          Turnos
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-950/40 flex flex-wrap items-center gap-4 text-[11px] text-zinc-400">
          <span className="font-semibold text-zinc-300">Referencias:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Disponible</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Seleccionado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Reservado / Ocupado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Bloqueado por Admin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
            <span>Cerrado / Almuerzo</span>
          </div>
        </div>
      </div>

      {/* Selected Day Slots Visual Board */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div>
            <div className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Horarios y Turnos del Día
            </div>
            <h4 className="text-base sm:text-lg font-black text-zinc-100 capitalize">
              {formatNaturalDate(selectedDate)}
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchSlots(selectedDate, selectedBarberId, selectedServiceId)}
              className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-700 transition-colors"
              title="Actualizar disponibilidad"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSlots ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* If day is completely blocked */}
        {slotsData?.isDayBlocked && (
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Ban className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div>
                <strong className="block text-rose-200">Día Cerrado o Bloqueado</strong>
                <span>{slotsData.dayBlockReason || 'No se admiten reservas en este día.'}</span>
              </div>
            </div>
            {mode === 'admin' && (
              <button
                type="button"
                onClick={handleToggleDayBlock}
                className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-zinc-950 font-bold text-xs"
              >
                Habilitar Día
              </button>
            )}
          </div>
        )}

        {/* Loading indicator */}
        {loadingSlots ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs">Consultando disponibilidad en tiempo real...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Slots Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
              {slotsData?.slots.map((slotItem) => {
                const isChosen = selectedTime === slotItem.slot;
                const isFree = slotItem.status === 'free' && slotItem.available;
                const isBooked = slotItem.status === 'booked';
                const isBlocked = slotItem.status === 'blocked';
                const isLunch = slotItem.status === 'lunch';
                const isPast = slotItem.status === 'past';

                return (
                  <div
                    key={slotItem.slot}
                    id={`slot-card-${slotItem.slot}`}
                    className={`rounded-xl p-3 border transition-all flex flex-col justify-between relative ${
                      isChosen
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 font-bold shadow-lg shadow-amber-500/20 scale-[1.02]'
                        : isFree
                        ? 'bg-zinc-950/80 border-zinc-700/60 hover:border-amber-500/80 text-zinc-100 hover:bg-zinc-800'
                        : isBooked
                        ? 'bg-blue-950/20 border-blue-800/40 text-blue-200'
                        : isBlocked
                        ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                        : 'bg-zinc-950/40 border-zinc-800/40 text-zinc-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black tracking-tight">{slotItem.slot}</span>

                      {/* Status Icon */}
                      {isChosen ? (
                        <Check className="w-4 h-4 text-zinc-950 stroke-[3]" />
                      ) : isFree ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      ) : isBooked ? (
                        <User className="w-3.5 h-3.5 text-blue-400" />
                      ) : isBlocked ? (
                        <Lock className="w-3.5 h-3.5 text-rose-400" />
                      ) : isLunch ? (
                        <Coffee className="w-3.5 h-3.5 text-zinc-500" />
                      ) : null}
                    </div>

                    {/* Metadata / Details */}
                    <div className="mt-2 text-[10px] truncate">
                      {isChosen ? (
                        <span className="text-zinc-900 font-bold uppercase tracking-wider">
                          Seleccionado
                        </span>
                      ) : isFree ? (
                        <span className="text-emerald-400 font-medium">Disponible</span>
                      ) : isBooked ? (
                        <div className="space-y-0.5">
                          <span className="text-blue-300 font-semibold truncate block">
                            {slotItem.appointment?.clientName || 'Ocupado'}
                          </span>
                          {slotItem.appointment?.serviceName && (
                            <span className="text-blue-400/80 text-[9px] truncate block">
                              {slotItem.appointment.serviceName}
                            </span>
                          )}
                        </div>
                      ) : isBlocked ? (
                        <span className="text-rose-400 truncate block" title={slotItem.reason}>
                          {slotItem.reason || 'Bloqueado'}
                        </span>
                      ) : isLunch ? (
                        <span className="text-zinc-500">Receso almuerzo</span>
                      ) : (
                        <span className="text-zinc-600">No disponible</span>
                      )}
                    </div>

                    {/* Interaction Button */}
                    <div className="mt-2.5 pt-2 border-t border-zinc-800/40">
                      {mode === 'client' ? (
                        isFree ? (
                          <button
                            type="button"
                            onClick={() => onSelectTime?.(slotItem.slot)}
                            className="w-full py-1 text-center rounded text-[11px] font-bold bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-zinc-950 transition-colors"
                          >
                            Elegir turno
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-600 block text-center py-0.5">
                            No disponible
                          </span>
                        )
                      ) : (
                        /* Admin Mode: Can toggle block/unblock */
                        <div className="flex items-center gap-1">
                          {isBlocked ? (
                            <button
                              type="button"
                              onClick={() => handleToggleSlotBlock(slotItem.slot, true)}
                              className="w-full py-1 px-1 text-center rounded text-[10px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-800/50 transition-colors flex items-center justify-center gap-1"
                              title="Desbloquear horario"
                            >
                              <Unlock className="w-3 h-3" />
                              <span>Habilitar</span>
                            </button>
                          ) : isFree ? (
                            <button
                              type="button"
                              onClick={() => handleToggleSlotBlock(slotItem.slot, false)}
                              className="w-full py-1 px-1 text-center rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 hover:bg-rose-950/40 hover:text-rose-400 border border-zinc-700 hover:border-rose-800 transition-colors flex items-center justify-center gap-1"
                              title="Bloquear este horario"
                            >
                              <Lock className="w-3 h-3" />
                              <span>Bloquear</span>
                            </button>
                          ) : isBooked ? (
                            <span className="text-[10px] text-blue-400 block text-center w-full py-0.5 font-medium">
                              Cód: {slotItem.appointment?.code || 'Reservado'}
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-600 block text-center w-full py-0.5">
                              Pausa
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
