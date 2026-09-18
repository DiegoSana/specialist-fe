'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { getUser, isAuthenticated, setUser } from '@/lib/auth';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';
import { useMyCompanyProfile } from '@/hooks/use-company';
import { useUploadFile } from '@/hooks/use-file-upload';
import { openVerificationModal } from '@/lib/verification';
import apiClient from '@/lib/api-client';
import AppLayout from '@/components/layout/app-layout';

const COMPANY_STATUS_UI: Record<
  string,
  { icon: string; iconText: string; badge: string; label: string }
> = {
  ACTIVE: { icon: 'bg-emerald-100', iconText: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', label: '✓ Activa' },
  VERIFIED: { icon: 'bg-emerald-100', iconText: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', label: '✓ Verificada' },
  PENDING_VERIFICATION: { icon: 'bg-yellow-100', iconText: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700', label: '⏳ Pendiente' },
  INACTIVE: { icon: 'bg-gray-100', iconText: 'text-gray-500', badge: 'bg-gray-100 text-gray-600', label: 'Inactiva' },
  SUSPENDED: { icon: 'bg-orange-100', iconText: 'text-orange-600', badge: 'bg-orange-100 text-orange-700', label: '⚠ Suspendida' },
  REJECTED: { icon: 'bg-red-100', iconText: 'text-red-600', badge: 'bg-red-100 text-red-700', label: '✗ Rechazada' },
};

const companyStatusUi = (status: string) =>
  COMPANY_STATUS_UI[status] ?? COMPANY_STATUS_UI.INACTIVE;

export default function ProfilePage() {
  const t = useTranslations('profile');
  const tVerification = useTranslations('verification');
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const locale = pathname?.split('/')[1] || 'es';
  
  const [user, setUserState] = useState<any | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string | undefined }>({});

  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  // Initialize user state
  useEffect(() => {
    const initialUser = getUser();
    if (initialUser) {
      setUserState(initialUser);
    }
    setIsLoadingUser(false);
  }, []);

  // Fetch user profile
  const { data: userProfile, isLoading: loadingUser } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const response = await apiClient.get('/users/me');
      return response.data;
    },
    enabled: isAuthenticated(),
  });

  // Fetch professional profile
  const { data: professionalProfile, isLoading: loadingProfessional } = useMyProfessionalProfile();

  // Fetch company profile
  const { data: companyProfile, isLoading: loadingCompany } = useMyCompanyProfile();

  // Upload file mutation
  const uploadFileMutation = useUploadFile();

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: typeof userFormData & { profilePictureUrl?: string }) => {
      const payload: any = {};
      if (data.firstName) payload.firstName = data.firstName;
      if (data.lastName) payload.lastName = data.lastName;
      if (data.phone && data.phone.trim() !== '') payload.phone = data.phone;
      if (data.profilePictureUrl && data.profilePictureUrl.trim() !== '') payload.profilePictureUrl = data.profilePictureUrl;
      
      const response = await apiClient.patch('/users/me', payload);
      return response.data;
    },
    onSuccess: (data) => {
      const currentUser = getUser();
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          firstName: data.firstName || currentUser.firstName,
          lastName: data.lastName || currentUser.lastName,
          phone: data.phone !== undefined ? data.phone : currentUser.phone,
          ...('profilePictureUrl' in data ? { profilePictureUrl: data.profilePictureUrl } : {}),
        };
        setUser(updatedUser);
        setUserState(updatedUser);
      }
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      setIsEditingPersonal(false);
    },
  });

  // Activate client profile mutation
  const activateClientMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/users/me/client-profile');
      return response.data;
    },
    onSuccess: () => {
      const currentUser = getUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, hasClientProfile: true };
        setUser(updatedUser);
        setUserState(updatedUser);
      }
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });

  useEffect(() => {
    if (!isLoadingUser && (!isAuthenticated() || !user)) {
      router.push(`/${locale}/login`);
    }
  }, [router, user, locale, isLoadingUser]);

  useEffect(() => {
    if (userProfile && !isEditingPersonal) {
      setUserFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phone: userProfile.phone || '',
      });
    }
  }, [userProfile, isEditingPersonal]);

  if (isLoadingUser) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) return null;

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors({ general: 'Solo se permiten imágenes' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ general: 'La imagen es muy grande (máx 10MB)' });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!userFormData.firstName.trim() || !userFormData.lastName.trim()) {
      setErrors({ general: 'Nombre y apellido son requeridos' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (selectedFile) {
        const fileResponse = await uploadFileMutation.mutateAsync({
          file: selectedFile,
          category: 'profile-picture',
        });
        await updateUserMutation.mutateAsync({
          ...userFormData,
          profilePictureUrl: fileResponse.url,
        });
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        await updateUserMutation.mutateAsync(userFormData);
      }
    } catch (error: any) {
      setErrors({ general: error.response?.data?.message || 'Error al guardar' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivateClient = async () => {
    try {
      await activateClientMutation.mutateAsync();
    } catch (error: any) {
      setErrors({ general: error.response?.data?.message || 'Error al activar perfil de cliente' });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
          </div>

          {/* Personal Data Section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">Datos Personales</h2>
                  <p className="text-xs text-gray-500">Tu información básica de cuenta</p>
                </div>
              </div>
              {!isEditingPersonal && (
                <button
                  onClick={() => setIsEditingPersonal(true)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Editar
                </button>
              )}
            </div>

            <div className="p-6">
              {loadingUser ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : isEditingPersonal ? (
                <form onSubmit={handleUserSubmit} className="space-y-5">
                  {errors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">{errors.general}</p>
                    </div>
                  )}

                  {/* Profile Picture */}
                  <div className="flex items-center gap-4">
                    {(previewUrl || userProfile?.profilePictureUrl) ? (
                      <img
                        src={previewUrl || userProfile?.profilePictureUrl}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="profile-upload"
                      />
                      <label
                        htmlFor="profile-upload"
                        className="inline-block px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors"
                      >
                        Cambiar foto
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                      <input
                        name="firstName"
                        type="text"
                        value={userFormData.firstName}
                        onChange={handleUserChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                      <input
                        name="lastName"
                        type="text"
                        value={userFormData.lastName}
                        onChange={handleUserChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={userProfile?.email || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                      name="phone"
                      type="tel"
                      value={userFormData.phone}
                      onChange={handleUserChange}
                      placeholder="+5492944123456"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingPersonal(false);
                        setErrors({});
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-start gap-4">
                  {userProfile?.profilePictureUrl ? (
                    <img
                      src={userProfile.profilePictureUrl}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {userProfile?.firstName} {userProfile?.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {userProfile?.email}
                    </p>
                    {userProfile?.phone && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {userProfile.phone}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Verification Section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">{tVerification('title')}</h2>
                  <p className="text-xs text-gray-500">{tVerification('subtitle')}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Phone Verification */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800">{tVerification('phone.label')}</p>
                    {userProfile?.phone && (
                      <p className="text-xs text-gray-500 truncate">{userProfile.phone}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  {userProfile?.phoneVerified ? (
                    <span className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full whitespace-nowrap">
                      {tVerification('verified')}
                    </span>
                  ) : (
                    <>
                      <span className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full whitespace-nowrap">
                        {tVerification('notVerified')}
                      </span>
                      <button
                        onClick={() => openVerificationModal('PHONE')}
                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                      >
                        {tVerification('verify')}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Email Verification */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800">{tVerification('email.label')}</p>
                    {userProfile?.email && (
                      <p className="text-xs text-gray-500 truncate">{userProfile.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                  {userProfile?.emailVerified ? (
                    <span className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full whitespace-nowrap">
                      {tVerification('verified')}
                    </span>
                  ) : (
                    <>
                      <span className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full whitespace-nowrap">
                        {tVerification('notVerified')}
                      </span>
                      <button
                        onClick={() => openVerificationModal('EMAIL')}
                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                      >
                        {tVerification('verify')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Client Profile Section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user?.hasClientProfile ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <svg className={`w-5 h-5 ${user?.hasClientProfile ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">Perfil de Cliente</h2>
                  <p className="text-xs text-gray-500">Solicitar trabajos a especialistas</p>
                </div>
              </div>
              {user?.hasClientProfile && (
                <span className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                  ✓ Activo
                </span>
              )}
            </div>

            <div className="p-6">
              {user?.hasClientProfile ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Tu perfil de cliente está activo. Podés crear solicitudes de trabajo y contactar especialistas.
                  </p>
                  <div className="flex gap-3">
                    <Link
                      href={`/${locale}/client/requests/new`}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Crear solicitud
                    </Link>
                    <Link
                      href={`/${locale}/client/dashboard`}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Ver mis solicitudes
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Activá tu perfil de cliente para poder solicitar trabajos a especialistas.
                  </p>
                  <button
                    onClick={handleActivateClient}
                    disabled={activateClientMutation.isPending}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {activateClientMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Activando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Activar perfil de cliente
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Specialist Profile Section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  professionalProfile?.status === 'VERIFIED' ? 'bg-green-100' :
                  professionalProfile?.status === 'PENDING_VERIFICATION' ? 'bg-yellow-100' :
                  user?.hasProfessionalProfile ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  <svg className={`w-5 h-5 ${
                    professionalProfile?.status === 'VERIFIED' ? 'text-green-600' :
                    professionalProfile?.status === 'PENDING_VERIFICATION' ? 'text-yellow-600' :
                    user?.hasProfessionalProfile ? 'text-red-600' : 'text-gray-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">Perfil de Especialista</h2>
                  <p className="text-xs text-gray-500">Ofrecer tus servicios profesionales</p>
                </div>
              </div>
              {user?.hasProfessionalProfile && professionalProfile && (
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  professionalProfile.status === 'VERIFIED' 
                    ? 'bg-green-100 text-green-700'
                    : professionalProfile.status === 'PENDING_VERIFICATION'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {professionalProfile.status === 'VERIFIED' ? '✓ Verificado' :
                   professionalProfile.status === 'PENDING_VERIFICATION' ? '⏳ Pendiente' :
                   '✗ Rechazado'}
                </span>
              )}
            </div>

            <div className="p-6">
              {loadingProfessional ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : user?.hasProfessionalProfile && professionalProfile ? (
                <div className="space-y-4">
                  {/* Rating */}
                  {professionalProfile.averageRating > 0 && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <span className="text-yellow-500">★</span>
                      <span className="font-medium">{professionalProfile.averageRating.toFixed(1)}</span>
                      <span className="text-gray-400">({professionalProfile.totalReviews} reseñas)</span>
                    </div>
                  )}

                  {/* Trades */}
                  {professionalProfile.trades && professionalProfile.trades.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {professionalProfile.trades.map((trade: any, index: number) => (
                        <span
                          key={trade.id}
                          className={`px-3 py-1 text-sm rounded-full ${
                            index === 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {trade.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quick info */}
                  <div className="text-sm text-gray-600 space-y-1">
                    {professionalProfile.city && (
                      <p>📍 {professionalProfile.city}{professionalProfile.zone ? `, ${professionalProfile.zone}` : ''}</p>
                    )}
                    {professionalProfile.experienceYears && (
                      <p>⏱️ {professionalProfile.experienceYears} años de experiencia</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Link
                      href={`/${locale}/specialist/setup`}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar perfil
                    </Link>
                    <Link
                      href={`/${locale}/specialist/job-board`}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Ver bolsa de trabajo
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Creá tu perfil de especialista para ofrecer tus servicios y acceder a la bolsa de trabajo.
                  </p>
                  <Link
                    href={`/${locale}/specialist/setup`}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Crear perfil de especialista
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Company Profile Section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  companyProfile ? companyStatusUi(companyProfile.status).icon : 'bg-gray-100'
                }`}>
                  <svg className={`w-5 h-5 ${
                    companyProfile ? companyStatusUi(companyProfile.status).iconText : 'text-gray-400'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">Perfil de Empresa</h2>
                  <p className="text-xs text-gray-500">Ofrecer servicios como empresa</p>
                </div>
              </div>
              {user?.hasCompanyProfile && companyProfile && (
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${companyStatusUi(companyProfile.status).badge}`}>
                  {companyStatusUi(companyProfile.status).label}
                </span>
              )}
            </div>

            <div className="p-6">
              {loadingCompany ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                </div>
              ) : user?.hasCompanyProfile && companyProfile ? (
                <div className="space-y-4">
                  {/* Company Name */}
                  <h3 className="text-lg font-semibold text-gray-800">{companyProfile.companyName}</h3>

                  {/* Rating */}
                  {companyProfile.averageRating > 0 && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <span className="text-yellow-500">★</span>
                      <span className="font-medium">{companyProfile.averageRating.toFixed(1)}</span>
                      <span className="text-gray-400">({companyProfile.totalReviews} reseñas)</span>
                    </div>
                  )}

                  {/* Trades */}
                  {companyProfile.trades && companyProfile.trades.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {companyProfile.trades.map((trade: any, index: number) => (
                        <span
                          key={trade.id}
                          className={`px-3 py-1 text-sm rounded-full ${
                            trade.isPrimary ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {trade.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Quick info */}
                  <div className="text-sm text-gray-600 space-y-1">
                    {companyProfile.city && (
                      <p>📍 {companyProfile.city}{companyProfile.zone ? `, ${companyProfile.zone}` : ''}</p>
                    )}
                    {companyProfile.employeeCount && (
                      <p>👥 {companyProfile.employeeCount} empleados</p>
                    )}
                    {companyProfile.foundedYear && (
                      <p>📅 Fundada en {companyProfile.foundedYear}</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Link
                      href={`/${locale}/company/setup`}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Editar perfil
                    </Link>
                    <Link
                      href={`/${locale}/specialist/job-board`}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Ver bolsa de trabajo
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Registrá tu empresa para ofrecer servicios profesionales y acceder a la bolsa de trabajo.
                  </p>
                  <Link
                    href={`/${locale}/company/setup`}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Registrar empresa
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
