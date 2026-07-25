import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

let pendingConfirmation: FirebaseAuthTypes.ConfirmationResult | null = null;

export function setPendingConfirmation(confirmation: FirebaseAuthTypes.ConfirmationResult) {
  pendingConfirmation = confirmation;
}

export function getPendingConfirmation(): FirebaseAuthTypes.ConfirmationResult | null {
  return pendingConfirmation;
}

export function clearPendingConfirmation() {
  pendingConfirmation = null;
}
