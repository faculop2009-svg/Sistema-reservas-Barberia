import express from 'express';
import path from 'path';
import { execSync } from 'child_process';
import { createServer as createViteServer } from 'vite';
import {
  loadSettings,
  saveSettings,
  loadAppointments,
  saveAppointments,
  loadBarbers,
  saveBarbers,
  createBarber,
  updateBarber,
  deleteBarber,
  loadServices,
  saveServices,
  updateService,
  createService,
  deleteService,
  loadCalendarBlocks,
  toggleSlotBlock,
  toggleDayBlock,
  getAvailableSlotsForDate,
  createNewAppointment,
  formatWhatsAppMessage,
  buildWhatsAppUrl,
  loadReviews,
  saveReviews,
  createReview,
  likeReview,
  replyToReview,
  deleteReviewReply,
  deleteReview,
  getReviewsSummary,
  loadProducts,
  saveProducts,
  createProduct,
  updateProduct,
  updateProductStock,
  deleteProduct,
  loadMonthlyPlans,
  saveMonthlyPlans,
  updateMonthlyPlan,
  loadSubscribers,
  saveSubscribers,
  createSubscriber,
  updateSubscriber,
  recordSubscriberCut,
  deleteSubscriber,
} from './server/storage.ts';
import { BookingPayload, Barber, CreateReviewPayload } from './src/types.ts';


async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON and urlencoded with 50mb limit for product images
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // -------------------------------------------------------------
  // Project ZIP Export for GitHub / Render
  // -------------------------------------------------------------
  app.get('/api/download-zip', (req, res) => {
    try {
      execSync(`python3 -c "
import zipfile, os
EXCLUDE = {'node_modules', '.git', 'dist', '.cache'}
zip_path = 'public/barberia-project.zip'
os.makedirs('public', exist_ok=True)
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in EXCLUDE and not d.startswith('.')]
        for f in files:
            if f.endswith('.zip') or f.endswith('.log'):
                continue
            full_p = os.path.join(root, f)
            arc_p = os.path.relpath(full_p, '.')
            zf.write(full_p, arc_p)
"`);
      const zipFile = path.resolve(process.cwd(), 'public/barberia-project.zip');
      res.download(zipFile, 'barberia-turnos-completo.zip');
    } catch (err: any) {
      console.error('Error generating project zip:', err);
      res.status(500).json({ error: 'No se pudo generar el archivo ZIP' });
    }
  });

  // -------------------------------------------------------------
  // Admin Authentication Security Middleware
  // -------------------------------------------------------------
  const requireAdminAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const settings = loadSettings();
    const validPin = (settings.adminPin || '1234').trim();
    const providedPin = (
      (req.headers['x-admin-pin'] as string) ||
      (req.query.adminPin as string) ||
      ''
    ).trim();

    if (!providedPin || providedPin !== validPin) {
      return res.status(401).json({ error: 'Acceso no autorizado. Se requiere PIN de administrador válido.' });
    }
    next();
  };

  // -------------------------------------------------------------
  // Admin PIN Verification Endpoint
  // -------------------------------------------------------------
  app.post('/api/auth/verify-pin', (req, res) => {
    const { pin } = req.body || {};
    const settings = loadSettings();
    const validPin = (settings.adminPin || '1234').trim();
    const submittedPin = (pin || '').toString().trim();

    if (submittedPin && submittedPin === validPin) {
      // Return full settings including adminPin to authorized session
      return res.json({
        success: true,
        message: 'Acceso autorizado',
        settings,
      });
    }

    return res.status(401).json({
      success: false,
      error: 'PIN incorrecto. Acceso denegado.',
    });
  });

  // -------------------------------------------------------------
  // Services Catalog
  // -------------------------------------------------------------
  app.get('/api/services', (req, res) => {
    res.json(loadServices());
  });

  app.post('/api/services', requireAdminAuth, (req, res) => {
    try {
      const { name, category, price, durationMinutes, description, imageUrl, popular, includedSteps } = req.body;
      if (!name || !price) {
        return res.status(400).json({ error: 'Nombre y precio son obligatorios' });
      }
      const created = createService({
        name: name.trim(),
        category: category || 'Corte',
        price: Number(price),
        durationMinutes: Number(durationMinutes) || 30,
        description: description?.trim() || '',
        imageUrl: imageUrl?.trim(),
        popular: !!popular,
        includedSteps: includedSteps || ['Atención personalizada'],
      });
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error al crear servicio' });
    }
  });

  app.put('/api/services/:id', requireAdminAuth, (req, res) => {
    try {
      const updated = updateService(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error al actualizar servicio' });
    }
  });

  app.delete('/api/services/:id', requireAdminAuth, (req, res) => {
    try {
      deleteService(req.params.id);
      res.json({ message: 'Servicio eliminado con éxito' });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error al eliminar servicio' });
    }
  });

  // -------------------------------------------------------------
  // Products & Inventory Management API
  // -------------------------------------------------------------
  app.get('/api/products', (req, res) => {
    res.json(loadProducts());
  });

  app.post('/api/products', requireAdminAuth, (req, res) => {
    try {
      const { name, brand, category, price, stock, minStockAlert, description, imageUrl, featured } = req.body;
      if (!name || !price) {
        return res.status(400).json({ error: 'El nombre y el precio del producto son obligatorios' });
      }
      const created = createProduct({
        name: name.trim(),
        brand: brand?.trim() || undefined,
        category: category?.trim() || 'General',
        price: Number(price),
        stock: Math.max(0, Number(stock) || 0),
        minStockAlert: Math.max(0, Number(minStockAlert) || 3),
        description: description?.trim() || '',
        imageUrl: imageUrl?.trim() || '',
        featured: !!featured,
      });
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error al crear producto' });
    }
  });

  app.put('/api/products/:id', requireAdminAuth, (req, res) => {
    try {
      const updated = updateProduct(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error al actualizar producto' });
    }
  });

  app.patch('/api/products/:id/stock', requireAdminAuth, (req, res) => {
    try {
      const { delta } = req.body;
      if (typeof delta !== 'number') {
        return res.status(400).json({ error: 'Se requiere el valor delta de stock (+1, -1, etc.)' });
      }
      const updated = updateProductStock(req.params.id, delta);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error al actualizar stock' });
    }
  });

  app.delete('/api/products/:id', requireAdminAuth, (req, res) => {
    try {
      deleteProduct(req.params.id);
      res.json({ message: 'Producto eliminado con éxito' });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error al eliminar producto' });
    }
  });

  // -------------------------------------------------------------
  // Monthly Plans & Subscribers Club API
  // -------------------------------------------------------------
  app.get('/api/plans', (req, res) => {
    res.json(loadMonthlyPlans());
  });

  app.get('/api/subscribers', requireAdminAuth, (req, res) => {
    res.json(loadSubscribers());
  });

  app.post('/api/subscribers', (req, res) => {
    try {
      const { clientName, clientPhone, planId, planName, monthlyFee, paymentMethod, notes } = req.body;
      if (!clientName || !clientPhone || !planId) {
        return res.status(400).json({ error: 'Nombre, teléfono y plan son obligatorios' });
      }

      const today = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthStr = `${nextMonth.getFullYear()}-${pad(nextMonth.getMonth() + 1)}-${pad(nextMonth.getDate())}`;

      const newSub = createSubscriber({
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        planId,
        planName: planName || (planId === 'plan_corte_barba' ? 'Plan Mensual Club Corte + Barba (4x3 VIP)' : 'Plan Mensual Club Corte (4x3)'),
        monthlyFee: Number(monthlyFee) || (planId === 'plan_corte_barba' ? 40500 : 27000),
        startDate: todayStr,
        nextBillingDate: nextMonthStr,
        status: 'active',
        paymentMethod: paymentMethod || 'debito_tarjeta',
        cutsUsedThisMonth: 0,
        maxCutsPerMonth: 4,
        notes: notes?.trim() || undefined,
      });

      res.status(201).json(newSub);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error al suscribir cliente' });
    }
  });

  app.patch('/api/subscribers/:id', requireAdminAuth, (req, res) => {
    try {
      const updated = updateSubscriber(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error al actualizar suscriptor' });
    }
  });

  app.post('/api/subscribers/:id/cut', requireAdminAuth, (req, res) => {
    try {
      const { delta = 1 } = req.body;
      const updated = recordSubscriberCut(req.params.id, delta);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error al registrar corte' });
    }
  });

  app.delete('/api/subscribers/:id', requireAdminAuth, (req, res) => {
    try {
      deleteSubscriber(req.params.id);
      res.json({ message: 'Suscriptor eliminado con éxito' });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error al eliminar suscriptor' });
    }
  });

  // -------------------------------------------------------------
  // Staff & Barbers Management
  // -------------------------------------------------------------
  app.get('/api/barbers', (req, res) => {
    res.json(loadBarbers());
  });

  app.post('/api/barbers', requireAdminAuth, (req, res) => {
    try {
      const { name, role, specialties, bio, phone, avatarUrl, availableDays, allowedServiceIds } = req.body;
      if (!name || !role) {
        return res.status(400).json({ error: 'El nombre y rol del peluquero son obligatorios' });
      }
      const newBarber = createBarber({
        name: name.trim(),
        role: role.trim(),
        specialties: Array.isArray(specialties) ? specialties : [specialties || 'Peluquería general'],
        bio: bio?.trim(),
        phone: phone?.trim(),
        avatarUrl: avatarUrl?.trim(),
        availableDays: availableDays || [1, 2, 3, 4, 5, 6],
        allowedServiceIds: allowedServiceIds || ['corte', 'corte_barba', 'barba'],
        active: true,
      });
      res.status(201).json(newBarber);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error al registrar peluquero' });
    }
  });

  app.put('/api/barbers/:id', requireAdminAuth, (req, res) => {
    try {
      const updated = updateBarber(req.params.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error al actualizar peluquero' });
    }
  });

  app.delete('/api/barbers/:id', requireAdminAuth, (req, res) => {
    try {
      deleteBarber(req.params.id);
      res.json({ message: 'Peluquero eliminado con éxito' });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Error al eliminar peluquero' });
    }
  });

  // -------------------------------------------------------------
  // Visual Calendar Blocks Management
  // -------------------------------------------------------------
  app.get('/api/calendar/blocks', (req, res) => {
    res.json(loadCalendarBlocks());
  });

  app.post('/api/calendar/toggle-slot', requireAdminAuth, (req, res) => {
    try {
      const { date, time, barberId = 'all', reason } = req.body;
      if (!date || !time) {
        return res.status(400).json({ error: 'Fecha y hora requeridas' });
      }
      const result = toggleSlotBlock(date, time, barberId, reason);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error al modificar horario' });
    }
  });

  app.post('/api/calendar/toggle-day', requireAdminAuth, (req, res) => {
    try {
      const { date, barberId = 'all', reason } = req.body;
      if (!date) {
        return res.status(400).json({ error: 'Fecha requerida' });
      }
      const result = toggleDayBlock(date, barberId, reason);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Error al modificar día' });
    }
  });

  // Business settings (Mask adminPin for public requests)
  app.get('/api/settings', (req, res) => {
    const settings = loadSettings();
    const providedPin = ((req.headers['x-admin-pin'] as string) || '').trim();
    if (providedPin && providedPin === (settings.adminPin || '1234').trim()) {
      return res.json(settings);
    }
    // Mask sensitive PIN for clients
    const { adminPin, ...publicSettings } = settings;
    res.json(publicSettings);
  });

  app.put('/api/settings', requireAdminAuth, (req, res) => {
    try {
      const updated = saveSettings(req.body);
      res.json(updated);
    } catch (err) {
      console.error('Error saving settings:', err);
      res.status(500).json({ error: 'Error al guardar la configuración' });
    }
  });

  // Available slots for a specific day
  app.get('/api/slots', (req, res) => {
    const date = (req.query.date as string) || '';
    const serviceId = (req.query.serviceId as string) || 'corte';
    const barberId = (req.query.barberId as string) || 'barber-any';
    const clientTime = req.query.clientTime as string | undefined;
    const clientDate = req.query.clientDate as string | undefined;

    const result = getAvailableSlotsForDate(date, serviceId, barberId, true, clientTime, clientDate);
    res.json(result);
  });

  // Appointments listing & search (Protected for barber/owner only)
  app.get('/api/appointments', requireAdminAuth, (req, res) => {
    const { date, status, search, barberId } = req.query;
    let list = loadAppointments();

    if (date && typeof date === 'string') {
      list = list.filter((a) => a.date === date);
    }

    if (barberId && typeof barberId === 'string' && barberId !== 'all') {
      list = list.filter((a) => a.barberId === barberId);
    }

    if (status && typeof status === 'string' && status !== 'all') {
      list = list.filter((a) => a.status === status);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.clientName.toLowerCase().includes(q) ||
          a.clientPhone.includes(q) ||
          a.code.toLowerCase().includes(q) ||
          a.serviceName.toLowerCase().includes(q) ||
          a.barberName.toLowerCase().includes(q)
      );
    }

    // Sort by date and time
    list.sort((a, b) => {
      const keyA = `${a.date} ${a.time}`;
      const keyB = `${b.date} ${b.time}`;
      return keyA.localeCompare(keyB);
    });

    res.json(list);
  });

  // Find appointment by code (for client lookup)
  app.get('/api/appointments/by-code/:code', (req, res) => {
    const code = req.params.code.toUpperCase().trim();
    const list = loadAppointments();
    const found = list.find((a) => a.code.toUpperCase() === code);

    if (!found) {
      return res.status(404).json({ error: 'Turno no encontrado con ese código' });
    }

    const settings = loadSettings();
    const whatsappUrl = buildWhatsAppUrl(
      found.clientPhone,
      found.whatsappMessage || formatWhatsAppMessage(found, settings)
    );

    res.json({ appointment: found, whatsappUrl });
  });

  // Create new appointment (Public - for clients booking)
  app.post('/api/appointments', (req, res) => {
    try {
      const payload: BookingPayload = req.body;

      if (!payload.clientName || !payload.clientPhone || !payload.date || !payload.time || !payload.serviceId) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para agendar el turno' });
      }

      // Check slot availability
      const slotData = getAvailableSlotsForDate(payload.date, payload.serviceId, payload.barberId);
      if (slotData.isDayBlocked) {
        return res.status(409).json({ error: slotData.dayBlockReason || 'El día seleccionado no está disponible.' });
      }

      const targetSlot = slotData.slots.find((s) => s.slot === payload.time);
      if (!targetSlot || !targetSlot.available) {
        return res.status(409).json({ error: targetSlot?.reason || 'El horario seleccionado ya no se encuentra disponible. Por favor elige otro.' });
      }

      const result = createNewAppointment(payload);
      res.status(201).json(result);
    } catch (err: any) {
      console.error('Error creating appointment:', err);
      res.status(500).json({ error: err.message || 'Error al agendar el turno' });
    }
  });

  // Update appointment (status, etc. - Protected)
  app.patch('/api/appointments/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const list = loadAppointments();
    const index = list.findIndex((a) => a.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    list[index] = { ...list[index], ...updates };
    saveAppointments(list);
    res.json(list[index]);
  });

  // Delete/cancel appointment (Protected)
  app.delete('/api/appointments/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    let list = loadAppointments();
    const found = list.find((a) => a.id === id);

    if (!found) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    // Mark as cancelled or remove
    found.status = 'cancelled';
    saveAppointments(list);
    res.json({ message: 'Turno cancelado con éxito', appointment: found });
  });

  // WhatsApp Reminder Dispatch Endpoint (Protected)
  app.post('/api/appointments/:id/reminder', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const list = loadAppointments();
    const found = list.find((a) => a.id === id);

    if (!found) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    const settings = loadSettings();
    const message = formatWhatsAppMessage(found, settings);
    const whatsappUrl = buildWhatsAppUrl(found.clientPhone, message);

    // Update reminder state
    found.reminderStatus = 'sent';
    found.reminderSentAt = new Date().toISOString();
    found.whatsappMessage = message;
    saveAppointments(list);

    res.json({
      success: true,
      whatsappUrl,
      message,
      appointment: found,
    });
  });

  // Get upcoming appointments due for reminder (Protected)
  app.get('/api/reminders/due', requireAdminAuth, (req, res) => {
    const list = loadAppointments();
    const settings = loadSettings();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const due = list.filter((a) => {
      if (a.status !== 'confirmed' || a.reminderStatus === 'sent') return false;
      // If date is today or tomorrow, it is due for a reminder
      const aptDate = new Date(a.date);
      const diffTime = aptDate.getTime() - now.getTime();
      const diffHours = diffTime / (1000 * 3600);
      return diffHours <= settings.autoRemindHoursBefore && diffHours >= -4; // up to 4 hours past
    });

    const enriched = due.map((apt) => ({
      ...apt,
      whatsappUrl: buildWhatsAppUrl(apt.clientPhone, formatWhatsAppMessage(apt, settings)),
    }));

    res.json(enriched);
  });

  // -------------------------------------------------------------
  // Reviews API
  // -------------------------------------------------------------
  app.get('/api/reviews', (req, res) => {
    const reviews = loadReviews();
    const summary = getReviewsSummary();
    res.json({ reviews, summary });
  });

  app.post('/api/reviews', (req, res) => {
    try {
      const { clientName, rating, comment, serviceId, barberId, tags } = req.body;
      if (!clientName || !clientName.trim()) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
      }
      if (!rating || Number(rating) < 1 || Number(rating) > 5) {
        return res.status(400).json({ error: 'La calificación debe ser entre 1 y 5 estrellas' });
      }
      if (!comment || !comment.trim()) {
        return res.status(400).json({ error: 'El comentario de la reseña es obligatorio' });
      }

      const newReview = createReview({
        clientName: clientName.trim(),
        rating: Number(rating),
        comment: comment.trim(),
        serviceId: serviceId || undefined,
        barberId: barberId || undefined,
        tags: Array.isArray(tags) ? tags : undefined,
      });

      const summary = getReviewsSummary();
      res.status(201).json({ review: newReview, summary });
    } catch (err: any) {
      console.error('Error creating review:', err);
      res.status(500).json({ error: 'Error al registrar la reseña' });
    }
  });

  app.post('/api/reviews/:id/like', (req, res) => {
    const { id } = req.params;
    const updated = likeReview(id);
    if (!updated) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }
    res.json(updated);
  });

  app.post('/api/reviews/:id/reply', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const { replyText, author } = req.body;
    if (!replyText || !replyText.trim()) {
      return res.status(400).json({ error: 'El texto de la respuesta es obligatorio' });
    }
    const updated = replyToReview(id, replyText, author);
    if (!updated) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }
    res.json(updated);
  });

  app.delete('/api/reviews/:id', (req, res) => {
    const { id } = req.params;
    const settings = loadSettings();
    const validPin = (settings.adminPin || '1234').trim();
    const providedPin = (
      (req.headers['x-admin-pin'] as string) ||
      (req.query.adminPin as string) ||
      (req.body && req.body.adminPin) ||
      ''
    ).trim();

    const isClientAuthor = (req.headers['x-client-author'] === 'true') || id.startsWith('rev-local-');

    if (!isClientAuthor && (!providedPin || providedPin !== validPin)) {
      return res.status(401).json({ error: 'Acceso no autorizado. Se requiere PIN de administrador o ser autor de la reseña.' });
    }

    const deleted = deleteReview(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }
    const summary = getReviewsSummary();
    res.json({ success: true, message: 'Reseña eliminada con éxito', summary });
  });

  app.delete('/api/reviews/:id/reply', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const updated = deleteReviewReply(id);
    if (!updated) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }
    res.json(updated);
  });

  // -------------------------------------------------------------
  // Monthly Plans API
  // -------------------------------------------------------------
  app.get('/api/monthly-plans', (req, res) => {
    try {
      const plans = loadMonthlyPlans();
      res.json(plans);
    } catch (err: any) {
      console.error('Error loading monthly plans:', err);
      res.status(500).json({ error: 'Error al cargar planes mensuales' });
    }
  });

  app.put('/api/monthly-plans/:id', requireAdminAuth, (req, res) => {
    try {
      const { id } = req.params;
      const updated = updateMonthlyPlan(id, req.body);
      res.json(updated);
    } catch (err: any) {
      console.error('Error updating monthly plan:', err);
      res.status(500).json({ error: err.message || 'Error al actualizar plan mensual' });
    }
  });

  // -------------------------------------------------------------
  // Products & Stock Inventory API
  // -------------------------------------------------------------
  app.get('/api/products', (req, res) => {
    try {
      const products = loadProducts();
      res.json(products);
    } catch (err: any) {
      console.error('Error loading products:', err);
      res.status(500).json({ error: 'Error al cargar productos' });
    }
  });

  app.post('/api/products', requireAdminAuth, (req, res) => {
    try {
      const { name, brand, category, price, stock, minStockAlert, description, imageUrl, featured } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
      }
      const newProd = createProduct({
        name: name.trim(),
        brand: brand?.trim() || '',
        category: category || 'Ceras y Pomadas',
        price: Number(price) || 0,
        stock: Math.max(0, Number(stock) || 0),
        minStockAlert: Math.max(0, Number(minStockAlert) || 3),
        description: description?.trim() || '',
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80',
        featured: Boolean(featured),
      });
      res.status(201).json(newProd);
    } catch (err: any) {
      console.error('Error creating product:', err);
      res.status(500).json({ error: 'Error al crear producto' });
    }
  });

  app.put('/api/products/:id', requireAdminAuth, (req, res) => {
    try {
      const { id } = req.params;
      const updated = updateProduct(id, req.body);
      res.json(updated);
    } catch (err: any) {
      console.error('Error updating product:', err);
      res.status(500).json({ error: err.message || 'Error al actualizar producto' });
    }
  });

  app.post('/api/products/:id/stock', requireAdminAuth, (req, res) => {
    try {
      const { id } = req.params;
      const delta = Number(req.body.delta) || 0;
      const updated = updateProductStock(id, delta);
      res.json(updated);
    } catch (err: any) {
      console.error('Error updating product stock:', err);
      res.status(500).json({ error: err.message || 'Error al modificar stock' });
    }
  });

  app.delete('/api/products/:id', requireAdminAuth, (req, res) => {
    try {
      const { id } = req.params;
      deleteProduct(id);
      res.json({ success: true, message: 'Producto eliminado' });
    } catch (err: any) {
      console.error('Error deleting product:', err);
      res.status(500).json({ error: 'Error al eliminar producto' });
    }
  });

  // -------------------------------------------------------------
  // Subscribers 4x3 API
  // -------------------------------------------------------------
  app.get('/api/subscribers', requireAdminAuth, (req, res) => {
    try {
      const subs = loadSubscribers();
      res.json(subs);
    } catch (err: any) {
      console.error('Error loading subscribers:', err);
      res.status(500).json({ error: 'Error al cargar suscriptores' });
    }
  });

  app.post('/api/subscribers', requireAdminAuth, (req, res) => {
    try {
      const newSub = createSubscriber(req.body);
      res.status(201).json(newSub);
    } catch (err: any) {
      console.error('Error creating subscriber:', err);
      res.status(500).json({ error: err.message || 'Error al registrar suscriptor' });
    }
  });

  app.put('/api/subscribers/:id', requireAdminAuth, (req, res) => {
    try {
      const { id } = req.params;
      const updated = updateSubscriber(id, req.body);
      res.json(updated);
    } catch (err: any) {
      console.error('Error updating subscriber:', err);
      res.status(500).json({ error: err.message || 'Error al actualizar suscriptor' });
    }
  });

  app.post('/api/subscribers/:id/cut', requireAdminAuth, (req, res) => {
    try {
      const { id } = req.params;
      const increment = Number(req.body.increment) || 1;
      const updated = recordSubscriberCut(id, increment);
      res.json(updated);
    } catch (err: any) {
      console.error('Error recording subscriber cut:', err);
      res.status(500).json({ error: err.message || 'Error al registrar corte' });
    }
  });

  app.delete('/api/subscribers/:id', requireAdminAuth, (req, res) => {
    try {
      const { id } = req.params;
      deleteSubscriber(id);
      res.json({ success: true, message: 'Suscriptor eliminado' });
    } catch (err: any) {
      console.error('Error deleting subscriber:', err);
      res.status(500).json({ error: 'Error al eliminar suscriptor' });
    }
  });

  // Background automated reminders check (every 5 minutes)
  setInterval(() => {
    try {
      const list = loadAppointments();
      const settings = loadSettings();
      const todayStr = new Date().toISOString().split('T')[0];
      const pendingToday = list.filter((a) => a.date === todayStr && a.status === 'confirmed' && a.reminderStatus === 'pending');
      if (pendingToday.length > 0) {
        console.log(`[Auto-Reminder Engine] ${pendingToday.length} turnos programados para hoy requieren recordatorio.`);
      }
    } catch (e) {
      console.error('[Auto-Reminder Engine] Error checking reminders:', e);
    }
  }, 5 * 60 * 1000);

  // Static routes for images and assets so they never 404 or disappear
  app.use('/images', express.static(path.join(process.cwd(), 'public/images')));
  app.use('/src/assets', express.static(path.join(process.cwd(), 'src/assets')));
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Peluquería server running on http://localhost:${PORT}`);
  });
}

startServer();
