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
  Lock,
  Star,
} from 'lucide-react';
import { BusinessSettings } from '../types.ts';

export type AppView = 'book' | 'catalog' | 'calendar' | 'reviews' | 'my-turns' | 'admin';


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
        {/* Top business info bar (Informational only for clients) */}
        <div className="hidden sm:flex items-center justify-between py-2 border-b border-zinc-800/60 text-xs text-zinc-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Lun a Sáb: {settings.openingHour} - {settings.closingHour} hs</span>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-zinc-400 hover:text-amber-400 transition-colors"
              title="Ver ubicación en el mapa"
            >
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              <span>{settings.address}</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${settings.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-zinc-300 hover:text-emerald-400 transition-colors"
              title="Contactar por WhatsApp"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>{settings.phone}</span>
            </a>
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
              id="nav-btn-reviews"
              onClick={() => setActiveView('reviews')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeView === 'reviews'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Reseñas</span>
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
              <span className="hidden sm:inline">Mi Turno</span>
              <span className="sm:hidden">Turno</span>
            </button>

            <div className="h-5 w-px bg-zinc-800 mx-1" />

            <button
              id="nav-btn-admin"
              onClick={() => setActiveView('admin')}
              className={`px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 border ${
                activeView === 'admin'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-inner'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
              }`}
              title="Acceso exclusivo para el barbero / dueño (requiere PIN)"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline text-xs">Acceso Barbero</span>
              <span className="sm:hidden text-xs">Staff</span>
              {pendingRemindersCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold animate-pulse">
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
