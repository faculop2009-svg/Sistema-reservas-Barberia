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
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  ImageIcon,
} from 'lucide-react';
import { BarberService } from '../types.ts';
import { resolveServiceImageUrl, getServiceFallback } from '../utils/serviceImage.ts';
import { saveClientServices } from '../utils/clientStorage.ts';

interface ServicesCatalogProps {
  services: BarberService[];
  onSelectServiceAndBook: (service: BarberService) => void;
  isAdmin?: boolean;
  onUpdateService?: (service: BarberService) => void;
  onServicesChange?: (services: BarberService[]) => void;
}

const SERVICE_PHOTO_PRESETS = [
  { label: 'Corte Clásico / Tijera', url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&auto=format&fit=crop&q=80' },
  { label: 'Degradé / Skin Fade', url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&auto=format&fit=crop&q=80' },
  { label: 'Barba & Toalla Caliente', url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&auto=format&fit=crop&q=80' },
  { label: 'Combo Completo', url: 'https://images.unsplash.com/photo-1517832606589-7629c3395909?w=600&auto=format&fit=crop&q=80' },
  { label: 'Colorimetría / Platinado', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=80' },
  { label: 'Tratamiento Capilar', url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80' },
];

export const ServicesCatalog: React.FC<ServicesCatalogProps> = ({
  services,
  onSelectServiceAndBook,
  isAdmin = false,
  onUpdateService,
  onServicesChange,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Modals
  const [editingService, setEditingService] = useState<BarberService | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [deletingService, setDeletingService] = useState<BarberService | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Corte');
  const [formPrice, setFormPrice] = useState<number>(5000);
  const [formDuration, setFormDuration] = useState<number>(30);
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formPopular, setFormPopular] = useState(false);

  const categories = ['all', ...Array.from(new Set(services.map((s) => s.category)))];

  const filteredServices = selectedCategory === 'all'
    ? services
    : services.filter((s) => s.category === selectedCategory);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getServiceIcon = (iconName?: string) => {
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
    setIsCreatingNew(false);
    setFormName(serv.name);
    setFormCategory(serv.category || 'Corte');
    setFormPrice(serv.price);
    setFormDuration(serv.durationMinutes);
    setFormDescription(serv.description || '');
    setFormImageUrl(serv.imageUrl || '');
    setFormPopular(!!serv.popular);
    setFormError(null);
  };

  const handleOpenCreate = () => {
    setEditingService(null);
    setIsCreatingNew(true);
    setFormName('');
    setFormCategory('Corte');
    setFormPrice(6000);
    setFormDuration(35);
    setFormDescription('Servicio profesional con productos de alta gama y acabado premium.');
    setFormImageUrl(SERVICE_PHOTO_PRESETS[0].url);
    setFormPopular(false);
    setFormError(null);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('El nombre del servicio es obligatorio.');
      return;
    }
    if (formPrice <= 0) {
      setFormError('El precio debe ser un número mayor a cero.');
      return;
    }

    setIsProcessing(true);
    setFormError(null);

    const adminPin = sessionStorage.getItem('barber_admin_pin') || '';

    try {
      if (editingService) {
        // Edit existing
        const updated: BarberService = {
          ...editingService,
          name: formName.trim(),
          category: formCategory.trim() || 'Corte',
          price: Number(formPrice),
          durationMinutes: Number(formDuration) || 30,
          description: formDescription.trim(),
          imageUrl: formImageUrl.trim() || editingService.imageUrl,
          popular: formPopular,
        };

        const res = await fetch(`/api/services/${editingService.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-pin': adminPin,
          },
          body: JSON.stringify(updated),
        }).catch(() => null);

        const nextList = services.map((s) => (s.id === updated.id ? updated : s));
        onUpdateService?.(updated);
        onServicesChange?.(nextList);
        saveClientServices(nextList);

        setEditingService(null);
        showToast(`Servicio "${updated.name}" actualizado.`);
      } else {
        // Create new
        const newPayload = {
          name: formName.trim(),
          category: formCategory.trim() || 'Corte',
          price: Number(formPrice),
          durationMinutes: Number(formDuration) || 30,
          description: formDescription.trim(),
          imageUrl: formImageUrl.trim() || SERVICE_PHOTO_PRESETS[0].url,
          popular: formPopular,
        };

        const res = await fetch('/api/services', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-pin': adminPin,
          },
          body: JSON.stringify(newPayload),
        }).catch(() => null);

        if (res && res.ok) {
          const created = await res.json();
          const nextList = [...services, created];
          onServicesChange?.(nextList);
          saveClientServices(nextList);
          setIsCreatingNew(false);
          showToast(`¡Servicio "${created.name}" creado con éxito!`);
        } else {
          // Fallback client creation
          const fallbackNew: BarberService = {
            id: `service_${Date.now()}` as any,
            ...newPayload,
            includedSteps: ['Atención personalizada', 'Finalización con producto premium'],
          };
          const nextList = [...services, fallbackNew];
          onServicesChange?.(nextList);
          saveClientServices(nextList);
          setIsCreatingNew(false);
          showToast(`¡Servicio "${fallbackNew.name}" agregado al catálogo!`);
        }
      }
    } catch (err) {
      console.error('Error saving service:', err);
      setFormError('Error al guardar el servicio. Verifica tu conexión.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingService) return;
    if (services.length <= 1) {
      alert('No puedes eliminar el único servicio disponible en el catálogo.');
      setDeletingService(null);
      return;
    }

    setIsProcessing(true);
    const adminPin = sessionStorage.getItem('barber_admin_pin') || '';

    try {
      const res = await fetch(`/api/services/${deletingService.id}`, {
        method: 'DELETE',
        headers: { 'x-admin-pin': adminPin },
      }).catch(() => null);

      const nextList = services.filter((s) => s.id !== deletingService.id);
      onServicesChange?.(nextList);
      saveClientServices(nextList);

      showToast(`Servicio "${deletingService.name}" eliminado del catálogo.`);
      setDeletingService(null);
    } catch (err) {
      console.error('Error deleting service:', err);
      alert('Error al eliminar el servicio');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-950 border border-emerald-500 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Catalog Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Carta & Menú Oficial de Servicios
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
              Catálogo de Servicios & Estilismo
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Asesoramiento técnico personalizado, productos de primera línea internacional y técnicas de precisión para un resultado impecable.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Crear Nuevo Servicio</span>
            </button>
          )}
        </div>

        {/* Categories Bar */}
        <div
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          className="flex items-center gap-2 pt-6 overflow-x-auto pb-1 horizontal-scroll-container snap-x -mx-1 px-1"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 snap-start ${
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
                    <span>Garantía de estilo</span>
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
                      ¿Qué incluye este servicio?
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(service)}
                    className="px-3 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-amber-400 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-colors"
                    title="Editar detalles del servicio"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingService(service)}
                    className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 text-xs border border-zinc-700 transition-colors"
                    title="Eliminar del catálogo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
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

      {/* Edit or Create Service Modal */}
      {(editingService || isCreatingNew) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                {isCreatingNew ? <Plus className="w-4 h-4 text-amber-500" /> : <Edit2 className="w-4 h-4 text-amber-500" />}
                <span>{isCreatingNew ? 'Crear Nuevo Servicio' : `Editar ${editingService?.name}`}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingService(null);
                  setIsCreatingNew(false);
                }}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Nombre del Servicio *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej. Corte Fade Master"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 font-medium focus:border-amber-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Categoría</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Ej. Corte, Barba, Combo, Color"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 font-medium focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Precio ($ ARS) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 font-bold focus:border-amber-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Duración (minutos) *</label>
                  <input
                    type="number"
                    step="5"
                    min="10"
                    max="180"
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 font-bold focus:border-amber-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Photo selector */}
              <div className="space-y-2 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
                <label className="block text-zinc-300 font-semibold flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                  Imagen Representativa
                </label>
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 text-xs focus:border-amber-500 outline-none"
                />
                <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
                  <span className="text-[10px] text-zinc-500 whitespace-nowrap">Fotos sugeridas:</span>
                  {SERVICE_PHOTO_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormImageUrl(p.url)}
                      className={`px-2 py-1 rounded text-[10px] border whitespace-nowrap transition-colors ${
                        formImageUrl === p.url
                          ? 'bg-amber-500 text-zinc-950 font-bold border-amber-500'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Descripción del Servicio</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detalles de la técnica, productos aplicados y acabado..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="popular-checkbox"
                  checked={formPopular}
                  onChange={(e) => setFormPopular(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <label htmlFor="popular-checkbox" className="text-zinc-200 font-medium cursor-pointer">
                  Destacar como servicio "Más pedido"
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    setEditingService(null);
                    setIsCreatingNew(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-semibold transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{isCreatingNew ? 'Crear Servicio' : 'Guardar Cambios'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal for Service Deletion (No window.confirm!) */}
      {deletingService && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-zinc-100">
                ¿Eliminar {deletingService.name}?
              </h3>
              <p className="text-xs text-zinc-400">
                Este servicio se retirará del catálogo y los clientes ya no podrán seleccionarlo para nuevas reservas.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => setDeletingService(null)}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmDelete}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <span>Eliminar Servicio</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
