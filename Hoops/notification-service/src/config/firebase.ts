import admin from 'firebase-admin';
import { logger } from '../utils/logger';

const CREDENTIALS_PATH = process.env.FIREBASE_CREDENTIALS_PATH || './firebase-credentials.json';

let initialized = false;

export function initializeFirebase(): void {
  if (initialized) return;

  try {
    const serviceAccount = require(`../../${CREDENTIALS_PATH}`);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    initialized = true;
    logger.info('Firebase initialized');
  } catch (error) {
    logger.warn('Firebase initialization failed:', error);
    logger.warn('Push notifications will be disabled');
  }
}

export function getMessaging() {
  if (!initialized) {
    throw new Error('Firebase not initialized');
  }
  return admin.messaging();
}

export { initialized as isFirebaseInitialized };