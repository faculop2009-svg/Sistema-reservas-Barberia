import React from 'react';
import {
  Scissors,
  Calendar,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  BookOpen,
  CalendarDays,
  Sparkles,
  Pencil,
} from 'lucide-react';
import { BusinessSettings } from '../types.ts';

export type AppView = 'book' | 'catalog' | 'calendar' | 'my-turns' | 'admin';

interface HeaderProps {
  settings: BusinessSettings;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  pendingRemindersCount?: number;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  activeView,
  setActiveView,
  pendingRemindersCount = 0,
  onOpenSettings,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top business info bar */}
        <div className="hidden sm:flex items-center justify-between py-2 border-b border-zinc-800/60 text-xs text-zinc-400">
          <div className="flex items-center gap-4">
            <button
              type="button"
              id="header-edit-hours-btn"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 text-zinc-300 hover:text-amber-400 transition-colors group cursor-pointer text-left"
              title="Haz clic para editar los horarios de atención"
            >
              <Clock className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
              <span>Lun a Sáb: {settings.openingHour} - {settings.closingHour} hs</span>
            </button>
            <button
              type="button"
              id="header-edit-address-btn"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 text-zinc-400 hover:text-amber-400 transition-colors group cursor-pointer text-left"
              title="Haz clic para editar la dirección de la barbería"
            >
              <MapPin className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-500 group-hover:scale-110 transition-transform" />
              <span>{settings.address}</span>
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="header-edit-phone-btn"
              onClick={onOpenSettings}
              className="flex items-center gap-1 text-zinc-300 hover:text-amber-400 transition-colors group cursor-pointer"
              title="Haz clic para editar el teléfono de WhatsApp"
            >
              <Phone className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
              <span>{settings.phone}</span>
            </button>

            {onOpenSettings && (
              <button
                type="button"
                id="header-direct-edit-settings-btn"
                onClick={onOpenSettings}
                className="px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-amber-500/20 text-zinc-400 hover:text-amber-400 border border-zinc-700/60 hover:border-amber-500/30 text-[11px] font-semibold transition-all flex items-center gap-1 ml-1 cursor-pointer"
                title="Editar horario, dirección o teléfono"
              >
                <Pencil className="w-2.5 h-2.5 text-amber-500" />
                <span>Editar datos</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Nav Bar */}
        <div className="flex items-center justify-between py-3">
          {/* Logo & Brand */}
          <div
            id="brand-logo"
            onClick={() => setActiveView('book')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-zinc-950 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Scissors className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-zinc-100 tracking-tight">
                  {settings.shopName}
                </h1>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Online
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block truncate max-w-sm">
                {settings.tagline}
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center gap-1 sm:gap-1.5">
            <button
              id="nav-btn-book"
              onClick={() => setActiveView('book')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeView === 'book'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Reservar</span>
            </button>

            <button
              id="nav-btn-catalog"
              onClick={() => setActiveView('catalog')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all hidden md:flex items-center gap-1.5 ${
                activeView === 'catalog'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Catálogo</span>
            </button>

            <button
              id="nav-btn-calendar"
              onClick={() => setActiveView('calendar')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all hidden lg:flex items-center gap-1.5 ${
                activeView === 'calendar'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Disponibilidad</span>
            </button>

            <button
              id="nav-btn-my-turns"
              onClick={() => setActiveView('my-turns')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeView === 'my-turns'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Mi Turno</span>
            </button>

            <div className="h-5 w-px bg-zinc-800 mx-1" />

            <button
              id="nav-btn-admin"
              onClick={() => setActiveView('admin')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 border ${
                activeView === 'admin'
                  ? 'bg-zinc-800 text-amber-400 border-amber-500/50 shadow-inner'
                  : 'bg-zinc-900/80 text-zinc-300 border-zinc-700/60 hover:text-amber-400 hover:border-zinc-600'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Panel Barbería</span>
              <span className="sm:hidden">Admin</span>
              {pendingRemindersCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black animate-pulse">
                  {pendingRemindersCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
