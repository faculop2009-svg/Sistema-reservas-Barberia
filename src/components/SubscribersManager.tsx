import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  CreditCard,
  Scissors,
  Flame,
  MessageCircle,
  Clock,
  AlertCircle,
  X,
  Sparkles,
  Trash2,
  Edit2,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { Subscriber, MonthlyPlan, BusinessSettings } from '../types.ts';
import { DEFAULT_MONTHLY_PLANS, DEFAULT_SETTINGS } from '../data/defaults.ts';
import {
  loadClientSubscribers,
  saveClientSubscribers,
  addClientSubscriber,
  updateClientSubscriber,
  recordClientSubscriberCut,
  deleteClientSubscriber,
  loadClientMonthlyPlans,
  loadClientSettings,
} from '../utils/clientStorage.ts';

interface SubscribersManagerProps {
  subscribers?: Subscriber[];
  settings?: BusinessSettings;
  plans?: MonthlyPlan[];
  onAddSubscriber?: (sub: Omit<Subscriber, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateSubscriber?: (id: string, updates: Partial<Subscriber>) => Promise<void>;
  onRecordCut?: (id: string, delta?: number) => Promise<void>;
  onDeleteSubscriber?: (id: string) => Promise<void>;
}

export const SubscribersManager: React.FC<SubscribersManagerProps> = ({
  subscribers: initialSubscribers,
  settings: propSettings,
  plans: propPlans,
  onAddSubscriber,
  onUpdateSubscriber,
  onRecordCut,
  onDeleteSubscriber,
}) => {
  const currentSettings = propSettings || loadClientSettings() || DEFAULT_SETTINGS;
  const [subscribers, setSubscribers] = useState<Subscriber[]>(() => {
    if (initialSubscribers && initialSubscribers.length > 0) return initialSubscribers;
    return loadClientSubscribers();
  });
  const [plans, setPlans] = useState<MonthlyPlan[]>(() => {
    if (propPlans && propPlans.length > 0) return propPlans;
    return loadClientMonthlyPlans();
  });

  useEffect(() => {
    if (initialSubscribers && initialSubscribers.length > 0) {
      setSubscribers(initialSubscribers);
    }
  }, [initialSubscribers]);

  useEffect(() => {
    if (propPlans && propPlans.length > 0) {
      setPlans(propPlans);
    }
  }, [propPlans]);

  // Load from API on mount
  useEffect(() => {
    const adminPin = sessionStorage.getItem('barber_admin_pin') || '';
    const headers: Record<string, string> = {};
    if (adminPin) headers['x-admin-pin'] = adminPin;

    fetch('/api/subscribers', { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data)) {
          setSubscribers(data);
          saveClientSubscribers(data);
        }
      })
      .catch(() => {});

    fetch('/api/monthly-plans')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setPlans(data);
        }
      })
      .catch(() => {});
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscriber | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan_corte');
  const [paymentMethod, setPaymentMethod] = useState<'debito_tarjeta' | 'debito_cbu' | 'mercadopago'>('debito_tarjeta');
  const [notes, setNotes] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const filteredSubscribers = subscribers.filter((s) => {
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      s.clientName.toLowerCase().includes(q) ||
      s.clientPhone.includes(q) ||
      s.planName.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const activeCount = subscribers.filter((s) => s.status === 'active').length;
  const totalMonthlyIncome = subscribers
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + (s.monthlyFee || 0), 0);

  const handleOpenNewModal = () => {
    setEditingSub(null);
    setClientName('');
    setClientPhone('');
    setSelectedPlanId('plan_corte');
    setPaymentMethod('debito_tarjeta');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEditModal = (s: Subscriber) => {
    setEditingSub(s);
    setClientName(s.clientName);
    setClientPhone(s.clientPhone);
    setSelectedPlanId(s.planId);
    setPaymentMethod(s.paymentMethod);
    setNotes(s.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      showToast('Por favor completa nombre y teléfono del cliente.');
      return;
    }

    setIsSubmitting(true);
    try {
      const plan = plans.find((p) => p.id === selectedPlanId) || plans[0];
      const today = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStr = `${nextMonth.getFullYear()}-${pad(nextMonth.getMonth() + 1)}-${pad(nextMonth.getDate())}`;

      if (editingSub) {
        if (onUpdateSubscriber) {
          await onUpdateSubscriber(editingSub.id, {
            clientName: clientName.trim(),
            clientPhone: clientPhone.trim(),
            planId: plan.id,
            planName: plan.name,
            monthlyFee: plan.monthlyPrice,
            paymentMethod,
            notes: notes.trim() || undefined,
          });
        } else {
          const adminPin = sessionStorage.getItem('barber_admin_pin') || '';
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (adminPin) headers['x-admin-pin'] = adminPin;
          await fetch(`/api/subscribers/${editingSub.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              clientName: clientName.trim(),
              clientPhone: clientPhone.trim(),
              planId: plan.id,
              planName: plan.name,
              monthlyFee: plan.monthlyPrice,
              paymentMethod,
              notes: notes.trim() || undefined,
            }),
          }).catch(() => null);
          const updated = updateClientSubscriber(editingSub.id, {
            clientName: clientName.trim(),
            clientPhone: clientPhone.trim(),
            planId: plan.id,
            planName: plan.name,
            monthlyFee: plan.monthlyPrice,
            paymentMethod,
            notes: notes.trim() || undefined,
          });
          if (updated) {
            setSubscribers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          }
        }
        showToast('Suscriptor actualizado correctamente');
      } else {
        const newSubData = {
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          planId: plan.id,
          planName: plan.name,
          monthlyFee: plan.monthlyPrice,
          startDate: todayStr,
          nextBillingDate: nextMonthStr,
          status: 'active' as const,
          paymentMethod,
          cutsUsedThisMonth: 0,
          maxCutsPerMonth: 4,
          notes: notes.trim() || undefined,
        };
        if (onAddSubscriber) {
          await onAddSubscriber(newSubData);
        } else {
          const adminPin = sessionStorage.getItem('barber_admin_pin') || '';
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (adminPin) headers['x-admin-pin'] = adminPin;
          const res = await fetch('/api/subscribers', {
            method: 'POST',
            headers,
            body: JSON.stringify(newSubData),
          }).catch(() => null);
          if (res && res.ok) {
            const created = await res.json();
            setSubscribers((prev) => [created, ...prev]);
            saveClientSubscribers([created, ...subscribers]);
          } else {
            const created = addClientSubscriber(newSubData);
            setSubscribers((prev) => [created, ...prev]);
          }
        }
        showToast('Cliente adherido al Club con éxito');
      }
      setShowModal(false);
    } catch (err: any) {
      showToast(err.message || 'Error al procesar la suscripción');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordCut = async (s: Subscriber, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (s.cutsUsedThisMonth >= (s.maxCutsPerMonth || 4)) {
        if (!window.confirm(`El cliente ya consumió los 4 cortes de su cuota mensual. ¿Deseas computar otro de todas formas?`)) {
          return;
        }
      }
      if (onRecordCut) {
        await onRecordCut(s.id, 1);
      } else {
        const adminPin = sessionStorage.getItem('barber_admin_pin') || '';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (adminPin) headers['x-admin-pin'] = adminPin;
        await fetch(`/api/subscribers/${s.id}/record-cut`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ delta: 1 }),
        }).catch(() => null);
        const updated = recordClientSubscriberCut(s.id, 1);
        if (updated) {
          setSubscribers((prev) => prev.map((sub) => (sub.id === updated.id ? updated : sub)));
        }
      }
      showToast(`Corte computado a ${s.clientName}. Total: ${(s.cutsUsedThisMonth || 0) + 1}/4 cortes usados.`);
    } catch (err) {
      showToast('Error al registrar el corte');
    }
  };

  const handleDelete = async (s: Subscriber, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Seguro que deseas dar de baja la suscripción de "${s.clientName}"?`)) {
      try {
        if (onDeleteSubscriber) {
          await onDeleteSubscriber(s.id);
        } else {
          const adminPin = sessionStorage.getItem('barber_admin_pin') || '';
          const headers: Record<string, string> = {};
          if (adminPin) headers['x-admin-pin'] = adminPin;
          await fetch(`/api/subscribers/${s.id}`, {
            method: 'DELETE',
            headers,
          }).catch(() => null);
          deleteClientSubscriber(s.id);
          setSubscribers((prev) => prev.filter((sub) => sub.id !== s.id));
        }
        showToast('Suscripción eliminada');
      } catch (err) {
        showToast('Error al eliminar suscripción');
      }
    }
  };

  const getWhatsAppChatUrl = (s: Subscriber) => {
    const cleanPhone = s.clientPhone.replace(/[^0-9]/g, '');
    const text = `Hola ${s.clientName}! Te escribimos desde ${currentSettings.shopName} por tu suscripción activa al *${s.planName}* (Débito Automático). Queríamos coordinar tu próximo corte del mes. Tenés ${s.maxCutsPerMonth - s.cutsUsedThisMonth} turnos disponibles en tu cuota actual. ¿Qué día y horario te queda cómodo?`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-2">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Gestión de Débito Automático</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-100 tracking-tight">
              Suscriptores Club Planes 4x3
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Clientes que pagan 3 cortes mensuales por débito automático y disfrutan de 4 cortes en el mes (Corte y Corte + Barba).
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenNewModal}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Adherir Nuevo Cliente</span>
          </button>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-800/80">
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
            <span className="text-[11px] text-zinc-400 font-medium">Suscriptores Activos</span>
            <p className="text-lg font-bold text-emerald-400 mt-0.5">{activeCount}</p>
          </div>
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
            <span className="text-[11px] text-zinc-400 font-medium">Ingresos Recurrentes</span>
            <p className="text-lg font-bold text-amber-400 mt-0.5">
              {currentSettings.currencySymbol || '$'}{totalMonthlyIncome.toLocaleString('es-AR')}/mes
            </p>
          </div>
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
            <span className="text-[11px] text-zinc-400 font-medium">Plan Corte (4x3)</span>
            <p className="text-lg font-bold text-zinc-200 mt-0.5">
              {subscribers.filter((s) => s.planId === 'plan_corte').length} clientes
            </p>
          </div>
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
            <span className="text-[11px] text-zinc-400 font-medium">Plan Corte + Barba (4x3 VIP)</span>
            <p className="text-lg font-bold text-zinc-200 mt-0.5">
              {subscribers.filter((s) => s.planId === 'plan_corte_barba').length} clientes
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente o teléfono..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-900 p-1 border border-zinc-800 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              statusFilter === 'all' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'
            }`}
          >
            Todos ({subscribers.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              statusFilter === 'active' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'
            }`}
          >
            Activos ({activeCount})
          </button>
        </div>
      </div>

      {/* Subscribers Cards Grid */}
      {filteredSubscribers.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-10 text-center space-y-3">
          <Users className="w-12 h-12 text-zinc-600 mx-auto" />
          <p className="text-zinc-300 font-semibold text-sm">No hay suscriptores registrados</p>
          <p className="text-zinc-500 text-xs max-w-sm mx-auto">
            {searchQuery
              ? 'No se encontraron resultados para la búsqueda.'
              : 'Agrega a tus primeros clientes para llevar el control de los 4 cortes mensuales pagados con débito automático.'}
          </p>
          <button
            onClick={handleOpenNewModal}
            className="mt-2 px-4 py-2 bg-amber-500 text-zinc-950 text-xs font-bold rounded-xl"
          >
            + Adherir primer cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredSubscribers.map((s) => {
            const isCombo = s.planId === 'plan_corte_barba';
            const remaining = Math.max(0, (s.maxCutsPerMonth || 4) - (s.cutsUsedThisMonth || 0));

            return (
              <div
                key={s.id}
                className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4 hover:border-zinc-700 transition-all shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        isCombo
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                      }`}
                    >
                      {isCombo ? <Flame className="w-5 h-5" /> : <Scissors className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                        <span>{s.clientName}</span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                            s.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {s.status === 'active' ? 'Débito Activo' : 'Pausado'}
                        </span>
                      </h4>
                      <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-zinc-500" />
                        <span>{s.clientPhone}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-amber-400 block">
                      {currentSettings.currencySymbol || '$'}{s.monthlyFee.toLocaleString('es-AR')}
                    </span>
                    <span className="text-[10px] text-zinc-400 uppercase font-medium">
                      {s.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Plan Badge & Consumption Tracker */}
                <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-200">{s.planName}</span>
                    <span className="text-amber-400 font-bold">
                      {s.cutsUsedThisMonth} de {s.maxCutsPerMonth} cortes usados
                    </span>
                  </div>

                  {/* Visual 4-slot progress boxes */}
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((slotNumber) => {
                      const isUsed = slotNumber <= s.cutsUsedThisMonth;
                      const isFreeBonus = slotNumber === 4;

                      return (
                        <div
                          key={slotNumber}
                          className={`py-2 px-1 rounded-lg text-center border text-[11px] font-bold transition-all ${
                            isUsed
                              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                              : isFreeBonus
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}
                        >
                          <span className="block">Corte {slotNumber}</span>
                          <span className="text-[10px] font-normal opacity-90 block">
                            {isUsed ? '✓ Realizado' : isFreeBonus ? '🎁 Bonificado' : 'Disponible'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                    <span>Inicio: {s.startDate}</span>
                    <span>Próximo cobro: {s.nextBillingDate}</span>
                  </div>
                </div>

                {s.notes && (
                  <p className="text-[11px] text-zinc-400 bg-zinc-950/50 p-2 rounded-lg italic">
                    Nota: {s.notes}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/60">
                  <button
                    type="button"
                    onClick={(e) => handleRecordCut(s, e)}
                    className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Registrar Corte Usado</span>
                  </button>

                  <a
                    href={getWhatsAppChatUrl(s)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-colors"
                    title="Contactar al suscriptor por WhatsApp para coordinar turno"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(s)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                    title="Editar suscriptor"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(s, e)}
                    className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-400 transition-colors"
                    title="Dar de baja"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Subscriber Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-500" />
                <span>{editingSub ? 'Editar Suscriptor' : 'Adherir Cliente al Club 4x3'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej. Lucas Fernández"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="Ej. +54 9 11 5555-1234"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Plan Mensual Seleccionado *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {plans.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedPlanId === p.id
                          ? 'border-amber-500 bg-amber-500/10'
                          : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-xs font-bold text-zinc-100 block">{p.name}</span>
                      <span className="text-[11px] text-amber-400 font-bold block mt-0.5">
                        {currentSettings.currencySymbol || '$'}{p.monthlyPrice.toLocaleString('es-AR')}/mes
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">
                        4 servicios en el mes
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Medio de Débito Automático *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 focus:border-amber-500"
                >
                  <option value="debito_tarjeta">Tarjeta de Débito / Crédito (Visa / Mastercard)</option>
                  <option value="debito_cbu">CBU / Débito Bancario Directo</option>
                  <option value="mercadopago">Mercado Pago Débito Automático</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Notas Internas (Opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej. Prefiere turnos los viernes por la tarde"
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingSub ? 'Guardar Cambios' : 'Confirmar Adhesión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-zinc-900 border border-amber-500/40 text-zinc-100 text-xs font-semibold shadow-xl flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};
