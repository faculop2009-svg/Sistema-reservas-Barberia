import React, { useState, useRef, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  Tag,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  ShoppingBag,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Edit3,
  Trash2,
  X,
  MessageCircle,
  Layers,
  Sparkles,
  Minus,
  Check,
  Filter,
} from 'lucide-react';
import { Product, BusinessSettings } from '../types.ts';
import { DEFAULT_PRODUCTS, DEFAULT_SETTINGS } from '../data/defaults.ts';
import {
  loadClientProducts,
  saveClientProducts,
  addClientProduct,
  updateClientProduct,
  updateClientProductStock,
  deleteClientProduct,
  loadClientSettings,
} from '../utils/clientStorage.ts';

interface ProductsSectionProps {
  products?: Product[];
  settings?: BusinessSettings;
  isAdmin?: boolean;
  whatsappNumber?: string;
  onAddProduct?: (productData: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  onUpdateProduct?: (id: string, updates: Partial<Product>) => Promise<void>;
  onUpdateStock?: (id: string, delta: number) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
  onProductsChange?: (products: Product[]) => void;
}

// Curated high quality presets for barber products so users can pick with 1 click
const PRODUCT_IMAGE_PRESETS = [
  {
    label: 'Pomada al Agua Brillo',
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80',
    category: 'Ceras y Pomadas',
  },
  {
    label: 'Cera Mate Arcilla',
    url: 'https://images.unsplash.com/photo-1597354984706-fac992d9306f?w=500&auto=format&fit=crop&q=80',
    category: 'Ceras y Pomadas',
  },
  {
    label: 'Aceite para Barba',
    url: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=500&auto=format&fit=crop&q=80',
    category: 'Cuidado de Barba',
  },
  {
    label: 'Bálsamo Aftershave',
    url: 'https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=500&auto=format&fit=crop&q=80',
    category: 'Afeitado',
  },
  {
    label: 'Shampoo Anticaída',
    url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=80',
    category: 'Shampoo & Capilar',
  },
  {
    label: 'Cepillo de Jabalí',
    url: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=500&auto=format&fit=crop&q=80',
    category: 'Accesorios',
  },
  {
    label: 'Peine de Madera',
    url: 'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=500&auto=format&fit=crop&q=80',
    category: 'Accesorios',
  },
  {
    label: 'Gel de Afeitar',
    url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80',
    category: 'Afeitado',
  },
  {
    label: 'Tónico Capilar',
    url: 'https://images.unsplash.com/photo-1608248597359-59749fb811a2?w=500&auto=format&fit=crop&q=80',
    category: 'Shampoo & Capilar',
  },
  {
    label: 'Navaja & Barber Tools',
    url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop&q=80',
    category: 'Accesorios',
  },
];

const PRESET_CATEGORIES = [
  'Ceras y Pomadas',
  'Cuidado de Barba',
  'Afeitado',
  'Shampoo & Capilar',
  'Accesorios',
  'Otros',
];

export const ProductsSection: React.FC<ProductsSectionProps> = ({
  products,
  settings,
  isAdmin = false,
  whatsappNumber,
  onAddProduct,
  onUpdateProduct,
  onUpdateStock,
  onDeleteProduct,
  onProductsChange,
}) => {
  const currentSettings = settings || loadClientSettings() || DEFAULT_SETTINGS;
  const [internalProducts, setInternalProducts] = useState<Product[]>(() => {
    if (products && products.length > 0) return products;
    return loadClientProducts();
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formCategory, setFormCategory] = useState('Ceras y Pomadas');
  const [formPrice, setFormPrice] = useState<number>(8500);
  const [formStock, setFormStock] = useState<number>(10);
  const [formMinAlert, setFormMinAlert] = useState<number>(3);
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'preset' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);

  // Sync with prop updates
  useEffect(() => {
    if (products && products.length > 0) {
      setInternalProducts(products);
    } else {
      const stored = loadClientProducts();
      setInternalProducts(stored);
    }
  }, [products]);

  // Sync with backend API
  useEffect(() => {
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setInternalProducts(data);
          saveClientProducts(data);
          if (onProductsChange) onProductsChange(data);
        }
      })
      .catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const categories = ['all', ...Array.from(new Set(internalProducts.map((p) => p.category).filter(Boolean)))];

  const filteredProducts = internalProducts.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  // Calculate stats
  const totalStockUnits = internalProducts.reduce((acc, p) => acc + (p.stock || 0), 0);
  const lowStockCount = internalProducts.filter((p) => (p.stock || 0) <= (p.minStockAlert || 3)).length;
  const totalValue = internalProducts.reduce((acc, p) => acc + (p.price || 0) * (p.stock || 0), 0);

  const handleOpenNewModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormBrand('');
    setFormCategory('Ceras y Pomadas');
    setFormPrice(8500);
    setFormStock(10);
    setFormMinAlert(3);
    setFormDescription('');
    setFormImageUrl(PRODUCT_IMAGE_PRESETS[0].url);
    setImageInputMode('upload');
    setShowModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormBrand(p.brand || '');
    setFormCategory(p.category || 'Ceras y Pomadas');
    setFormPrice(p.price);
    setFormStock(p.stock);
    setFormMinAlert(p.minStockAlert || 3);
    setFormDescription(p.description || '');
    setFormImageUrl(p.imageUrl || '');
    setImageInputMode('upload');
    setShowModal(true);
  };

  // Handle local file upload (converts to base64 DataURL for immediate use)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Por favor selecciona un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setFormImageUrl(result);
        showToast('¡Imagen cargada correctamente!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPrice) {
      showToast('Por favor completa el nombre y precio del producto.');
      return;
    }

    setIsSubmitting(true);
    try {
      const productPayload = {
        name: formName.trim(),
        brand: formBrand.trim() || undefined,
        category: formCategory,
        price: Number(formPrice),
        stock: Math.max(0, Number(formStock)),
        minStockAlert: Math.max(0, Number(formMinAlert)),
        description: formDescription.trim(),
        imageUrl: formImageUrl || PRODUCT_IMAGE_PRESETS[0].url,
      };

      if (editingProduct) {
        if (onUpdateProduct) {
          await onUpdateProduct(editingProduct.id, productPayload);
        } else {
          updateClientProduct(editingProduct.id, productPayload);
          try {
            const pin = currentSettings.adminPin || '1234';
            await fetch(`/api/products/${editingProduct.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
              body: JSON.stringify(productPayload),
            });
          } catch {}
          const updated = internalProducts.map((p) => (p.id === editingProduct.id ? { ...p, ...productPayload } : p));
          setInternalProducts(updated);
          if (onProductsChange) onProductsChange(updated);
        }
        showToast('Producto actualizado correctamente');
      } else {
        if (onAddProduct) {
          await onAddProduct(productPayload);
        } else {
          const newProd = addClientProduct(productPayload);
          try {
            const pin = currentSettings.adminPin || '1234';
            await fetch('/api/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
              body: JSON.stringify(productPayload),
            });
          } catch {}
          const updated = [newProd, ...internalProducts];
          setInternalProducts(updated);
          if (onProductsChange) onProductsChange(updated);
        }
        showToast('Producto agregado al inventario');
      }
      setShowModal(false);
    } catch (err: any) {
      showToast(err.message || 'Error al guardar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStockChange = async (p: Product, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (onUpdateStock) {
        await onUpdateStock(p.id, delta);
      } else {
        updateClientProductStock(p.id, delta);
        try {
          const pin = currentSettings.adminPin || '1234';
          await fetch(`/api/products/${p.id}/stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
            body: JSON.stringify({ delta }),
          });
        } catch {}
        const newStock = Math.max(0, p.stock + delta);
        const updated = internalProducts.map((item) => (item.id === p.id ? { ...item, stock: newStock } : item));
        setInternalProducts(updated);
        if (onProductsChange) onProductsChange(updated);
      }
      const newStock = Math.max(0, p.stock + delta);
      showToast(`Stock de "${p.name}" actualizado a ${newStock} unid.`);
    } catch (err) {
      showToast('Error al actualizar el stock');
    }
  };

  const handleDelete = async (p: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de eliminar "${p.name}" del catálogo?`)) {
      try {
        if (onDeleteProduct) {
          await onDeleteProduct(p.id);
        } else {
          deleteClientProduct(p.id);
          try {
            const pin = currentSettings.adminPin || '1234';
            await fetch(`/api/products/${p.id}`, {
              method: 'DELETE',
              headers: { 'x-admin-pin': pin },
            });
          } catch {}
          const updated = internalProducts.filter((item) => item.id !== p.id);
          setInternalProducts(updated);
          if (onProductsChange) onProductsChange(updated);
        }
        showToast('Producto eliminado');
      } catch (err) {
        showToast('Error al eliminar producto');
      }
    }
  };

  const getWhatsAppOrderUrl = (p: Product) => {
    const rawPhone = whatsappNumber || currentSettings.phone || '';
    const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    const text = `💈 *Consulta por Producto en ${currentSettings.shopName}*\n\nHola, me interesa comprar/reservar el siguiente producto:\n\n📦 *Producto:* ${p.name}\n🏷️ *Marca/Categoría:* ${p.brand ? p.brand + ' - ' : ''}${p.category}\n💵 *Precio:* ${currentSettings.currencySymbol || '$'}${p.price.toLocaleString('es-AR')}\n\n¿Tienen disponibilidad para pasar a retirar por la barbería? ¡Muchas gracias!`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-2">
              <Package className="w-3.5 h-3.5" />
              <span>Tienda & Cuidado Personal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-100 tracking-tight">
              Stock de Productos & Styling
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Pomadas al agua, ceras mate, aceites aromáticos para barba y accesorios profesionales de barbería. Consulta o reserva para retirar en tu visita.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {isAdmin && (
              <button
                type="button"
                id="btn-add-product"
                onClick={handleOpenNewModal}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Producto</span>
              </button>
            )}
          </div>
        </div>

        {/* Admin Inventory Quick Metrics */}
        {isAdmin && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-zinc-800/80">
            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
              <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                <Package className="w-3 h-3 text-zinc-500" />
                Total Productos
              </span>
              <p className="text-lg font-bold text-zinc-100 mt-0.5">{internalProducts.length}</p>
            </div>
            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
              <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                <Layers className="w-3 h-3 text-emerald-400" />
                Unidades en Stock
              </span>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">{totalStockUnits}</p>
            </div>
            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
              <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                Poco o Sin Stock
              </span>
              <p className={`text-lg font-bold mt-0.5 ${lowStockCount > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
                {lowStockCount}
              </p>
            </div>
            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
              <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                <Tag className="w-3 h-3 text-amber-500" />
                Valor Total Stock
              </span>
              <p className="text-lg font-bold text-zinc-100 mt-0.5">
                {currentSettings.currencySymbol || '$'}{totalValue.toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar producto, pomada, aceite, marca..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Categories Bar */}
        <div
          onWheel={(e) => {
            if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY;
          }}
          className="flex items-center gap-1.5 overflow-x-auto horizontal-scroll-container py-1 -mx-1 px-1"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm shadow-amber-500/20'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat === 'all' ? 'Todos los productos' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-10 text-center space-y-3">
          <Package className="w-12 h-12 text-zinc-600 mx-auto" />
          <p className="text-zinc-300 font-semibold text-sm">No se encontraron productos</p>
          <p className="text-zinc-500 text-xs max-w-sm mx-auto">
            {searchQuery
              ? `No hay coincidencias para "${searchQuery}". Intenta con otro término.`
              : 'Aún no hay productos registrados en esta categoría.'}
          </p>
          {isAdmin && (
            <button
              onClick={handleOpenNewModal}
              className="mt-2 px-4 py-2 bg-amber-500 text-zinc-950 text-xs font-bold rounded-xl"
            >
              + Agregar el primer producto
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            const isOutOfStock = (p.stock || 0) <= 0;
            const isLowStock = !isOutOfStock && (p.stock || 0) <= (p.minStockAlert || 3);

            return (
              <div
                key={p.id}
                id={`product-card-${p.id}`}
                className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
              >
                <div>
                  {/* Product Image Box */}
                  <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80';
                      }}
                    />

                    {/* Category pill */}
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-lg bg-zinc-950/80 backdrop-blur-md text-[10px] font-bold text-zinc-300 border border-zinc-700/50">
                      {p.category}
                    </span>

                    {/* Stock Status Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      {isOutOfStock ? (
                        <span className="px-2.5 py-0.5 rounded-lg bg-red-500/90 text-zinc-950 text-[10px] font-extrabold shadow-sm">
                          Sin Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/90 text-zinc-950 text-[10px] font-extrabold shadow-sm animate-pulse">
                          ¡Últimas {p.stock} unid!
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/90 text-zinc-950 text-[10px] font-bold shadow-sm">
                          {p.stock} en stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-2">
                    {p.brand && (
                      <p className="text-[11px] font-semibold text-amber-400 tracking-wide uppercase">
                        {p.brand}
                      </p>
                    )}
                    <h3 className="text-sm font-bold text-zinc-100 leading-snug line-clamp-2">
                      {p.name}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {p.description || 'Producto premium para cuidado y estilo en barbería.'}
                    </p>
                  </div>
                </div>

                {/* Footer and Actions */}
                <div className="p-4 pt-2 border-t border-zinc-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 font-medium block">Precio</span>
                      <span className="text-base font-extrabold text-amber-400">
                        {currentSettings.currencySymbol || '$'}{p.price.toLocaleString('es-AR')}
                      </span>
                    </div>

                    {/* Quick Stock Controls for Admin */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={(e) => handleQuickStockChange(p, -1, e)}
                          title="Restar 1 unidad vendida"
                          disabled={p.stock <= 0}
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-zinc-200 px-1.5 min-w-[20px] text-center">
                          {p.stock}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleQuickStockChange(p, 1, e)}
                          title="Sumar 1 unidad al stock"
                          className="w-6 h-6 flex items-center justify-center rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-2 pt-1">
                    {/* Client WhatsApp Inquiry */}
                    <a
                      href={getWhatsAppOrderUrl(p)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Consultar / Encargar</span>
                    </a>

                    {/* Admin Edit & Delete buttons */}
                    {isAdmin && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(p)}
                          title="Editar producto"
                          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(p, e)}
                          title="Eliminar producto"
                          className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 sm:p-7 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-100">
                    {editingProduct ? 'Editar Producto' : 'Registrar Nuevo Producto'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {editingProduct
                      ? 'Actualiza el precio, stock o datos del artículo'
                      : 'Agrega un artículo al catálogo para venta en la barbería'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Pomada Modeladora Brillo Fuerte 100g"
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Brand and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Marca / Fabricante
                  </label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="Ej. Suavecito / Barber Club"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Categoría *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                  >
                    {PRESET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price, Stock and Min Alert */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Precio ({currentSettings.currencySymbol || '$'}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Cantidad en Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Alerta Stock Mínimo
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMinAlert}
                    onChange={(e) => setFormMinAlert(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Descripción del Producto
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detalles sobre beneficios, fijación, modo de uso o aroma..."
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* EASY IMAGE SELECTOR SECTION ("donde se puedan poner imágenes fácilmente") */}
              <div className="space-y-2.5 p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Foto del Producto (Fácil y Rápido)</span>
                  </label>
                  <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      className={`px-2 py-1 rounded-md transition-colors ${
                        imageInputMode === 'upload' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400'
                      }`}
                    >
                      Subir archivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('preset')}
                      className={`px-2 py-1 rounded-md transition-colors ${
                        imageInputMode === 'preset' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400'
                      }`}
                    >
                      Fotos Pro (1-Click)
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`px-2 py-1 rounded-md transition-colors ${
                        imageInputMode === 'url' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400'
                      }`}
                    >
                      Pegar URL
                    </button>
                  </div>
                </div>

                {/* Mode 1: Local file upload & Drag and Drop */}
                {imageInputMode === 'upload' && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-amber-500 bg-amber-500/10'
                        : 'border-zinc-700/80 bg-zinc-900/40 hover:border-amber-500/60 hover:bg-zinc-900'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <Upload className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-zinc-200">
                      Haz clic para elegir foto o arrastra una imagen aquí
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Soporta JPG, PNG, WebP desde tu computadora o celular
                    </p>
                  </div>
                )}

                {/* Mode 2: Presets gallery (1-click select) */}
                {imageInputMode === 'preset' && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-zinc-400">
                      Toca cualquier foto profesional de barbería para asignarla inmediatamente:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                      {PRODUCT_IMAGE_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormImageUrl(preset.url)}
                          className={`relative rounded-xl overflow-hidden border text-left p-1 group transition-all ${
                            formImageUrl === preset.url
                              ? 'border-amber-500 ring-2 ring-amber-500/40'
                              : 'border-zinc-800 hover:border-zinc-600'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-full h-16 object-cover rounded-lg"
                          />
                          <p className="text-[10px] text-zinc-300 font-medium truncate mt-1">
                            {preset.label}
                          </p>
                          {formImageUrl === preset.url && (
                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mode 3: Paste URL */}
                {imageInputMode === 'url' && (
                  <div>
                    <input
                      type="url"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... o enlace directo de imagen"
                      className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                {/* Live Preview Box */}
                {formImageUrl && (
                  <div className="flex items-center gap-3 pt-2 border-t border-zinc-800/80">
                    <img
                      src={formImageUrl}
                      alt="Vista previa"
                      className="w-16 h-16 object-cover rounded-xl border border-zinc-700 bg-zinc-950 flex-shrink-0"
                      onError={() => showToast('No se pudo cargar la imagen desde esa URL')}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-200">Vista previa de la imagen</p>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {formImageUrl.startsWith('data:') ? 'Imagen cargada localmente' : formImageUrl}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="text-xs text-red-400 hover:text-red-300 p-1"
                    >
                      Quitar
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingProduct ? 'Guardar Cambios' : 'Registrar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-zinc-900 border border-amber-500/40 text-zinc-100 text-xs font-semibold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};
