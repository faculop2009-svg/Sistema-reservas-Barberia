import React, { useState } from 'react';
import {
  Scissors,
  Sparkles,
  Flame,
  Palette,
  Check,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { BarberService, ServiceType } from '../types.ts';
import { resolveServiceImageUrl, getServiceFallback } from '../utils/serviceImage.ts';

interface ServiceSelectorProps {
  services: BarberService[];
  selectedServiceId: ServiceType;
  onSelectService: (service: BarberService) => void;
  onViewCatalog?: () => void;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({
  services,
  selectedServiceId,
  onSelectService,
  onViewCatalog,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(services.map((s) => s.category).filter(Boolean)))];

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter((s) => s.category === selectedCategory);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Scissors':
        return <Scissors className="w-4 h-4" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4" />;
      case 'Flame':
        return <Flame className="w-4 h-4" />;
      case 'Palette':
        return <Palette className="w-4 h-4" />;
      default:
        return <Scissors className="w-4 h-4" />;
    }
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
            <span>1. Elige tu servicio</span>
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Selecciona el corte, barba o tratamiento que deseas realizarte
          </p>
        </div>

        {onViewCatalog && (
          <button
            type="button"
            onClick={onViewCatalog}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 self-start sm:self-auto py-1 px-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Ver fotos y catálogo completo</span>
          </button>
        )}
      </div>

      {/* Swipeable Category Filter Bar */}
      {categories.length > 2 && (
        <div
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          className="flex items-center gap-1.5 overflow-x-auto horizontal-scroll-container py-1 -mx-1 px-1"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm shadow-amber-500/20'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat === 'all' ? 'Todos los servicios' : cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {filteredServices.map((service) => {
          const isSelected = selectedServiceId === service.id;
          const isExpanded = expandedId === service.id;

          return (
            <div
              key={service.id}
              id={`service-card-${service.id}`}
              onClick={() => onSelectService(service)}
              className={`relative rounded-2xl border cursor-pointer transition-all duration-200 text-left flex flex-col justify-between overflow-hidden ${
                isSelected
                  ? 'bg-amber-950/20 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/50'
                  : 'bg-zinc-900/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              {service.popular && (
                <span className="absolute top-2 right-3 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500 text-zinc-950 shadow-sm">
                  Más pedido
                </span>
              )}

              {/* Card top banner with image preview */}
              <div className="flex items-start gap-3 p-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-zinc-700/80 bg-zinc-950 shadow-inner">
                  <img
                    src={resolveServiceImageUrl(service.imageUrl, service.id)}
                    alt={service.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const fallback = getServiceFallback(service.id);
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 pr-12">
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold mb-0.5">
                    {getIcon(service.iconName)}
                    <span>{service.category}</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-zinc-100 truncate">
                    {service.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs mt-1 text-zinc-400">
                    <span className="font-black text-zinc-100 text-sm">
                      ${service.price.toLocaleString('es-AR')}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Clock className="w-3 h-3 text-amber-500" />
                      {service.durationMinutes} min
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="px-4 pb-2">
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {service.description}
                </p>

                {/* Expanded includes list */}
                {isExpanded && service.includes && service.includes.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-zinc-800/80 space-y-1.5 animate-in fade-in duration-200">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Incluye:
                    </span>
                    {service.includes.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer row */}
              <div className="px-4 py-2.5 bg-zinc-950/40 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                {service.includes && service.includes.length > 0 ? (
                  <button
                    type="button"
                    onClick={(e) => toggleExpand(service.id, e)}
                    className="text-[11px] text-zinc-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                  >
                    <span>{isExpanded ? 'Menos detalles' : 'Ver qué incluye'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                ) : (
                  <span className="text-[11px] text-zinc-500">Servicio premium</span>
                )}

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                    isSelected ? 'bg-amber-500 text-zinc-950' : 'border border-zinc-700 text-transparent'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
