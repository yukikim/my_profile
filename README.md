# プロフィールサイト 要件定義書

## 1. 文書概要

本書は、自分自身のプロフィールサイトを構築するための要件を定義する。
システムは新規専用CMSとして作り込むのではなく、汎用的に利用できるCMS基盤を流用し、プロフィールサイト向けのコンテンツ構成に調整して利用する。

参照元: `CMSSiteCreationReport.md`

## 2. 背景と目的

### 2.1 背景

プロフィール、実績、記事、問い合わせ導線などを一元的に管理できる個人サイトを構築したい。
将来的には、プロフィールサイトだけでなく、企業サイト、ランディングページ、ブログサイトなどにも転用できるCMS基盤として発展させる。

### 2.2 目的

- 自分自身のプロフィール、経歴、スキル、実績をWeb上で公開する
- ブログやお知らせを管理画面から更新できるようにする
- 画像や資料などのメディアをCMSで管理する
- ページ構成をブロック単位で柔軟に変更できるようにする
- 将来的に他サイトへ流用できる汎用CMS基盤を整備する

## 3. システム方針

### 3.1 基本方針

参照レポートの方針に従い、メインシステムは次の構成とする。

```text
Payload CMS + Next.js
```

主な技術要素は次の通り。

```text
Next.js
TypeScript
Payload CMS
PostgreSQL
Vercel
```

### 3.2 CMS流用方針

汎用CMSで管理できる基本要素を維持しつつ、プロフィールサイト向けに次のコンテンツを扱う。

```text
Pages
Profile
Works
Posts
Categories
Media
Forms
Users
```

### 3.3 初期開発方針

初期段階では過度に汎用化せず、プロフィールサイトとして必要な機能に絞って構築する。
そのうえで、ページ管理とブロック管理は将来の再利用性を考慮して設計する。

## 4. 対象ユーザー

### 4.1 サイト閲覧者

- プロフィールを確認したい個人、企業、採用担当者、取引先
- 実績や制作物を確認したい見込み顧客
- ブログや発信内容を読みたい閲覧者

### 4.2 管理者

- サイト所有者本人
- 必要に応じて記事や実績を更新する編集者

## 5. サイト構成要件

### 5.1 公開ページ

初期公開時のページ構成は次を想定する。

| ページ | パス | 概要 |
| --- | --- | --- |
| トップページ | `/` | プロフィール概要、主要実績、問い合わせ導線を表示する |
| プロフィール | `/about` | 自己紹介、経歴、スキル、活動内容を表示する |
| 実績一覧 | `/works` | 制作実績、プロジェクト、ポートフォリオを一覧表示する |
| 実績詳細 | `/works/[slug]` | 個別実績の詳細を表示する |
| 記事一覧 | `/posts` | ブログ、ニュース、活動報告を一覧表示する |
| 記事詳細 | `/posts/[slug]` | 個別記事を表示する |
| お問い合わせ | `/contact` | 問い合わせフォームまたは外部連絡先を表示する |

### 5.2 管理画面

Payload CMSの管理画面を利用する。

```text
/admin
```

管理画面では、プロフィール、固定ページ、実績、記事、カテゴリ、メディア、問い合わせフォームを管理できること。

## 6. 機能要件

### 6.1 認証・ユーザー管理

| ID | 要件 |
| --- | --- |
| FR-001 | 管理画面にログインできる |
| FR-002 | 管理ユーザーを作成、編集、削除できる |
| FR-003 | ユーザーに権限ロールを設定できる |

想定ロール:

```text
admin
editor
author
```

### 6.2 プロフィール管理

| ID | 要件 |
| --- | --- |
| FR-010 | 名前、肩書き、自己紹介文を管理できる |
| FR-011 | プロフィール画像を設定できる |
| FR-012 | 経歴、スキル、資格、SNSリンクを管理できる |
| FR-013 | トップページやプロフィールページでプロフィール情報を表示できる |

### 6.3 固定ページ管理

| ID | 要件 |
| --- | --- |
| FR-020 | 固定ページを作成、編集、削除できる |
| FR-021 | ページごとにslugを設定できる |
| FR-022 | 公開状態をdraft/publishedで管理できる |
| FR-023 | ブロックを組み合わせてページレイアウトを構成できる |
| FR-024 | SEO情報をページごとに設定できる |

### 6.4 実績管理

| ID | 要件 |
| --- | --- |
| FR-030 | 実績を作成、編集、削除できる |
| FR-031 | 実績タイトル、概要、本文、サムネイルを管理できる |
| FR-032 | 担当範囲、使用技術、公開URL、GitHub URLを管理できる |
| FR-033 | 実績をカテゴリまたはタグで分類できる |
| FR-034 | 実績の公開状態を管理できる |

### 6.5 記事管理

| ID | 要件 |
| --- | --- |
| FR-040 | 記事を作成、編集、削除できる |
| FR-041 | 記事タイトル、本文、抜粋、サムネイルを管理できる |
| FR-042 | 記事をカテゴリで分類できる |
| FR-043 | 公開日時を設定できる |
| FR-044 | 記事ごとにSEO情報を設定できる |

### 6.6 メディア管理

| ID | 要件 |
| --- | --- |
| FR-050 | 画像ファイルをアップロードできる |
| FR-051 | 画像にalt、captionを設定できる |
| FR-052 | ページ、実績、記事、ブロックからメディアを参照できる |

### 6.7 問い合わせ管理

| ID | 要件 |
| --- | --- |
| FR-060 | 問い合わせフォームを設置できる |
| FR-061 | 送信内容をCMSに保存できる |
| FR-062 | 送信完了メッセージを設定できる |
| FR-063 | 通知先メールアドレスを設定できる |

### 6.8 ブロック管理

| ID | 要件 |
| --- | --- |
| FR-070 | ページ内に複数のブロックを配置できる |
| FR-071 | ブロックの並び順を管理画面から変更できる |
| FR-072 | Hero、RichText、Features、Gallery、FAQ、CTA、ContactFormを利用できる |
| FR-073 | ブロック単位で表示内容を編集できる |

### 6.9 グローバル設定

| ID | 要件 |
| --- | --- |
| FR-080 | サイト名、説明文、URL、ロゴ、faviconを管理できる |
| FR-081 | ヘッダーのナビゲーションを管理できる |
| FR-082 | フッターのナビゲーション、コピーライト、SNSリンクを管理できる |

## 7. 非機能要件

### 7.1 パフォーマンス

- 公開ページはNext.jsのキャッシュ機構を活用し、高速に表示する
- 画像は最適化された形式で配信できるようにする
- CMS API呼び出しは必要な項目に絞る

### 7.2 セキュリティ

- 管理画面は認証済みユーザーのみアクセス可能とする
- 公開前コンテンツは一般閲覧者に表示しない
- 問い合わせフォームにはスパム対策を検討する
- 環境変数、DB接続情報、CMS secretはリポジトリに含めない

### 7.3 保守性

- TypeScriptで型安全に実装する
- PayloadのCollection、Global、Blockを責務ごとに分割する
- フロントエンド表示コンポーネントとCMSスキーマを過度に密結合させない
- 将来的な企業サイト、LP、ブログサイトへの転用を考慮する

### 7.4 運用性

- 管理者がコードを編集せずに主要コンテンツを更新できる
- 下書きと公開済みの状態を明確に分ける
- 本番環境はVercel、DBはNeonまたはRailwayを想定する

## 8. 対応範囲

### 8.1 初期リリース範囲

```text
Users
Media
Pages
Profile
Works
Posts
Categories
Forms
FormSubmissions
SiteSettings
Header
Footer
基本ブロック
```

### 8.2 初期リリース対象外

```text
会員機能
EC機能
決済機能
多言語対応
高度なワークフロー承認
外部CRM連携
```

## 9. 開発・実行環境要件

### 9.1 開発環境

```text
Mac
Node.js
Docker
PostgreSQL
Next.js
Payload CMS
TypeScript
```

### 9.2 本番環境

```text
Vercel
Neon PostgreSQL
```

代替案としてRailwayも利用可能とする。

## 10. マイルストーン

### フェーズ1: 最小CMS構築

- Payload CMS + Next.jsのセットアップ
- PostgreSQL接続
- Users、Media、Pages、Posts、Categoriesの実装
- 管理画面から基本CRUDを確認

### フェーズ2: プロフィールサイト化

- Profile、Worksの実装
- トップ、プロフィール、実績、記事、問い合わせページの実装
- SiteSettings、Header、Footerの実装

### フェーズ3: Block Editor化

- Hero、RichText、Features、Gallery、FAQ、CTA、ContactFormの実装
- Pageのlayoutフィールドでブロックを並べ替え可能にする
- BlockRendererで公開ページに反映する

### フェーズ4: 汎用テンプレート化

- 企業サイト、LP、ブログサイトへ転用しやすい構成へ整理
- 再利用可能なブロックとコンポーネントを拡張
- seed、migration、初期設定を整備

## 11. 受け入れ条件

- 管理画面からプロフィール情報を更新できる
- 管理画面から固定ページを作成し、公開ページとして表示できる
- 管理画面から実績を追加し、実績一覧と詳細に表示できる
- 管理画面から記事を追加し、記事一覧と詳細に表示できる
- メディアをアップロードし、ページ、実績、記事で利用できる
- トップページをブロック構成で編集できる
- 下書きコンテンツが公開ページに表示されない
- 本番環境にデプロイできる構成になっている

---

# プロフィールサイト 基本設計書

## 1. 文書概要

本書は、プロフィールサイトをPayload CMS + Next.jsで構築するための基本設計を定義する。
参照元の `CMSSiteCreationReport.md` に記載された汎用CMS構成をベースに、プロフィールサイト向けのCollection、Global、Block、画面構成を設計する。

## 2. システム全体構成

### 2.1 アーキテクチャ

```text
Next.js
├ App Router
├ Payload CMS
└ PostgreSQL
```

フロントエンドとCMSは1つのNext.jsプロジェクト内に統合する。
Next.js App Routerのルートグループを利用し、公開サイトとPayload管理画面を分離する。

```text
src/app
├ (frontend)
└ (payload)
```

### 2.2 技術スタック

| 区分 | 採用技術 |
| --- | --- |
| フロントエンド | Next.js App Router |
| 言語 | TypeScript |
| CMS | Payload CMS |
| DB | PostgreSQL |
| ORM/DB Adapter | Payload標準のDB構成を優先 |
| ホスティング | Vercel |
| DBホスティング | Neon PostgreSQLまたはRailway |
| 開発環境 | Mac、Docker、PostgreSQL |

### 2.3 URL設計

| 区分 | URL | 概要 |
| --- | --- | --- |
| 公開サイト | `/` | トップページ |
| 管理画面 | `/admin` | Payload CMS管理画面 |
| CMS API | `/api` | Payload API |

## 3. ディレクトリ設計

推奨ディレクトリ構成は次の通り。

```text
src/
├─ app/
│  ├─ (frontend)/
│  │  ├─ page.tsx
│  │  ├─ layout.tsx
│  │  ├─ about/
│  │  ├─ works/
│  │  ├─ posts/
│  │  ├─ contact/
│  │  └─ [...slug]/
│  ├─ (payload)/
│  │  ├─ admin/
│  │  └─ api/
│  └─ not-found.tsx
│
├─ collections/
│  ├─ Users.ts
│  ├─ Media.ts
│  ├─ Pages.ts
│  ├─ Profile.ts
│  ├─ Works.ts
│  ├─ Posts.ts
│  ├─ Categories.ts
│  ├─ Forms.ts
│  └─ FormSubmissions.ts
│
├─ globals/
│  ├─ Header.ts
│  ├─ Footer.ts
│  └─ SiteSettings.ts
│
├─ blocks/
│  ├─ Hero/
│  ├─ RichText/
│  ├─ Features/
│  ├─ Gallery/
│  ├─ FAQ/
│  ├─ CTA/
│  └─ ContactForm/
│
├─ components/
│  ├─ ui/
│  ├─ layout/
│  ├─ cms/
│  └─ shared/
│
├─ lib/
│  ├─ payload/
│  ├─ cache/
│  ├─ seo/
│  └─ utils/
│
├─ hooks/
├─ access/
├─ payload/
│  ├─ seed/
│  ├─ migrations/
│  └─ plugins/
├─ styles/
└─ payload.config.ts
```

## 4. 画面設計

### 4.1 公開画面

| 画面ID | 画面名 | パス | 表示内容 |
| --- | --- | --- | --- |
| FE-001 | トップページ | `/` | Hero、プロフィール概要、主要実績、最新記事、CTA |
| FE-002 | プロフィール | `/about` | 自己紹介、経歴、スキル、SNSリンク |
| FE-003 | 実績一覧 | `/works` | 実績カード一覧、カテゴリ絞り込み |
| FE-004 | 実績詳細 | `/works/[slug]` | 実績詳細、画像、担当範囲、使用技術、関連リンク |
| FE-005 | 記事一覧 | `/posts` | 記事一覧、カテゴリ絞り込み |
| FE-006 | 記事詳細 | `/posts/[slug]` | 記事本文、サムネイル、カテゴリ、公開日 |
| FE-007 | 問い合わせ | `/contact` | 問い合わせフォーム、SNS、外部リンク |
| FE-008 | 汎用固定ページ | `/[...slug]` | Pages Collectionで管理するページ |

### 4.2 管理画面

Payload CMS標準の管理画面を利用する。

| 画面ID | 画面名 | 管理対象 |
| --- | --- | --- |
| AD-001 | Users | 管理ユーザー |
| AD-002 | Media | 画像、添付ファイル |
| AD-003 | Pages | 固定ページ |
| AD-004 | Profile | プロフィール |
| AD-005 | Works | 実績 |
| AD-006 | Posts | 記事 |
| AD-007 | Categories | カテゴリ |
| AD-008 | Forms | フォーム定義 |
| AD-009 | FormSubmissions | フォーム送信内容 |
| AD-010 | SiteSettings | サイト全体設定 |
| AD-011 | Header | ヘッダー設定 |
| AD-012 | Footer | フッター設定 |

## 5. データ設計

### 5.1 ERイメージ

```text
User
 │
 ├─ Post ─ Category
 │
 ├─ Work ─ Category
 │
 ├─ Page ─ Block
 │
 └─ Media

Profile
SiteSettings
Header
Footer
Form
 └─ FormSubmission
```

### 5.2 Collections

#### Users

管理ユーザーを扱う。

| フィールド | 型 | 必須 | 概要 |
| --- | --- | --- | --- |
| email | email | yes | ログイン用メールアドレス |
| name | text | yes | 表示名 |
| role | select | yes | admin/editor/author |
| lastLogin | date | no | 最終ログイン日時 |

#### Media

画像、資料などのアップロードファイルを扱う。

| フィールド | 型 | 必須 | 概要 |
| --- | --- | --- | --- |
| alt | text | yes | 代替テキスト |
| caption | text | no | キャプション |
| file | upload | yes | アップロードファイル |
| mimeType | text | auto | MIME type |
| width | number | auto | 画像幅 |
| height | number | auto | 画像高さ |

#### Pages

固定ページを扱う。

| フィールド | 型 | 必須 | 概要 |
| --- | --- | --- | --- |
| title | text | yes | ページタイトル |
| slug | text | yes | URL slug |
| status | select | yes | draft/published |
| layout | blocks | no | ページブロック |
| seo | group | no | SEO設定 |
| publishedAt | date | no | 公開日時 |

#### Profile

プロフィール情報を扱う。本人の情報は単一管理になりやすいため、CollectionではなくGlobalとして実装してもよい。
初期設計では管理画面上の扱いやすさを優先し、要件に応じてGlobal化を選択する。

| フィールド | 型 | 必須 | 概要 |
| --- | --- | --- | --- |
| name | text | yes | 氏名または活動名 |
| title | text | no | 肩書き |
| bio | richText | yes | 自己紹介 |
| avatar | relationship | no | プロフィール画像 |
| skills | array | no | スキル一覧 |
| careers | array | no | 経歴 |
| snsLinks | array | no | SNSリンク |

#### Works

制作実績、プロジェクト、ポートフォリオを扱う。

| フィールド | 型 | 必須 | 概要 |
| --- | --- | --- | --- |
| title | text | yes | 実績タイトル |
| slug | text | yes | URL slug |
| excerpt | textarea | no | 概要 |
| content | richText | no | 詳細本文 |
| thumbnail | relationship | no | サムネイル画像 |
| gallery | relationship | no | 追加画像 |
| role | text | no | 担当範囲 |
| techStack | array | no | 使用技術 |
| projectUrl | text | no | 公開URL |
| repositoryUrl | text | no | GitHub URL |
| categories | relationship | no | カテゴリ |
| status | select | yes | draft/published |
| seo | group | no | SEO設定 |
| publishedAt | date | no | 公開日時 |

#### Posts

ブログ、ニュース、活動報告を扱う。

| フィールド | 型 | 必須 | 概要 |
| --- | --- | --- | --- |
| title | text | yes | 記事タイトル |
| slug | text | yes | URL slug |
| excerpt | textarea | no | 抜粋 |
| content | richText | yes | 本文 |
| thumbnail | relationship | no | サムネイル |
| status | select | yes | draft/published |
| publishedAt | date | no | 公開日時 |
| author | relationship | no | 投稿者 |
| categories | relationship | no | カテゴリ |
| seo | group | no | SEO設定 |

#### Categories

記事と実績の分類に利用する。

| フィールド | 型 | 必須 | 概要 |
| --- | --- | --- | --- |
| name | text | yes | カテゴリ名 |
| slug | text | yes | URL slug |
| description | textarea | no | 説明 |
| type | select | no | post/work/common |

#### Forms

フォーム定義を扱う。

| フィールド | 型 | 必須 | 概要 |
| --- | --- | --- | --- |
| name | text | yes | フォーム名 |
| fields | array | yes | 入力項目定義 |
| successMessage | textarea | no | 送信完了メッセージ |
| notificationEmails | array | no | 通知先メール |

#### FormSubmissions

フォーム送信データを扱う。

| フィールド | 型 | 必須 | 概要 |
| --- | --- | --- | --- |
| form | relationship | yes | 対象フォーム |
| data | json | yes | 送信内容 |
| createdAt | date | auto | 送信日時 |

### 5.3 Globals

#### SiteSettings

| フィールド | 型 | 概要 |
| --- | --- | --- |
| siteName | text | サイト名 |
| siteDescription | textarea | サイト説明 |
| siteUrl | text | サイトURL |
| logo | relationship | ロゴ |
| favicon | relationship | favicon |
| defaultOgImage | relationship | デフォルトOGP画像 |

#### Header

| フィールド | 型 | 概要 |
| --- | --- | --- |
| logo | relationship | ヘッダーロゴ |
| navigation | array | ナビゲーション |
| ctaButton | group | CTAボタン |

#### Footer

| フィールド | 型 | 概要 |
| --- | --- | --- |
| navigation | array | フッターナビゲーション |
| snsLinks | array | SNSリンク |
| copyright | text | コピーライト |

### 5.4 共通フィールド

#### SEO

Pages、Posts、Worksで共通利用する。

| フィールド | 型 | 概要 |
| --- | --- | --- |
| metaTitle | text | meta title |
| metaDescription | textarea | meta description |
| ogImage | relationship | OGP画像 |
| canonicalUrl | text | canonical URL |

## 6. Block設計

Pagesの `layout` フィールドで利用する。
Payloadのblocks型を使い、管理画面から追加、編集、並び替えできるようにする。

### 6.1 対象ブロック

| Block | 用途 | 主なフィールド |
| --- | --- | --- |
| Hero | ファーストビュー | title、subtitle、backgroundImage、ctaText、ctaUrl |
| RichText | 汎用本文 | content |
| Features | スキル、特徴、サービス一覧 | title、items |
| Gallery | 画像一覧 | images |
| FAQ | よくある質問 | items |
| CTA | 問い合わせ誘導 | title、description、buttonText、buttonUrl |
| ContactForm | 問い合わせフォーム表示 | form、title、description |

### 6.2 BlockRenderer

公開画面では `components/cms/BlockRenderer.tsx` を用意し、CMSから取得したblockTypeごとに表示コンポーネントへ振り分ける。

```tsx
export const BlockRenderer = ({ blocks }) => {
  return blocks.map((block) => {
    switch (block.blockType) {
      case "hero":
        return <Hero {...block} />;
      case "richText":
        return <RichText {...block} />;
      case "features":
        return <Features {...block} />;
      case "gallery":
        return <Gallery {...block} />;
      case "faq":
        return <FAQ {...block} />;
      case "cta":
        return <CTA {...block} />;
      case "contactForm":
        return <ContactForm {...block} />;
      default:
        return null;
    }
  });
};
```

## 7. ルーティング設計

### 7.1 固定ルート

```text
/
/about
/works
/works/[slug]
/posts
/posts/[slug]
/contact
```

### 7.2 CMSページルート

Pages Collectionのslugを利用して、任意の固定ページを表示する。

```text
/[...slug]
```

### 7.3 表示制御

- `status = published` のコンテンツのみ公開ページに表示する
- `publishedAt` が未来日時の場合は公開対象外とする
- slugが重複しないようにCMS側で制御する

## 8. データ取得設計

### 8.1 lib/payload

Payloadへのアクセスは `lib/payload` に集約する。

```text
lib/payload/
├─ getPage.ts
├─ getProfile.ts
├─ getWorks.ts
├─ getWork.ts
├─ getPosts.ts
├─ getPost.ts
├─ getSiteSettings.ts
├─ getHeader.ts
└─ getFooter.ts
```

### 8.2 取得関数例

```typescript
export async function getPage(slug: string) {
  const payload = await getPayload();

  return payload.find({
    collection: "pages",
    where: {
      slug: {
        equals: slug,
      },
      status: {
        equals: "published",
      },
    },
  });
}
```

## 9. 権限設計

### 9.1 ロール

| ロール | 権限 |
| --- | --- |
| admin | すべての作成、編集、削除、設定変更が可能 |
| editor | Pages、Profile、Works、Posts、Mediaの作成、編集が可能 |
| author | Postsの作成、編集が可能 |

### 9.2 accessディレクトリ

```text
access/
├─ isAdmin.ts
├─ isEditor.ts
├─ isAuthor.ts
└─ publishedOnly.ts
```

## 10. Hook設計

```text
hooks/
├─ generateSlug.ts
├─ revalidatePage.ts
├─ revalidatePost.ts
├─ revalidateWork.ts
└─ protectPublishedSlug.ts
```

| Hook | 用途 |
| --- | --- |
| generateSlug | titleからslugを自動生成する |
| revalidatePage | ページ更新時にキャッシュを再検証する |
| revalidatePost | 記事更新時にキャッシュを再検証する |
| revalidateWork | 実績更新時にキャッシュを再検証する |
| protectPublishedSlug | 公開済みURLの不用意な変更を防ぐ |

## 11. SEO設計

### 11.1 metadata生成

Next.jsのmetadata APIを利用し、各ページのSEOフィールドからmetadataを生成する。

優先順位:

```text
各コンテンツのSEO設定
↓
コンテンツのtitle/excerpt
↓
SiteSettingsのデフォルト値
```

### 11.2 OGP

OGP画像は次の優先順位で決定する。

```text
コンテンツ個別のogImage
↓
thumbnail
↓
SiteSettings.defaultOgImage
```

## 12. フォーム設計

問い合わせフォームはForms Collectionの定義を利用し、送信データはFormSubmissionsに保存する。

送信処理:

```text
入力
↓
バリデーション
↓
FormSubmissionsへ保存
↓
通知メール送信
↓
完了メッセージ表示
```

初期実装では、名前、メールアドレス、件名、本文を標準項目とする。

## 13. デプロイ設計

### 13.1 開発環境

```text
npx create-payload-app
npm run dev
```

開発時URL:

```text
http://localhost:3000
http://localhost:3000/admin
```

### 13.2 本番環境

```text
Vercel
Neon PostgreSQL
```

環境変数:

```text
DATABASE_URI
PAYLOAD_SECRET
NEXT_PUBLIC_SITE_URL
```

### 13.3 テンプレート初期化

フェーズ4では、プロフィールサイト以外にも転用しやすいように用途別のseedを用意する。

```bash
# profile / company / landing / blog
TEMPLATE=profile npm run seed
```

seedで作成・更新する内容:

- 管理ユーザー
- SiteSettings、Header、Footer、Profile
- Categories
- Pages
- Posts
- Works
- Contact Form

管理ユーザーは次の環境変数で変更できる。

```text
SEED_ADMIN_EMAIL
SEED_ADMIN_PASSWORD
SEED_ADMIN_NAME
```

### 13.4 Migration

Payloadのmigrationは `migrations/` に出力する。

```bash
npm run migrate:create -- migration-name
npm run migrate
npm run migrate:status
```

Collection、Global、Field、Blockを変更したらmigrationを作成し、本番反映前に生成内容を確認する。

## 14. 初期実装順序

1. Payload CMS + Next.jsプロジェクトを作成する
2. PostgreSQL接続を設定する
3. Users、Mediaを実装する
4. Pages、Posts、Categoriesを実装する
5. Profile、Worksを実装する
6. SiteSettings、Header、Footerを実装する
7. Hero、RichText、CTAの最小ブロックを実装する
8. BlockRendererを実装する
9. トップ、プロフィール、実績、記事、問い合わせ画面を実装する
10. SEO、フォーム、キャッシュ再検証を整備する

## 15. 将来拡張

初期リリース後、次の機能を追加候補とする。

- 多言語対応
- 会員サイト機能
- EC機能
- GoogleMapブロック
- YouTube埋め込みブロック
- Pricingブロック
- テンプレート切り替え
- サイト複製用seedデータ

---

## 開発環境でのログイン情報

ログイン情報:
http://localhost:3000/admin
admin@example.com
password123
