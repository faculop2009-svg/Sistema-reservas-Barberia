import React, { useState, useMemo, useEffect } from 'react';
import {
  Star,
  ThumbsUp,
  CheckCircle,
  MessageSquare,
  Search,
  Plus,
  Filter,
  X,
  Sparkles,
  Scissors,
  User,
  Calendar,
  CornerDownRight,
  Trash2,
  Send,
  SlidersHorizontal,
  ChevronDown,
  ShieldCheck,
  AlertCircle,
  Edit3,
  KeyRound,
  Check,
  HeartHandshake,
  ShieldAlert,
  RotateCcw,
  BadgeCheck,
  ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { Review, BarberService, Barber, BusinessSettings } from '../types.ts';
import { getMyCreatedReviewIds } from '../utils/clientStorage.ts';

interface ReviewsSectionProps {
  reviews: Review[];
  services: BarberService[];
  barbers: Barber[];
  settings: BusinessSettings;
  isAdmin: boolean;
  onAddReview: (payload: {
    clientName: string;
    rating: number;
    comment: string;
    serviceId?: string;
    barberId?: string;
    tags?: string[];
  }) => Promise<void>;
  onLikeReview: (reviewId: string) => void;
  onReplyReview?: (reviewId: string, replyText: string, providedPin?: string) => Promise<void>;
  onDeleteReviewReply?: (reviewId: string, providedPin?: string) => Promise<void>;
  onDeleteReview?: (reviewId: string, providedPin?: string) => Promise<boolean>;
  onBookClick: () => void;
}

const AVAILABLE_TAGS = [
  'Puntualidad impecable',
  'Degradé perfecto',
  'Toalla caliente',
  'Atención de 10',
  'Navaja tradicional',
  'Ambiente y música',
  'Asesoramiento',
  'Higiene impecable',
  'Buen café',
  'Recomendado 100%',
];

// Helper: Normalize accents for robust search
function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

// Helper: Format ISO date string into friendly Spanish display
function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (dateStr === todayStr) {
      return 'Hoy';
    }

    const yesterday = new Date(now.getTime() - 86400000);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    if (dateStr === yesterdayStr) {
      return 'Ayer';
    }

    const months = [
      'ene', 'feb', 'mar', 'abr', 'may', 'jun',
      'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
    ];
    return `${day} ${months[month - 1]}. ${year}`;
  } catch {
    return dateStr;
  }
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  reviews,
  services,
  barbers,
  settings,
  isAdmin,
  onAddReview,
  onLikeReview,
  onReplyReview,
  onDeleteReviewReply,
  onDeleteReview,
  onBookClick,
}) => {
  // Filters and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | 'all'>('all');
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string>('all');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'helpful'>('newest');
  const [onlyWithReply, setOnlyWithReply] = useState(false);
  const [onlyMyReviews, setOnlyMyReviews] = useState(false);

  // Pagination / Load more
  const [visibleCount, setVisibleCount] = useState(6);

  // Add review modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [formRating, setFormRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [formName, setFormName] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formServiceId, setFormServiceId] = useState('');
  const [formBarberId, setFormBarberId] = useState('');
  const [formTags, setFormTags] = useState<string[]>(['Puntualidad impecable', 'Atención de 10']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Dynamic In-App Deletion Modal State
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [deletePinInput, setDeletePinInput] = useState('');
  const [deletePinError, setDeletePinError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Dynamic Reply State
  const [replyingReview, setReplyingReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyPinInput, setReplyPinInput] = useState('');
  const [replyPinError, setReplyPinError] = useState<string | null>(null);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Delete Reply Confirmation State
  const [deleteReplyTarget, setDeleteReplyTarget] = useState<Review | null>(null);
  const [isDeletingReply, setIsDeletingReply] = useState(false);

  // Local likes tracking
  const [likedReviews, setLikedReviews] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('barber_liked_reviews');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Client-authored review IDs
  const [myReviewIds, setMyReviewIds] = useState<string[]>([]);
  useEffect(() => {
    setMyReviewIds(getMyCreatedReviewIds());
  }, [reviews]);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Calculate dynamic summary metrics
  const summary = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return {
        average: 5.0,
        total: 0,
        percentRecommended: 100,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    let positive = 0;

    for (const r of reviews) {
      const star = Math.max(1, Math.min(5, Math.round(r.rating)));
      dist[star] = (dist[star] || 0) + 1;
      sum += r.rating;
      if (r.rating >= 4) positive++;
    }

    const avg = Number((sum / total).toFixed(1));
    const percentRec = Math.round((positive / total) * 100);

    return {
      average: avg,
      total,
      percentRecommended: percentRec,
      distribution: dist,
    };
  }, [reviews]);

  // Filter and sort reviews with normalized search & flexible matching
  const filteredReviews = useMemo(() => {
    return reviews
      .filter((r) => {
        // Author filter
        if (onlyMyReviews) {
          if (!myReviewIds.includes(r.id) && !r.id.startsWith('rev-local-')) {
            return false;
          }
        }

        // Search query (accent-insensitive)
        if (searchQuery.trim()) {
          const q = normalizeSearchText(searchQuery);
          const matchesName = normalizeSearchText(r.clientName).includes(q);
          const matchesComment = normalizeSearchText(r.comment).includes(q);
          const matchesBarber = r.barberName ? normalizeSearchText(r.barberName).includes(q) : false;
          const matchesService = r.serviceName ? normalizeSearchText(r.serviceName).includes(q) : false;
          const matchesTag = r.tags?.some((t) => normalizeSearchText(t).includes(q)) || false;
          const matchesReply = r.ownerReply?.text ? normalizeSearchText(r.ownerReply.text).includes(q) : false;

          if (!matchesName && !matchesComment && !matchesBarber && !matchesService && !matchesTag && !matchesReply) {
            return false;
          }
        }

        // Rating filter
        if (selectedRatingFilter !== 'all') {
          if (Math.round(r.rating) !== selectedRatingFilter) {
            return false;
          }
        }

        // Barber filter (robust ID & name matching)
        if (selectedBarberFilter !== 'all') {
          const targetBarber = barbers.find((b) => b.id === selectedBarberFilter);
          const matchesId = r.barberId === selectedBarberFilter;
          const matchesName = targetBarber && r.barberName && targetBarber.name.toLowerCase() === r.barberName.toLowerCase();
          if (!matchesId && !matchesName) {
            return false;
          }
        }

        // Service filter (robust ID & name matching)
        if (selectedServiceFilter !== 'all') {
          const targetService = services.find((s) => s.id === selectedServiceFilter);
          const matchesId = r.serviceId === selectedServiceFilter;
          const matchesName = targetService && r.serviceName && targetService.name.toLowerCase() === r.serviceName.toLowerCase();
          if (!matchesId && !matchesName) {
            return false;
          }
        }

        // Only with owner reply filter
        if (onlyWithReply) {
          if (!r.ownerReply) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === 'highest') {
          return b.rating - a.rating;
        }
        if (sortBy === 'helpful') {
          return (b.likesCount || 0) - (a.likesCount || 0);
        }
        return 0;
      });
  }, [
    reviews,
    searchQuery,
    selectedRatingFilter,
    selectedBarberFilter,
    selectedServiceFilter,
    sortBy,
    onlyWithReply,
    onlyMyReviews,
    myReviewIds,
    barbers,
    services,
  ]);

  const displayedReviews = useMemo(() => {
    return filteredReviews.slice(0, visibleCount);
  }, [filteredReviews, visibleCount]);

  const handleLike = (id: string) => {
    if (likedReviews[id]) return;
    onLikeReview(id);
    const updated = { ...likedReviews, [id]: true };
    setLikedReviews(updated);
    try {
      localStorage.setItem('barber_liked_reviews', JSON.stringify(updated));
    } catch {}
    showToast('¡Gracias por tu valoración!', 'info');
  };

  const handleToggleTag = (tag: string) => {
    if (formTags.includes(tag)) {
      setFormTags(formTags.filter((t) => t !== tag));
    } else {
      setFormTags([...formTags, tag]);
    }
  };

  // Create review submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Por favor ingresa tu nombre o apodo.');
      return;
    }
    if (!formComment.trim() || formComment.trim().length < 5) {
      setFormError('El comentario debe tener al menos 5 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddReview({
        clientName: formName.trim(),
        rating: formRating,
        comment: formComment.trim(),
        serviceId: formServiceId || undefined,
        barberId: formBarberId || undefined,
        tags: formTags.length > 0 ? formTags : undefined,
      });

      setSubmitSuccess(true);
      showToast('✓ Reseña publicada con éxito');
      setTimeout(() => {
        setShowAddModal(false);
        setSubmitSuccess(false);
        setFormName('');
        setFormComment('');
        setFormRating(5);
        setFormServiceId('');
        setFormBarberId('');
        setFormTags(['Puntualidad impecable', 'Atención de 10']);
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar la reseña. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic In-App Deletion
  const handleConfirmDelete = async () => {
    if (!deleteTarget || !onDeleteReview) return;
    setDeletePinError(null);

    const isAuthor = myReviewIds.includes(deleteTarget.id) || deleteTarget.id.startsWith('rev-local-');
    const validPin = (settings.adminPin || '1234').trim();

    // Check authorization
    if (!isAuthor && !isAdmin) {
      if (!deletePinInput.trim()) {
        setDeletePinError('Ingresa el PIN de administrador para continuar.');
        return;
      }
      if (deletePinInput.trim() !== validPin) {
        setDeletePinError('PIN incorrecto. El PIN predeterminado es 1234.');
        return;
      }
    }

    const targetId = deleteTarget.id;
    const authorName = deleteTarget.clientName;

    setIsDeleting(true);
    setDeletingId(targetId);

    try {
      await onDeleteReview(targetId, deletePinInput.trim());
      setDeleteTarget(null);
      setDeletePinInput('');
      showToast(`✓ Reseña de "${authorName}" eliminada.`);
    } catch (err: any) {
      setDeletePinError(err.message || 'No se pudo eliminar la reseña.');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  // Dynamic Reply Submission
  const handleSendReply = async () => {
    if (!replyingReview || !replyText.trim() || !onReplyReview) return;
    setReplyPinError(null);

    const validPin = (settings.adminPin || '1234').trim();
    if (!isAdmin) {
      if (!replyPinInput.trim()) {
        setReplyPinError('Ingresa el PIN de administrador para responder.');
        return;
      }
      if (replyPinInput.trim() !== validPin) {
        setReplyPinError('PIN incorrecto. El PIN predeterminado es 1234.');
        return;
      }
    }

    setIsSubmittingReply(true);
    try {
      await onReplyReview(replyingReview.id, replyText.trim(), replyPinInput.trim());
      showToast('✓ Respuesta oficial publicada.');
      setReplyingReview(null);
      setReplyText('');
      setReplyPinInput('');
    } catch (err: any) {
      setReplyPinError(err.message || 'Error al guardar la respuesta.');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Dynamic Reply Deletion
  const handleConfirmDeleteReply = async () => {
    if (!deleteReplyTarget || !onDeleteReviewReply) return;
    setIsDeletingReply(true);
    try {
      await onDeleteReviewReply(deleteReplyTarget.id);
      showToast('✓ Respuesta eliminada.');
      setDeleteReplyTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingReply(false);
    }
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return '¡Excelente! Servicio impecable';
      case 4:
        return 'Muy bueno, recomendable';
      case 3:
        return 'Bueno / Conforme';
      case 2:
        return 'Regular';
      case 1:
        return 'Malo';
      default:
        return '';
    }
  };

  const activeFiltersCount =
    (selectedRatingFilter !== 'all' ? 1 : 0) +
    (selectedBarberFilter !== 'all' ? 1 : 0) +
    (selectedServiceFilter !== 'all' ? 1 : 0) +
    (onlyWithReply ? 1 : 0) +
    (onlyMyReviews ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedRatingFilter('all');
    setSelectedBarberFilter('all');
    setSelectedServiceFilter('all');
    setOnlyWithReply(false);
    setOnlyMyReviews(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md text-xs font-semibold ${
              toast.type === 'error'
                ? 'bg-red-950/90 border-red-500/40 text-red-200'
                : toast.type === 'info'
                ? 'bg-zinc-900/90 border-amber-500/40 text-amber-200'
                : 'bg-zinc-900/95 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-zinc-400 hover:text-zinc-200 ml-1 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-amber-500 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Opiniones & Experiencias Reales
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-zinc-100 tracking-tight">
              Reseñas de Clientes en {settings.shopName}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              La confianza de nuestra comunidad es nuestra mejor carta de presentación. Conoce los comentarios sobre la
              calidad de los cortes, el ritual de afeitado y la puntualidad de cada turno.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              id="btn-open-review-modal"
              type="button"
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 flex-shrink-0 group"
            >
              <Plus className="w-4 h-4 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
              <span>Dejar mi Reseña</span>
            </button>
          </div>
        </div>
      </div>

      {/* METRIC SUMMARY DASHBOARD CARD (DYNAMICALLY UPDATED) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 bg-zinc-900/70 border border-zinc-800/80 rounded-3xl p-6 sm:p-7 shadow-lg backdrop-blur-sm">
        {/* Score Column */}
        <div className="md:col-span-4 flex flex-col justify-center items-center text-center p-4 border-b md:border-b-0 md:border-r border-zinc-800/80">
          <div className="text-5xl sm:text-6xl font-black text-zinc-100 tracking-tight flex items-baseline gap-1">
            <span>{summary.average.toFixed(1)}</span>
            <span className="text-xl sm:text-2xl text-zinc-500 font-semibold">/ 5</span>
          </div>

          <div className="flex items-center gap-1 my-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-5 h-5 ${
                  s <= Math.round(summary.average)
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-zinc-700'
                }`}
              />
            ))}
          </div>

          <p className="text-xs text-zinc-400 font-medium">
            Basado en <span className="font-bold text-zinc-200">{summary.total}</span>{' '}
            {summary.total === 1 ? 'opinión verificada' : 'opiniones verificadas'}
          </p>

          <div className="mt-4 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
            <BadgeCheck className="w-4 h-4" />
            <span>{summary.percentRecommended}% de recomendaciones positivas</span>
          </div>
        </div>

        {/* Star Distribution Progress Bars */}
        <div className="md:col-span-8 flex flex-col justify-center gap-2.5 p-2 sm:p-4">
          <div className="text-xs font-semibold text-zinc-400 mb-1 flex items-center justify-between">
            <span>Distribución de calificaciones</span>
            {selectedRatingFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedRatingFilter('all')}
                className="text-amber-400 hover:underline text-[11px]"
              >
                Ver todas las estrellas
              </button>
            )}
          </div>

          {[5, 4, 3, 2, 1].map((stars) => {
            const count = summary.distribution[stars] || 0;
            const percentage = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
            const isSelected = selectedRatingFilter === stars;

            return (
              <button
                key={stars}
                type="button"
                onClick={() => setSelectedRatingFilter(isSelected ? 'all' : stars)}
                className={`w-full flex items-center gap-3 group text-left p-1 rounded-xl transition-all ${
                  isSelected ? 'bg-amber-500/10 ring-1 ring-amber-500/30' : 'hover:bg-zinc-800/40'
                }`}
              >
                <div className="flex items-center gap-1 w-12 flex-shrink-0 text-xs font-medium text-zinc-300">
                  <span>{stars}</span>
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>

                <div className="flex-1 h-2.5 bg-zinc-800 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isSelected
                        ? 'bg-amber-400'
                        : stars >= 4
                        ? 'bg-amber-500 group-hover:bg-amber-400'
                        : stars === 3
                        ? 'bg-zinc-500'
                        : 'bg-zinc-600'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="w-16 text-right flex-shrink-0 text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-300">{count}</span>
                  <span className="text-[10px] text-zinc-500 ml-1">({percentage}%)</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER CONTROLS & SEARCH BAR */}
      <div className="space-y-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="input-reviews-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por cliente, comentario, barbero, corte..."
                className="w-full pl-9 pr-9 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Barber Select */}
            <div className="md:col-span-3">
              <select
                id="select-reviews-barber"
                value={selectedBarberFilter}
                onChange={(e) => setSelectedBarberFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500/50"
              >
                <option value="all">Todos los barberos</option>
                {barbers
                  .filter((b) => b.id !== 'barber-any')
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Service Select */}
            <div className="md:col-span-2">
              <select
                id="select-reviews-service"
                value={selectedServiceFilter}
                onChange={(e) => setSelectedServiceFilter(e.target.value)}
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500/50"
              >
                <option value="all">Todos los servicios</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="md:col-span-2">
              <div className="relative">
                <select
                  id="select-reviews-sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500/50 font-medium"
                >
                  <option value="newest">Más recientes</option>
                  <option value="highest">Mayor puntaje (5★)</option>
                  <option value="helpful">Más útiles</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Filter Toggles & Active Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Only with reply button */}
              <button
                type="button"
                onClick={() => setOnlyWithReply(!onlyWithReply)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  onlyWithReply
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Con respuesta de la barbería</span>
              </button>

              {/* My reviews button */}
              {myReviewIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setOnlyMyReviews(!onlyMyReviews)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    onlyMyReviews
                      ? 'bg-amber-500 text-zinc-950 border-amber-500'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Mis reseñas ({myReviewIds.length})</span>
                </button>
              )}

              {/* Reset button if filters are active */}
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-zinc-400 hover:text-red-400 text-xs flex items-center gap-1 px-2 py-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpiar filtros ({activeFiltersCount})</span>
                </button>
              )}
            </div>

            <div className="text-zinc-500 text-xs">
              Mostrando <span className="text-zinc-200 font-semibold">{filteredReviews.length}</span>{' '}
              {filteredReviews.length === 1 ? 'reseña' : 'reseñas'}
            </div>
          </div>
        </div>

        {/* ACTIVE FILTER CHIPS (IF ANY) */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-zinc-500 mr-1">Filtros activos:</span>
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-[11px] border border-zinc-700/50">
                Texto: "{searchQuery}"
                <button type="button" onClick={() => setSearchQuery('')} className="hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedRatingFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] border border-amber-500/40">
                {selectedRatingFilter} Estrellas
                <button type="button" onClick={() => setSelectedRatingFilter('all')} className="hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedBarberFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-[11px] border border-zinc-700/50">
                Barbero: {barbers.find((b) => b.id === selectedBarberFilter)?.name}
                <button type="button" onClick={() => setSelectedBarberFilter('all')} className="hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedServiceFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-[11px] border border-zinc-700/50">
                Servicio: {services.find((s) => s.id === selectedServiceFilter)?.name}
                <button type="button" onClick={() => setSelectedServiceFilter('all')} className="hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {onlyWithReply && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-[11px] border border-zinc-700/50">
                Con respuesta
                <button type="button" onClick={() => setOnlyWithReply(false)} className="hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {onlyMyReviews && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] border border-amber-500/40">
                Mis reseñas
                <button type="button" onClick={() => setOnlyMyReviews(false)} className="hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* REVIEWS LIST */}
      {filteredReviews.length === 0 ? (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-zinc-200">No encontramos reseñas con esos criterios</h3>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
            Prueba ajustando el texto de búsqueda o quitando los filtros de estrellas y barberos.
          </p>
          <button
            type="button"
            onClick={resetAllFilters}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-all inline-flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer filtros</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedReviews.map((rev) => {
              const isLiked = !!likedReviews[rev.id];
              const isMyReview = myReviewIds.includes(rev.id) || rev.id.startsWith('rev-local-');
              const isBeingDeleted = deletingId === rev.id;

              return (
                <div
                  key={rev.id}
                  id={`review-card-${rev.id}`}
                  className={`bg-zinc-900 border rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-sm transition-all duration-300 ${
                    isBeingDeleted
                      ? 'opacity-0 scale-95 pointer-events-none'
                      : isMyReview
                      ? 'border-amber-500/40 bg-zinc-900/95 ring-1 ring-amber-500/20'
                      : 'border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Author & Rating Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner ${
                            isMyReview
                              ? 'bg-amber-500 text-zinc-950 font-black'
                              : 'bg-zinc-800 text-amber-400 border border-zinc-700'
                          }`}
                        >
                          {rev.clientName.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-zinc-100 text-sm">{rev.clientName}</span>
                            {isMyReview && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                                Tu reseña
                              </span>
                            )}
                            {rev.verifiedClient && !isMyReview && (
                              <span
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium"
                                title="Cliente con turno completado y verificado"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Verificado</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {formatDisplayDate(rev.date)}
                          </span>
                        </div>
                      </div>

                      {/* Stars badge */}
                      <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 flex-shrink-0">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-bold text-zinc-200">{rev.rating}</span>
                      </div>
                    </div>

                    {/* Metadata tags (Service & Barber) */}
                    {(rev.serviceName || rev.barberName) && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        {rev.serviceName && (
                          <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 flex items-center gap-1">
                            <Scissors className="w-3 h-3 text-amber-400" />
                            {rev.serviceName}
                          </span>
                        )}
                        {rev.barberName && (
                          <span className="px-2 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 flex items-center gap-1">
                            <User className="w-3 h-3 text-amber-400" />
                            {rev.barberName}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Comment Body */}
                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                      "{rev.comment}"
                    </p>

                    {/* Tags Pills */}
                    {rev.tags && rev.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {rev.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-full bg-zinc-950 border border-zinc-800 text-zinc-400 text-[10px] font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Barber Shop Official Reply (if any) */}
                    {rev.ownerReply && (
                      <div className="mt-3 p-3 rounded-xl bg-zinc-950/80 border border-amber-500/20 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                            <CornerDownRight className="w-3.5 h-3.5" />
                            <span>Respuesta de {rev.ownerReply.author || settings.shopName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500">
                              {formatDisplayDate(rev.ownerReply.date)}
                            </span>
                            {isAdmin && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReplyingReview(rev);
                                    setReplyText(rev.ownerReply?.text || '');
                                  }}
                                  className="text-zinc-500 hover:text-amber-400 p-0.5"
                                  title="Editar respuesta"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteReplyTarget(rev)}
                                  className="text-zinc-500 hover:text-red-400 p-0.5"
                                  title="Eliminar respuesta"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-zinc-300 pl-5 leading-relaxed font-normal">
                          {rev.ownerReply.text}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    {/* Helpful Like Button */}
                    <button
                      type="button"
                      onClick={() => handleLike(rev.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                        isLiked
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-zinc-800/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="¿Te pareció útil esta opinión?"
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                      <span>Útil ({rev.likesCount || 0})</span>
                    </button>

                    {/* Action Buttons: Reply and Delete */}
                    <div className="flex items-center gap-2">
                      {/* Reply Button (Admin or shop staff) */}
                      {!rev.ownerReply && onReplyReview && (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingReview(rev);
                            setReplyText('');
                            setReplyPinInput('');
                            setReplyPinError(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                          title="Responder como barbería"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Responder</span>
                        </button>
                      )}

                      {/* Delete Review Button */}
                      {onDeleteReview && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget(rev);
                            setDeletePinInput('');
                            setDeletePinError(null);
                          }}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                            isMyReview
                              ? 'text-red-400 hover:bg-red-500/10 text-[11px] font-medium'
                              : 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10'
                          }`}
                          title={isMyReview ? 'Borrar mi reseña' : 'Eliminar reseña'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {isMyReview && <span>Borrar</span>}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Load More Pagination Button */}
          {filteredReviews.length > visibleCount && (
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 6)}
                className="w-full sm:w-auto px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Cargar más opiniones ({filteredReviews.length - visibleCount} restantes)
              </button>
              <button
                type="button"
                onClick={() => setVisibleCount(filteredReviews.length)}
                className="text-xs text-zinc-400 hover:text-amber-400 underline transition-colors"
              >
                Mostrar todas ({filteredReviews.length})
              </button>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM CTA: INVITE TO BOOK */}
      <div className="mt-10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
        <div className="max-w-xl mx-auto space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
            ¿Listo para vivir la experiencia {settings.shopName}?
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400">
            Únete a cientos de clientes satisfechos. Elige a tu barbero de confianza y reserva tu turno en menos de 1 minuto sin registro previo.
          </p>
        </div>

        <button
          type="button"
          id="btn-reviews-cta-book"
          onClick={onBookClick}
          className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm shadow-xl shadow-amber-500/20 hover:scale-105 transition-all inline-flex items-center gap-2"
        >
          <Scissors className="w-4 h-4 stroke-[2.5]" />
          <span>Reservar mi Turno Ahora</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: DYNAMIC IN-APP REVIEW DELETION MODAL */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-100">¿Eliminar esta reseña?</h3>
                  <p className="text-xs text-zinc-400">Esta acción no se puede deshacer.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeletePinInput('');
                  setDeletePinError(null);
                }}
                className="w-8 h-8 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Review Preview Card */}
            <div className="p-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-zinc-200">{deleteTarget.clientName}</span>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="font-bold">{deleteTarget.rating}</span>
                </div>
              </div>
              <p className="text-zinc-400 italic line-clamp-3">"{deleteTarget.comment}"</p>
            </div>

            {/* Authentication Notice / PIN input */}
            {myReviewIds.includes(deleteTarget.id) || deleteTarget.id.startsWith('rev-local-') || isAdmin ? (
              <div className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/40 text-xs text-zinc-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  {isAdmin
                    ? 'Sesión de administrador activa. Puedes eliminar esta reseña de forma permanente.'
                    : 'Esta es tu propia reseña. Puedes eliminarla inmediatamente.'}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span>Introduce el PIN de Administrador</span>
                </label>
                <input
                  type="password"
                  value={deletePinInput}
                  onChange={(e) => {
                    setDeletePinInput(e.target.value);
                    setDeletePinError(null);
                  }}
                  placeholder="PIN de administrador (ej. 1234)"
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                  autoFocus
                />
                <p className="text-[11px] text-zinc-500">
                  Para proteger las opiniones de clientes, se requiere el PIN de la barbería.
                </p>
              </div>
            )}

            {deletePinError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{deletePinError}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeletePinInput('');
                  setDeletePinError(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-red-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Eliminando...' : 'Sí, eliminar reseña'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: IN-APP OFFICIAL REPLY MODAL */}
      {/* ========================================================= */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-black text-zinc-100">
                    Responder a {replyingReview.clientName}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    La respuesta se mostrará públicamente bajo el nombre de {settings.shopName}.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingReview(null)}
                className="w-8 h-8 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Client comment excerpt */}
            <div className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-xs text-zinc-400 italic">
              "{replyingReview.comment}"
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-300">Mensaje de respuesta:</label>
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Ej. ¡Muchas gracias por tu visita y comentario, Lucas! Nos alegra que hayas disfrutado el ritual..."
                className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                autoFocus
              />
            </div>

            {!isAdmin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                  <span>PIN de Administrador</span>
                </label>
                <input
                  type="password"
                  value={replyPinInput}
                  onChange={(e) => {
                    setReplyPinInput(e.target.value);
                    setReplyPinError(null);
                  }}
                  placeholder="PIN de administrador (ej. 1234)"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            )}

            {replyPinError && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs">
                {replyPinError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setReplyingReview(null)}
                disabled={isSubmittingReply}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendReply}
                disabled={isSubmittingReply || !replyText.trim()}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingReply ? 'Publicando...' : 'Publicar Respuesta'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: DELETE REPLY CONFIRMATION */}
      {/* ========================================================= */}
      {deleteReplyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-black text-zinc-100">¿Eliminar respuesta oficial?</h3>
            <p className="text-xs text-zinc-400">
              Se quitará la respuesta oficial de la barbería para la reseña de {deleteReplyTarget.clientName}.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setDeleteReplyTarget(null)}
                disabled={isDeletingReply}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteReply}
                disabled={isDeletingReply}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-red-600/20 disabled:opacity-50"
              >
                {isDeletingReply ? 'Borrando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: ADD REVIEW MODAL */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div>
                <h3 className="text-lg font-black text-zinc-100 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span>Dejar una Reseña</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tu opinión nos ayuda a seguir mejorando y orienta a otros clientes.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-zinc-100">¡Muchas gracias por tu reseña!</h4>
                <p className="text-xs text-zinc-400">
                  Ha sido publicada exitosamente y ya es visible en la lista de opiniones.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {formError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs">
                    {formError}
                  </div>
                )}

                {/* Rating Selector */}
                <div className="space-y-1.5 text-center bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                    ¿Cómo calificarías tu experiencia?
                  </label>

                  <div className="flex items-center justify-center gap-2 py-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = star <= (hoverRating || formRating);
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-1 text-zinc-600 hover:scale-110 transition-transform focus:outline-none"
                        >
                          <Star
                            className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                              isFilled
                                ? 'text-amber-400 fill-amber-400 filter drop-shadow(0 0 4px rgba(251,191,36,0.5))'
                                : 'text-zinc-700'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs font-semibold text-amber-400">
                    {getRatingLabel(hoverRating || formRating)}
                  </p>
                </div>

                {/* Client Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Tu Nombre o Apodo <span className="text-amber-500">*</span>
                  </label>
                  <input
                    id="review-form-name"
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej. Lucas Fernández"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                {/* Service & Barber */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">
                      Servicio recibido (opcional)
                    </label>
                    <select
                      value={formServiceId}
                      onChange={(e) => setFormServiceId(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="">Seleccionar servicio...</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400">
                      Barbero que te atendió (opcional)
                    </label>
                    <select
                      value={formBarberId}
                      onChange={(e) => setFormBarberId(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-amber-500/50"
                    >
                      <option value="">Seleccionar barbero...</option>
                      {barbers
                        .filter((b) => b.id !== 'barber-any')
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Comment Textarea */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-300">
                    Tu Comentario <span className="text-amber-500">*</span>
                  </label>
                  <textarea
                    id="review-form-comment"
                    required
                    rows={3}
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="Cuéntanos qué te pareció el corte, la puntualidad, la atención o el ambiente..."
                    className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                {/* Quick Tags Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 block">
                    ¿Qué aspectos destacarías? (toca para elegir)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_TAGS.map((tag) => {
                      const isSelected = formTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                              : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Cancelar
                  </button>

                  <button
                    id="btn-submit-new-review"
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Publicando...' : 'Publicar Reseña'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
