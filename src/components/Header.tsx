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
  Package,
} from 'lucide-react';
import { BusinessSettings } from '../types.ts';

export type AppView = 'book' | 'catalog' | 'products' | 'calendar' | 'reviews' | 'my-turns' | 'admin';


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
        <div className="hidden sm:flex items-center justify-between py-2 border-b border-zinc-800/80 text-xs text-zinc-400">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Abierto Hoy</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-300 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Lun a Sáb {settings.openingHour} - {settings.closingHour} hs</span>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-zinc-400 hover:text-amber-400 transition-colors text-[11px]"
              title="Ver ubicación en el mapa"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-500/70" />
              <span>{settings.address}</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${settings.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-400 transition-all text-[11px] font-medium"
              title="Contactar por WhatsApp"
            >
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>WhatsApp: {settings.phone}</span>
            </a>
          </div>
        </div>

        {/* Main Nav Bar */}
        <div className="flex items-center justify-between py-3">
          {/* Logo & Brand */}
          <div
            id="brand-logo"
            onClick={() => setActiveView('book')}
            className="flex items-center gap-3 cursor-pointer group min-w-0"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 p-[1px] shadow-lg shadow-amber-500/10 group-hover:scale-105 transition-transform flex-shrink-0">
              <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center text-amber-400 group-hover:text-amber-300">
                <Scissors className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-zinc-100 tracking-tight truncate font-display">
                  {settings.shopName}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex-shrink-0">
                  Salon &amp; Barbershop
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block truncate max-w-sm">
                {settings.tagline}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Controls */}
          <nav className="hidden md:flex items-center gap-1.5">
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
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeView === 'catalog'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{settings.enableMonthlyPlans !== false ? 'Catálogo & Planes' : 'Catálogo'}</span>
            </button>

            {settings.enableProducts !== false && (
              <button
                id="nav-btn-products"
                onClick={() => setActiveView('products')}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  activeView === 'products'
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Productos</span>
              </button>
            )}

            {settings.enablePublicCalendar !== false && (
              <button
                id="nav-btn-calendar"
                onClick={() => setActiveView('calendar')}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  activeView === 'calendar'
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Disponibilidad</span>
              </button>
            )}

            {settings.enableReviews !== false && (
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
            )}

            {settings.enableLookupMyTurn !== false && (
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
            )}

            <div className="h-5 w-px bg-zinc-800 mx-1" />

            <button
              id="nav-btn-admin"
              onClick={() => setActiveView('admin')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 border ${
                activeView === 'admin'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/40 shadow-inner'
                  : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
              }`}
              title="Acceso exclusivo para el barbero / dueño (requiere PIN)"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs">Acceso Barbero</span>
              {pendingRemindersCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold animate-pulse">
                  {pendingRemindersCount}
                </span>
              )}
            </button>
          </nav>

          {/* Quick Mobile Right Action (Staff PIN or WhatsApp) */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="nav-btn-admin-mobile-quick"
              onClick={() => setActiveView('admin')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
                activeView === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Acceso Barbero"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px]">Staff</span>
              {pendingRemindersCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Swipeable Horizontal Navigation Bar (Allows smooth touch sliding to see all options) */}
        <div
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          className="md:hidden pb-2.5 pt-0.5 -mx-4 px-4 overflow-x-auto horizontal-scroll-container"
        >
          <div className="flex items-center gap-1.5 w-max">
            <button
              id="nav-btn-book-mobile"
              onClick={() => setActiveView('book')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeView === 'book'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm shadow-amber-500/20'
                  : 'bg-zinc-900/80 border border-zinc-800 text-zinc-300'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Reservar</span>
            </button>

            <button
              id="nav-btn-catalog-mobile"
              onClick={() => setActiveView('catalog')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeView === 'catalog'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm shadow-amber-500/20'
                  : 'bg-zinc-900/80 border border-zinc-800 text-zinc-300'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{settings.enableMonthlyPlans !== false ? 'Catálogo & Planes' : 'Catálogo'}</span>
            </button>

            {settings.enableProducts !== false && (
              <button
                id="nav-btn-products-mobile"
                onClick={() => setActiveView('products')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeView === 'products'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm shadow-amber-500/20'
                    : 'bg-zinc-900/80 border border-zinc-800 text-zinc-300'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Productos</span>
              </button>
            )}

            {settings.enablePublicCalendar !== false && (
              <button
                id="nav-btn-calendar-mobile"
                onClick={() => setActiveView('calendar')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeView === 'calendar'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm shadow-amber-500/20'
                    : 'bg-zinc-900/80 border border-zinc-800 text-zinc-300'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Disponibilidad</span>
              </button>
            )}

            {settings.enableReviews !== false && (
              <button
                id="nav-btn-reviews-mobile"
                onClick={() => setActiveView('reviews')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeView === 'reviews'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm shadow-amber-500/20'
                    : 'bg-zinc-900/80 border border-zinc-800 text-zinc-300'
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Reseñas</span>
              </button>
            )}

            {settings.enableLookupMyTurn !== false && (
              <button
                id="nav-btn-my-turns-mobile"
                onClick={() => setActiveView('my-turns')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeView === 'my-turns'
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm shadow-amber-500/20'
                    : 'bg-zinc-900/80 border border-zinc-800 text-zinc-300'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Mi Turno</span>
              </button>
            )}

            <button
              id="nav-btn-admin-tab-mobile"
              onClick={() => setActiveView('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeView === 'admin'
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm shadow-amber-500/20'
                  : 'bg-zinc-900/80 border border-zinc-800 text-zinc-300'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Panel Barbero</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
