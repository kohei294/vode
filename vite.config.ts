import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

/**
 * 本番ビルドのみ index に CSP を注入（開発時の HMR / ws はそのまま）。
 * frame-ancestors は meta では無効なため含めない。
 */
/** Firebase Auth / Firestore / 関連 API 用（クライアント SDK の接続先） */
const FIREBASE_CONNECT =
  "https://*.googleapis.com https://*.gstatic.com wss://*.googleapis.com";

const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  // サムネ・スライド画像は https（および data/blob）。http 画像は upgrade-insecure-requests で扱い、混入リスクを下げる。
  "img-src 'self' https: data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${FIREBASE_CONNECT}`,
  "base-uri 'self'",
  "form-action 'none'",
  'upgrade-insecure-requests',
].join('; ');

export default defineConfig({
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'vode-csp-meta',
        apply: 'build',
        transformIndexHtml(html) {
          const meta = `    <meta http-equiv="Content-Security-Policy" content="${PRODUCTION_CSP}" />\n`;
          return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n${meta}`);
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
});
