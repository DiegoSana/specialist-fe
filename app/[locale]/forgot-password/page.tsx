'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useForgotPassword } from '@/hooks/use-password-reset';
import Footer from '@/components/layout/footer';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword');
  const params = useParams();
  const locale = typeof params.locale === 'string' ? params.locale : 'es';

  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const forgotPasswordMutation = useForgotPassword();

  const validateForm = (): boolean => {
    const newErrors: { email?: string } = {};

    if (!email) {
      newErrors.email = t('emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('emailInvalid');
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
      await forgotPasswordMutation.mutateAsync({ email });
      setSubmitted(true);
    } catch (error: any) {
      setErrors({ general: t('error') });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center">
            <Link href="/" className="inline-block">
              <span className="text-3xl font-bold text-blue-600">Specialist</span>
            </Link>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">{t('title')}</h2>
              <p className="mt-2 text-sm text-gray-500">{t('subtitle')}</p>
            </div>

            {submitted ? (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-800">{t('success')}</p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {errors.general && (
                  <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                    <div className="text-sm text-red-600">{errors.general}</div>
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('email')}
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.email ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="tu@email.com"
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={forgotPasswordMutation.isPending}
                  className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {forgotPasswordMutation.isPending ? t('submitting') : t('submit')}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  {t('backToLogin')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer locale={locale} />
    </div>
  );
}
