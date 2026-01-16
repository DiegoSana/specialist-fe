'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useLogin } from '@/hooks/use-auth';
import { isAuthenticated, getUser } from '@/lib/auth';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const loginMutation = useLogin();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      const user = getUser();
      if (user) {
        // If no profile, go to profile setup
        if (!user.hasClientProfile && !user.hasProfessionalProfile) {
          router.push('/es/profile-setup');
        } else if (user.hasProfessionalProfile) {
          router.push('/es/specialist/dashboard');
        } else {
          router.push('/es/professionals');
        }
      }
    }
  }, [router]);

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = t('emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('emailInvalid');
    }

    if (!password) {
      newErrors.password = t('passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('passwordMinLength');
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
      await loginMutation.mutateAsync({ email, password });
    } catch (error: any) {
      if (error.response?.status === 401) {
        setErrors({ general: t('invalidCredentials') });
      } else if (error.message) {
        setErrors({ general: error.message });
      } else {
        setErrors({ general: t('error') || 'An error occurred. Please try again.' });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold text-blue-600">Specialist</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
              {t('title')}
            </h2>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/google`}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="font-medium text-sm">Continuar con Google</span>
            </a>
            
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/facebook`}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#1877F2] text-white hover:bg-[#166FE5] transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="font-medium text-sm">Continuar con Facebook</span>
            </a>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-400">
                o continúa con tu email
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                <div className="text-sm text-red-600">
                  {errors.general}
                </div>
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('password')}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.password ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1.5 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t('signingIn')}
                </span>
              ) : (
                t('signIn')
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {t('noAccount')}{' '}
              <Link
                href="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {t('signUp')}
              </Link>
            </p>
          </div>
        </div>

        {/* Beta Test Credentials */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-amber-600 text-lg">🧪</span>
            <h3 className="font-semibold text-amber-800">Versión Beta - Cuentas de prueba</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Specialists */}
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">👤 Especialistas</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => { setEmail('electricista@test.com'); setPassword('Test1234!'); }}
                  className="w-full text-left p-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-700">electricista@test.com</p>
                  <p className="text-xs text-gray-400">Roberto - Electricista ⭐4.8</p>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('plomero@test.com'); setPassword('Test1234!'); }}
                  className="w-full text-left p-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-700">plomero@test.com</p>
                  <p className="text-xs text-gray-400">Miguel - Plomero ⭐4.5</p>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('carpintero@test.com'); setPassword('Test1234!'); }}
                  className="w-full text-left p-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-700">carpintero@test.com</p>
                  <p className="text-xs text-gray-400">Diego - Carpintero ⭐5.0</p>
                </button>
              </div>
            </div>

            {/* Companies */}
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">🏢 Empresas</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => { setEmail('constructora@test.com'); setPassword('Test1234!'); }}
                  className="w-full text-left p-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-700">constructora@test.com</p>
                  <p className="text-xs text-gray-400">Constructora del Sur ⭐4.9</p>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('serviciostech@test.com'); setPassword('Test1234!'); }}
                  className="w-full text-left p-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-700">serviciostech@test.com</p>
                  <p className="text-xs text-gray-400">Servicios Técnicos ⭐4.6</p>
                </button>
              </div>
            </div>

            {/* Clients */}
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">🔍 Clientes</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => { setEmail('cliente1@test.com'); setPassword('Test1234!'); }}
                  className="w-full text-left p-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-700">cliente1@test.com</p>
                  <p className="text-xs text-gray-400">Juan Pérez</p>
                </button>
                <button
                  type="button"
                  onClick={() => { setEmail('cliente2@test.com'); setPassword('Test1234!'); }}
                  className="w-full text-left p-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-700">cliente2@test.com</p>
                  <p className="text-xs text-gray-400">María García</p>
                </button>
              </div>
            </div>

            {/* Admin */}
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">⚙️ Admin</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => { setEmail('admin@specialist.com'); setPassword('Test1234!'); }}
                  className="w-full text-left p-2 rounded-lg bg-white border border-amber-200 hover:border-amber-400 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-700">admin@specialist.com</p>
                  <p className="text-xs text-gray-400">Administrador</p>
                </button>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-amber-600 mt-3 text-center">
            Hacé clic en una cuenta para auto-completar • Pass: Test1234!
          </p>
        </div>
      </div>
    </div>
  );
}
