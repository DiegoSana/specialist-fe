'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useCreateRequest } from '@/hooks/use-requests';
import { useTradesWithProfessionals } from '@/hooks/use-professionals';
import { useSearchProviders, UnifiedProvider } from '@/hooks/use-providers';
import ProtectedLayout from '@/components/layout/protected-layout';
import { Trade } from '@/types';

type RequestType = 'public' | 'direct' | null;

export default function NewRequestPage() {
  const t = useTranslations('client.newRequest');
  const tProfileActive = useTranslations('profileActive');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [requestType, setRequestType] = useState<RequestType>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<UnifiedProvider | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    availability: '',
    photos: [] as string[],
  });

  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    address?: string;
    general?: string;
  }>({});

  const [isProfileInactiveError, setIsProfileInactiveError] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  const { data: trades } = useTradesWithProfessionals();
  const { data: allProviders } = useSearchProviders({ providerType: 'ALL' });
  const createRequestMutation = useCreateRequest();

  // Pre-select provider if professionalId or companyId is in URL
  useEffect(() => {
    const professionalId = searchParams.get('professionalId');
    const companyId = searchParams.get('companyId');
    const providerId = professionalId || companyId;
    
    if (providerId && allProviders && allProviders.length > 0) {
      const provider = allProviders.find((p) => p.id === providerId);
      if (provider) {
        setSelectedProvider(provider);
        setRequestType('direct');
        // Set the primary trade from the provider
        if (provider.trades && provider.trades.length > 0) {
          const primaryTrade = provider.trades.find((t) => t.isPrimary) || provider.trades[0];
          if (trades) {
            const trade = trades.find((t) => t.id === primaryTrade.id);
            if (trade) {
              setSelectedTrade(trade);
            }
          }
        }
      }
    }
  }, [searchParams, allProviders, trades]);

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

    const matchingProviders = (allProviders || []).filter((provider) => {
      const displayName = provider.displayName.toLowerCase();
      const tradeName = provider.trades?.map((t) => t.name.toLowerCase()).join(' ') || '';
      return displayName.includes(query) || tradeName.includes(query);
    });

    return {
      trades: matchingTrades,
      providers: matchingProviders,
    };
  }, [searchQuery, trades, allProviders]);

  // Get providers for selected trade
  const providersForTrade = useMemo(() => {
    if (!selectedTrade || !allProviders) return [];
    return allProviders.filter((p) =>
      p.trades?.some((t) => t.id === selectedTrade.id)
    );
  }, [selectedTrade, allProviders]);

  const handleTradeSelect = (trade: Trade) => {
    setSelectedTrade(trade);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleProviderSelect = (provider: UnifiedProvider) => {
    setSelectedProvider(provider);
    setRequestType('direct');
    if (!selectedTrade && provider.trades && provider.trades.length > 0) {
      const primaryTrade = provider.trades.find((t) => t.isPrimary) || provider.trades[0];
      const trade = trades?.find((t) => t.id === primaryTrade.id);
      if (trade) setSelectedTrade(trade);
    }
    setSearchQuery('');
    setShowDropdown(false);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (requestType === 'direct' && !selectedProvider) {
      newErrors.general = t('errors.selectSpecialist');
    }

    if (requestType === 'public' && !selectedTrade) {
      newErrors.general = 'Debes seleccionar una especialidad';
    }

    if (!formData.title.trim()) {
      newErrors.title = t('errors.titleRequired');
    } else if (formData.title.trim().length < 5) {
      newErrors.title = t('errors.titleMinLength');
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
    setIsProfileInactiveError(false);

    if (!validateForm()) {
      return;
    }

    try {
      await createRequestMutation.mutateAsync({
        professionalId: requestType === 'direct' && selectedProvider?.type === 'PROFESSIONAL' ? selectedProvider.id : undefined,
        companyId: requestType === 'direct' && selectedProvider?.type === 'COMPANY' ? selectedProvider.id : undefined,
        tradeId: selectedTrade?.id,
        isPublic: requestType === 'public',
        title: formData.title,
        description: formData.description,
        address: formData.address,
        availability: formData.availability,
        photos: formData.photos,
      });

      const locale = pathname?.split('/')[1] || 'es';
      router.push(`/${locale}/client/dashboard`);
    } catch (error: any) {
      const msg = error.response?.data?.message as string | undefined;
      const lower = (msg || '').toLowerCase();
      const isProfileInactive =
        !!msg &&
        lower.includes('verify') &&
        (lower.includes('email') || lower.includes('phone'));
      setErrors({
        general: isProfileInactive
          ? tProfileActive('createRequestMessage')
          : msg || t('errors.general'),
      });
      setIsProfileInactiveError(isProfileInactive);
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
    if (selectedProvider) {
      setSelectedProvider(null);
    } else if (selectedTrade && requestType === 'direct') {
      setSelectedTrade(null);
    } else if (requestType) {
      setRequestType(null);
      setSelectedTrade(null);
      setSelectedProvider(null);
    } else {
      const locale = pathname?.split('/')[1] || 'es';
      router.push(`/${locale}/client/dashboard`);
    }
  };

  const locale = pathname?.split('/')[1] || 'es';

  return (
    <ProtectedLayout requireProfile={false}>
      {(user) => {
        const needsVerificationToCreate =
          user && (user.emailVerified === false || user.phoneVerified === false);

        return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Proactive message: need to verify before creating request */}
          {needsVerificationToCreate && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800">{tProfileActive('createRequestMessage')}</p>
              <Link
                href={`/${locale}/profile`}
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {tProfileActive('goToProfile')}
                <span aria-hidden>→</span>
              </Link>
            </div>
          )}

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
                    // min-w-0: same CSS Grid min-width:auto footgun as the provider list below.
                    className="min-w-0 bg-gray-50 rounded-xl p-4 hover:bg-blue-50 hover:border-blue-300 border-2 border-transparent transition-all text-left"
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

          {/* Step 2B: Direct Request - Select Provider */}
          {requestType === 'direct' && !selectedProvider && (
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
                    {filteredResults.providers && filteredResults.providers.length > 0 ? (
                      <div className="p-2">
                        {filteredResults.providers.map((provider) => (
                          <button
                            key={provider.id}
                            onClick={() => handleProviderSelect(provider)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-lg flex items-center gap-3"
                          >
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                              {provider.profileImage || provider.user?.profilePictureUrl ? (
                                <img src={provider.profileImage || provider.user?.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <div className="truncate font-medium text-gray-800">
                                  {provider.displayName}
                                </div>
                                {provider.type === 'COMPANY' && (
                                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                    Empresa
                                  </span>
                                )}
                              </div>
                              <div className="truncate text-sm text-gray-500">
                                {provider.trades?.map((t) => t.name).join(', ')}
                              </div>
                            </div>
                            {provider.averageRating > 0 && (
                              <div className="text-sm text-yellow-500 font-medium">
                                ★ {provider.averageRating.toFixed(1)}
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

              {/* All Providers */}
              <div className="grid gap-3">
                {(allProviders || []).slice(0, 10).map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleProviderSelect(provider)}
                    // min-w-0: as a CSS Grid item (parent: "grid gap-3"), this button defaults
                    // to min-width:auto, which lets its content force it - and the whole page -
                    // wider than the viewport on narrow screens.
                    className="min-w-0 bg-gray-50 rounded-xl p-4 hover:bg-green-50 hover:border-green-300 border-2 border-transparent transition-all text-left flex items-center gap-4"
                  >
                    <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                      {provider.profileImage || provider.user?.profilePictureUrl ? (
                        <img src={provider.profileImage || provider.user?.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-gray-800">
                          {provider.displayName}
                        </div>
                        {provider.type === 'COMPANY' && (
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            Empresa
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {provider.trades?.map((t) => t.name).join(', ')}
                      </div>
                      {provider.city && (
                        <div className="text-xs text-gray-400 mt-1">
                          📍 {provider.city}{provider.zone && `, ${provider.zone}`}
                        </div>
                      )}
                    </div>
                    {provider.averageRating > 0 && (
                      <div className="text-right flex-shrink-0">
                        <div className="text-yellow-500 font-semibold">★ {provider.averageRating.toFixed(1)}</div>
                        <div className="text-xs text-gray-400">{provider.totalReviews} {t('reviews')}</div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Request Form */}
          {((requestType === 'public' && selectedTrade) || (requestType === 'direct' && selectedProvider)) && (
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
                          {selectedProvider?.profileImage || selectedProvider?.user?.profilePictureUrl ? (
                            <img src={selectedProvider.profileImage || selectedProvider.user?.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <div className="text-sm text-green-600 font-medium">{t('directRequest.title')}</div>
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-gray-800">
                              {selectedProvider?.displayName}
                            </div>
                            {selectedProvider?.type === 'COMPANY' && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                Empresa
                              </span>
                            )}
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

              {/* WhatsApp Info for Direct Requests */}
              {requestType === 'direct' && selectedProvider && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-green-800 font-medium mb-1">
                      {t('whatsappInfo.title')}
                    </p>
                    <p className="text-sm text-green-700">
                      {t('whatsappInfo.description')}
                    </p>
                  </div>
                </div>
              )}

              <h2 className="text-lg font-semibold text-gray-800">
                {t('requestDetails')}
              </h2>

              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-600">{errors.general}</p>
                  {isProfileInactiveError && (
                    <Link
                      href={`/${pathname?.split('/')[1] || 'es'}/profile`}
                      className="inline-block mt-3 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {tProfileActive('goToProfile')} →
                    </Link>
                  )}
                </div>
              )}

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('title')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 ${
                    errors.title ? 'border-red-300' : 'border-gray-200'
                  }`}
                  placeholder={t('titlePlaceholder')}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                )}
              </div>

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
        );
      }}
    </ProtectedLayout>
  );
}
