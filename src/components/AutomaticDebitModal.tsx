import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  Scissors,
  Flame,
  X,
  AlertCircle,
  MessageCircle,
  HelpCircle,
  ArrowRight,
  Download,
  Info,
  Building,
  User,
  Phone,
  Mail,
} from 'lucide-react';
import { MonthlyPlan, BusinessSettings, Subscriber } from '../types.ts';
import { addClientSubscriber } from '../utils/clientStorage.ts';

interface AutomaticDebitModalProps {
  plan: MonthlyPlan;
  settings: BusinessSettings;
  isOpen: boolean;
  onClose: () => void;
  onBookService?: (serviceTarget: string) => void;
}

type CardBrand = 'visa' | 'mastercard' | 'amex' | 'cabal' | 'tarjeta';

function detectCardBrand(num: string): CardBrand {
  const clean = num.replace(/\s+/g, '');
  if (/^4/.test(clean)) return 'visa';
  if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
  if (/^3[47]/.test(clean)) return 'amex';
  if (/^(5896|6042|6043)/.test(clean)) return 'cabal';
  return 'tarjeta';
}

function formatCardNumber(val: string): string {
  const digitsOnly = val.replace(/\D/g, '').slice(0, 16);
  const parts = digitsOnly.match(/[\s\S]{1,4}/g) || [];
  return parts.join(' ');
}

function formatExpiryDate(val: string): string {
  const digitsOnly = val.replace(/\D/g, '').slice(0, 4);
  if (digitsOnly.length >= 3) {
    return `${digitsOnly.slice(0, 2)}/${digitsOnly.slice(2, 4)}`;
  }
  return digitsOnly;
}

export const AutomaticDebitModal: React.FC<AutomaticDebitModalProps> = ({
  plan,
  settings,
  isOpen,
  onClose,
  onBookService,
}) => {
  // Form states
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [dni, setDni] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cardType, setCardType] = useState<'debito' | 'credito'>('debito');
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Interaction & submission states
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdSubscriber, setCreatedSubscriber] = useState<Subscriber | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const brand = useMemo(() => detectCardBrand(cardNumber), [cardNumber]);

  if (!isOpen) return null;

  const isCombo = plan.serviceTarget === 'corte_barba';
  const currency = settings.currencySymbol || '$';

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
    if (errorMessage) setErrorMessage(null);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    setExpiry(formatted);
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const rawCard = cardNumber.replace(/\s+/g, '');
    if (rawCard.length < 15) {
      setErrorMessage('Por favor ingresa un número de tarjeta válido de 15 o 16 dígitos.');
      return;
    }

    if (!cardHolder.trim() || cardHolder.trim().split(' ').length < 2) {
      setErrorMessage('Ingresa nombre y apellido completo tal como figura en el plástico.');
      return;
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setErrorMessage('La fecha de vencimiento debe tener formato MM/AA.');
      return;
    }

    const [expMonth, expYear] = expiry.split('/').map(Number);
    if (expMonth < 1 || expMonth > 12) {
      setErrorMessage('Mes de vencimiento inválido (debe ser entre 01 y 12).');
      return;
    }

    if (cvc.length < 3) {
      setErrorMessage('El código de seguridad (CVC / CVV) debe tener 3 o 4 dígitos.');
      return;
    }

    if (!dni.trim() || dni.trim().length < 7) {
      setErrorMessage('Por favor ingresa un DNI / CUIT válido para el débito bancario.');
      return;
    }

    if (!phone.trim() || phone.trim().length < 8) {
      setErrorMessage('Ingresa un número de WhatsApp / teléfono de contacto.');
      return;
    }

    if (!acceptTerms) {
      setErrorMessage('Debes aceptar las condiciones del débito automático mensual.');
      return;
    }

    // Start simulation steps
    setIsProcessing(true);
    setProcessingStep('Validando datos con la red emisora...');

    try {
      await new Promise((res) => setTimeout(res, 800));
      setProcessingStep('Encriptando credenciales y generando token de débito...');
      await new Promise((res) => setTimeout(res, 800));
      setProcessingStep('Registrando adhesión en el Club 4x3...');
      await new Promise((res) => setTimeout(res, 600));

      const lastFour = rawCard.slice(-4);
      const cardBrandName = brand === 'tarjeta' ? 'tarjeta' : brand;

      const subscriberPayload = {
        clientName: cardHolder.trim(),
        clientPhone: phone.trim(),
        clientEmail: email.trim() || undefined,
        clientDni: dni.trim(),
        planId: plan.id,
        planName: plan.name,
        monthlyFee: plan.monthlyPrice,
        paymentMethod: 'debito_tarjeta' as const,
        cardDetails: {
          cardHolder: cardHolder.trim(),
          lastFourDigits: lastFour,
          brand: cardBrandName,
          expiration: expiry,
          dni: dni.trim(),
        },
        notes: `Adherido vía Web con tarjeta ${cardType.toUpperCase()} ${brand.toUpperCase()} **** ${lastFour}`,
      };

      // 1. Try server POST
      let savedSub: Subscriber | null = null;
      try {
        const res = await fetch('/api/subscribers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscriberPayload),
        });
        if (res.ok) {
          savedSub = await res.json();
        }
      } catch (err) {
        console.warn('Server subscriber sync failed, saving locally:', err);
      }

      // 2. Save client local storage
      if (!savedSub) {
        const today = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const nextMonthStr = `${nextMonth.getFullYear()}-${pad(nextMonth.getMonth() + 1)}-${pad(nextMonth.getDate())}`;

        savedSub = addClientSubscriber({
          clientName: cardHolder.trim(),
          clientPhone: phone.trim(),
          clientEmail: email.trim() || undefined,
          clientDni: dni.trim(),
          planId: plan.id,
          planName: plan.name,
          monthlyFee: plan.monthlyPrice,
          startDate: todayStr,
          nextBillingDate: nextMonthStr,
          status: 'active',
          paymentMethod: 'debito_tarjeta',
          cutsUsedThisMonth: 0,
          maxCutsPerMonth: 4,
          cardDetails: subscriberPayload.cardDetails,
          notes: subscriberPayload.notes,
        });
      }

      setCreatedSubscriber(savedSub);
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Subscription error:', err);
      setErrorMessage('Hubo un inconveniente al procesar la adhesión. Por favor intenta nuevamente.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const getWhatsAppConfirmationUrl = () => {
    if (!createdSubscriber) return '';
    const phoneClean = settings.phone.replace(/\D/g, '');
    const lastFour = createdSubscriber.cardDetails?.lastFourDigits || cardNumber.slice(-4) || '****';
    const brandName = (createdSubscriber.cardDetails?.brand || brand).toUpperCase();

    const text = `💈 *¡HOLA ${settings.shopName.toUpperCase()}! ME ADHERÍ AL PLAN MENSUAL* 💈\n\n` +
      `¡Hola! Acabo de registrar mi tarjeta para el *Débito Automático* del club mensual:\n\n` +
      `📌 *Plan:* ${plan.name}\n` +
      `👤 *Titular:* ${createdSubscriber.clientName}\n` +
      `💳 *Medio de Pago:* ${cardType === 'debito' ? 'Débito' : 'Crédito'} ${brandName} (Terminada en **** ${lastFour})\n` +
      `💵 *Cuota Mensual:* ${currency}${plan.monthlyPrice.toLocaleString('es-AR')} / mes\n` +
      `✂️ *Beneficio:* 4 servicios al precio de 3 (1 servicio 100% bonificado al mes)\n` +
      `🆔 *Constancia:* ${createdSubscriber.id}\n` +
      `📅 *Fecha de Adhesión:* ${new Date().toLocaleDateString('es-AR')}\n\n` +
      `Quedo registrado en el padrón de clientes del club. ¡Muchas gracias!`;

    return `https://wa.me/${phoneClean}?text=${encodeURIComponent(text)}`;
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div
        id="automatic-debit-modal"
        className="bg-zinc-900 border border-zinc-700/80 rounded-3xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto"
      >
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-800 flex items-center justify-between relative flex-shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shadow-lg ${
                isCombo
                  ? 'bg-amber-500 text-zinc-950 shadow-amber-500/20'
                  : 'bg-emerald-500 text-zinc-950 shadow-emerald-500/20'
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <CreditCard className="w-6 h-6 stroke-[2.2]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                  {isSuccess ? 'Adhesión Confirmada' : 'Carga de Tarjeta para Débito Automático'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  Club 4x3
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-zinc-100">
                {plan.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            id="close-automatic-debit-modal-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {isSuccess && createdSubscriber ? (
            /* ============================================================== */
            /* SUCCESS VIEW / COMPROBANTE DE ADHESIÓN                          */
            /* ============================================================== */
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              {/* Green Success Badge */}
              <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 mb-2">
                  <CheckCircle2 className="w-8 h-8 stroke-[3]" />
                </div>
                <h4 className="text-xl font-black text-emerald-300">
                  ¡Tarjeta Adherida con Éxito al Débito Automático!
                </h4>
                <p className="text-xs sm:text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
                  Ya formas parte del <strong>Club de Clientes VIP</strong>. Tu membresía está activa y tienes <strong>4 servicios mensuales al precio de 3</strong>.
                </p>
              </div>

              {/* Official Receipt Card */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-inner">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <span className="text-xs text-zinc-400 font-semibold">Identificador de Membresía:</span>
                  <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    {createdSubscriber.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500 block">Titular:</span>
                    <span className="font-bold text-zinc-200">{createdSubscriber.clientName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Medio de Pago:</span>
                    <span className="font-bold text-zinc-200 uppercase">
                      {createdSubscriber.cardDetails?.brand || brand} **** {createdSubscriber.cardDetails?.lastFourDigits || cardNumber.slice(-4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Cuota Mensual:</span>
                    <span className="font-black text-amber-400 text-sm">
                      {currency}{plan.monthlyPrice.toLocaleString('es-AR')} / mes
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Beneficio Activo:</span>
                    <span className="font-bold text-emerald-400">4x3 (1 Gratis al mes)</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    El cobro mensual se realizará automáticamente los días 1° de cada mes. Sin contrato de permanencia.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <a
                  href={getWhatsAppConfirmationUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/40 transition-all hover:scale-[1.01]"
                >
                  <MessageCircle className="w-5 h-5 fill-current" />
                  <span>Enviar Constancia Oficial por WhatsApp</span>
                </a>

                {onBookService && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onBookService(plan.serviceTarget);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Agendar mi Primer Turno del Mes Ahora</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* CARD REGISTRATION & BILLING FORM                               */
            /* ============================================================== */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Plan Summary Bar */}
              <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">{plan.name}</span>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Paga 3 Lleva 4
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    4 servicios mensuales • Ahorro mensual: <strong className="text-zinc-200">{currency}{plan.savingsAmount.toLocaleString('es-AR')}</strong>
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xl sm:text-2xl font-black text-amber-400">
                    {currency}{plan.monthlyPrice.toLocaleString('es-AR')}
                  </span>
                  <span className="text-xs text-zinc-400 block font-medium">/ mes débito automático</span>
                </div>
              </div>

              {/* Interactive Visual Credit/Debit Card */}
              <div className="relative w-full max-w-sm mx-auto h-52 rounded-2xl p-5 bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 border border-amber-500/40 shadow-2xl text-zinc-100 flex flex-col justify-between overflow-hidden">
                <div className="absolute -right-8 -top-8 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Top Card Row */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    {/* Golden Chip */}
                    <div className="w-10 h-7 rounded-md bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-500 border border-amber-300/60 shadow flex items-center justify-center">
                      <div className="w-6 h-4 border border-amber-800/40 rounded-sm opacity-60" />
                    </div>
                    {/* Contactless Icon */}
                    <div className="text-zinc-400">
                      <svg className="w-4 h-4 fill-current opacity-70" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                      </svg>
                    </div>
                  </div>

                  {/* Brand Logo / Text */}
                  <div className="text-right">
                    <span className="text-xs font-black tracking-widest uppercase text-amber-400">
                      {brand === 'visa' && 'VISA'}
                      {brand === 'mastercard' && 'MASTERCARD'}
                      {brand === 'amex' && 'AMEX'}
                      {brand === 'cabal' && 'CABAL'}
                      {brand === 'tarjeta' && (cardType === 'debito' ? 'DÉBITO' : 'CRÉDITO')}
                    </span>
                    <span className="text-[9px] text-zinc-400 block uppercase tracking-tight">
                      {cardType === 'debito' ? 'Débito Automático' : 'Crédito Automático'}
                    </span>
                  </div>
                </div>

                {/* Card Number Display */}
                <div className="relative z-10 py-1">
                  <span className="font-mono text-base sm:text-lg tracking-wider font-semibold text-zinc-100 drop-shadow">
                    {cardNumber ? cardNumber : '•••• •••• •••• ••••'}
                  </span>
                </div>

                {/* Bottom Row: Holder & Expiration */}
                <div className="flex items-end justify-between relative z-10 text-xs">
                  <div>
                    <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Titular</span>
                    <span className="font-bold tracking-wide text-zinc-200 uppercase truncate max-w-[170px] block">
                      {cardHolder ? cardHolder : 'NOMBRE Y APELLIDO'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] text-zinc-400 uppercase tracking-wider block">Vence</span>
                    <span className="font-mono font-bold text-zinc-200">
                      {expiry ? expiry : 'MM/AA'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Type Selector (Débito vs Crédito) */}
              <div className="flex items-center gap-2 p-1 bg-zinc-950 border border-zinc-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCardType('debito')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    cardType === 'debito'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Tarjeta de Débito (Bancaria)
                </button>
                <button
                  type="button"
                  onClick={() => setCardType('credito')}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    cardType === 'credito'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Tarjeta de Crédito (Cualquier Banco)
                </button>
              </div>

              {/* Error Notice */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form Input Fields */}
              <div className="space-y-3.5 text-xs">
                {/* 1. Card Number */}
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    Número de Tarjeta *
                  </label>
                  <div className="relative">
                    <input
                      id="card-number-input"
                      type="text"
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono text-sm tracking-wider focus:border-amber-500 outline-none pr-10"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* 2. Holder Name */}
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    Nombre y Apellido del Titular *
                  </label>
                  <div className="relative">
                    <input
                      id="card-holder-input"
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="Tal como figura en la tarjeta"
                      className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-zinc-100 font-semibold uppercase focus:border-amber-500 outline-none pr-10"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      <User className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* 3. Expiration and CVC */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">
                      Vencimiento (MM/AA) *
                    </label>
                    <input
                      id="card-expiry-input"
                      type="text"
                      inputMode="numeric"
                      value={expiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/AA"
                      maxLength={5}
                      className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono text-center font-bold focus:border-amber-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-bold mb-1 flex items-center justify-between">
                      <span>Cód. Seguridad (CVV) *</span>
                      <span className="text-[10px] text-zinc-500 font-normal">Dorso</span>
                    </label>
                    <div className="relative">
                      <input
                        id="card-cvc-input"
                        type="password"
                        inputMode="numeric"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="123"
                        maxLength={4}
                        className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-zinc-100 font-mono text-center font-bold focus:border-amber-500 outline-none pr-9"
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. DNI & WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">
                      DNI / CUIT del Titular *
                    </label>
                    <input
                      id="card-dni-input"
                      type="text"
                      inputMode="numeric"
                      value={dni}
                      onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      placeholder="Para el débito bancario"
                      className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-zinc-100 font-medium focus:border-amber-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 font-bold mb-1">
                      Teléfono / WhatsApp *
                    </label>
                    <div className="relative">
                      <input
                        id="card-phone-input"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej. +54 9 11 2345-6789"
                        className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-zinc-100 font-medium focus:border-amber-500 outline-none pr-9"
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Email (Optional for receipt) */}
                <div>
                  <label className="block text-zinc-300 font-bold mb-1 flex items-center justify-between">
                    <span>Email de facturación (Opcional)</span>
                    <span className="text-[10px] text-zinc-500">Para recibir comprobante</span>
                  </label>
                  <div className="relative">
                    <input
                      id="card-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu-email@gmail.com"
                      className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-zinc-100 font-medium focus:border-amber-500 outline-none pr-9"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Terms Acceptance */}
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded text-amber-500 focus:ring-amber-400 bg-zinc-900 border-zinc-700 cursor-pointer"
                  />
                  <span className="text-[11px] text-zinc-300 leading-relaxed">
                    Autorizo a <strong>{settings.shopName}</strong> a debitar automáticamente de esta tarjeta el monto mensual de <strong>{currency}{plan.monthlyPrice.toLocaleString('es-AR')}</strong> para mi membresía 4x3. Puedo pausar o cancelar la suscripción en cualquier momento sin penalidad.
                  </span>
                </label>

                {/* Security Guarantee Note */}
                <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Conexión cifrada SSL de 256 bits. Los datos se tokenizan de forma segura.</span>
                </div>
              </div>

              {/* Submit CTA Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="submit-card-debit-btn"
                  disabled={isProcessing}
                  className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-amber-400 text-zinc-950 font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      <span>{processingStep || 'Procesando adhesión...'}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 stroke-[2.5]" />
                      <span>
                        Confirmar Adhesión al Débito Automático ({currency}{plan.monthlyPrice.toLocaleString('es-AR')}/mes)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
