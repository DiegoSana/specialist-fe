'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { VerificationType } from '@/hooks/use-verification';
import {
  useRequestPhoneVerification,
  useConfirmPhoneVerification,
  useRequestEmailVerification,
  useConfirmEmailVerification,
} from '@/hooks/use-verification';
import { getUser } from '@/lib/auth';

interface VerificationModalProps {
  type: VerificationType;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

type PhoneStep = 'phone' | 'code';
type EmailStep = 'request' | 'waiting';

export default function VerificationModal({
  type,
  isOpen,
  onClose,
  onSuccess,
  onCancel,
}: VerificationModalProps) {
  const t = useTranslations('verification');
  const tCommon = useTranslations('common');
  const user = getUser();

  // Phone verification state
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('phone');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Email verification state
  const [emailStep, setEmailStep] = useState<EmailStep>('request');
  const [emailCode, setEmailCode] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  // Mutations
  const requestPhone = useRequestPhoneVerification();
  const confirmPhone = useConfirmPhoneVerification();
  const requestEmail = useRequestEmailVerification();
  const confirmEmail = useConfirmEmailVerification();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setPhoneStep('phone');
      setPhoneCode('');
      setPhoneError(null);
      setEmailStep('request');
      setEmailCode('');
      setEmailError(null);
    }
  }, [isOpen]);

  const handleRequestPhone = async () => {
    setPhoneError(null);
    try {
      await requestPhone.mutateAsync();
      setPhoneStep('code');
    } catch (error: any) {
      setPhoneError(
        error.response?.data?.message || t('phone.requestError')
      );
    }
  };

  const handleConfirmPhone = async () => {
    if (phoneCode.length < 4) {
      setPhoneError(t('phone.codeTooShort'));
      return;
    }

    setPhoneError(null);
    try {
      await confirmPhone.mutateAsync(phoneCode);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      setPhoneError(
        error.response?.data?.message || t('phone.confirmError')
      );
    }
  };

  const handleRequestEmail = async () => {
    setEmailError(null);
    try {
      await requestEmail.mutateAsync();
      setEmailStep('waiting');
    } catch (error: any) {
      setEmailError(
        error.response?.data?.message || t('email.requestError')
      );
    }
  };

  const handleConfirmEmail = async () => {
    if (emailCode.length < 4) {
      setEmailError(t('email.codeTooShort'));
      return;
    }

    setEmailError(null);
    try {
      await confirmEmail.mutateAsync(emailCode);
      onSuccess?.();
      onClose();
    } catch (error: any) {
      setEmailError(
        error.response?.data?.message || t('email.confirmError')
      );
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex-1 min-w-0">
            {type === 'PHONE' ? t('phone.title') : t('email.title')}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700 flex-shrink-0"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {type === 'PHONE' ? (
            <>
              {phoneStep === 'phone' ? (
                <div className="space-y-4">
                  <p className="text-sm sm:text-base text-gray-600">{t('phone.description')}</p>
                  
                  {user?.phone ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1">{t('phone.currentPhone')}</p>
                      <p className="font-medium text-sm sm:text-base break-all">{user.phone}</p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                      <p className="text-xs sm:text-sm text-yellow-800">
                        {t('phone.noPhone')}
                      </p>
                    </div>
                  )}

                  {phoneError && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                      <p className="text-xs sm:text-sm text-red-800">{phoneError}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleCancel}
                      className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      {tCommon('cancel')}
                    </button>
                    <button
                      onClick={handleRequestPhone}
                      disabled={requestPhone.isPending || !user?.phone}
                      className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {requestPhone.isPending ? tCommon('sending') : t('phone.sendCode')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm sm:text-base text-gray-600">{t('phone.enterCode')}</p>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      {t('phone.codeLabel')}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      value={phoneCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setPhoneCode(value);
                        setPhoneError(null);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl sm:text-2xl tracking-widest"
                      placeholder="0000"
                      autoFocus
                    />
                  </div>

                  {phoneError && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                      <p className="text-xs sm:text-sm text-red-800">{phoneError}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setPhoneStep('phone')}
                      className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      {tCommon('back')}
                    </button>
                    <button
                      onClick={handleConfirmPhone}
                      disabled={confirmPhone.isPending || phoneCode.length < 4}
                      className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {confirmPhone.isPending ? tCommon('verifying') : t('phone.verify')}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {emailStep === 'request' ? (
                <div className="space-y-4">
                  <p className="text-sm sm:text-base text-gray-600">{t('email.description')}</p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">{t('email.currentEmail')}</p>
                    <p className="font-medium text-sm sm:text-base break-all">{user?.email}</p>
                  </div>

                  {emailError && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                      <p className="text-xs sm:text-sm text-red-800">{emailError}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleCancel}
                      className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      {tCommon('cancel')}
                    </button>
                    <button
                      onClick={handleRequestEmail}
                      disabled={requestEmail.isPending}
                      className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {requestEmail.isPending ? tCommon('sending') : t('email.sendCode')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <p className="text-xs sm:text-sm text-blue-800 mb-2">
                      {t('email.checkInbox')}
                    </p>
                    <p className="text-xs sm:text-sm text-blue-700">
                      {t('email.checkInboxDescription')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      {t('email.codeLabel')}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      value={emailCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setEmailCode(value);
                        setEmailError(null);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl sm:text-2xl tracking-widest"
                      placeholder="0000"
                      autoFocus
                    />
                  </div>

                  {emailError && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                      <p className="text-xs sm:text-sm text-red-800">{emailError}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setEmailStep('request')}
                      className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      {tCommon('back')}
                    </button>
                    <button
                      onClick={handleConfirmEmail}
                      disabled={confirmEmail.isPending || emailCode.length < 4}
                      className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {confirmEmail.isPending ? tCommon('verifying') : t('email.verify')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

