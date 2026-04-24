import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const REQUIRED_ENV = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

export function getMissingFirebaseEnvKeys(): readonly string[] {
  return REQUIRED_ENV.filter((key) => {
    const v = import.meta.env[key as keyof ImportMetaEnv];
    return !(typeof v === 'string' && v.trim().length > 0);
  });
}

export function isFirebaseConfigured(): boolean {
  return getMissingFirebaseEnvKeys().length === 0;
}

if (import.meta.env.DEV) {
  const missing = getMissingFirebaseEnvKeys();
  if (missing.length > 0 && missing.length < REQUIRED_ENV.length) {
    console.warn(
      '[Vode] Firebase 用の環境変数が一部だけ設定されています。ログイン画面を出すには次も埋めてください:',
      missing.join(', ')
    );
  }
}

let app: FirebaseApp | null = null;
let firestore: Firestore | null = null;
let auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) return null;
  if (!app) {
    const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
    app =
      getApps()[0] ??
      initializeApp({
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        ...(typeof measurementId === 'string' && measurementId.trim()
          ? { measurementId: measurementId.trim() }
          : {}),
      });
  }
  return app;
}

export function getFirestoreDb(): Firestore | null {
  const a = getFirebaseApp();
  if (!a) return null;
  if (!firestore) firestore = getFirestore(a);
  return firestore;
}

export function getFirebaseAuth(): Auth | null {
  const a = getFirebaseApp();
  if (!a) return null;
  if (!auth) auth = getAuth(a);
  return auth;
}
