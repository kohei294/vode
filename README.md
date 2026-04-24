# Vode

ブラウザ上でスライド資料を編集する React アプリです。データは **localStorage** に保存されます。Firebase の環境変数を設定すると **メール／パスワード認証** と **Firestore** によるクラウド同期（ユーザーごとの `users/{uid}/vode/projects`）が有効になります。

## ローカルで動かす

**前提:** Node.js 20 以上

```bash
npm install
npm run dev
```

### Firebase をローカルで使う（任意）

1. Firebase Console で **Authentication（メール／パスワード）** と **Firestore** を有効にする。
2. **`.env.example` はテンプレート用のサンプルキー名だけ**です。実際の API キーなどは **絶対に `.env.example` に書かず**、**`.env.local`** にだけ書いてください（`.gitignore` で `.env.local` は無視されます）。`.env.example` をコピーして `.env.local` を作り、Console の **プロジェクトの設定 → 全般 → マイアプリ** の値で `VITE_FIREBASE_*` をすべて埋める。
3. **Firestore セキュリティルール**はリポジトリの `firestore.rules` を参照し、Firebase CLI などでデプロイする（例: `firebase deploy --only firestore:rules`）。`firebase.json` がこのルールファイルを指します。認証済みユーザーが **`users/{自分のuid}/vode/` 以下だけ**読み書きできる内容になっています。

#### 公開リポジトリに push する前に（必須チェック）

- **`.env.example` に本物の Firebase 値を入れない**（過去に入れた場合は Console でキー制限の見直しやキー再発行を検討）。
- **`git status` で `.env` / `.env.local` / `.env.production` がコミット対象に入っていないか確認**（通常は `.gitignore` で除外されます）。
- **Vercel 本番**では Environment Variables に同じ `VITE_*` キーを登録し、**デプロイを再実行**する（ビルド時に埋め込まれるため）。
- 本番 URL（例: `*.vercel.app` や独自ドメイン）を Firebase Authentication の **Authorized domains** に追加する。
- 手元で **`npm run lint`** と **`npm test`**、`npm run build` が通ることを確認する。

未設定の場合は従来どおりログイン画面は出ず、localStorage のみで動作します。

### ログイン画面が出ないとき

- **`.env.local` は `package.json` と同じフォルダ（リポジトリのルート）に置く**（親フォルダや別プロジェクトに置くと読まれません）。`.env.example` に値を書いただけでは読み込まれません。
- 必須は **`VITE_FIREBASE_` で始まる 6 変数すべて**（空行・先頭の `export` なし・`=` の左右の余計なスペースに注意）。
- ファイルを保存したら **`npm run dev` を再起動**する。
- 開発中はダッシュボード左上に **`Firebase ON/OFF`** が出ます。OFF のままなら環境変数がまだ Vite に渡っていません。
- すでに一度ログインしているとメイン画面のままです。**シークレットウィンドウ**で開くか、ダッシュボードの **ログアウト** で一度切る。

### メールでログイン・新規登録できないとき

- 画面上のメッセージに **`auth/...` のコード**が付く場合は、そのコードで原因が切り分けできます（最新版のアプリでは表示されます）。
- **`auth/operation-not-allowed`**  
  Authentication の **Sign-in method** で **「メール／パスワード」プロバイダー自体**を有効にする（「メールリンク（パスワードなし）」だけオンにしていないか確認）。
- **`auth/unauthorized-domain`**  
  Authentication → **Settings** → **Authorized domains** に、ブラウザのアドレスのホスト名（例: `localhost`）が含まれているか確認。
- **`auth/invalid-api-key`** または **`auth/api-key-not-valid.-please-pass-a-valid-api-key.`**  
  - Firebase Console → **プロジェクトの設定** → **全般** → 登録済みアプリの **API キー** を再コピーし、`.env.local` の `VITE_FIREBASE_API_KEY` と **一字一句**合わせる（先頭末尾のスペースや `"` で囲まない）。保存後 **`npm run dev` を再起動**。  
  - [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **認証情報** → その **ブラウザ キー** を開く。  
    - **アプリケーションの制限**が「HTTP リファラー」のとき、`http://localhost:3000/*` と `http://127.0.0.1:3000/*` を追加する（ポートは実際の dev URL に合わせる）。切り分けでは一時的に **「なし」** でもよい。  
    - **API の制限**で Firebase / Identity Toolkit 関連が拒否されていないか確認する。

## スクリプト

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバー（ポート 3000） |
| `npm run build` | 本番用静的ファイルを `dist/` に出力 |
| `npm run preview` | ビルド結果のプレビュー |
| `npm run lint` | ESLint + TypeScript チェック |
| `npm run test` | Vitest ユニットテスト |

## GitHub → Vercel で公開

1. リポジトリを GitHub に push する。
2. [Vercel](https://vercel.com) で **New Project** → そのリポジトリをインポート。
3. **Framework Preset:** Vite（自動検出されることが多い）
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **環境変数:** Firebase を使う場合は、**Firebase Console の実値**を Vercel の **Environment Variables** に登録する（キー名は `.env.example` と同じ `VITE_FIREBASE_*`）。値は **GitHub に載せず** Vercel だけに置く。

`vercel.json` で **セキュリティ用 HTTP ヘッダー**（`X-Frame-Options`, `X-Content-Type-Options` など）と、**`Content-Security-Policy: frame-ancestors 'none'`**（他サイトへの埋め込み防止）を付与しています。本番ビルドでは Vite プラグインで **追加の CSP**（`script-src`, `connect-src` に Firebase 用ドメインなど）を `index.html` の meta に注入します。

## データの保存・移行

プロジェクト一覧とスライドは **`localStorage`** に自動保存されます（同一サイト上で別スクリプトによる XSS が成立すると読み取られる可能性があるため、機微な原稿のみを扱う場合は運用で注意してください）。別ブラウザへ移すときは、エディタ上部の **「書き出し」** で JSON を保存し、**「読み込み」** で復元してください。

### 作成を楽にする（アプリ内機能）

- **ダッシュボードの「複製」**: プロジェクト全体をコピーし、タイトルに「（コピー）」を付けた新規プロジェクトとして開きます。社内テンプレや過去案件のベースに使えます。
- **左サイドバーの複製アイコン**: 選択中のスライドと同じ内容を**直下に**複製します（レイアウトを保ったまま文言だけ差し替える用途向き）。
- **「他プロジェクトへコピー」**（エディタ左サイドバー）: チェックで選んだスライドを、別プロジェクトの**末尾**にコピーします（プロジェクトが 2 件以上あるときのみ利用可。1 プロジェクトあたりの枚数上限あり）。
- **JSON 書き出し／読み込み**: 定期的なバックアップや、似た構成を別環境へ持ち運ぶときに利用してください（読み込みは**一覧がすべて置き換わる**点に注意）。

## API キーについて

Gemini などの **API キーはフロントエンドのビルドに埋め込まないでください**。外部の生成 AI を使う場合は、サーバー側でキーを保持し、ブラウザからはプロキシ経由で呼び出す構成にしてください。
