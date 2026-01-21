'use client';

import { useState, useEffect } from 'react';
import VerificationModal from './verification-modal';
import {
  subscribeToVerificationState,
  getVerificationState,
  closeVerificationModal,
} from '@/lib/verification';
import { VerificationType } from '@/hooks/use-verification';

export default function VerificationProvider() {
  const [state, setState] = useState(getVerificationState());

  useEffect(() => {
    const unsubscribe = subscribeToVerificationState(() => {
      setState(getVerificationState());
    });

    return unsubscribe;
  }, []);

  const handleClose = () => {
    if (state.onCancel) {
      state.onCancel();
    }
    closeVerificationModal();
  };

  const handleSuccess = () => {
    if (state.onSuccess) {
      state.onSuccess();
    }
    closeVerificationModal();
  };

  if (!state.isOpen || !state.type) {
    return null;
  }

  return (
    <VerificationModal
      type={state.type as VerificationType}
      isOpen={state.isOpen}
      onClose={handleClose}
      onSuccess={handleSuccess}
      onCancel={handleClose}
    />
  );
}

