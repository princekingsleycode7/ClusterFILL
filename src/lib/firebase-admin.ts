// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

// This function initializes the app, making sure it only happens once.
export function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return;
  }

  const serviceAccount = JSON.parse(
    process.env.FIREBASE_ADMIN_CREDENTIALS as string
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Export getters for the services
export const getAuth = () => getAdminAuth();
export const getFirestore = () => getAdminFirestore();