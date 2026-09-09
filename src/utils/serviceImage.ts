export const SERVICE_FALLBACK_IMAGES: Record<string, string> = {
  corte: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
  corte_barba: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80',
  barba: 'https://images.unsplash.com/photo-1517832606589-7629c33971a6?auto=format&fit=crop&w=800&q=80',
  color: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80',
  default: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80',
};

export function getServiceFallback(serviceId?: string): string {
  if (!serviceId) return SERVICE_FALLBACK_IMAGES.default;
  return SERVICE_FALLBACK_IMAGES[serviceId] || SERVICE_FALLBACK_IMAGES.default;
}

export function resolveServiceImageUrl(imageUrl?: string, serviceId?: string): string {
  if (!imageUrl || imageUrl.trim() === '') {
    return getServiceFallback(serviceId);
  }
  return imageUrl;
}
