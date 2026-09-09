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
} from 'lucide-react';
import { Barber, BarberService } from '../types.ts';

interface StaffManagementProps {
  barbers: Barber[];
  services: BarberService[];
  onBarbersChange: (barbers: Barber[]) => void;
  onNavigateToCalendar?: (barberId?: string) => void;
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

export const StaffManagement: React.FC<StaffManagementProps> = ({
  barbers,
  services,
  onBarbersChange,
  onNavigateToCalendar,
}) => {
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [specialtiesText, setSpecialtiesText] = useState('');
  const [specialtiesList, setSpecialtiesList] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [availableDays, setAvailableDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [allowedServiceIds, setAllowedServiceIds] = useState<string[]>(['corte', 'corte_barba', 'barba']);
  const [active, setActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter out the generic "barber-any" for the staff roster view, but keep it available
  const staffList = barbers.filter((b) => b.id !== 'barber-any');

  const filteredStaff = staffList.filter((b) => {
    if (selectedServiceFilter === 'all') return true;
    return b.allowedServiceIds?.includes(selectedServiceFilter);
  });

  const openNewBarberModal = () => {
    setEditingBarber(null);
    setName('');
    setRole('Barbero & Estilista');
    setSpecialtiesList(['Degradé', 'Tijera', 'Barba']);
    setSpecialtiesText('');
    setBio('');
    setPhone('');
    setAvatarUrl('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80');
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
    setSpecialtiesList(barber.specialties || (barber.specialty ? [barber.specialty] : []));
    setSpecialtiesText('');
    setBio(barber.bio || '');
    setPhone(barber.phone || '');
    setAvatarUrl(barber.avatarUrl || '');
    setAvailableDays(barber.availableDays || [1, 2, 3, 4, 5, 6]);
    setAllowedServiceIds(barber.allowedServiceIds || services.map((s) => s.id));
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

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !role.trim()) {
      setFormError('El nombre y el rol son obligatorios.');
      return;
    }

    if (allowedServiceIds.length === 0) {
      setFormError('Debes asignar al menos un servicio que este peluquero pueda realizar.');
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
      avatarUrl: avatarUrl.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      availableDays,
      allowedServiceIds,
      active,
    };

    try {
      if (editingBarber) {
        // Update
        const res = await fetch(`/api/barbers/${editingBarber.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          onBarbersChange(barbers.map((b) => (b.id === updated.id ? updated : b)));
          setIsModalOpen(false);
        } else {
          const err = await res.json();
          setFormError(err.error || 'Error al actualizar el peluquero');
        }
      } else {
        // Create new
        const res = await fetch('/api/barbers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          onBarbersChange([...barbers, created]);
          setIsModalOpen(false);
        } else {
          const err = await res.json();
          setFormError(err.error || 'Error al registrar el peluquero');
        }
      }
    } catch (err) {
      console.error(err);
      setFormError('Error de red al guardar el peluquero');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBarber = async (id: string, barberName: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${barberName} del equipo?`)) return;

    try {
      const res = await fetch(`/api/barbers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onBarbersChange(barbers.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error('Error deleting barber:', err);
    }
  };

  return (
    <div className="space-y-6">
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
            Administra los perfiles, especialidades técnicas, días de atención y servicios asignados a cada profesional.
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
      <div className="flex items-center justify-between gap-4 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-zinc-400 flex items-center gap-1 font-semibold whitespace-nowrap">
            <Filter className="w-3.5 h-3.5 text-amber-500" />
            Filtrar por servicio asignado:
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
              className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all flex flex-col justify-between shadow-lg"
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
                      <span
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-900 ${
                          barber.active ? 'bg-emerald-500' : 'bg-zinc-600'
                        }`}
                        title={barber.active ? 'Activo' : 'Inactivo'}
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                        {barber.name}
                      </h3>
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
                      className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 hover:text-amber-400 border border-zinc-700/60 transition-colors"
                      title="Editar perfil"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBarber(barber.id, barber.name)}
                      className="p-2 rounded-lg bg-zinc-800/80 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border border-zinc-700/60 hover:border-rose-900/50 transition-colors"
                      title="Eliminar peluquero"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
                <span className="text-zinc-500">
                  ID: <code className="text-zinc-400">{barber.id}</code>
                </span>
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
                {editingBarber ? `Editar Perfil: ${editingBarber.name}` : 'Registrar Nuevo Peluquero'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <X className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Lucas Domínguez"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Rol / Puesto *</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Ej. Master Barber & Especialista en Fades"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Teléfono Celular (WhatsApp)</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+54 9 11 2233-4455"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">URL Foto / Avatar</label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Bio / Perfil Profesional</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Años de experiencia, cursos realizados o estilo característico..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 focus:border-amber-500 outline-none resize-none"
                />
              </div>

              {/* Specialties Manager */}
              <div className="space-y-2 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
                <label className="block text-zinc-300 font-semibold">
                  Especialidades Técnicas
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
                    placeholder="Ej. Skin fade, Navaja tradicional, Barba perfilada, Colorimetría..."
                    className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 focus:border-amber-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpecialty}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-amber-400 hover:bg-zinc-700 font-semibold"
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
              <div className="space-y-2 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-300 font-semibold">
                    Asignación de Servicios que puede realizar *
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
                            ? 'bg-amber-950/20 border-amber-500 text-amber-300'
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
                          <span className="font-semibold text-zinc-200">{serv.name}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500">{serv.durationMinutes}m</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Working Days */}
              <div className="space-y-2 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800">
                <label className="block text-zinc-300 font-semibold">
                  Días Laborales Asignados
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
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="active-checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="active-checkbox" className="text-zinc-300 font-medium cursor-pointer">
                  Peluquero activo para recibir turnos en el calendario
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold shadow-md shadow-amber-500/20"
                >
                  {isSubmitting ? 'Guardando...' : editingBarber ? 'Actualizar Peluquero' : 'Registrar Peluquero'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
