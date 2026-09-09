import React, { useState } from 'react';
import { Lock, KeyRound, AlertCircle, X, CheckCircle2 } from 'lucide-react';

interface AdminPinModalProps {
  correctPin: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  correctPin,
  onSuccess,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectivePin = correctPin || '1234';
    if (pin.trim() === effectivePin.trim()) {
      sessionStorage.setItem('barber_admin_authenticated', 'true');
      onSuccess();
    } else {
      setError('PIN incorrecto. Intenta nuevamente.');
      setPin('');
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
          <h3 className="text-lg font-black text-zinc-100">Acceso Administrativo</h3>
          <p className="text-xs text-zinc-400">
            Ingresa el PIN de seguridad para gestionar turnos, catálogo y configuración del salón.
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
              Código PIN (4 dígitos)
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={8}
                autoFocus
                inputMode="numeric"
                required
                value={pin}
                onChange={(e) => {
                  setError(null);
                  setPin(e.target.value);
                }}
                placeholder="••••"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl py-3 px-4 text-center text-xl font-mono tracking-widest text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
              <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="p-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-[11px] text-zinc-400 flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
            <span>
              PIN predeterminado: <strong className="text-amber-400 font-mono">1234</strong>. Puedes cambiarlo luego en el botón <em>Configuración</em>.
            </span>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
            >
              Ingresar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
