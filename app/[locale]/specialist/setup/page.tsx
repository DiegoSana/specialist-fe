'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { getUser, isAuthenticated, setUser } from '@/lib/auth';
import { useTrades } from '@/hooks/use-professionals';
import apiClient from '@/lib/api-client';

export default function ProfessionalSetupPage() {
  const t = useTranslations('professional.setup');
  const router = useRouter();
  const pathname = usePathname();
  const user = getUser();

  const [formData, setFormData] = useState({
    tradeIds: [] as string[],
    description: '',
    experienceYears: '',
    zone: '',
    city: 'Bariloche',
    address: '',
    whatsapp: '',
  });

  const [errors, setErrors] = useState<{
    tradeIds?: string;
    general?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: trades, isLoading: loadingTrades } = useTrades();

  useEffect(() => {
    if (!isAuthenticated() || !user) {
      const locale = pathname?.split('/')[1] || 'es';
      router.push(`/${locale}/login`);
    }
  }, [router, user, pathname]);

  if (!user) {
    return null;
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

    setIsSubmitting(true);

    try {
      const response = await apiClient.post<{ professional: any; user: any }>('/service/professionals/me/profile', {
        tradeIds: formData.tradeIds,
        description: formData.description || undefined,
        experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : undefined,
        zone: formData.zone || undefined,
        city: formData.city,
        address: formData.address || undefined,
        whatsapp: formData.whatsapp || undefined,
      });

      // Update user data in localStorage if provided
      if (response.data.user) {
        setUser(response.data.user);
      }

      // Redirect to professionals page
      const locale = pathname?.split('/')[1] || 'es';
      router.push(`/${locale}/professionals`);
    } catch (error: any) {
      console.error('Error creating professional profile:', error);
      setErrors({
        general: error.response?.data?.message || t('errors.general'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {t('title')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{errors.general}</p>
              </div>
            )}

            {/* Trade Selection - Multiple */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('trades')} * {t('selectMultiple')}
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
                        checked={formData.tradeIds.includes(trade.id)}
                        onChange={() => handleTradeToggle(trade.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-800">
                        {trade.name}
                        {formData.tradeIds[0] === trade.id && formData.tradeIds.length > 0 && (
                          <span className="ml-2 text-xs text-blue-600">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                placeholder={t('descriptionPlaceholder')}
              />
            </div>

            {/* Experience Years */}
            <div>
              <label
                htmlFor="experienceYears"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('experienceYears')}
              </label>
              <input
                id="experienceYears"
                name="experienceYears"
                type="number"
                min="0"
                max="50"
                value={formData.experienceYears}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                placeholder={t('experienceYearsPlaceholder')}
              />
            </div>

            {/* City */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
              />
            </div>

            {/* Zone */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                placeholder={t('zonePlaceholder')}
              />
            </div>

            {/* Address */}
            <div>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                placeholder={t('addressPlaceholder')}
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label
                htmlFor="whatsapp"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('whatsapp')}
              </label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                value={formData.whatsapp}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
                placeholder="+5492944123456"
              />
            </div>

            <div className="flex gap-4">
              <Link
                href="/dashboard"
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {t('skip')}
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t('creating') : t('create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

