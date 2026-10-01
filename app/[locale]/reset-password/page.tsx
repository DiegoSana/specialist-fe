'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useResetPassword } from '@/hooks/use-password-reset';
import Footer from '@/components/layout/footer';

export default function ResetPasswordPage() {
  const t = useTranslations('auth.resetPassword');
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'es';
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [submitted, setSubmitted] = useState(false);

  const resetPasswordMutation = useResetPassword();

  const validateForm = (): boolean => {
    const newErrors: { newPassword?: string; confirmPassword?: string } = {};

    if (!newPassword) {
      newErrors.newPassword = t('newPasswordRequired');
    } else if (newPassword.length < 6) {
      newErrors.newPassword = t('newPasswordMinLength');
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t('confirmPasswordRequired');
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = t('passwordsNotMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!token || !validateForm()) {
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({ token, newPassword });
      setSubmitted(true);
    } catch (error: any) {
      if (error.response?.status === 400) {
        setErrors({ general: t('invalidTokenError') });
      } else {
        setErrors({ general: t('error') });
      }
    }
  };

  // No token at all in the URL: show an invalid-link state immediately, no form.
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <Link href="/" className="inline-block">
                <span className="text-3xl font-bold text-blue-600">Specialist</span>
              </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">{t('invalidLinkTitle')}</h2>
              </div>

              <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                <div className="text-sm text-red-600">{t('invalidLinkMessage')}</div>
              </div>

              <div className="mt-6 text-center">
                <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  {t('requestNewLink')}
                </Link>
              </div>
            </div>
          </div>
        </div>
        <Footer locale={locale} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-block">
              <span className="text-3xl font-bold text-blue-600">Specialist</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">{t('title')}</h2>
              {!submitted && <p className="mt-2 text-sm text-gray-500">{t('subtitle')}</p>}
            </div>

            {submitted ? (
              <>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <p className="text-sm text-blue-800">{t('success')}</p>
                </div>
                <div className="mt-6 text-center">
                  <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                    {t('goToLogin')}
                  </Link>
                </div>
              </>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {errors.general && (
                  <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                    <div className="text-sm text-red-600">{errors.general}</div>
                    {errors.general === t('invalidTokenError') && (
                      <Link
                        href="/forgot-password"
                        className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-500"
                      >
                        {t('requestNewLink')}
                      </Link>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('newPassword')}
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.newPassword ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="••••••••"
                  />
                  {errors.newPassword && (
                    <p className="mt-1.5 text-sm text-red-500">{errors.newPassword}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('confirmPassword')}
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-sm text-red-500">{errors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {resetPasswordMutation.isPending ? t('submitting') : t('submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer locale={locale} />
    </div>
  );
}
