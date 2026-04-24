import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth, isFirebaseConfigured } from '../lib/firebase';

type FirebaseAuthContextValue = {
  isFirebaseConfigured: boolean;
  authLoading: boolean;
  user: User | null;
  authError: string | null;
  clearAuthError: () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const FirebaseAuthContext = createContext<FirebaseAuthContextValue | null>(null);

function getAuthErrorCode(err: unknown): string {
  if (err instanceof FirebaseError) return err.code;
  if (typeof err === 'object' && err && 'code' in err) return String((err as { code?: string }).code ?? '');
  return '';
}

function mapAuthError(err: unknown): string {
  const code = getAuthErrorCode(err);
  switch (code) {
    case 'auth/invalid-email':
      return 'メールアドレスの形式が正しくありません。';
    case 'auth/user-disabled':
      return 'このアカウントは無効化されています。';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'メールアドレスまたはパスワードが正しくありません。';
    case 'auth/email-already-in-use':
      return 'このメールアドレスは既に登録されています。';
    case 'auth/weak-password':
      return 'パスワードが弱すぎます。より長いパスワードを設定してください。';
    case 'auth/too-many-requests':
      return '試行回数が多すぎます。しばらくしてから再度お試しください。';
    case 'auth/network-request-failed':
      return 'ネットワークエラーが発生しました。接続を確認してください。';
    case 'auth/operation-not-allowed':
      return (
        'メール／パスワードでのサインインが Firebase で許可されていません。' +
        ' Console の Authentication → Sign-in method で「メール／パスワード」を有効にし、上のスイッチがオンか確認してください。'
      );
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid.-please-pass-a-valid-api-key.':
      return (
        'API キーが無効です。次を順に確認してください。' +
        ' (1) Firebase Console → プロジェクトの設定 → 全般 → マイアプリ の「API キー」をコピーし、.env.local の VITE_FIREBASE_API_KEY と完全一致させる（余分な引用符・改行・全角スペースがないか）。' +
        ' (2) Google Cloud Console → APIs とサービス → 認証情報 → そのブラウザ用キーの「アプリケーションの制限」で localhost が許可されているか。開発中は一時的に「なし」にすると切り分けしやすいです。' +
        ' (3) 同じキーの「API の制限」で Identity Toolkit API などがブロックされていないか。'
      );
    case 'auth/unauthorized-domain':
      return (
        'このドメインからのログインが許可されていません。' +
        ' Firebase Console → Authentication → Settings → Authorized domains に、使っているホスト名（例: localhost）を追加してください。'
      );
    case 'auth/configuration-not-found':
      return 'Firebase の設定が見つかりません。projectId など .env.local の値が Console の Web アプリと一致しているか確認してください。';
    default:
      if (code) {
        return `認証に失敗しました（${code}）。ブラウザの開発者ツール（Console）にも詳細が出ていることがあります。`;
      }
      return '認証に失敗しました。入力内容を確認してください。';
  }
}

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isFirebaseConfigured();
  const [authLoading, setAuthLoading] = useState(configured);
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      setAuthLoading(false);
      setUser(null);
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      setAuthLoading(false);
      setUser(null);
      return;
    }
    setAuthLoading(true);
    const unsub = onAuthStateChanged(
      auth,
      (u) => {
        setUser(u);
        setAuthLoading(false);
      },
      () => {
        setUser(null);
        setAuthLoading(false);
      }
    );
    return () => unsub();
  }, [configured]);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      if (import.meta.env.DEV) console.error('[Vode] signInWithEmail', e);
      setAuthError(mapAuthError(e));
      throw e;
    }
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setAuthError(null);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      if (import.meta.env.DEV) console.error('[Vode] signUpWithEmail', e);
      setAuthError(mapAuthError(e));
      throw e;
    }
  }, []);

  const signOutUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setAuthError(null);
    await signOut(auth);
  }, []);

  const value = useMemo<FirebaseAuthContextValue>(
    () => ({
      isFirebaseConfigured: configured,
      authLoading,
      user,
      authError,
      clearAuthError,
      signInWithEmail,
      signUpWithEmail,
      signOutUser,
    }),
    [configured, authLoading, user, authError, clearAuthError, signInWithEmail, signUpWithEmail, signOutUser]
  );

  return <FirebaseAuthContext.Provider value={value}>{children}</FirebaseAuthContext.Provider>;
}

export function useFirebaseAuth(): FirebaseAuthContextValue {
  const ctx = useContext(FirebaseAuthContext);
  if (!ctx) {
    throw new Error('useFirebaseAuth must be used within FirebaseAuthProvider');
  }
  return ctx;
}
