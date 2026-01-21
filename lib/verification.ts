'use client';

import { VerificationType } from '@/hooks/use-verification';
import { getUser } from './auth';

type VerificationCallback = () => void;

// Global state for verification modal
let verificationState: {
  isOpen: boolean;
  type: VerificationType | null;
  onSuccess: VerificationCallback | null;
  onCancel: VerificationCallback | null;
} = {
  isOpen: false,
  type: null,
  onSuccess: null,
  onCancel: null,
};

// Listeners for state changes
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function subscribeToVerificationState(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getVerificationState() {
  return verificationState;
}

export function openVerificationModal(
  type: VerificationType,
  onSuccess?: VerificationCallback,
  onCancel?: VerificationCallback
) {
  verificationState = {
    isOpen: true,
    type,
    onSuccess: onSuccess || null,
    onCancel: onCancel || null,
  };
  notifyListeners();
}

export function closeVerificationModal() {
  verificationState = {
    isOpen: false,
    type: null,
    onSuccess: null,
    onCancel: null,
  };
  notifyListeners();
}

/**
 * Check if verification requirements are met.
 * If not, opens the verification modal.
 * Returns a promise that resolves to true if requirements are met, false if cancelled.
 */
export async function verifyRequirements(
  requirements: VerificationType[]
): Promise<boolean> {
  return new Promise((resolve) => {
    const user = getUser();
    if (!user) {
      resolve(false);
      return;
    }

    // Check which requirements are not met
    const unmetRequirements: VerificationType[] = [];

    if (requirements.includes('PHONE') && !user.phoneVerified) {
      unmetRequirements.push('PHONE');
    }

    if (requirements.includes('EMAIL') && !user.emailVerified) {
      unmetRequirements.push('EMAIL');
    }

    // If all requirements are met, resolve immediately
    if (unmetRequirements.length === 0) {
      resolve(true);
      return;
    }

    // Open modal for first unmet requirement
    const firstRequirement = unmetRequirements[0];
    
    openVerificationModal(
      firstRequirement,
      () => {
        // On success, check if there are more requirements
        const updatedUser = getUser();
        const stillUnmet = unmetRequirements.filter((req) => {
          if (req === 'PHONE') return !updatedUser?.phoneVerified;
          if (req === 'EMAIL') return !updatedUser?.emailVerified;
          return false;
        });

        if (stillUnmet.length === 0) {
          resolve(true);
        } else {
          // Recursively check remaining requirements
          verifyRequirements(stillUnmet).then(resolve);
        }
      },
      () => {
        // On cancel
        resolve(false);
      }
    );
  });
}

