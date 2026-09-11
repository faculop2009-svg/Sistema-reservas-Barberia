import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Sparkles,
  Check,
  Plus,
  MessageCircle,
  ExternalLink,
  ArrowRight,
  Package,
  Flame,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { Product, Appointment, BusinessSettings } from '../types.ts';
import { loadClientProducts, loadClientSettings } from '../utils/clientStorage.ts';
import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS } from '../data/defaults.ts';

interface PostBookingProductsAdProps {
  appointment: Appointment;
  settings?: BusinessSettings;
  selectedProducts?: Product[];
  onToggleProduct?: (product: Product) => void;
  onNavigateToProducts?: () => void;
}

export const PostBookingProductsAd: React.FC<PostBookingProductsAdProps> = ({
  appointment,
  settings: propSettings,
  selectedProducts: controlledSelectedProducts,
  onToggleProduct: controlledOnToggleProduct,
  onNavigateToProducts,
}) => {
  const settings = propSettings || loadClientSettings() || DEFAULT_SETTINGS;
  const [products, setProducts] = useState<Product[]>(() => {
    const local = loadClientProducts();
    return local && local.length > 0 ? local : DEFAULT_PRODUCTS;
  });
  const [internalSelectedProductIds, setInternalSelectedProductIds] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Load latest products from server if available
  useEffect(() => {
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      })
      .catch(() => {});
  }, []);

  const isControlled = controlledSelectedProducts !== undefined && controlledOnToggleProduct !== undefined;

  const currentSelectedProducts = isControlled
    ? controlledSelectedProducts
    : products.filter((p) => internalSelectedProductIds.includes(p.id));

  const currentSelectedIds = currentSelectedProducts.map((p) => p.id);

  const toggleProductSelection = (product: Product) => {
    if (isControlled && controlledOnToggleProduct) {
      controlledOnToggleProduct(product);
    } else {
      setInternalSelectedProductIds((prev) =>
        prev.includes(product.id) ? prev.filter((id) => id !== product.id) : [...prev, product.id]
      );
    }
  };

  // Only show products with stock
  const inStockProducts = products.filter((p) => (p.stock || 0) > 0);
  const categories = ['all', ...Array.from(new Set(inStockProducts.map((p) => p.category)))];

  const displayedProducts = inStockProducts.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  const totalProductsPrice = currentSelectedProducts.reduce((sum, p) => sum + p.price, 0);
  const finalTotalPrice = appointment.servicePrice + totalProductsPrice;

  const rawPhone = settings.phone || '';
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '');

  const formatDateDisplay = (ymd: string) => {
    try {
      const [year, month, day] = ymd.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return ymd;
    }
  };

  // WhatsApp order link for selected products combined with the appointment
  const getCombinedWhatsAppUrl = () => {
    const itemsList = currentSelectedProducts
      .map(
        (p) =>
          `• *${p.name}* (+${settings.currencySymbol || '$'}${p.price.toLocaleString('es-AR')})`
      )
      .join('\n');

    const message = `💈 *Turno Reservado + Pedido de Productos en ${settings.shopName}*\n\n` +
      `¡Hola! Tengo turno reservado (Código: *${appointment.code}*):\n` +
      `📍 *Servicio:* ${appointment.serviceName} (${settings.currencySymbol || '$'}${appointment.servicePrice.toLocaleString('es-AR')})\n` +
      `💈 *Profesional:* ${appointment.barberName}\n` +
      `📅 *Fecha:* ${formatDateDisplay(appointment.date)} a las ${appointment.time} hs\n\n` +
      `🛍️ *Productos sumados para retirar en mi visita:*\n` +
      `${itemsList}\n\n` +
      `💵 Subtotal Productos: ${settings.currencySymbol || '$'}${totalProductsPrice.toLocaleString('es-AR')}\n` +
      `💰 *TOTAL FINAL A ABONAR EN EL LOCAL:* ${settings.currencySymbol || '$'}${finalTotalPrice.toLocaleString('es-AR')}\n\n` +
      `¿Me los pueden tener separados y listos para cuando vaya? ¡Muchas gracias!`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // WhatsApp link for a single product directly
  const getSingleProductWhatsAppUrl = (product: Product) => {
    const totalSingle = appointment.servicePrice + product.price;
    const message = `💈 *Consulta por Producto en ${settings.shopName}*\n\n` +
      `¡Hola! Tengo turno reservado para el ${formatDateDisplay(appointment.date)} a las ${appointment.time} hs (Código: *${appointment.code}*) con ${appointment.barberName}.\n\n` +
      `Quiero sumar este producto para retirar en mi visita:\n` +
      `📦 *${product.name}* (+${settings.currencySymbol || '$'}${product.price.toLocaleString('es-AR')})\n\n` +
      `💰 Total Final (Servicio + Producto): ${settings.currencySymbol || '$'}${totalSingle.toLocaleString('es-AR')}\n\n` +
      `¿Me lo pueden tener preparado? ¡Muchas gracias!`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div id="post-booking-products-ad" className="bg-zinc-950 border-2 border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Ad Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[11px] font-extrabold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-current animate-pulse" />
            <span>Anuncio Especial para tu Visita</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-zinc-100 tracking-tight flex items-center gap-2">
            <span>¿Querés mantener tu corte y barba impecables?</span>
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
            Aprovechá tu turno con <strong className="text-zinc-200">{appointment.barberName}</strong> para retirar tus productos oficiales de styling y cuidado personal sin esperas.
          </p>
        </div>

        {onNavigateToProducts && (
          <button
            type="button"
            onClick={onNavigateToProducts}
            className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-amber-400 font-semibold flex items-center gap-1.5 transition-all flex-shrink-0 group"
          >
            <span>Ver Tienda Completa</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Category Filter Pills (if more than 1 category) */}
      {categories.length > 2 && (
        <div
          onWheel={(e) => {
            if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY;
          }}
          className="flex items-center gap-1.5 overflow-x-auto horizontal-scroll-container py-1 -mx-1 px-1 relative z-10"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-amber-500 text-zinc-950 font-black shadow-sm'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              {cat === 'all' ? 'Todos los productos' : cat}
            </button>
          ))}
        </div>
      )}

      {/* Products Showcase Grid - Spacious, Prominent & Clean */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 relative z-10">
        {displayedProducts.slice(0, 6).map((product) => {
          const isSelected = currentSelectedIds.includes(product.id);

          return (
            <div
              key={product.id}
              id={`ad-product-${product.id}`}
              onClick={() => toggleProductSelection(product)}
              className={`flex flex-col justify-between rounded-2xl border transition-all cursor-pointer select-none overflow-hidden group p-3 sm:p-4 ${
                isSelected
                  ? 'bg-emerald-950/25 border-emerald-500 shadow-xl ring-2 ring-emerald-500/40'
                  : 'bg-zinc-900/90 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-900 shadow-md'
              }`}
            >
              {/* Product Media & Badges */}
              <div className="relative w-full h-36 sm:h-40 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 flex-shrink-0">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80';
                  }}
                />

                {/* Category / Brand Badge */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-zinc-950/85 backdrop-blur-md border border-zinc-700/80 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  {product.brand || product.category}
                </div>

                {/* Stock badge */}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-zinc-950/85 backdrop-blur-md border border-zinc-700/80 text-[10px] font-semibold text-emerald-400">
                  {product.stock} en stock
                </div>

                {/* Selected Status Overlay */}
                {isSelected && (
                  <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in duration-150">
                    <div className="bg-emerald-500 text-zinc-950 font-black text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>SUMADO AL TURNO</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="pt-3 pb-2 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black text-zinc-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                    {product.name}
                  </h4>
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-baseline justify-between">
                  <span className="text-xs text-zinc-400 font-medium">Precio producto:</span>
                  <span className="text-base sm:text-lg font-black text-amber-400">
                    {settings.currencySymbol || '$'}{product.price.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* GIANT, SUPER PROMINENT "SUMAR" BUTTON */}
              <div className="pt-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  id={`btn-sumar-${product.id}`}
                  onClick={() => toggleProductSelection(product)}
                  className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-[0.98] ${
                    isSelected
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-950/40 ring-2 ring-emerald-300'
                      : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-950/40 hover:brightness-105'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>✓ SUMADO AL TURNO (+{settings.currencySymbol || '$'}{product.price.toLocaleString('es-AR')})</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>+ SUMAR AL TURNO (+{settings.currencySymbol || '$'}{product.price.toLocaleString('es-AR')})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer: Order Selected Products with Appointment */}
      {currentSelectedProducts.length > 0 ? (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-amber-500/15 border-2 border-emerald-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-xl">
          <div className="flex items-center gap-3 text-xs text-zinc-200">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-zinc-950 flex items-center justify-center font-black text-sm flex-shrink-0 shadow-md">
              {currentSelectedProducts.length}
            </div>
            <div>
              <span className="font-bold text-zinc-100 text-sm block">
                {currentSelectedProducts.length === 1 ? '1 producto sumado al turno' : `${currentSelectedProducts.length} productos sumados al turno`}
              </span>
              <span className="text-xs text-zinc-300">
                Servicio ({settings.currencySymbol || '$'}{appointment.servicePrice.toLocaleString('es-AR')}) + Productos ({settings.currencySymbol || '$'}{totalProductsPrice.toLocaleString('es-AR')}) = <strong className="text-amber-400 font-black text-sm">TOTAL FINAL: {settings.currencySymbol || '$'}{finalTotalPrice.toLocaleString('es-AR')}</strong>
              </span>
            </div>
          </div>

          <a
            id="order-products-whatsapp-btn"
            href={getCombinedWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.02] flex-shrink-0"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Confirmar Turno + Productos ({settings.currencySymbol || '$'}{finalTotalPrice.toLocaleString('es-AR')})</span>
          </a>
        </div>
      ) : (
        <div className="text-center pt-2 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
            Tocá el botón dorado <strong>"+ SUMAR AL TURNO"</strong> en cualquier producto para agregarlo al total final.
          </span>
          {onNavigateToProducts && (
            <button
              type="button"
              onClick={onNavigateToProducts}
              className="text-amber-400 hover:text-amber-300 font-bold cursor-pointer underline text-xs"
            >
              Explorar todo el stock →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
