import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Scissors,
  CheckCircle2,
  Calendar,
  CreditCard,
  Percent,
  Flame,
  Info,
  Edit3,
  X,
  Save,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { MonthlyPlan, BusinessSettings } from '../types.ts';
import { DEFAULT_MONTHLY_PLANS, DEFAULT_SETTINGS } from '../data/defaults.ts';
import {
  loadClientMonthlyPlans,
  saveClientMonthlyPlans,
  updateClientMonthlyPlan,
  loadClientSettings,
} from '../utils/clientStorage.ts';

interface MonthlyPlansSectionProps {
  settings?: BusinessSettings;
  plans?: MonthlyPlan[];
  isAdmin?: boolean;
  onSelectPlanAndBook?: (serviceId: string) => void;
  onRequestSubscribe?: (plan: MonthlyPlan) => void;
  onPlansChange?: (plans: MonthlyPlan[]) => void;
}

export const MonthlyPlansSection: React.FC<MonthlyPlansSectionProps> = ({
  settings,
  plans,
  isAdmin = false,
  onSelectPlanAndBook,
  onRequestSubscribe,
  onPlansChange,
}) => {
  const currentSettings = settings || loadClientSettings() || DEFAULT_SETTINGS;
  const [currentPlans, setCurrentPlans] = useState<MonthlyPlan[]>(() => {
    if (plans && plans.length > 0) return plans;
    return loadClientMonthlyPlans();
  });

  const [editingPlan, setEditingPlan] = useState<MonthlyPlan | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Modal form states
  const [formName, setFormName] = useState('');
  const [formMonthlyPrice, setFormMonthlyPrice] = useState<number>(0);
  const [formSingleServicePrice, setFormSingleServicePrice] = useState<number>(0);
  const [formCutsPaid, setFormCutsPaid] = useState<number>(3);
  const [formCutsPerMonth, setFormCutsPerMonth] = useState<number>(4);
  const [formSavingsAmount, setFormSavingsAmount] = useState<number>(0);
  const [formBadge, setFormBadge] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formBenefits, setFormBenefits] = useState<string[]>([]);
  const [newBenefitInput, setNewBenefitInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync props if provided
  useEffect(() => {
    if (plans && plans.length > 0) {
      setCurrentPlans(plans);
    } else {
      const stored = loadClientMonthlyPlans();
      setCurrentPlans(stored);
    }
  }, [plans]);

  // Fetch from server if available
  useEffect(() => {
    fetch('/api/monthly-plans')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCurrentPlans(data);
          saveClientMonthlyPlans(data);
          if (onPlansChange) onPlansChange(data);
        }
      })
      .catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenEditModal = (plan: MonthlyPlan) => {
    setEditingPlan(plan);
    setFormName(plan.name);
    setFormMonthlyPrice(plan.monthlyPrice);
    setFormSingleServicePrice(plan.singleServicePrice);
    setFormCutsPaid(plan.cutsPaid || 3);
    setFormCutsPerMonth(plan.cutsPerMonth || 4);
    setFormSavingsAmount(plan.savingsAmount || (plan.singleServicePrice * ((plan.cutsPerMonth || 4) - (plan.cutsPaid || 3))));
    setFormBadge(plan.badge || '4x3 Mensual');
    setFormDescription(plan.description);
    setFormBenefits([...(plan.benefits || [])]);
    setNewBenefitInput('');
  };

  const handleRecalculate4x3 = () => {
    const single = Number(formSingleServicePrice) || 0;
    const paid = Number(formCutsPaid) || 3;
    const total = Number(formCutsPerMonth) || 4;
    const monthly = single * paid;
    const savings = single * Math.max(0, total - paid);
    setFormMonthlyPrice(monthly);
    setFormSavingsAmount(savings);
    showToast(`Recalculado: $${monthly.toLocaleString('es-AR')}/mes (Ahorro $${savings.toLocaleString('es-AR')})`);
  };

  const handleAddBenefit = () => {
    if (!newBenefitInput.trim()) return;
    setFormBenefits([...formBenefits, newBenefitInput.trim()]);
    setNewBenefitInput('');
  };

  const handleRemoveBenefit = (index: number) => {
    setFormBenefits(formBenefits.filter((_, i) => i !== index));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    if (!formMonthlyPrice || formMonthlyPrice <= 0) {
      showToast('Por favor ingresa un precio mensual válido mayor a 0');
      return;
    }

    setIsSaving(true);
    try {
      const updates: Partial<MonthlyPlan> = {
        name: formName.trim() || editingPlan.name,
        monthlyPrice: Number(formMonthlyPrice),
        singleServicePrice: Number(formSingleServicePrice) || Math.round(Number(formMonthlyPrice) / (formCutsPaid || 3)),
        cutsPaid: Number(formCutsPaid) || 3,
        cutsPerMonth: Number(formCutsPerMonth) || 4,
        savingsAmount: Number(formSavingsAmount) || 0,
        badge: formBadge.trim() || '4x3 Mensual',
        description: formDescription.trim() || editingPlan.description,
        benefits: formBenefits.length > 0 ? formBenefits : editingPlan.benefits,
      };

      // 1. Update localStorage
      updateClientMonthlyPlan(editingPlan.id, updates);

      // 2. Try updating server
      try {
        const pin = currentSettings.adminPin || '1234';
        await fetch(`/api/monthly-plans/${editingPlan.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-pin': pin,
          },
          body: JSON.stringify(updates),
        });
      } catch (err) {
        console.warn('Server sync failed, saved locally:', err);
      }

      // 3. Update local state
      const updatedList = currentPlans.map((p) => (p.id === editingPlan.id ? { ...p, ...updates } : p));
      setCurrentPlans(updatedList);
      if (onPlansChange) onPlansChange(updatedList);

      setEditingPlan(null);
      showToast(`¡Precios de "${formName || editingPlan.name}" actualizados con éxito!`);
    } catch (err: any) {
      showToast(err.message || 'Error al guardar los cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const getWhatsAppSubscribeUrl = (plan: MonthlyPlan) => {
    const cleanPhone = (currentSettings.phone || '').replace(/[^0-9]/g, '');
    const text = `💈 *Solicitud de Suscripción a Plan Mensual 4x3 en ${currentSettings.shopName}*\n\nHola, quiero adherirme al *${plan.name}* con *Débito Automático*:\n\n✂️ *Beneficio:* 4 servicios al mes pagando solo 3\n💵 *Cuota mensual:* ${currentSettings.currencySymbol || '$'}${plan.monthlyPrice.toLocaleString('es-AR')}/mes\n🎁 *Ahorro:* ${currentSettings.currencySymbol || '$'}${plan.savingsAmount.toLocaleString('es-AR')} de regalo todos los meses\n\n¿Me indican cómo asociar mi tarjeta o CBU para el débito automático? ¡Muchas gracias!`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-zinc-950 px-4 py-3 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-5 h-5" />
          <span>{toast}</span>
        </div>
      )}

      {/* Admin Notice Bar */}
      {isAdmin && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-200">Panel de Configuración de Planes Mensuales</p>
              <p className="text-[11px] text-zinc-400">
                Puedes editar el precio mensual, precio unitario de referencia y beneficios de cada combo 4x3.
              </p>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 whitespace-nowrap">
            Modo Administrador Activo
          </span>
        </div>
      )}

      {/* Hero Banner for Monthly Club */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-950 border border-amber-500/30 p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>Club Barbería • Planes Mensuales 4x3</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-extrabold text-zinc-100 tracking-tight">
            Pagás 3 cortes con débito automático y <span className="text-amber-400">te hacés 4 cortes en el mes</span>
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Mantén tu estilo impecable todas las semanas. Con nuestros planes mensuales con débito automático bancario o tarjeta, recibes <strong>4 servicios al precio de 3</strong>. ¡1 servicio completamente bonificado todos los meses!
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 text-zinc-200">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Débito automático mensual</span>
            </span>
            <span className="flex items-center gap-1.5 text-zinc-200">
              <Percent className="w-4 h-4 text-emerald-400" />
              <span>25% de ahorro directo</span>
            </span>
            <span className="flex items-center gap-1.5 text-zinc-200">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Sin contratos • Pausá cuando quieras</span>
            </span>
          </div>
        </div>
      </div>

      {/* The 2 Plans: CORTE & CORTE Y BARBA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {currentPlans.map((plan) => {
          const isCombo = plan.serviceTarget === 'corte_barba';
          const regularTotal = (plan.singleServicePrice || 0) * (plan.cutsPerMonth || 4);

          return (
            <div
              key={plan.id}
              id={`plan-card-${plan.id}`}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between border transition-all duration-300 shadow-lg hover:shadow-xl ${
                isCombo
                  ? 'bg-gradient-to-b from-zinc-900 to-zinc-950 border-amber-500/50 ring-1 ring-amber-500/30'
                  : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Header & Badges */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                        isCombo
                          ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                          : 'bg-zinc-800 text-amber-400'
                      }`}
                    >
                      {isCombo ? <Flame className="w-5 h-5" /> : <Scissors className="w-5 h-5" />}
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                        {plan.badge || '4x3 Mensual'}
                      </span>
                      <h3 className="text-lg sm:text-xl font-extrabold text-zinc-100">
                        {plan.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <button
                        type="button"
                        id={`btn-edit-plan-${plan.id}`}
                        onClick={() => handleOpenEditModal(plan)}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                        title="Modificar precio del plan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Editar Precio</span>
                      </button>
                    )}
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold whitespace-nowrap">
                      1 {isCombo ? 'Combo' : 'Corte'} GRATIS
                    </span>
                  </div>
                </div>

                {/* Pricing Box */}
                <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 my-3 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">
                        {currentSettings.currencySymbol || '$'}{plan.monthlyPrice.toLocaleString('es-AR')}
                      </span>
                      <span className="text-xs text-zinc-400 font-medium ml-1">/ mes</span>
                    </div>
                    <div className="text-right">
                      {regularTotal > 0 && (
                        <span className="text-xs text-zinc-500 line-through block">
                          {currentSettings.currencySymbol || '$'}{regularTotal.toLocaleString('es-AR')}
                        </span>
                      )}
                      <span className="text-[11px] text-emerald-400 font-bold">
                        Ahorrás {currentSettings.currencySymbol || '$'}{(plan.savingsAmount || 0).toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-300 font-medium pt-1 border-t border-zinc-800/60 flex items-center justify-between">
                    <span>Pagas: <strong>{plan.cutsPaid || 3} servicios</strong> (${((plan.singleServicePrice || 0) * (plan.cutsPaid || 3)).toLocaleString('es-AR')})</span>
                    <span className="text-amber-400 font-bold">Recibes: <strong>{plan.cutsPerMonth || 4} al mes</strong></span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  {plan.description}
                </p>

                {/* Benefits Checklist */}
                <div className="space-y-2 mb-6">
                  <p className="text-xs font-bold text-zinc-300 uppercase tracking-wider text-[11px]">
                    Beneficios incluidos:
                  </p>
                  {(plan.benefits || []).map((benefit, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <a
                  href={getWhatsAppSubscribeUrl(plan)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                    isCombo
                      ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20'
                      : 'bg-zinc-100 hover:bg-white text-zinc-950'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Adherirme con Débito Automático</span>
                </a>

                {onSelectPlanAndBook && (
                  <button
                    type="button"
                    onClick={() => onSelectPlanAndBook(plan.serviceTarget)}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-zinc-100 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Agendar mi turno individual ({plan.targetServiceName})</span>
                  </button>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(plan)}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Configurar valores y precio de este combo</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* How Automatic Debit Works Banner */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-3">
        <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400" />
          <span>¿Cómo funciona el Plan Mensual con Débito Automático?</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-3.5 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold flex items-center justify-center">
              1
            </span>
            <p className="text-xs font-bold text-zinc-200">Adhesión Simple</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Te contactamos por WhatsApp o en la barbería para adherir tu tarjeta de débito, crédito o CBU bancario.
            </p>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-3.5 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold flex items-center justify-center">
              2
            </span>
            <p className="text-xs font-bold text-zinc-200">Cobro 3x4 Automático</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Se debita el valor de 3 cortes el día 1 o fecha pactada y se acreditan 4 cortes para que los disfrutes en los 30 días.
            </p>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-3.5 space-y-1.5">
            <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold flex items-center justify-center">
              3
            </span>
            <p className="text-xs font-bold text-zinc-200">Turnos Semanales Libres</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Reservas tus turnos desde la web con prioridad sin pagar nada en el local. ¡Tu cuarto corte es 100% de regalo!
            </p>
          </div>
        </div>
      </div>

      {/* EDIT MODAL FOR MONTHLY PLAN PRICES */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-3xl w-full max-w-xl p-6 sm:p-7 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">Editar Precios del Combo Mensual</h3>
                  <p className="text-xs text-zinc-400">{editingPlan.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              {/* Plan Name & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Nombre del Plan</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                    placeholder="Ej: Plan Mensual Club Corte"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Etiqueta / Badge</label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                    placeholder="Ej: 4x3 Mensual o VIP 4x3"
                  />
                </div>
              </div>

              {/* Price Breakdown Block */}
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4" />
                    Valores de Facturación y Débito
                  </span>
                  <button
                    type="button"
                    onClick={handleRecalculate4x3}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1 transition-colors"
                    title="Calcular precio mensual = precio unitario x 3 cortes"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Recalcular 4x3 Automático</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Precio de la Cuota Mensual ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-amber-400">
                        {currentSettings.currencySymbol || '$'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={formMonthlyPrice || ''}
                        onChange={(e) => setFormMonthlyPrice(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-amber-500/50 rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-bold text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        placeholder="27000"
                        required
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      Monto que se debitará cada 30 días
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1">
                      Precio Unitario del Servicio ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-zinc-400">
                        {currentSettings.currencySymbol || '$'}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={formSingleServicePrice || ''}
                        onChange={(e) => setFormSingleServicePrice(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-semibold text-zinc-100 focus:border-amber-500 focus:outline-none"
                        placeholder="9000"
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      Valor de 1 corte individual sin plan
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-800/80">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">Cortes que abona</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formCutsPaid}
                      onChange={(e) => setFormCutsPaid(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 text-center focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">Cortes que recibe</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formCutsPerMonth}
                      onChange={(e) => setFormCutsPerMonth(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-amber-400 font-bold text-center focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">Ahorro ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={formSavingsAmount || ''}
                      onChange={(e) => setFormSavingsAmount(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-emerald-400 font-bold text-center focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Descripción explicativa</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none"
                  placeholder="Detalles sobre el plan mensual..."
                />
              </div>

              {/* Benefits Checklist */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Beneficios incluidos ({formBenefits.length})
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {formBenefits.map((b, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 bg-zinc-950 border border-zinc-800/80 rounded-xl px-3 py-1.5 text-xs text-zinc-300">
                      <span className="flex-1 truncate">{b}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(idx)}
                        className="text-zinc-500 hover:text-red-400 p-0.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newBenefitInput}
                    onChange={(e) => setNewBenefitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBenefit();
                      }
                    }}
                    placeholder="Agregar nuevo beneficio..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Nuevos Precios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
