# Verification Flow Implementation

## Overview

A global, reusable verification flow for phone and email verification has been implemented in the frontend. The implementation follows existing patterns and conventions.

## Components Created

### 1. Verification Hooks (`hooks/use-verification.ts`)
- `useRequestPhoneVerification()` - Request phone verification code
- `useConfirmPhoneVerification()` - Confirm phone verification with OTP
- `useRequestEmailVerification()` - Request email verification code
- `useConfirmEmailVerification()` - Confirm email verification with OTP

All hooks automatically update user state in localStorage and invalidate React Query cache.

### 2. Verification Modal (`components/verification/verification-modal.tsx`)
A multi-step modal component that handles:
- **Phone verification**: Shows phone number → Request code → Enter code → Verify
- **Email verification**: Shows email → Request code → Enter code → Verify

Features:
- Error handling with user-friendly messages
- Loading states
- Input validation
- Responsive design

### 3. Verification Provider (`components/verification/verification-provider.tsx`)
Global provider component that manages the verification modal state. Added to `app/providers.tsx`.

### 4. Verification Helper (`lib/verification.ts`)
Global state management and helper functions:
- `openVerificationModal(type, onSuccess?, onCancel?)` - Open modal programmatically
- `closeVerificationModal()` - Close modal
- `verifyRequirements(requirements)` - Check and prompt for verification

## Usage Examples

### Basic Usage - Open Modal
```typescript
import { openVerificationModal } from '@/lib/verification';

// Open phone verification modal
openVerificationModal('PHONE', () => {
  console.log('Phone verified!');
});

// Open email verification modal
openVerificationModal('EMAIL', () => {
  console.log('Email verified!');
});
```

### Advanced Usage - Check Requirements
```typescript
import { verifyRequirements } from '@/lib/verification';

// Check if phone is verified, prompt if not
const ok = await verifyRequirements(['PHONE']);
if (!ok) {
  // User cancelled verification
  return;
}
// Continue with protected action
```

### Multiple Requirements
```typescript
// Check both phone and email
const ok = await verifyRequirements(['PHONE', 'EMAIL']);
if (!ok) return;
// Both verified, continue
```

## Profile Page Integration

A new "Account Verification" section has been added to the Profile page (`app/[locale]/profile/page.tsx`) that:
- Shows current verification status for phone and email
- Provides "Verify" buttons for unverified items
- Updates automatically when verification completes

## Translations

Added translations in both `messages/es.json` and `messages/en.json`:
- `verification.*` - Modal and UI translations
- `verification.phone.*` - Phone-specific translations
- `verification.email.*` - Email-specific translations

## State Management

- User verification state is stored in `User` type (updated)
- Verification status is synced with backend via `/users/me` endpoint
- LocalStorage is updated automatically when verification succeeds
- React Query cache is invalidated to refresh UI

## Type Updates

Updated `types/index.ts`:
- Added `phoneVerified: boolean` to `User` interface
- Added `emailVerified: boolean` to `User` interface

## Architecture

The implementation follows DDD principles:
- **Domain**: Types and interfaces
- **Application**: Hooks (use-verification.ts)
- **Infrastructure**: API client integration
- **Presentation**: Modal component and provider

## Testing

To test the verification flow:

1. **From Profile Page**:
   - Navigate to `/profile`
   - Click "Verify" button for phone or email
   - Follow the modal flow

2. **Programmatically**:
   ```typescript
   import { openVerificationModal } from '@/lib/verification';
   
   openVerificationModal('PHONE');
   ```

3. **With Requirements Check**:
   ```typescript
   import { verifyRequirements } from '@/lib/verification';
   
   const ok = await verifyRequirements(['PHONE']);
   ```

## Notes

- Verification is NOT required at login
- Verification is only prompted when needed (via `verifyRequirements`)
- The modal can be opened from anywhere in the app
- State is automatically synced with backend
- No hardcoded delivery channels (SMS/WhatsApp) - backend handles it

