'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getUser, isAuthenticated } from '@/lib/auth';
import { useCreateRequest } from '@/hooks/use-requests';
import { useTradesWithProfessionals, useSearchProfessionals } from '@/hooks/use-professionals';
import AppLayout from '@/components/layout/app-layout';
import { Professional, Trade } from '@/types';

type RequestType = 'public' | 'direct' | null;

export default function NewRequestPage() {
  const t = useTranslations('client.newRequest');
  const router = useRouter();
  const pathname = usePathname();
  const user = getUser();

  const [requestType, setRequestType] = useState<RequestType>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    address: '',
    availability: '',
    photos: [] as string[],
  });

  const [errors, setErrors] = useState<{
    description?: string;
    address?: string;
    general?: string;
  }>({});

  const searchRef = useRef<HTMLDivElement>(null);

  const { data: trades } = useTradesWithProfessionals();
  const { data: allProfessionals } = useSearchProfessionals({});
  const createRequestMutation = useCreateRequest();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter trades and professionals based on search
  const filteredResults = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    
    if (!query) {
      return {
        trades: trades || [],
        professionals: [],
      };
    }

    const matchingTrades = (trades || []).filter(
      (trade) =>
        trade.name.toLowerCase().includes(query) ||
        trade.description?.toLowerCase().includes(query)
    );

    const matchingProfessionals = (allProfessionals || []).filter((professional) => {
      const fullName = `${professional.user?.firstName || ''} ${professional.user?.lastName || ''}`.toLowerCase();
      const tradeName = professional.trades?.map((t) => t.name.toLowerCase()).join(' ') || '';
      return fullName.includes(query) || tradeName.includes(query);
    });

    return {
      trades: matchingTrades,
      professionals: matchingProfessionals,
    };
  }, [searchQuery, trades, allProfessionals]);

  // Get professionals for selected trade
  const professionalsForTrade = useMemo(() => {
    if (!selectedTrade || !allProfessionals) return [];
    return allProfessionals.filter((p) =>
      p.trades?.some((t) => t.id === selectedTrade.id)
    );
  }, [selectedTrade, allProfessionals]);

  if (!isAuthenticated() || !user) {
    const locale = pathname?.split('/')[1] || 'es';
    router.push(`/${locale}/login`);
    return null;
  }

  const handleTradeSelect = (trade: Trade) => {
    setSelectedTrade(trade);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleProfessionalSelect = (professional: Professional) => {
    setSelectedProfessional(professional);
    if (!selectedTrade && professional.trades && professional.trades.length > 0) {
      const primaryTrade = professional.trades.find((t) => t.isPrimary) || professional.trades[0];
      const trade = trades?.find((t) => t.id === primaryTrade.id);
      if (trade) setSelectedTrade(trade);
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (requestType === 'direct' && !selectedProfessional) {
      newErrors.general = t('errors.selectSpecialist');
    }

    if (requestType === 'public' && !selectedTrade) {
      newErrors.general = 'Debes seleccionar una especialidad';
    }

    if (!formData.description.trim()) {
      newErrors.description = t('errors.descriptionRequired');
    } else if (formData.description.trim().length < 10) {
      newErrors.description = t('errors.descriptionMinLength');
    }

    if (!formData.address.trim()) {
      newErrors.address = t('errors.addressRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      await createRequestMutation.mutateAsync({
        professionalId: requestType === 'direct' ? selectedProfessional?.id : undefined,
        tradeId: selectedTrade?.id,
        isPublic: requestType === 'public',
        description: formData.description,
        address: formData.address,
        availability: formData.availability,
        photos: formData.photos,
      });

      const locale = pathname?.split('/')[1] || 'es';
      router.push(`/${locale}/client/dashboard`);
    } catch (error: any) {
      setErrors({
        general: error.response?.data?.message || t('errors.general'),
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const goBack = () => {
    if (selectedProfessional) {
      setSelectedProfessional(null);
    } else if (selectedTrade && requestType === 'direct') {
      setSelectedTrade(null);
    } else if (requestType) {
      setRequestType(null);
      setSelectedTrade(null);
      setSelectedProfessional(null);
    } else {
      const locale = pathname?.split('/')[1] || 'es';
      router.push(`/${locale}/client/dashboard`);
    }
  };

  const locale = pathname?.split('/')[1] || 'es';

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={goBack}
              className="flex items-center text-gray-500 hover:text-gray-700 mb-4"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('back')}
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              {t('title')}
            </h1>
            <p className="text-gray-500 mt-1">
              {t('subtitle')}
            </p>
          </div>

          {/* Step 1: Choose Request Type */}
          {!requestType && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">
                {t('requestTypeTitle')}
              </h2>

              {/* Public Request Option */}
              <button
                onClick={() => setRequestType('public')}
                className="w-full bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 mb-2">
                      {t('publicRequest.title')}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {t('publicRequest.description')}
                    </p>
                    <ul className="space-y-2">
                      {(t.raw('publicRequest.benefits') as string[]).map((benefit, i) => (
                        <li key={i} className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              {/* Direct Request Option */}
              <button
                onClick={() => setRequestType('direct')}
                className="w-full bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-green-500 hover:shadow-lg transition-all text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 group-hover:text-green-600 mb-2">
                      {t('directRequest.title')}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {t('directRequest.description')}
                    </p>
                    <ul className="space-y-2">
                      {(t.raw('directRequest.benefits') as string[]).map((benefit, i) => (
                        <li key={i} className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          )}

          {/* Step 2A: Public Request - Select Trade */}
          {requestType === 'public' && !selectedTrade && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {t('selectTrade')}
              </h2>
              
              {/* Search */}
              <div className="mb-6" ref={searchRef}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>

              {/* Trades Grid */}
              <div className="grid gap-3 md:grid-cols-2">
                {(searchQuery ? filteredResults.trades : trades || []).map((trade) => (
                  <button
                    key={trade.id}
                    onClick={() => handleTradeSelect(trade)}
                    className="bg-gray-50 rounded-xl p-4 hover:bg-blue-50 hover:border-blue-300 border-2 border-transparent transition-all text-left"
                  >
                    <h3 className="font-semibold text-gray-800">{trade.name}</h3>
                    {trade.description && (
                      <p className="text-sm text-gray-500 mt-1">{trade.description}</p>
                    )}
                  </button>
                ))}
              </div>

              {trades?.length === 0 && (
                <p className="text-center text-gray-500 py-8">{t('noTrades')}</p>
              )}
            </div>
          )}

          {/* Step 2B: Direct Request - Select Specialist */}
          {requestType === 'direct' && !selectedProfessional && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {t('selectSpecialist')}
              </h2>
              
              {/* Search */}
              <div className="relative mb-6" ref={searchRef}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800"
                />
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>

                {/* Search Dropdown */}
                {showDropdown && searchQuery && (
                  <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-80 overflow-y-auto">
                    {filteredResults.professionals.length > 0 ? (
                      <div className="p-2">
                        {filteredResults.professionals.map((professional) => (
                          <button
                            key={professional.id}
                            onClick={() => handleProfessionalSelect(professional)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3"
                          >
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                              {professional.user?.profilePictureUrl ? (
                                <img src={professional.user.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">
                                {professional.user?.firstName} {professional.user?.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {professional.trades?.map((t) => t.name).join(', ')}
                              </div>
                            </div>
                            {professional.averageRating > 0 && (
                              <div className="text-sm text-yellow-500 font-medium">
                                ★ {professional.averageRating.toFixed(1)}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">{t('noResults')}</div>
                    )}
                  </div>
                )}
              </div>

              {/* All Specialists */}
              <div className="grid gap-3">
                {(allProfessionals || []).slice(0, 10).map((professional) => (
                  <button
                    key={professional.id}
                    onClick={() => handleProfessionalSelect(professional)}
                    className="bg-gray-50 rounded-xl p-4 hover:bg-green-50 hover:border-green-300 border-2 border-transparent transition-all text-left flex items-center gap-4"
                  >
                    <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {professional.user?.profilePictureUrl ? (
                        <img src={professional.user.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800">
                        {professional.user?.firstName} {professional.user?.lastName}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {professional.trades?.map((t) => t.name).join(', ')}
                      </div>
                      {professional.city && (
                        <div className="text-xs text-gray-400 mt-1">
                          📍 {professional.city}{professional.zone && `, ${professional.zone}`}
                        </div>
                      )}
                    </div>
                    {professional.averageRating > 0 && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-yellow-500 font-semibold">★ {professional.averageRating.toFixed(1)}</div>
                        <div className="text-xs text-gray-400">{professional.totalReviews} {t('reviews')}</div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Request Form */}
          {((requestType === 'public' && selectedTrade) || (requestType === 'direct' && selectedProfessional)) && (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
              {/* Selected Info */}
              <div className={`p-4 rounded-xl ${requestType === 'public' ? 'bg-blue-50 border border-blue-100' : 'bg-green-50 border border-green-100'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {requestType === 'public' ? (
                      <>
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm text-blue-600 font-medium">{t('publicRequest.title')}</div>
                          <div className="font-semibold text-gray-800">{selectedTrade?.name}</div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                          {selectedProfessional?.user?.profilePictureUrl ? (
                            <img src={selectedProfessional.user.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="text-sm text-green-600 font-medium">{t('directRequest.title')}</div>
                          <div className="font-semibold text-gray-800">
                            {selectedProfessional?.user?.firstName} {selectedProfessional?.user?.lastName}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={goBack}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    {t('changeSpecialist')}
                  </button>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-gray-800">
                {t('requestDetails')}
              </h2>

              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('description')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  required
                  value={formData.description}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 ${
                    errors.description ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder={t('descriptionPlaceholder')}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('address')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 ${
                    errors.address ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder={t('addressPlaceholder')}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-500">{errors.address}</p>
                )}
              </div>

              {/* Availability */}
              <div>
                <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('availability')}
                </label>
                <input
                  id="availability"
                  name="availability"
                  type="text"
                  value={formData.availability}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  placeholder={t('availabilityPlaceholder')}
                />
              </div>

              {/* Photos placeholder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('photos')} <span className="text-gray-400 text-xs">({t('optional')})</span>
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                  <p className="text-sm text-gray-400">{t('photosNote')}</p>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={goBack}
                  className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createRequestMutation.isPending}
                  className={`flex-1 px-6 py-3 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                    requestType === 'public'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {createRequestMutation.isPending
                    ? t('creating')
                    : requestType === 'public'
                    ? t('createPublic')
                    : t('createDirect')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
