import React, { useState } from 'react';
import {
  User,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Phone,
  Calendar,
  Scissors,
  Sparkles,
  ShieldCheck,
  Star,
  Layers,
  CheckCircle2,
  Briefcase,
  Clock,
  ChevronRight,
  Filter,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
  Power,
  KeyRound,
} from 'lucide-react';
import { Barber, BarberService } from '../types.ts';
import { saveClientBarbers } from '../utils/clientStorage.ts';

interface StaffManagementProps {
  barbers: Barber[];
  services: BarberService[];
  onBarbersChange: (barbers: Barber[]) => void;
  onNavigateToCalendar?: (barberId?: string) => void;
  onRequestPinModal?: () => void;
}

const WEEK_DAYS = [
  { id: 1, label: 'Lunes', short: 'Lun' },
  { id: 2, label: 'Martes', short: 'Mar' },
  { id: 3, label: 'Miércoles', short: 'Mié' },
  { id: 4, label: 'Jueves', short: 'Jue' },
  { id: 5, label: 'Viernes', short: 'Vie' },
  { id: 6, label: 'Sábado', short: 'Sáb' },
  { id: 0, label: 'Domingo', short: 'Dom' },
];

const PRESET_AVATARS = [
  {
    name: 'Fade Clásico',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Barba & Grooming',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Estilista & Color',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Modern Stylist',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Especialista Barba',
    url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Master Barber',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Colorimetría',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  },
  {
    name: 'Freestyle Hair',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
  },
];

export const StaffManagement: React.FC<StaffManagementProps> = ({
  barbers,
  services,
  onBarbersChange,
  onNavigateToCalendar,
  onRequestPinModal,
}) => {
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);

  // Deletion Confirmation State (In-app modal, replaces window.confirm which is blocked in iframes)
  const [deletingBarber, setDeletingBarber] = useState<Barber | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [specialtiesText, setSpecialtiesText] = useState('');
  const [specialtiesList, setSpecialtiesList] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [availableDays, setAvailableDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [allowedServiceIds, setAllowedServiceIds] = useState<string[]>([]);
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filter out the generic "barber-any" for the staff roster view, but keep it available
  const staffList = barbers.filter((b) => b.id !== 'barber-any');

  const filteredStaff = staffList.filter((b) => {
    if (selectedServiceFilter === 'all') return true;
    return b.allowedServiceIds?.includes(selectedServiceFilter);
  });

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => {
      setSuccessToast(null);
    }, 3500);
  };

  const openNewBarberModal = () => {
    setEditingBarber(null);
    setName('');
    setRole('Barbero & Estilista');
    setSpecialtiesList(['Cortes clásicos', 'Degradé / Fade', 'Diseño de barba']);
    setSpecialtiesText('');
    setBio('');
    setPhone('');
    setAvatarUrl(PRESET_AVATARS[0].url);
    setAvailableDays([1, 2, 3, 4, 5, 6]);
    setAllowedServiceIds(services.map((s) => s.id));
    setActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditBarberModal = (barber: Barber) => {
    setEditingBarber(barber);
    setName(barber.name);
    setRole(barber.role || 'Peluquero Profesional');
    setSpecialtiesList(
      barber.specialties && barber.specialties.length > 0
        ? barber.specialties
        : barber.specialty
        ? [barber.specialty]
        : ['Peluquería general']
    );
    setSpecialtiesText('');
    setBio(barber.bio || '');
    setPhone(barber.phone || '');
    setAvatarUrl(barber.avatarUrl || PRESET_AVATARS[0].url);
    setAvailableDays(barber.availableDays || [1, 2, 3, 4, 5, 6]);
    setAllowedServiceIds(
      barber.allowedServiceIds && barber.allowedServiceIds.length > 0
        ? barber.allowedServiceIds
        : services.map((s) => s.id)
    );
    setActive(barber.active ?? true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddSpecialty = () => {
    if (specialtiesText.trim() && !specialtiesList.includes(specialtiesText.trim())) {
      setSpecialtiesList([...specialtiesList, specialtiesText.trim()]);
      setSpecialtiesText('');
    }
  };

  const handleRemoveSpecialty = (spec: string) => {
    setSpecialtiesList(specialtiesList.filter((s) => s !== spec));
  };

  const handleToggleDay = (dayId: number) => {
    if (availableDays.includes(dayId)) {
      if (availableDays.length === 1) return; // keep at least 1 day
      setAvailableDays(availableDays.filter((d) => d !== dayId));
    } else {
      setAvailableDays([...availableDays, dayId]);
    }
  };

  const handleToggleService = (serviceId: string) => {
    if (allowedServiceIds.includes(serviceId)) {
      if (allowedServiceIds.length === 1) return; // keep at least 1 service
      setAllowedServiceIds(allowedServiceIds.filter((s) => s !== serviceId));
    } else {
      setAllowedServiceIds([...allowedServiceIds, serviceId]);
    }
  };

  // Direct toggle active/inactive status from card
  const handleQuickToggleActive = async (barber: Barber) => {
    const updatedStatus = !barber.active;
    const adminPin = sessionStorage.getItem('barber_admin_pin') || '';

    try {
      const res = await fetch(`/api/barbers/${barber.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin,
        },
        body: JSON.stringify({ active: updatedStatus }),
      }).catch(() => null);

      if (res && res.ok) {
        const updated = await res.json();
        const nextList = barbers.map((b) => (b.id === updated.id ? updated : b));
        onBarbersChange(nextList);
        saveClientBarbers(nextList);
        showToast(`Estado de ${barber.name} cambiado a ${updatedStatus ? 'Activo' : 'Inactivo'}`);
      } else {
        // Fallback local update
        const nextList = barbers.map((b) => (b.id === barber.id ? { ...b, active: updatedStatus } : b));
        onBarbersChange(nextList);
        saveClientBarbers(nextList);
        showToast(`Estado de ${barber.name} actualizado localmente.`);
      }
    } catch {
      const nextList = barbers.map((b) => (b.id === barber.id ? { ...b, active: updatedStatus } : b));
      onBarbersChange(nextList);
      saveClientBarbers(nextList);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) {
      setFormError('El nombre y el puesto/rol son obligatorios.');
      return;
    }

    if (allowedServiceIds.length === 0) {
      setFormError('Debes asignar al menos un servicio que este profesional pueda realizar.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      name: name.trim(),
      role: role.trim(),
      specialties: specialtiesList.length > 0 ? specialtiesList : ['Peluquería general'],
      specialty: specialtiesList[0] || role.trim(),
      bio: bio.trim(),
      phone: phone.trim(),
      avatarUrl: avatarUrl.trim() || PRESET_AVATARS[0].url,
      availableDays,
      allowedServiceIds,
      active,
    };

    try {
      const adminPin = sessionStorage.getItem('barber_admin_pin') || '';

      if (editingBarber) {
        // Update existing barber
        const res = await fetch(`/api/barbers/${editingBarber.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-pin': adminPin,
          },
          body: JSON.stringify(payload),
        }).catch(() => null);

        if (res && res.ok) {
          const updated = await res.json();
          const nextList = barbers.map((b) => (b.id === updated.id ? updated : b));
          onBarbersChange(nextList);
          saveClientBarbers(nextList);
          setIsModalOpen(false);
          showToast(`Profesional ${updated.name} actualizado con éxito.`);
        } else if (res && res.status === 401) {
          setFormError('Acceso no autorizado. Tu PIN de administrador es inválido o la sesión expiró.');
        } else {
          // If network failed, update in client storage as fallback
          const updated: Barber = { ...editingBarber, ...payload };
          const nextList = barbers.map((b) => (b.id === updated.id ? updated : b));
          onBarbersChange(nextList);
          saveClientBarbers(nextList);
          setIsModalOpen(false);
          showToast(`Profesional ${updated.name} actualizado.`);
        }
      } else {
        // Create new barber
        const res = await fetch('/api/barbers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-pin': adminPin,
          },
          body: JSON.stringify(payload),
        }).catch(() => null);

        if (res && res.ok) {
          const created = await res.json();
          const nextList = [...barbers, created];
          onBarbersChange(nextList);
          saveClientBarbers(nextList);
          setIsModalOpen(false);
          showToast(`¡Nuevo profesional ${created.name} registrado con éxito!`);
        } else if (res && res.status === 401) {
          setFormError('Acceso no autorizado. Tu PIN de administrador es inválido o la sesión expiró.');
        } else {
          // Fallback client creation
          const newBarber: Barber = {
            id: `barber-${Date.now()}`,
            ...payload,
          };
          const nextList = [...barbers, newBarber];
          onBarbersChange(nextList);
          saveClientBarbers(nextList);
          setIsModalOpen(false);
          showToast(`¡Nuevo profesional ${newBarber.name} registrado!`);
        }
      }
    } catch (err) {
      console.error('Error saving barber:', err);
      setFormError('Error de conexión al guardar los datos del peluquero.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBarber) return;
    setIsDeleting(true);

    try {
      const adminPin = sessionStorage.getItem('barber_admin_pin') || '';
      const res = await fetch(`/api/barbers/${deletingBarber.id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-pin': adminPin,
        },
      }).catch(() => null);

      if (res && res.ok) {
        const nextList = barbers.filter((b) => b.id !== deletingBarber.id);
        onBarbersChange(nextList);
        saveClientBarbers(nextList);
        showToast(`Profesional ${deletingBarber.name} eliminado del equipo.`);
        setDeletingBarber(null);
      } else if (res && res.status === 401) {
        alert('Acceso no autorizado. Se requiere PIN de administrador válido para eliminar.');
      } else {
        // Fallback local deletion
        const nextList = barbers.filter((b) => b.id !== deletingBarber.id);
        onBarbersChange(nextList);
        saveClientBarbers(nextList);
        showToast(`Profesional ${deletingBarber.name} eliminado.`);
        setDeletingBarber(null);
      }
    } catch (err) {
      console.error('Error deleting barber:', err);
      alert('Error de red al eliminar el profesional.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-950 border border-emerald-500 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/90 border border-zinc-800 p-5 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-100 flex items-center gap-2">
              <User className="w-6 h-6 text-amber-500" />
              Gestión de Personal & Peluqueros
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {staffList.length} Profesionales
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            Modifica nombres, fotos, especialidades, días de atención y asignación de servicios de cada profesional.
          </p>
        </div>

        <button
          type="button"
          id="btn-add-barber"
          onClick={openNewBarberModal}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registrar Nuevo Peluquero</span>
        </button>
      </div>

      {/* Filter Bar: By Assigned Service */}
      <div className="flex items-center justify-between gap-4 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 text-xs overflow-x-auto">
        <div className="flex items-center gap-2 pb-1 sm:pb-0">
          <span className="text-zinc-400 flex items-center gap-1 font-semibold whitespace-nowrap">
            <Filter className="w-3.5 h-3.5 text-amber-500" />
            Filtrar por servicio:
          </span>
          <button
            onClick={() => setSelectedServiceFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedServiceFilter === 'all'
                ? 'bg-amber-500 text-zinc-950 font-bold'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Todos ({staffList.length})
          </button>
          {services.map((s) => {
            const count = staffList.filter((b) => b.allowedServiceIds?.includes(s.id)).length;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedServiceFilter(s.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  selectedServiceFilter === s.id
                    ? 'bg-amber-500 text-zinc-950 font-bold'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {s.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Staff Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredStaff.map((barber) => {
          const barberAssignedServices = services.filter((s) =>
            barber.allowedServiceIds?.includes(s.id)
          );

          return (
            <div
              key={barber.id}
              id={`staff-card-${barber.id}`}
              className={`bg-zinc-900/80 border rounded-2xl p-5 transition-all flex flex-col justify-between shadow-lg ${
                barber.active ? 'border-zinc-800 hover:border-zinc-700' : 'border-zinc-800/60 opacity-75'
              }`}
            >
              <div className="space-y-4">
                {/* Top Profile Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <img
                        src={
                          barber.avatarUrl ||
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                        }
                        alt={barber.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-xl object-cover border border-zinc-700 shadow-md"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuickToggleActive(barber)}
                        title={barber.active ? 'Clic para desactivar' : 'Clic para activar'}
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900 transition-transform hover:scale-125 ${
                          barber.active ? 'bg-emerald-500' : 'bg-zinc-600'
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-zinc-100">
                          {barber.name}
                        </h3>
                        {!barber.active && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
                            Pausado
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-400 font-medium">
                        {barber.role}
                      </p>
                      {barber.phone && (
                        <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          {barber.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditBarberModal(barber)}
                      className="p-2 rounded-lg bg-zinc-800/90 hover:bg-amber-500 hover:text-zinc-950 text-zinc-300 border border-zinc-700/80 transition-all font-semibold"
                      title="Editar nombre, foto o datos"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingBarber(barber)}
                      className="p-2 rounded-lg bg-zinc-800/90 hover:bg-rose-950/80 text-zinc-400 hover:text-rose-400 border border-zinc-700/80 hover:border-rose-800 transition-all"
                      title="Eliminar peluquero"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bio */}
                {barber.bio && (
                  <p className="text-xs text-zinc-400 italic bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-800/60">
                    "{barber.bio}"
                  </p>
                )}

                {/* Specialties Chips */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Especialidades Técnicas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {barber.specialties && barber.specialties.length > 0 ? (
                      barber.specialties.map((spec, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-md text-[11px] bg-zinc-800 text-zinc-200 border border-zinc-700/60 font-medium"
                        >
                          {spec}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-500">Peluquería general</span>
                    )}
                  </div>
                </div>

                {/* Assigned Services */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      <Scissors className="w-3 h-3 text-amber-500" />
                      Servicios Asignados ({barberAssignedServices.length}):
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {services.map((serv) => {
                      const isAssigned = barber.allowedServiceIds?.includes(serv.id);
                      return (
                        <div
                          key={serv.id}
                          className={`px-2 py-1 rounded text-[11px] flex items-center justify-between border ${
                            isAssigned
                              ? 'bg-amber-950/20 text-amber-300 border-amber-500/40 font-medium'
                              : 'bg-zinc-950/40 text-zinc-600 border-zinc-800/50'
                          }`}
                        >
                          <span className="truncate">{serv.name}</span>
                          {isAssigned ? (
                            <Check className="w-3 h-3 text-amber-400 flex-shrink-0 ml-1" />
                          ) : (
                            <X className="w-3 h-3 text-zinc-600 flex-shrink-0 ml-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Working Days Badges */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-500" />
                    Días de Trabajo:
                  </span>
                  <div className="flex items-center gap-1">
                    {WEEK_DAYS.map((wd) => {
                      const works = barber.availableDays?.includes(wd.id);
                      return (
                        <span
                          key={wd.id}
                          className={`flex-1 py-1 text-center rounded text-[10px] font-bold ${
                            works
                              ? 'bg-amber-500 text-zinc-950'
                              : 'bg-zinc-950 text-zinc-600 border border-zinc-800/80'
                          }`}
                          title={`${wd.label}: ${works ? 'Disponible' : 'Franco / Libre'}`}
                        >
                          {wd.short}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Quick Action: See Calendar */}
              <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickToggleActive(barber)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
                    barber.active
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/60'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  <span>{barber.active ? 'Activo en Turnos' : 'Desactivado'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateToCalendar?.(barber.id)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-semibold flex items-center gap-1.5 transition-colors text-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Ver Turnos en Calendario</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create or Edit Barber */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" />
                {editingBarber ? `Editar Profesional: ${editingBarber.name}` : 'Registrar Nuevo Peluquero'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <p className="font-semibold">{formError}</p>
                  {formError.includes('PIN') && onRequestPinModal && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        onRequestPinModal();
                      }}
                      className="text-amber-400 underline hover:text-amber-300 font-bold block pt-1"
                    >
                      Reingresar PIN de administrador ahora →
                    </button>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Photo & Live Avatar Preview */}
              <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 space-y-3">
                <label className="block text-zinc-300 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                  Foto de Perfil & Avatar
                </label>

                <div className="flex items-center gap-4">
                  <img
                    src={avatarUrl || PRESET_AVATARS[0].url}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-md flex-shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="Pega un enlace de imagen o selecciona un preset abajo..."
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none text-xs"
                    />
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      <span className="text-[10px] text-zinc-400 whitespace-nowrap">Presets rápidos:</span>
                      {PRESET_AVATARS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatarUrl(preset.url)}
                          className={`w-7 h-7 rounded-lg overflow-hidden border transition-all flex-shrink-0 ${
                            avatarUrl === preset.url ? 'border-amber-500 scale-110 ring-2 ring-amber-500/50' : 'border-zinc-700 hover:border-zinc-500'
                          }`}
                          title={preset.name}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Name and Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Lucas Domínguez"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 focus:border-amber-500 outline-none font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Puesto o Especialidad Principal *</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Ej. Master Barber & Fade Specialist"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-zinc-100 focus:border-amber-500 outline-none font-medium"
                    required
                  />
                </div>
              </div>

              {/* Phone & Bio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Teléfono Móvil (WhatsApp)</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+54 9 351 123-4567"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Breve Descripción / Bio</label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Especialista en navaja, 8 años en el rubro..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Specialties Manager */}
              <div className="space-y-2 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
                <label className="block text-zinc-300 font-semibold">
                  Especialidades Técnicas (Etiquetas)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={specialtiesText}
                    onChange={(e) => setSpecialtiesText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSpecialty();
                      }
                    }}
                    placeholder="Ej. Skin fade, Barboterapia, Colorimetría, Navaja..."
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 focus:border-amber-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpecialty}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-800 text-amber-400 hover:bg-zinc-700 font-semibold transition-colors"
                  >
                    Añadir
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {specialtiesList.map((spec) => (
                    <span
                      key={spec}
                      className="px-2.5 py-1 rounded-md text-xs bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center gap-1.5"
                    >
                      {spec}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecialty(spec)}
                        className="text-zinc-400 hover:text-rose-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Allowed Services Assignment */}
              <div className="space-y-2 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-300 font-semibold">
                    Servicios Asignados que puede realizar *
                  </label>
                  <span className="text-[10px] text-zinc-500">
                    Solo podrá ser elegido para estos servicios
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {services.map((serv) => {
                    const isChecked = allowedServiceIds.includes(serv.id);
                    return (
                      <label
                        key={serv.id}
                        className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-amber-950/20 border-amber-500 text-amber-300 font-semibold'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleService(serv.id)}
                            className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                          />
                          <span className="text-zinc-200">{serv.name}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500">${serv.price.toLocaleString('es-AR')}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Working Days */}
              <div className="space-y-2 bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800">
                <label className="block text-zinc-300 font-semibold">
                  Días de Trabajo en la Semana
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {WEEK_DAYS.map((wd) => {
                    const isChecked = availableDays.includes(wd.id);
                    return (
                      <button
                        key={wd.id}
                        type="button"
                        onClick={() => handleToggleDay(wd.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          isChecked
                            ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-md shadow-amber-500/20'
                            : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {wd.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800">
                <input
                  type="checkbox"
                  id="active-checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500 w-4 h-4"
                />
                <label htmlFor="active-checkbox" className="text-zinc-200 font-medium cursor-pointer">
                  Profesional activo para agendar citas en el sistema
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-semibold transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{editingBarber ? 'Actualizar Peluquero' : 'Registrar Peluquero'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-App Custom Confirmation Modal for Deleting (Eliminates iframe confirm() suppression) */}
      {deletingBarber && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-zinc-100">
                ¿Eliminar a {deletingBarber.name}?
              </h3>
              <p className="text-xs text-zinc-400">
                Esta acción removerá a este profesional del equipo y ya no estará disponible para turnos.
              </p>
            </div>

            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center gap-3">
              <img
                src={deletingBarber.avatarUrl}
                alt={deletingBarber.name}
                className="w-12 h-12 rounded-lg object-cover border border-zinc-700"
              />
              <div className="text-left">
                <p className="text-sm font-bold text-zinc-200">{deletingBarber.name}</p>
                <p className="text-xs text-amber-400">{deletingBarber.role}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingBarber(null)}
                className="w-1/2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <span>Sí, Eliminar</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
