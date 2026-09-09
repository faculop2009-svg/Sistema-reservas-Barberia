import React, { useState } from 'react';
import {
  Scissors,
  Sparkles,
  Flame,
  Palette,
  Clock,
  Check,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Tag,
  Star,
  Layers,
  Edit2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { BarberService, ServiceType } from '../types.ts';
import { resolveServiceImageUrl, getServiceFallback } from '../utils/serviceImage.ts';

interface ServicesCatalogProps {
  services: BarberService[];
  onSelectServiceAndBook: (service: BarberService) => void;
  isAdmin?: boolean;
  onUpdateService?: (service: BarberService) => void;
}

export const ServicesCatalog: React.FC<ServicesCatalogProps> = ({
  services,
  onSelectServiceAndBook,
  isAdmin = false,
  onUpdateService,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingService, setEditingService] = useState<BarberService | null>(null);
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDuration, setEditDuration] = useState<number>(0);
  const [editDescription, setEditDescription] = useState<string>('');

  const categories = ['all', ...Array.from(new Set(services.map((s) => s.category)))];

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter((s) => s.category === selectedCategory);

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Scissors':
        return <Scissors className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'Flame':
        return <Flame className="w-5 h-5" />;
      case 'Palette':
        return <Palette className="w-5 h-5" />;
      default:
        return <Scissors className="w-5 h-5" />;
    }
  };

  const handleOpenEdit = (serv: BarberService) => {
    setEditingService(serv);
    setEditPrice(serv.price);
    setEditDuration(serv.durationMinutes);
    setEditDescription(serv.description);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    const updated: BarberService = {
      ...editingService,
      price: editPrice,
      durationMinutes: editDuration,
      description: editDescription,
    };

    try {
      const adminPin = sessionStorage.getItem('barber_admin_pin') || '';
      const res = await fetch(`/api/services/${editingService.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin,
        },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        onUpdateService?.(updated);
        setEditingService(null);
      }
    } catch (err) {
      console.error('Error updating service:', err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Catalog Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Carta & Menú Oficial de Servicios
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
            Catálogo de Servicios & Estilismo
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Cada servicio incluye asesoramiento técnico personalizado, productos de primera línea internacional y técnicas de precisión para un resultado impecable y duradero.
          </p>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 pt-6 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {cat === 'all' ? 'Todos los servicios' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Grid with Rich Photography & Step Inclusions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            id={`service-catalog-card-${service.id}`}
            className="group bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all duration-300 flex flex-col justify-between shadow-lg"
          >
            <div>
              {/* Service Representative Image */}
              <div className="relative h-56 w-full overflow-hidden bg-zinc-950">
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
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                {/* Badge tags overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-950/80 backdrop-blur-md text-zinc-200 border border-zinc-700/60 flex items-center gap-1.5">
                    {getServiceIcon(service.iconName)}
                    {service.category}
                  </span>
                </div>

                {service.popular && (
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500 text-zinc-950 shadow-md flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Más solicitado
                    </span>
                  </div>
                )}

                {/* Bottom title & price in image overlay */}
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-zinc-100 drop-shadow-md group-hover:text-amber-400 transition-colors">
                      {service.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-amber-400 drop-shadow-md">
                      ${service.price.toLocaleString('es-AR')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4">
                {/* Duration & quick meta */}
                <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/80 text-xs text-zinc-400">
                  <div className="flex items-center gap-1.5 text-zinc-300">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Tiempo estimado:</span>
                    <strong className="text-zinc-100">{service.durationMinutes} minutos</strong>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Garantía de satisfacción</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {service.description}
                </p>

                {/* What it includes / Scope */}
                {service.includes && service.includes.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-500" />
                      ¿Qué abarca este servicio?
                    </h4>
                    <ul className="space-y-1.5">
                      {service.includes.map((step, idx) => (
                        <li key={idx} className="text-xs text-zinc-400 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-5 pt-0 mt-2 flex items-center justify-between gap-3 border-t border-zinc-800/60 pt-4">
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => handleOpenEdit(service)}
                  className="px-3 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-amber-400 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Editar precio/tiempo
                </button>
              ) : (
                <span className="text-xs text-zinc-500">
                  Reserva sin pagos por adelantado
                </span>
              )}

              <button
                type="button"
                id={`btn-book-service-${service.id}`}
                onClick={() => onSelectServiceAndBook(service)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Calendar className="w-4 h-4" />
                <span>Reservar turno</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Service Modal (Admin Only) */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-500" />
                Editar {editingService.name}
              </h3>
              <button
                onClick={() => setEditingService(null)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Precio ($ ARS)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 font-semibold focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Tiempo estimado (minutos)</label>
                <input
                  type="number"
                  step="5"
                  value={editDuration}
                  onChange={(e) => setEditDuration(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 font-semibold focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Descripción del servicio</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-3 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
