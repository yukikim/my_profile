# GitHub → Vercel / Neon デプロイ手順

## 構成と追加ファイル

- GitHub Actions: PR と `main` への push で lint・型チェック・既存テスト・空の PostgreSQL への migration・本番ビルドを実行。
- Vercel Git Integration: PR/ブランチを Preview、`main` を Production にデプロイ。
- Neon: Payload の PostgreSQL。既存の `@payloadcms/db-postgres` をそのまま使用。
- Vercel Blob: Media の画像を永続保存。Neon は画像ファイル本体の保存先ではありません。

| ファイル                             | 役割                                                     |
| ------------------------------------ | -------------------------------------------------------- |
| `.github/workflows/ci.yml`           | 外部サービスの Secret を使わず、一時 PostgreSQL 16 で CI |
| `.nvmrc` / `package.json` の engines | Node.js 22 系に統一                                      |
| `vercel.json`                        | `npm ci` と `npm run build:vercel` を指定                |
| `scripts/vercelBuild.mjs`            | 環境変数検査 → check → migrate → build。失敗時は停止     |
| `payload.config.ts`                  | Blob 接続、接続プール、Vercel の必須設定検査             |

GitHub Actions と Vercel のビルドは並行して動きます。GitHub CI の成功を Vercel が自動で待つ構成ではないため、Vercel 側でも `npm run check` を実行します。Production に失敗した PR が入らないよう、後述の必須チェックも設定してください。

## 1. Neon を作成する

1. Neon でプロジェクトを作成します。PostgreSQL 16 を選ぶと開発用 Docker・CI と揃います。リージョンは Vercel Functions の実行リージョンに近づけます。
2. Production 用 branch、database、role を確認します。database 名は `neondb` のままでも構いません。
3. Connect から、同じ branch・database・role の接続 URL を **2 種類**取得します。
   - Connection pooling 有効: ホストに `-pooler` を含む URL → `DATABASE_URI`
   - Connection pooling 無効: 直接接続 URL → `DATABASE_URI_DIRECT`
4. URL の `sslmode=require` など Neon が付与するパラメーターを維持します。TLS 検証を無効化する設定は不要です。
5. Preview 用に独立した branch を作り、別の接続 URL を取得します。Production の接続 URL を Preview に設定しないでください。

少人数で固定 Preview branch を使う場合も、異なる PR の schema 変更・同時 migration は衝突し得ます。schema を変更する PR は一つずつ検証するか、PR ごとに Neon branch と Vercel のブランチ別環境変数を設定します。Production から Neon branch を作るとデータも複製されるため、Preview には公開してよいデータを使ってください。

## 2. Vercel と Blob を作成する

1. Vercel の Add New Project から GitHub の `yukikim/my_profile` を Import します。
2. Framework Preset は Next.js、Root Directory はリポジトリのルート、Node.js は 22.x、Production Branch は `main` にします。
3. Install/Build Command は `vercel.json` の設定を使用し、Output Directory は Next.js の既定値のままにします。
4. Vercel Blob の **Public store** を作成してプロジェクトの Production に OIDC 方式で接続します。Preview には別の store を作成・接続します。
5. 下記の環境変数を登録してからデプロイします。先に空の設定で Import した場合は、設定完了後に Redeploy してください。

Public Blob の URL はアクセス可能です。現在の Media も公開読み取りなので、この構成には公開用の画像・資料を保存します。Vercel 上のローカルファイルシステムにはアップロードを保存しません。

| 環境変数                            | Production                   | Preview                           |
| ----------------------------------- | ---------------------------- | --------------------------------- |
| `DATABASE_URI`                      | 本番 Neon の pooled URL      | Preview branch の pooled URL      |
| `DATABASE_URI_DIRECT`               | 同じ本番 DB の direct URL    | 同じ Preview DB の direct URL     |
| `PAYLOAD_SECRET`                    | 固有の十分に長いランダム値   | Preview 専用のランダム値          |
| `BLOB_STORE_ID`                     | 本番 Public Blob の store ID | Preview Public Blob の store ID   |
| `NEXT_PUBLIC_SITE_URL`              | `https://本番ドメイン`       | `https://Preview用の固定ドメイン` |
| `GMAIL_USER` / `GMAIL_APP_PASSWORD` | 問い合わせ通知を使う場合のみ | 通常は未設定                      |

`BLOB_STORE_ID` は Blob の OIDC 接続で自動追加されます。`BLOB_READ_WRITE_TOKEN` は不要です。SDK は各操作時に Vercel が提供する短命な OIDC トークンを取得します。`VERCEL_OIDC_TOKEN` を手動で固定登録しないでください。`BLOB_WEBHOOK_PUBLIC_KEY` は現在のサーバーアップロード方式では使用しません。

ローカルで `BLOB_STORE_ID` を未設定にすると `public/media` を使用します。ローカルから Blob を使う場合は、対象プロジェクトを `vercel link` で選び、`vercel env pull` で OIDC の環境を取得してください。トークン期限切れの場合は再取得します。

`PAYLOAD_SECRET` は例えば `openssl rand -hex 32` で生成し、運用中は同じ値を維持します。既存 DB を移す場合は現在の secret を引き継ぎます。ただし開発用の既定値を使っていた場合は本番用へ変更し、再ログイン等を確認してください。Secret の値を GitHub にコミットしないでください。

Neon/Vercel 連携が自動で `DATABASE_URL` や `POSTGRES_URL` を登録しても、このアプリが読むのは **`DATABASE_URI`** です。上表の名前へ設定してください。`VERCEL` は Vercel のシステム環境変数です。`TARGET_DATABASE_URI` と `SEED_ADMIN_*` は Vercel に登録しません。

`NEXT_PUBLIC_SITE_URL` はビルド時に設定します。CMS の SiteSettings に保存済みの `siteUrl` がある場合はそちらが使われるため、管理画面でも本番 URL に変更します。環境変数変更後は再デプロイします。

### お問い合わせの受付と通知

管理画面の Forms に `name: Contact` のフォームを作成します。メール通知には、そのフォームの `notificationEmails` と、Production の `GMAIL_USER` / `GMAIL_APP_PASSWORD` が必要です。

お問い合わせは先に Form Submissions へ保存します。保存に失敗した場合はフォーム内にエラーを表示します。保存後のメール通知だけが失敗した場合は受付完了を返し、Vercel の Runtime Logs に `Contact notification failed; submission saved` と保存先の `submissionId` を記録します。通知の自動再送は行わないため、管理画面の Form Submissions で内容を確認してください。保存処理の例外は `Contact submission storage failed` で記録します。

送信時だけページ全体がエラーになる場合は、該当時刻の Runtime Logs、Gmail の環境変数と認証、通知先設定を確認します。環境変数を変更したら再デプロイが必要です。

## 3. DB の初期化を選ぶ

### 新規の空 DB から開始

初回の Vercel ビルドで、コミット済みの migration が空 DB に適用されます。`push: false` を維持するため、schema が起動時に自動変更されることはありません。

初回公開前はアクセスを制限した環境で `/admin` の初期ユーザー作成を行い、管理者を自分で登録します。Production の Deployment Protection を利用できない場合は、公開前にローカルアプリを対象 Neon へ接続して初期管理者を登録します。未登録の `/admin` を誰でもアクセスできる状態で放置しないでください。

既存の `npm run seed` はサンプルコンテンツを含む開発用処理なので、CI/CD では実行しません。

### 現在のローカルデータを引き継ぐ

**初回デプロイの migration より前に**、空の Neon DB へ復元します。復元には schema と `payload_migrations` 履歴も含まれます。その後のビルドは未適用の migration のみを実行します。

1. PostgreSQL クライアント (`pg_dump` / `pg_restore`) を用意します。dump は元 DB 以上のメジャーバージョンを使い、restore も dump を読み取れるバージョンを使います。
2. ローカル `.env` の `DATABASE_URI` がコピー元であることを確認します。Neon をコピー元にする場合は direct URL を使います。
3. バックアップを取得します。

   ```bash
   npm run db:dump -- backups/before-neon.dump
   ```

4. `.env` の `TARGET_DATABASE_URI` に **復元先 Neon の direct URL** を設定します。コピー元の `DATABASE_URI` は維持します。
5. 接続先を確認したうえで、次を実行します。`--confirm` は対象 DB の既存データを置換することへの確認です。

   ```bash
   npm run db:restore -- backups/before-neon.dump --confirm
   ```

6. Vercel の環境変数を Neon に向け、デプロイします。既存管理者でログインし、件数・記事・日誌・権限を確認します。

この作業で元のローカル DB を削除する必要はありません。Preview と Production はそれぞれ個別に初期化・復元します。本手順の実行前に、復元先に残す必要のあるデータがないことを確認してください。

### 既存画像の移行

DB dump に `public/media/` の画像本体は含まれません。このフォルダーも別途バックアップしてください。

少量の場合は、Blob が有効な環境の管理画面で **既存の Media レコードを開き、同じ画像ファイルを選び直して保存**します。既存レコードの ID を維持するので、記事・プロフィールからの参照を保ったまま Blob へアップロードでき、thumbnail/og も再生成されます。新規 Media を作り直した場合は参照の付け替えが必要です。

大量の場合は元画像・生成済みサイズ画像を同じファイル名で Blob へコピーする別の移行処理が必要です。この変更では既存ファイルの自動コピーは行いません。画像の移行完了を確認してから公開してください。

サーバーアップロード方式を維持しているため、Vercel のリクエスト上限 4.5 MB より十分小さい画像を使います。大きい画像は事前に圧縮してください。大容量対応は client upload と画像サイズ生成の動作を検証してから別途導入します。

Payload 3.85.1 の標準 Blob アダプターは固定トークンを必須とするため、`lib/storage/vercelBlob.ts` で `@payloadcms/plugin-cloud-storage` と OIDC 対応の `@vercel/blob` を接続しています。保存・削除は OIDC 認証、公開画像の配信は Blob CDN を使用します。client upload provider は登録しません。

## 4. GitHub の CI と通常のデプロイ

1. 今回のファイルを GitHub へ push します。
2. Actions タブで CI が成功することを確認します。この CI に Neon/Vercel の GitHub Secrets は不要です。
3. GitHub の Rulesets または Branch protection で `main` への PR を必須にし、チェック `lint, types, tests, migrations, build` を必須にします。直接 push や管理者 bypass を許可する場合は CI 前に本番反映できる点に注意してください。
4. ブランチへ push → PR → CI / Vercel Preview 確認 → merge → Vercel Production の流れで更新します。

ローカルでの事前確認:

```bash
npm ci
npm run check
npm run build
```

schema 変更時は開発 DB を最新にしてから `npm run migrate:create -- 説明的な名前` を実行し、生成された SQL・snapshot・`migrations/index.ts` を確認してコミットします。作成済みの migration は書き換えず、新しい migration を追加します。

Vercel ビルドは migration を **build より先に**実行します。build が失敗しても DB の変更は残り、以前のデプロイも同じ DB にアクセスします。追加中心の後方互換変更にし、列削除・名前変更などは段階的に行ってください。同じ Neon branch に対するデプロイは重ねず、完了してから次を開始します。

Vercel のデプロイをロールバックしても DB は戻りません。DB の復旧が必要な場合はバックアップや Neon の復元機能で別 branch に戻して検証してから切り替えます。CD から `migrate:down` や `db:restore` を自動実行しません。

## 公開前の動作確認

- `/admin` のログイン、ログアウト、編集権限
- Profile / SiteSettings / Header / Footer の内容と本番 URL
- 画像アップロード、一覧・詳細の表示、再デプロイ後も画像が残ること
- 記事と Engineering Notes の公開/非公開、CMS 更新の反映
- 問い合わせの DB 保存、必要な場合は通知メール
- Preview が本番 DB / Blob を変更しないこと

## OIDC 移行前の検証記録（2026-09-04）

ローカル Node.js 22 と使い捨て PostgreSQL 16 で、既存 migration の初回適用・再実行、本番ビルド、型チェック、テスト 63 件を確認しました。lint はエラー 0、既存の未使用変数の警告 5 件です。Blob はダミー token で有効化したビルドまでの検証です。

GitHub Actions の実行、Vercel 上のデプロイ、実 Neon への接続・復元、実 Blob のアップロードは未実施です。管理画面でのサービス作成・環境変数登録と公開前の動作確認を実施してください。

## OIDC 移行の検証（2026-09-04）

`npm run check` が成功しました（lint は既存の警告5件）。ストレージ有効化、ローカル保存、保存・削除、画像の Range/キャッシュ応答と、実 SDK が OIDC トークン更新を次のリクエストに反映することを通信モックで確認しました。

固定トークンなし・ダミーの `BLOB_STORE_ID` で `npm run build` が成功しました。DB は接続できないテスト用 URL を指定し、既存のローカルコンテンツへのフォールバックでビルドしています。実 DB の migration、Vercel の OIDC 認証、実 Blob のアップロード・削除は未検証です。再デプロイ後に管理画面で確認してください。

## 公式資料

- [Vercel Git Integration](https://vercel.com/docs/git)
- [Vercel Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Payload production deployment](https://payloadcms.com/docs/production/deployment)
- [Payload migrations](https://payloadcms.com/docs/database/migrations)
- [Payload storage adapters](https://payloadcms.com/docs/upload/storage-adapters)
- [Neon connection pooling](https://neon.com/docs/connect/connection-pooling)

- [Vercel Blob OIDC authentication](https://vercel.com/changelog/vercel-blob-now-supports-oidc-authentication)
