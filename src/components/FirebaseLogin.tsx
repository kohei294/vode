import React, { useState } from 'react';
import { useFirebaseAuth } from '../contexts/FirebaseAuthContext';
import { cn } from '../lib/utils';
import vodeLogoUrl from '../assets/vode.png';
import vodeSymbolUrl from '../assets/vode-symbol.png';

export function FirebaseLogin() {
  const { authError, clearAuthError, signInWithEmail, signUpWithEmail } = useFirebaseAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    clearAuthError();
    try {
      if (mode === 'signin') await signInWithEmail(email, password);
      else await signUpWithEmail(email, password);
    } catch {
      // authError set in context
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFDFD] px-4 font-sans text-[#1C1C1E]">
      <div className="w-full max-w-md rounded-xl border border-[#5b5c64]/20 bg-[#FFFFFF] p-8 shadow-sm">
        <h1 className="sr-only">Vode</h1>
        <div className="flex flex-col items-center">
          <div className="flex min-w-0 items-center justify-center gap-3">
            <img
              src={vodeSymbolUrl}
              alt=""
              width={500}
              height={500}
              decoding="async"
              aria-hidden
              className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
            />
            <img
              src={vodeLogoUrl}
              alt="Vode"
              width={1000}
              height={360}
              decoding="async"
              className="h-10 w-auto max-w-[min(100%,240px)] shrink-0 object-contain object-left sm:h-11 sm:max-w-[min(100%,280px)]"
            />
          </div>
        </div>
        <p className="mt-5 text-center text-sm text-[#5b5c64]">
          {mode === 'signin' ? 'アカウントにログインしてクラウド同期を使います。' : '新規アカウントを作成します。'}
        </p>

        <div className="mt-6 flex rounded-lg border border-[#5b5c64]/20 p-0.5 text-sm font-medium">
          <button
            type="button"
            className={cn(
              'flex-1 rounded-md py-2 transition-colors',
              mode === 'signin' ? 'bg-[#1C1C1E] text-[#FFFFFF]' : 'text-[#5b5c64] hover:text-[#1C1C1E]'
            )}
            onClick={() => {
              setMode('signin');
              clearAuthError();
            }}
          >
            ログイン
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 rounded-md py-2 transition-colors',
              mode === 'signup' ? 'bg-[#1C1C1E] text-[#FFFFFF]' : 'text-[#5b5c64] hover:text-[#1C1C1E]'
            )}
            onClick={() => {
              setMode('signup');
              clearAuthError();
            }}
          >
            新規登録
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1">
            <label htmlFor="vode-firebase-email" className="text-xs font-medium text-[#5b5c64]">
              メールアドレス
            </label>
            <input
              id="vode-firebase-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="w-full rounded-md border border-[#5b5c64]/30 bg-[#FFFFFF] px-3 py-2 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#1C1C1E]/20"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="vode-firebase-password" className="text-xs font-medium text-[#5b5c64]">
              パスワード
            </label>
            <input
              id="vode-firebase-password"
              type="password"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={6}
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className="w-full rounded-md border border-[#5b5c64]/30 bg-[#FFFFFF] px-3 py-2 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#1C1C1E]/20"
            />
            {mode === 'signup' && (
              <p className="text-[11px] leading-snug text-[#5b5c64]">6 文字以上（Firebase の既定に準じます）。</p>
            )}
          </div>

          {authError ? (
            <div
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-950"
            >
              {authError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-[#1C1C1E] py-2.5 text-sm font-medium text-[#FFFFFF] transition-colors hover:bg-[#5b5c64] disabled:pointer-events-none disabled:opacity-50"
          >
            {submitting ? '処理中…' : mode === 'signin' ? 'ログイン' : '登録して続行'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-relaxed text-[#5b5c64]">
          Firebase のメール／パスワード認証がコンソールで有効になっている必要があります。
        </p>
      </div>
    </div>
  );
}
