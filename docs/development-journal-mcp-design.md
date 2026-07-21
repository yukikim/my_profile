# 開発日誌・設計判断MCP 基本設計

## 1. 文書の目的

本書は、「開発日誌・設計判断MCP」を現在の `my_profile` プロジェクトへ追加するためのデータ設計、処理境界、MCP Tool、アクセス制御、ファイル構成を定義する。

## 2. 現在のプロジェクトとの関係

既存プロジェクトでは、次の構成が利用されている。

| 項目           | 現在の実装                                   |
| -------------- | -------------------------------------------- |
| フロントエンド | Next.js 16 App Router                        |
| CMS            | Payload CMS 3                                |
| DB             | PostgreSQL                                   |
| Collection登録 | `payload.config.ts`                          |
| 公開データ取得 | `lib/payload/` のPayload Local APIヘルパー   |
| 公開状態       | `status: draft / published` と `publishedAt` |
| 管理権限       | `access/` のロール判定                       |
| パッケージ管理 | npm（`package-lock.json`）                   |

新機能もこの構成を維持し、開発日誌専用の別DBや別CMSは導入しない。

## 3. システム構成

### 3.1 コンポーネント

| コンポーネント   | 責務                                           |
| ---------------- | ---------------------------------------------- |
| Payload Admin    | 開発日誌とADRの入力、編集、レビュー、公開      |
| PostgreSQL       | 2つのCollectionと既存Worksのrelationshipを保存 |
| Query Service    | 公開サイト用とMCP用の検索条件を組み立てる      |
| Response Mapper  | PayloadのDocumentをMCP用の安全な出力へ変換する |
| MCP Server       | Toolの登録、入力検証、検索呼び出し、エラー整形 |
| Next.js Frontend | `public` のEngineering Notesを表示             |

### 3.2 初期transport

初期リリースはローカルの `stdio` transportを採用する。

理由:

- CodexなどのローカルMCPクライアントから子プロセスとして起動できる。
- HTTPエンドポイントを公開しないため、MVPでOAuthサーバーを用意する必要がない。
- Payloadと同じ環境変数およびPostgreSQLを利用できる。
- 1人で利用する読み取り専用MCPという初期要件に合う。

リモート利用が必要になった場合のみStreamable HTTPへ移行する。公式TypeScript SDKでも、ローカル連携にはstdio、リモートサーバーにはStreamable HTTPが案内されている。

## 4. データ設計

### 4.1 共通ルール

両Collectionに次の概念を持たせる。

| フィールド     | 型           | 必須 | 用途                                  |
| -------------- | ------------ | ---- | ------------------------------------- |
| `title`        | text         | yes  | 管理画面と検索結果の見出し            |
| `slug`         | text         | yes  | 一意な識別子と公開URL                 |
| `project`      | text         | yes  | プロジェクト名。初期値は `my_profile` |
| `relatedWorks` | relationship | no   | `works` との関連。複数可              |
| `tags`         | array        | no   | キーワード絞り込み                    |
| `status`       | select       | yes  | `draft` / `published`                 |
| `visibility`   | select       | yes  | `public` / `private`                  |
| `publishedAt`  | date         | no   | 公開日時                              |
| `createdAt`    | date         | auto | Payload標準タイムスタンプ             |
| `updatedAt`    | date         | auto | Payload標準タイムスタンプ             |

`status` と `visibility` は別の意味を持つ。

| status    | visibility | Payload管理画面 | MCP  | 公開サイト・未認証API |
| --------- | ---------- | --------------- | ---- | --------------------- |
| draft     | public     | 可              | 不可 | 不可                  |
| draft     | private    | 可              | 不可 | 不可                  |
| published | private    | 可              | 可   | 不可                  |
| published | public     | 可              | 可   | 可                    |

### 4.2 DevelopmentLogs

Collection slugは `development-logs` とする。

| フィールド         | 型           | 必須 | 概要                                 |
| ------------------ | ------------ | ---- | ------------------------------------ |
| `title`            | text         | yes  | 日誌のタイトル                       |
| `slug`             | text         | yes  | 一意、indexあり                      |
| `logDate`          | date         | yes  | 作業日                               |
| `project`          | text         | yes  | 対象プロジェクト                     |
| `summary`          | textarea     | yes  | 作業概要                             |
| `implementation`   | textarea     | no   | 実装した内容                         |
| `problem`          | textarea     | no   | 発生した問題、現象、エラー           |
| `cause`            | textarea     | no   | 判明した原因                         |
| `resolution`       | textarea     | no   | 対処と解決方法                       |
| `lessonsLearned`   | textarea     | no   | 学んだこと、再発防止                 |
| `nextActions`      | array        | no   | 次に行う作業。各要素は `task` を持つ |
| `relatedWorks`     | relationship | no   | `works`、複数可                      |
| `relatedDecisions` | relationship | no   | `architecture-decisions`、複数可     |
| `tags`             | array        | no   | 各要素は `label` を持つ              |
| `status`           | select       | yes  | 公開状態                             |
| `visibility`       | select       | yes  | 公開範囲                             |
| `publishedAt`      | date         | no   | 公開日時                             |

本文は初期段階では `textarea` を採用する。MCPへ返す際のプレーンテキスト変換を単純にし、構造化項目ごとの検索と再利用を優先する。装飾表現が必要になった段階でrichText化を再検討する。

### 4.3 ArchitectureDecisions

Collection slugは `architecture-decisions` とする。

| フィールド             | 型           | 必須 | 概要                                   |
| ---------------------- | ------------ | ---- | -------------------------------------- |
| `decisionId`           | text         | yes  | `ADR-0001` 形式、一意、indexあり       |
| `title`                | text         | yes  | 判断のタイトル                         |
| `slug`                 | text         | yes  | 一意、indexあり                        |
| `project`              | text         | yes  | 対象プロジェクト                       |
| `decisionStatus`       | select       | yes  | `proposed` / `accepted` / `superseded` |
| `context`              | textarea     | yes  | 背景、課題、制約                       |
| `options`              | array        | yes  | `name`、`description`、`pros`、`cons`  |
| `decision`             | textarea     | yes  | 採用した方針                           |
| `rationale`            | textarea     | yes  | 採用理由                               |
| `positiveConsequences` | array        | no   | 利点、期待効果                         |
| `negativeConsequences` | array        | no   | デメリット、トレードオフ               |
| `decidedAt`            | date         | no   | 判断日                                 |
| `supersedes`           | relationship | no   | 置き換え対象のADR、自Collection参照    |
| `relatedWorks`         | relationship | no   | `works`、複数可                        |
| `relatedLogs`          | relationship | no   | `development-logs`、複数可             |
| `tags`                 | array        | no   | 各要素は `label` を持つ                |
| `status`               | select       | yes  | 公開状態                               |
| `visibility`           | select       | yes  | 公開範囲                               |
| `publishedAt`          | date         | no   | 公開日時                               |

`decisionStatus` は設計判断のライフサイクル、`status` はコンテンツの公開状態であり、別のフィールドとして扱う。

### 4.4 relationshipの方針

- 開発日誌、ADRの双方から `Works` を参照できるようにする。
- 開発日誌とADRの相互関連は、初期実装では一方だけ設定される可能性を許容する。
- 検索時に逆参照が必要な場合は、対象IDを条件にPayloadへ問い合わせる。
- 循環relationshipによる巨大な応答を防ぐため、MCP検索では `depth` を小さくし、関連データはID、slug、titleへ整形する。

## 5. アクセス制御設計

### 5.1 Collection操作

| 操作                   | 権限                                              |
| ---------------------- | ------------------------------------------------- |
| create                 | admin / editor / author                           |
| update                 | admin / editor / author                           |
| delete                 | admin / editor                                    |
| read（認証済み管理者） | 全件                                              |
| read（未認証）         | `status = published AND visibility = public` のみ |

実装時には既存の `isAdminEditorOrAuthor`、`isAdminOrEditor` を再利用する。read accessは単純な `() => true` にせず、未認証リクエストへPayloadのWhere条件を返す専用関数を追加する。

### 5.2 公開日時

公開サイトと未認証APIは次の条件を満たすものだけを返す。

```text
status = published
AND visibility = public
AND (publishedAt is empty OR publishedAt <= now)
```

MCPも `status = published` と公開日時の条件を必須とするが、`visibility` は `public` と `private` の両方を対象とする。

### 5.3 MCPの信頼境界

stdio MCPサーバーは、このリポジトリとDB環境変数へアクセスできるローカルの信頼されたプロセスとして扱う。そのためCollectionの非公開記録を検索できるが、次の制約をサーバー自身で強制する。

- 下書きを返さない。
- 取得フィールドをallowlistで限定する。
- Payload DocumentをそのままJSON化しない。
- `DATABASE_URI`、`PAYLOAD_SECRET`、ユーザー情報を応答へ含めない。
- エラー時に接続文字列、SQL、スタックトレースをMCPクライアントへ返さない。
- 検索件数と文字数に上限を設ける。
- Toolはすべて読み取り専用として登録する。

## 6. MCP Tool設計

### 6.1 共通仕様

- 入力はZodなどのスキーマで検証する。
- `limit` の初期値は10、最大値は50とする。
- 日付はISO 8601文字列で返す。
- 0件はエラーではなく空配列と検索条件を返す。
- 内部エラーは安全なメッセージとエラーコードへ変換する。
- 応答は説明用テキストと構造化データを返せる形にする。

### 6.2 `search_development_logs`

開発日誌をキーワードと絞り込み条件で検索する。

入力:

- `query?: string`
- `project?: string`
- `tags?: string[]`
- `from?: string`
- `to?: string`
- `relatedWorkSlug?: string`
- `visibility?: "public" | "private" | "all"`
- `limit?: number`

検索対象は `title`、`summary`、`implementation`、`problem`、`cause`、`resolution`、`lessonsLearned` とする。

### 6.3 `get_recent_development_logs`

直近の開発日誌を `logDate` の降順で返す。

入力:

- `project?: string`
- `days?: number`
- `limit?: number`

### 6.4 `search_architecture_decisions`

ADRをキーワード、状態、関連Workなどで検索する。

入力:

- `query?: string`
- `project?: string`
- `decisionStatus?: "proposed" | "accepted" | "superseded"`
- `tags?: string[]`
- `relatedWorkSlug?: string`
- `visibility?: "public" | "private" | "all"`
- `limit?: number`

### 6.5 `get_project_history`

指定プロジェクトの開発日誌とADRを時系列へ統合して返す。

入力:

- `project: string`
- `from?: string`
- `to?: string`
- `includeLogs?: boolean`（初期値 `true`）
- `includeDecisions?: boolean`（初期値 `true`）
- `limit?: number`

### 6.6 `get_decision_context`

1件のADRについて、背景、選択肢、判断、理由、影響、関連Work、関連日誌を返す。

入力:

- `decisionId?: string`
- `slug?: string`

いずれか一方を必須とする。

### 6.7 `get_related_decisions`

指定したADRまたはWorkに関連する設計判断を返す。

入力:

- `decisionId?: string`
- `workSlug?: string`
- `includeSuperseded?: boolean`
- `limit?: number`

`decisionId` と `workSlug` のいずれか一方を必須とする。

## 7. MCP出力モデル

### 7.1 開発日誌の出力

```ts
type DevelopmentLogResult = {
  id: string;
  title: string;
  slug: string;
  logDate: string;
  project: string;
  summary: string;
  implementation?: string;
  problem?: string;
  cause?: string;
  resolution?: string;
  lessonsLearned?: string;
  nextActions: string[];
  relatedWorks: Array<{ title: string; slug: string }>;
  relatedDecisionIds: string[];
  tags: string[];
  visibility: "public" | "private";
};
```

### 7.2 ADRの出力

```ts
type ArchitectureDecisionResult = {
  id: string;
  decisionId: string;
  title: string;
  slug: string;
  project: string;
  decisionStatus: "proposed" | "accepted" | "superseded";
  context: string;
  options: Array<{
    name: string;
    description?: string;
    pros: string[];
    cons: string[];
  }>;
  decision: string;
  rationale: string;
  positiveConsequences: string[];
  negativeConsequences: string[];
  relatedWorks: Array<{ title: string; slug: string }>;
  relatedLogSlugs: string[];
  supersedesDecisionId?: string;
  tags: string[];
  visibility: "public" | "private";
  decidedAt?: string;
};
```

## 8. Query Service設計

公開サイトとMCP ToolからPayload検索を直接組み立てると、公開条件の漏れや重複が生じる。そのため次の層へ分割する。

```text
MCP Tool / Next.js Page
        ↓
Query Service
        ↓
Payload Local API
        ↓
Response Mapper
```

Query Serviceは呼び出し元を明示的に受け取る。

```ts
type Audience = "public-site" | "trusted-mcp";
```

- `public-site`: `published + public + publishedAt` を強制する。
- `trusted-mcp`: `published + publishedAt` を強制し、visibility指定を許可する。

呼び出し側が任意のWhere条件でこの必須条件を上書きできないAPIにする。

## 9. ファイル構成案

```text
collections/
├─ DevelopmentLogs.ts
└─ ArchitectureDecisions.ts

access/
└─ readPublishedEngineeringNote.ts

lib/payload/
├─ getDevelopmentLogs.ts
└─ getArchitectureDecisions.ts

lib/engineering-notes/
├─ types.ts
├─ queries.ts
├─ mappers.ts
└─ visibility.ts

mcp/
├─ server.ts
├─ env.ts
├─ errors.ts
├─ schemas.ts
└─ tools/
   ├─ searchDevelopmentLogs.ts
   ├─ getRecentDevelopmentLogs.ts
   ├─ searchArchitectureDecisions.ts
   ├─ getProjectHistory.ts
   ├─ getDecisionContext.ts
   └─ getRelatedDecisions.ts

app/(frontend)/engineering-notes/
├─ page.tsx
├─ logs/[slug]/page.tsx
└─ decisions/[slug]/page.tsx
```

さらに `payload.config.ts` へ2つのCollectionを登録し、`package.json` へMCP起動・確認用scriptを追加する。

## 10. 環境変数

初期MCPは既存の次の環境変数を利用する。

- `DATABASE_URI`
- `PAYLOAD_SECRET`

standalone Node.jsプロセスでもNext.jsと同じ `.env` 系ファイルを安全に読み込めるようにする。値そのものをMCP設定ファイルやログへ複製しない。

将来Streamable HTTPへ移行する場合は、OAuth issuer、MCP resource URI、許可scopeなどを追加する。固定APIキーだけで公開MCPを運用する案は採用しない。

## 11. 公開サイト設計

### 11.1 URL

| URL                                   | 内容                |
| ------------------------------------- | ------------------- |
| `/engineering-notes`                  | 公開日誌とADRの一覧 |
| `/engineering-notes/logs/[slug]`      | 開発日誌詳細        |
| `/engineering-notes/decisions/[slug]` | ADR詳細             |

### 11.2 表示項目

一覧では種別、タイトル、日付、概要、プロジェクト、タグ、関連Workを表示する。詳細ページでは、開発日誌またはADRの構造に沿って各セクションを表示する。

秘密情報の伏せ字処理に依存せず、`public` に設定された記録だけを表示する。管理者は公開前に記録内容そのものをレビューする。

### 11.3 Next.js実装前の確認

このリポジトリの `AGENTS.md` に従い、公開画面やキャッシュを実装する直前に `node_modules/next/dist/docs/` の該当ガイドを確認する。特にApp Routerのデータ取得、キャッシュ、動的ルート、metadataの現行仕様を確認する。

## 12. エラー設計

| コード                  | 意味                          | MCPへ返す内容                  |
| ----------------------- | ----------------------------- | ------------------------------ |
| `INVALID_INPUT`         | 入力スキーマ違反              | 対象フィールドと安全な説明     |
| `NOT_FOUND`             | 指定ID、slugが存在しない      | 識別子と未検出であること       |
| `PAYLOAD_UNAVAILABLE`   | DBまたはPayloadを利用できない | 再試行を促す一般的な説明       |
| `QUERY_FAILED`          | 検索処理失敗                  | 接続情報を含まない一般的な説明 |
| `RESULT_LIMIT_EXCEEDED` | 設定上限を超える要求          | 許可される最大件数             |

stdioでは標準出力がMCP通信に使われるため、診断ログは標準エラーへ出す。秘密値とPayload Document全体はログへ出さない。

## 13. テスト方針

### 13.1 Access Control

- 未認証では `published + public` だけを取得できる。
- 認証済み管理者はprivateとdraftを管理できる。
- 公開日時が未来の記録は公開サイトへ出ない。

### 13.2 Query Service

- `public-site` ではprivateを指定しても返らない。
- `trusted-mcp` でもdraftは返らない。
- 日付、project、tag、関連Workの条件が正しく組み合わされる。
- limit最大値を超えられない。

### 13.3 Mapper

- allowlist外のフィールドを出力しない。
- relationshipがIDと展開済みDocumentのどちらでも処理できる。
- 空の任意項目を安全に処理できる。

### 13.4 MCP

- Tool一覧に6個の読み取りToolが表示される。
- 正常系が構造化結果を返す。
- 不正入力と未検出が定義済みエラーになる。
- stdoutへ診断ログが混入しない。

### 13.5 End-to-End

- Payload管理画面で作成した記録をMCPから検索できる。
- private記録はMCPで取得できるが公開URLでは取得できない。
- draft記録はMCPと公開URLのどちらでも取得できない。
- Codexから代表質問を実行し、期待するADRまたは日誌が参照される。

## 14. 将来拡張

### Resources

詳細記録をURIで直接参照する必要が生じた場合に、次のResource Templateを追加できる。

- `engineering-note://development-log/{slug}`
- `engineering-note://architecture-decision/{decisionId}`

### 書き込みTool

- `draft_development_log`
- `create_architecture_decision_draft`
- `supersede_architecture_decision`

書き込みは必ずdraftとして保存し、ユーザー確認とPayload管理画面でのレビューを必須にする。

### リモートMCP

Streamable HTTPへ移行する場合は、OAuth 2.1、HTTPS、resource audience検証、最小scope、レート制限、監査ログを追加する。MCPのHTTP認可仕様では、stdioと異なりHTTP transport向けの認可要件が定義されている。

## 15. 参考資料

- [MCP TypeScript SDK: Building MCP servers](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/server.md)
- [MCP Authorization specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)
- [MCP Tools specification](https://modelcontextprotocol.io/specification/draft/server/tools)

SDKは更新が速いため、実装開始時に安定版のパッケージ名、バージョン、import pathを公式リポジトリで再確認し、`package-lock.json` に固定する。
