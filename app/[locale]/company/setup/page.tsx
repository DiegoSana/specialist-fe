'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { getUser, isAuthenticated, setUser } from '@/lib/auth';
import { useTrades } from '@/hooks/use-professionals';
import { useMyCompanyProfile, useCreateCompany, useUpdateCompany } from '@/hooks/use-company';

const EMPLOYEE_COUNT_OPTIONS = [
  { value: '1-5', label: '1-5' },
  { value: '6-20', label: '6-20' },
  { value: '21-50', label: '21-50' },
  { value: '50+', label: '50+' },
];

export default function CompanySetupPage() {
  const t = useTranslations('company.setup');
  const router = useRouter();
  const pathname = usePathname();
  const user = getUser();

  // Check if this is edit mode (user already has company profile)
  const isEditMode = user?.hasCompanyProfile || false;

  // Fetch existing profile if in edit mode
  const { data: existingProfile, isLoading: loadingProfile } = useMyCompanyProfile();

  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();

  const [formData, setFormData] = useState({
    companyName: '',
    legalName: '',
    taxId: '',
    description: '',
    foundedYear: '',
    employeeCount: '',
    website: '',
    phone: '',
    email: '',
    address: '',
    city: 'Bariloche',
    zone: '',
    tradeIds: [] as string[],
  });

  const [errors, setErrors] = useState<{
    companyName?: string;
    tradeIds?: string;
    general?: string;
  }>({});

  const [isInitialized, setIsInitialized] = useState(false);

  const { data: trades, isLoading: loadingTrades } = useTrades();

  // Pre-fill form with existing data when in edit mode
  useEffect(() => {
    if (isEditMode && existingProfile && !isInitialized) {
      setFormData({
        companyName: existingProfile.companyName || '',
        legalName: existingProfile.legalName || '',
        taxId: existingProfile.taxId || '',
        description: existingProfile.description || '',
        foundedYear: existingProfile.foundedYear?.toString() || '',
        employeeCount: existingProfile.employeeCount || '',
        website: existingProfile.website || '',
        phone: existingProfile.phone || '',
        email: existingProfile.email || '',
        address: existingProfile.address || '',
        city: existingProfile.city || 'Bariloche',
        zone: existingProfile.zone || '',
        tradeIds: existingProfile.trades?.map((t) => t.id) || [],
      });
      setIsInitialized(true);
    }
  }, [isEditMode, existingProfile, isInitialized]);

  useEffect(() => {
    if (!isAuthenticated() || !user) {
      const locale = pathname?.split('/')[1] || 'es';
      router.push(`/${locale}/login`);
    }
  }, [router, user, pathname]);

  if (!user) {
    return null;
  }

  // Show loading while fetching existing profile in edit mode
  if (isEditMode && loadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleTradeToggle = (tradeId: string) => {
    setFormData((prev) => {
      const tradeIds = prev.tradeIds.includes(tradeId)
        ? prev.tradeIds.filter((id) => id !== tradeId)
        : [...prev.tradeIds, tradeId];
      return { ...prev, tradeIds };
    });
    if (errors.tradeIds) {
      setErrors((prev) => ({ ...prev, tradeIds: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = t('errors.companyNameRequired');
    }

    if (formData.tradeIds.length === 0) {
      newErrors.tradeIds = t('errors.tradeRequired');
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

    const payload = {
      companyName: formData.companyName,
      legalName: formData.legalName || undefined,
      taxId: formData.taxId || undefined,
      description: formData.description || undefined,
      foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined,
      employeeCount: formData.employeeCount || undefined,
      website: formData.website || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      address: formData.address || undefined,
      city: formData.city,
      zone: formData.zone || undefined,
      trades: formData.tradeIds.map((id, index) => ({
        id,
        isPrimary: index === 0,
      })),
    };

    try {
      if (isEditMode) {
        await updateCompany.mutateAsync(payload);
      } else {
        await createCompany.mutateAsync(payload);
      }

      // Refresh user data
      const locale = pathname?.split('/')[1] || 'es';
      router.push(isEditMode ? `/${locale}/profile` : `/${locale}/company/dashboard`);
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} company profile:`, error);
      setErrors({
        general: error.response?.data?.message || t('errors.general'),
      });
    }
  };

  const isSubmitting = createCompany.isPending || updateCompany.isPending;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {isEditMode ? t('editTitle') : t('title')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isEditMode ? t('editSubtitle') : t('subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            )}

            {/* Company Name */}
            <div>
              <label
                htmlFor="companyName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('companyName')} *
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                value={formData.companyName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800 ${
                  errors.companyName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={t('companyNamePlaceholder')}
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
              )}
            </div>

            {/* Legal Name */}
            <div>
              <label
                htmlFor="legalName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('legalName')}
              </label>
              <input
                id="legalName"
                name="legalName"
                type="text"
                value={formData.legalName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
                placeholder={t('legalNamePlaceholder')}
              />
            </div>

            {/* Tax ID (CUIT) */}
            <div>
              <label
                htmlFor="taxId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('taxId')}
              </label>
              <input
                id="taxId"
                name="taxId"
                type="text"
                value={formData.taxId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
                placeholder={t('taxIdPlaceholder')}
              />
            </div>

            {/* Trade Selection - Multiple */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('trades')} * {t('selectMultiple')}
              </label>
              {loadingTrades ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                </div>
              ) : (
                <div
                  className={`border rounded-md p-3 space-y-2 max-h-60 overflow-y-auto ${
                    errors.tradeIds ? 'border-red-300' : 'border-gray-300'
                  } bg-white`}
                >
                  {trades?.map((trade) => (
                    <label
                      key={trade.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.tradeIds.includes(trade.id)}
                        onChange={() => handleTradeToggle(trade.id)}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-800">
                        {trade.name}
                        {formData.tradeIds[0] === trade.id && formData.tradeIds.length > 0 && (
                          <span className="ml-2 text-xs text-emerald-600">
                            ({t('primary')})
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
              {formData.tradeIds.length > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  {t('selectedTrades')}: {formData.tradeIds.length}. {t('firstIsPrimary')}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('description')}
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
                placeholder={t('descriptionPlaceholder')}
              />
            </div>

            {/* Founded Year & Employee Count */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="foundedYear"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t('foundedYear')}
                </label>
                <input
                  id="foundedYear"
                  name="foundedYear"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.foundedYear}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
                  placeholder={t('foundedYearPlaceholder')}
                />
              </div>
              <div>
                <label
                  htmlFor="employeeCount"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t('employeeCount')}
                </label>
                <select
                  id="employeeCount"
                  name="employeeCount"
                  value={formData.employeeCount}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
                >
                  <option value="">{t('selectEmployeeCount')}</option>
                  {EMPLOYEE_COUNT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} {t('employees')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contact Info */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">{t('contactInfo')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t('phone')}
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
                    placeholder="+5492944123456"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t('email')}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
                    placeholder={t('emailPlaceholder')}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label
                  htmlFor="website"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t('website')}
                </label>
                <input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
                  placeholder="https://www.ejemplo.com"
                />
              </div>
            </div>

            {/* Location */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">{t('location')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t('city')}
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
                  />
                </div>
                <div>
                  <label
                    htmlFor="zone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t('zone')}
                  </label>
                  <input
                    id="zone"
                    name="zone"
                    type="text"
                    value={formData.zone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
                    placeholder={t('zonePlaceholder')}
                  />
                </div>
              </div>
              <div className="mt-4">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t('address')}
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-gray-800"
                  placeholder={t('addressPlaceholder')}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Link
                href={isEditMode ? `/${pathname?.split('/')[1] || 'es'}/profile` : '/dashboard'}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {isEditMode ? t('cancel') : t('skip')}
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? isEditMode
                    ? t('saving')
                    : t('creating')
                  : isEditMode
                  ? t('save')
                  : t('create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


