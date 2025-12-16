'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUser, isAuthenticated, setUser } from '@/lib/auth';
import { useTrades } from '@/hooks/use-professionals';
import { useMyProfessionalProfile } from '@/hooks/use-professional-profile';
import { useUploadFile } from '@/hooks/use-file-upload';
import { useAddGalleryItem, useRemoveGalleryItem } from '@/hooks/use-professional-gallery';
import apiClient from '@/lib/api-client';
import AppLayout from '@/components/layout/app-layout';

type TabType = 'user' | 'client' | 'professional';

export default function ProfilePage() {
  const t = useTranslations('profile');
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [user, setUserState] = useState<any | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Initialize user state on client side only
  useEffect(() => {
    const initialUser = getUser();
    if (initialUser) {
      setUserState(initialUser);
    }
    setIsLoadingUser(false);
  }, []);

  const [activeTab, setActiveTab] = useState<TabType>('user');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // User form data
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  // Professional form data
  const [professionalFormData, setProfessionalFormData] = useState({
    tradeIds: [] as string[],
    description: '',
    experienceYears: '',
    zone: '',
    city: 'Bariloche',
    address: '',
    whatsapp: '',
    website: '',
  });

  const [errors, setErrors] = useState<{
    [key: string]: string | undefined;
  }>({});

  // Fetch user profile
  const { data: userProfile, isLoading: loadingUser, refetch: refetchUser } = useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const response = await apiClient.get('/users/profile');
      return response.data;
    },
    enabled: isAuthenticated(),
  });

  // Fetch professional profile
  const { data: professionalProfile, isLoading: loadingProfessional, refetch: refetchProfessional } = useMyProfessionalProfile();

  // Fetch trades
  const { data: trades, isLoading: loadingTrades } = useTrades();

  // Upload file mutation
  const uploadFileMutation = useUploadFile();
  const addGalleryItemMutation = useAddGalleryItem();
  const removeGalleryItemMutation = useRemoveGalleryItem();

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: typeof userFormData & { profilePictureUrl?: string }) => {
      // Remove empty strings and undefined values
      const payload: any = {};
      if (data.firstName) payload.firstName = data.firstName;
      if (data.lastName) payload.lastName = data.lastName;
      if (data.phone && data.phone.trim() !== '') payload.phone = data.phone;
      if (data.profilePictureUrl && data.profilePictureUrl.trim() !== '') payload.profilePictureUrl = data.profilePictureUrl;
      
      const response = await apiClient.put('/users/profile', payload);
      return response.data;
    },
    onSuccess: (data) => {
      // Get current user from localStorage
      const currentUser = getUser();
      
      if (currentUser) {
        // Always update profilePictureUrl if it's in the response, even if it's null
        const updatedUser = {
          ...currentUser,
          firstName: data.firstName || currentUser.firstName,
          lastName: data.lastName || currentUser.lastName,
          phone: data.phone !== undefined ? data.phone : currentUser.phone,
          // If profilePictureUrl is in the response, use it (even if null)
          // Otherwise, keep the current value
          ...('profilePictureUrl' in data ? { profilePictureUrl: data.profilePictureUrl } : {}),
        };
        setUser(updatedUser);
        setUserState(updatedUser);
      }
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      setIsEditing(false);
    },
  });

  // Update professional mutation
  const updateProfessionalMutation = useMutation({
    mutationFn: async (data: typeof professionalFormData) => {
      const response = await apiClient.put('/service/professionals/me/profile', {
        tradeIds: data.tradeIds,
        description: data.description || undefined,
        experienceYears: data.experienceYears ? parseInt(data.experienceYears) : undefined,
        zone: data.zone || undefined,
        city: data.city,
        address: data.address || undefined,
        whatsapp: data.whatsapp || undefined,
        website: data.website || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professional', 'me'] });
      setIsEditing(false);
    },
  });

  useEffect(() => {
    // Only redirect if we've finished loading and user is not authenticated
    if (!isLoadingUser && (!isAuthenticated() || !user)) {
      const locale = pathname?.split('/')[1] || 'es';
      router.push(`/${locale}/login`);
    }
  }, [router, user, pathname, isLoadingUser]);

  useEffect(() => {
    if (userProfile && !isEditing) {
      setUserFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phone: userProfile.phone || '',
      });
    }
  }, [userProfile, isEditing]);

  useEffect(() => {
    if (professionalProfile && !isEditing && activeTab === 'professional') {
      setProfessionalFormData({
        tradeIds: professionalProfile.trades?.map((t: any) => t.id) || [],
        description: professionalProfile.description || '',
        experienceYears: professionalProfile.experienceYears?.toString() || '',
        zone: professionalProfile.zone || '',
        city: professionalProfile.city || 'Bariloche',
        address: professionalProfile.address || '',
        whatsapp: professionalProfile.whatsapp || '',
        website: professionalProfile.website || '',
      });
    }
  }, [professionalProfile, isEditing, activeTab]);

  // Show loading state while checking authentication
  if (isLoadingUser) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">Loading...</div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return null;
  }

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleProfessionalChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setProfessionalFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTradeToggle = (tradeId: string) => {
    setProfessionalFormData((prev) => {
      const tradeIds = prev.tradeIds.includes(tradeId)
        ? prev.tradeIds.filter((id) => id !== tradeId)
        : [...prev.tradeIds, tradeId];
      return { ...prev, tradeIds };
    });
    if (errors.tradeIds) {
      setErrors((prev) => ({ ...prev, tradeIds: undefined }));
    }
  };

  const validateUserForm = (): boolean => {
    const newErrors: typeof errors = {};
    if (!userFormData.firstName.trim()) {
      newErrors.firstName = t('errors.firstNameRequired');
    }
    if (!userFormData.lastName.trim()) {
      newErrors.lastName = t('errors.lastNameRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateProfessionalForm = (): boolean => {
    const newErrors: typeof errors = {};
    if (professionalFormData.tradeIds.length === 0) {
      newErrors.tradeIds = t('errors.tradeRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({ general: t('user.profilePicture.invalidType') });
        return;
      }
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ general: t('user.profilePicture.tooLarge') });
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadProfilePicture = async () => {
    if (!selectedFile) return;

    try {
      const fileResponse = await uploadFileMutation.mutateAsync({
        file: selectedFile,
        category: 'profile-picture',
      });

      // Update user profile with the new image URL
      await updateUserMutation.mutateAsync({
        ...userFormData,
        profilePictureUrl: fileResponse.url,
      });

      setSelectedFile(null);
      setPreviewUrl(null);
      setErrors({});
    } catch (error: any) {
      setErrors({
        general: error.response?.data?.message || t('user.profilePicture.uploadError'),
      });
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validateUserForm()) return;

    setIsSubmitting(true);
    try {
      // If there's a new file selected, upload it first
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
      setErrors({
        general: error.response?.data?.message || t('errors.general'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfessionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validateProfessionalForm()) return;

    setIsSubmitting(true);
    try {
      await updateProfessionalMutation.mutateAsync(professionalFormData);
    } catch (error: any) {
      setErrors({
        general: error.response?.data?.message || t('errors.general'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const locale = pathname?.split('/')[1] || 'es';

  const tabs = [
    { id: 'user' as TabType, label: t('tabs.user'), icon: '👤' },
    ...(user?.hasClientProfile ? [{ id: 'client' as TabType, label: t('tabs.client'), icon: '🛒' }] : []),
    ...(user?.hasProfessionalProfile ? [{ id: 'professional' as TabType, label: t('tabs.professional'), icon: '👷' }] : []),
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">{t('title')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('subtitle')}</p>
            
            {/* Status and Profiles Info */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">
                    {t('status.label')}
                  </h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    userProfile?.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : userProfile?.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {userProfile?.status === 'ACTIVE' ? t('status.active') : 
                     userProfile?.status === 'PENDING' ? t('status.pending') : 
                     userProfile?.status === 'SUSPENDED' ? t('status.suspended') : 
                     userProfile?.status === 'BANNED' ? t('status.banned') : 
                     userProfile?.status || '-'}
                  </span>
                </div>
                
                {/* Profiles */}
                <div>
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">
                    {t('profiles.label')}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {user.hasClientProfile && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {t('profiles.client')}
                      </span>
                    )}
                    {user?.hasProfessionalProfile && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        {t('profiles.professional')}
                      </span>
                    )}
                    {user?.isAdmin && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                        {t('profiles.admin')}
                      </span>
                    )}
                    {!user?.hasClientProfile && !user?.hasProfessionalProfile && !user?.isAdmin && (
                      <span className="text-gray-500 text-xs">{t('profiles.none')}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsEditing(false);
                    setErrors({});
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* User Tab */}
          {activeTab === 'user' && (
            <div className="bg-white rounded-lg shadow p-6">
              {loadingUser ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : isEditing ? (
                <form onSubmit={handleUserSubmit} className="space-y-6">
                  {errors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800">{errors.general}</p>
                    </div>
                  )}

                  {/* Profile Picture */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('user.profilePicture.label')}
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {(previewUrl || userProfile?.profilePictureUrl) ? (
                          <img
                            src={previewUrl || userProfile?.profilePictureUrl || ''}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleFileSelect}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100
                           
                           
                            cursor-pointer"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {t('user.profilePicture.hint')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('user.email')}
                    </label>
                    <input
                      type="email"
                      value={userProfile?.email || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">{t('user.emailCannotChange')}</p>
                  </div>

                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('user.firstName')} *
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={userFormData.firstName}
                      onChange={handleUserChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.firstName
                          ? 'border-red-300'
                          : 'border-gray-300'
                      } bg-white text-gray-800`}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('user.lastName')} *
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={userFormData.lastName}
                      onChange={handleUserChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.lastName
                          ? 'border-red-300'
                          : 'border-gray-300'
                      } bg-white text-gray-800`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('user.phone')}
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={userFormData.phone}
                      onChange={handleUserChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                      placeholder="+5492944123456"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setErrors({});
                        if (userProfile) {
                          setUserFormData({
                            firstName: userProfile.firstName || '',
                            lastName: userProfile.lastName || '',
                            phone: userProfile.phone || '',
                          });
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? t('saving') : t('save')}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">{t('user.title')}</h2>
                      <p className="text-sm text-gray-500 mt-1">{t('user.subtitle')}</p>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {t('edit')}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Profile Picture */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">{t('user.profilePicture.label')}</h3>
                      {userProfile?.profilePictureUrl ? (
                        <img
                          src={userProfile.profilePictureUrl}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">{t('user.email')}</h3>
                      <p className="text-sm text-gray-800">{userProfile?.email}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">{t('user.firstName')}</h3>
                      <p className="text-sm text-gray-800">{userProfile?.firstName}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-1">{t('user.lastName')}</h3>
                      <p className="text-sm text-gray-800">{userProfile?.lastName}</p>
                    </div>
                    {userProfile?.phone && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-1">{t('user.phone')}</h3>
                        <p className="text-sm text-gray-800">{userProfile.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Client Tab */}
          {activeTab === 'client' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">{t('client.title')}</h2>
                  <p className="text-sm text-gray-500 mt-1">{t('client.subtitle')}</p>
                </div>
                <div className="text-center py-12">
                  <p className="text-gray-500">{t('client.noSettings')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Professional Tab */}
          {activeTab === 'professional' && (
            <div className="bg-white rounded-lg shadow p-6">
              {loadingProfessional ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : !professionalProfile ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">{t('professional.noProfile')}</p>
                  <a
                    href={`/${locale}/specialist/setup`}
                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {t('professional.createProfile')}
                  </a>
                </div>
              ) : isEditing ? (
                <form onSubmit={handleProfessionalSubmit} className="space-y-6">
                  {errors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800">{errors.general}</p>
                    </div>
                  )}

                  {/* Trades Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('professional.trades')} * {t('professional.selectMultiple')}
                    </label>
                    {loadingTrades ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div
                        className={`border rounded-md p-3 space-y-2 max-h-60 overflow-y-auto ${
                          errors.tradeIds
                            ? 'border-red-300'
                            : 'border-gray-300'
                        } bg-white`}
                      >
                        {trades?.map((trade) => (
                          <label
                            key={trade.id}
                            className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={professionalFormData.tradeIds.includes(trade.id)}
                              onChange={() => handleTradeToggle(trade.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-800">
                              {trade.name}
                              {professionalFormData.tradeIds[0] === trade.id && professionalFormData.tradeIds.length > 0 && (
                                <span className="ml-2 text-xs text-blue-600">
                                  ({t('professional.primary')})
                                </span>
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                    {errors.tradeIds && (
                      <p className="mt-1 text-sm text-red-600">{errors.tradeIds}</p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {t('professional.description')}
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={professionalFormData.description}
                      onChange={handleProfessionalChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                      placeholder={t('professional.descriptionPlaceholder')}
                    />
                  </div>

                  {/* Experience Years */}
                  <div>
                    <label
                      htmlFor="experienceYears"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {t('professional.experienceYears')}
                    </label>
                    <input
                      id="experienceYears"
                      name="experienceYears"
                      type="number"
                      min="0"
                      max="50"
                      value={professionalFormData.experienceYears}
                      onChange={handleProfessionalChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('professional.city')}
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={professionalFormData.city}
                      onChange={handleProfessionalChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                    />
                  </div>

                  {/* Zone */}
                  <div>
                    <label htmlFor="zone" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('professional.zone')}
                    </label>
                    <input
                      id="zone"
                      name="zone"
                      type="text"
                      value={professionalFormData.zone}
                      onChange={handleProfessionalChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('professional.address')}
                    </label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={professionalFormData.address}
                      onChange={handleProfessionalChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('professional.whatsapp')}
                    </label>
                    <input
                      id="whatsapp"
                      name="whatsapp"
                      type="tel"
                      value={professionalFormData.whatsapp}
                      onChange={handleProfessionalChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                      {t('professional.website')}
                    </label>
                    <input
                      id="website"
                      name="website"
                      type="url"
                      value={professionalFormData.website}
                      onChange={handleProfessionalChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                    />
                  </div>

                  {/* Gallery */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('professional.gallery.label')}
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      {t('professional.gallery.description')}
                    </p>
                    
                    {/* Gallery Upload */}
                    <div className="mb-4">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          try {
                            // Determine category based on file type
                            const category = file.type.startsWith('video/') ? 'project-video' : 'project-image';
                            const fileResponse = await uploadFileMutation.mutateAsync({
                              file,
                              category,
                            });

                            // Add to gallery
                            await addGalleryItemMutation.mutateAsync(fileResponse.url);
                            e.target.value = ''; // Reset input
                          } catch (error: any) {
                            setErrors({
                              general: error.response?.data?.message || t('professional.gallery.uploadError'),
                            });
                          }
                        }}
                        className="hidden"
                        id="gallery-upload"
                      />
                      <label
                        htmlFor="gallery-upload"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {t('professional.gallery.addPhoto')}
                      </label>
                    </div>

                    {/* Gallery Display */}
                    {professionalProfile?.gallery && professionalProfile.gallery.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {professionalProfile.gallery.map((url, index) => (
                          <div key={index} className="relative group aspect-square overflow-hidden rounded-lg bg-gray-200">
                            {url.match(/\.(mp4|webm|ogg)$/i) ? (
                              <video
                                src={url}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                              />
                            ) : (
                              <img
                                src={url}
                                alt={`Gallery ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <button
                              onClick={async () => {
                                try {
                                  await removeGalleryItemMutation.mutateAsync(url);
                                } catch (error: any) {
                                  setErrors({
                                    general: error.response?.data?.message || t('professional.gallery.removeError'),
                                  });
                                }
                              }}
                              className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                              title={t('professional.gallery.remove')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setErrors({});
                        if (professionalProfile) {
                          setProfessionalFormData({
                            tradeIds: professionalProfile.trades?.map((t: any) => t.id) || [],
                            description: professionalProfile.description || '',
                            experienceYears: professionalProfile.experienceYears?.toString() || '',
                            zone: professionalProfile.zone || '',
                            city: professionalProfile.city || 'Bariloche',
                            address: professionalProfile.address || '',
                            whatsapp: professionalProfile.whatsapp || '',
                            website: professionalProfile.website || '',
                          });
                        }
                      }}
                      className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? t('saving') : t('save')}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">
                        {t('professional.title')}
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {t('professional.subtitle')}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {t('edit')}
                    </button>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">{t('professional.statusLabel')}</h3>
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        professionalProfile.status === 'VERIFIED'
                          ? 'bg-green-100 text-green-800'
                          : professionalProfile.status === 'PENDING_VERIFICATION'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {professionalProfile.status === 'VERIFIED'
                        ? t('professional.status.verified')
                        : professionalProfile.status === 'PENDING_VERIFICATION'
                        ? t('professional.status.pendingVerification')
                        : t('professional.status.rejected')}
                    </span>
                  </div>

                  {/* Trades */}
                  {professionalProfile.trades && professionalProfile.trades.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">
                        {t('professional.trades')}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {professionalProfile.trades.map((trade: any, index: number) => (
                          <span
                            key={trade.id}
                            className={`px-3 py-1 rounded-full text-sm ${
                              trade.isPrimary || index === 0
                                ? 'bg-blue-100 text-blue-800 font-medium'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {trade.name}
                            {(trade.isPrimary || index === 0) && (
                              <span className="ml-1 text-xs">({t('professional.primary')})</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {professionalProfile.description && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        {t('professional.description')}
                      </h3>
                      <p className="text-sm text-gray-800">{professionalProfile.description}</p>
                    </div>
                  )}

                  {/* Experience */}
                  {professionalProfile.experienceYears && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        {t('professional.experienceYears')}
                      </h3>
                      <p className="text-sm text-gray-800">
                        {professionalProfile.experienceYears} {t('professional.years')}
                      </p>
                    </div>
                  )}

                  {/* Location */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      {t('professional.location')}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-800">
                      <p>
                        <span className="font-medium">{t('professional.city')}:</span> {professionalProfile.city}
                      </p>
                      {professionalProfile.zone && (
                        <p>
                          <span className="font-medium">{t('professional.zone')}:</span> {professionalProfile.zone}
                        </p>
                      )}
                      {professionalProfile.address && (
                        <p>
                          <span className="font-medium">{t('professional.address')}:</span> {professionalProfile.address}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Contact */}
                  {(professionalProfile.whatsapp || professionalProfile.website) && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        {t('professional.contact')}
                      </h3>
                      <div className="space-y-1 text-sm">
                        {professionalProfile.whatsapp && (
                          <p className="text-gray-800">
                            <span className="font-medium">WhatsApp:</span>{' '}
                            <a
                              href={`https://wa.me/${professionalProfile.whatsapp.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {professionalProfile.whatsapp}
                            </a>
                          </p>
                        )}
                        {professionalProfile.website && (
                          <p className="text-gray-800">
                            <span className="font-medium">{t('professional.website')}:</span>{' '}
                            <a
                              href={professionalProfile.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {professionalProfile.website}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Rating */}
                  {professionalProfile.averageRating > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        {t('professional.rating')}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500 text-xl">★</span>
                        <span className="text-sm font-medium text-gray-800">
                          {professionalProfile.averageRating.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({professionalProfile.totalReviews} {t('professional.reviews')})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

