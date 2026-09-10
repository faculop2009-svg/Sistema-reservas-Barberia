import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, X, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { BusinessSettings } from '../types.ts';
import { loadClientSettings } from '../utils/clientStorage.ts';

interface AdminPinModalProps {
  correctPin?: string;
  onSuccess: (verifiedSettings?: BusinessSettings) => void;
  onClose: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  correctPin,
  onSuccess,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPin = pin.trim();
    if (!trimmedPin) {
      setError('Por favor ingresa tu código PIN.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      // 1. Try server verification first
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: trimmedPin }),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        sessionStorage.setItem('barber_admin_pin', trimmedPin);
        sessionStorage.setItem('barber_admin_authenticated', 'true');
        onSuccess(data.settings);
        return;
      }

      if (res && res.status === 401) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'PIN incorrecto. Acceso denegado.');
        setPin('');
        return;
      }

      // 2. Client-side fallback if backend is unreachable
      const clientSettings = loadClientSettings();
      const fallbackPin = (correctPin || clientSettings.adminPin || '1234').trim();
      if (trimmedPin === fallbackPin) {
        sessionStorage.setItem('barber_admin_pin', trimmedPin);
        sessionStorage.setItem('barber_admin_authenticated', 'true');
        onSuccess();
      } else {
        setError('PIN incorrecto. Acceso denegado.');
        setPin('');
      }
    } catch {
      setError('Error al verificar el PIN. Inténtalo nuevamente.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 space-y-5 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 transition-colors p-1"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 pt-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-zinc-100">Acceso del Personal</h3>
          <p className="text-xs text-zinc-400">
            Ingresa tu PIN de seguridad para acceder a la agenda interna y gestión de la barbería.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 text-center">
              Código PIN de Seguridad
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={8}
                autoFocus
                inputMode="numeric"
                required
                disabled={isVerifying}
                value={pin}
                onChange={(e) => {
                  setError(null);
                  setPin(e.target.value);
                }}
                placeholder="••••"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-3 px-10 text-center text-xl font-mono tracking-widest text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all disabled:opacity-50"
              />
              <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-zinc-400 hover:text-zinc-200 transition-colors absolute right-3.5 top-1/2 -translate-y-1/2 p-1"
                title={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="p-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <span>
              Área privada exclusiva para el dueño o barbero. Si eres cliente, vuelve atrás para reservar tu turno.
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={isVerifying}
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors disabled:opacity-50"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <span>Ingresar</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
