# 開発日誌・設計判断MCP 実装タスク

## 1. この文書の使い方

本書は実装順のチェックリストである。各Phaseの完了条件を満たしてから次へ進む。

初期リリースでは「管理画面から入力」「MCPから安全に読み取る」「publicだけをサイトに表示する」までを対象にする。書き込みMCPとリモートMCPは別マイルストーンとする。

## 2. Phase 0: 実装前確認

- [x] [`development-journal-mcp-overview.md`](./development-journal-mcp-overview.md) の対象範囲を確認する。
- [x] [`development-journal-mcp-design.md`](./development-journal-mcp-design.md) のデータ項目を確認する。
- [x] `status`、`visibility`、`decisionStatus` の違いを確認する。
- [x] 初期transportをstdioとすることを確認する。
- [x] 初期MCPを読み取り専用とすることを確認する。
- [x] MCPからprivateを読める運用が許容されることを確認する。
- [x] 開発日誌とADRに保存してはいけない情報の基準を決める。

完了条件:

- MVPの範囲とセキュリティ境界に未決事項がない。

## 3. Phase 1: Payload Collection

### 3.1 共通フィールドとaccess

- [x] 未認証read用のaccess関数を `access/readPublishedEngineeringNote.ts` に追加する。
- [x] `status = published` を必須にする。
- [x] `visibility = public` を必須にする。
- [x] `publishedAt` が未来の場合は公開しない条件を実装する。
- [x] create/update/deleteは既存のロール判定を再利用する。

### 3.2 DevelopmentLogs

- [x] `collections/DevelopmentLogs.ts` を作成する。
- [x] 基本項目、作業内容、問題、原因、解決方法、学び、次の作業を追加する。
- [x] `works` へのrelationshipを追加する。
- [x] `architecture-decisions` へのrelationshipを追加する。
- [x] `slug` をunique + indexにする。
- [x] 管理画面のdefaultColumnsを設定する。
- [x] draft、version管理を設定する。

### 3.3 ArchitectureDecisions

- [x] `collections/ArchitectureDecisions.ts` を作成する。
- [x] `decisionId`、背景、選択肢、判断、理由、影響を追加する。
- [x] `decisionStatus` を追加する。
- [x] `works` と `development-logs` へのrelationshipを追加する。
- [x] `supersedes` の自己relationshipを追加する。
- [x] `decisionId` と `slug` をunique + indexにする。
- [x] 管理画面のdefaultColumnsを設定する。
- [x] draft、version管理を設定する。

### 3.4 Configと型

- [x] `payload.config.ts` に2つのCollectionを登録する。
- [x] Payload型を再生成する。
- [x] relationshipのCollection slugと生成型を確認する。
- [x] ESLintとTypeScriptの形式に合わせて整形する。

想定確認コマンド:

```bash
npm run generate:types
npm run lint
npm run typecheck
```

完了条件:

- Payload管理画面で2つのCollectionを開ける。
- 開発日誌とADRを下書き保存できる。
- `Works` と相互に関連付けられる。

## 4. Phase 2: Migrationとテストデータ

- [x] Collection追加用migrationを作成する。
- [x] 生成されたmigrationに意図しない破壊的変更がないか確認する。
- [x] migrationを適用する。
- [x] migration statusを確認する。
- [x] 代表的な開発日誌を2件以上登録する。
- [x] 代表的なADRを2件以上登録する。
- [x] public/private、draft/publishedの全組み合わせを用意する。
- [x] 既存seedへ追加するか、開発用fixtureを別に持つか決定する。

初期データ候補:

- Payload CMSを採用した理由
- PostgreSQLを採用した理由
- Works取得失敗時に静的データへフォールバックする理由
- FormsとFormSubmissionsを分けた理由
- 問い合わせフォーム実装時の開発日誌

想定確認コマンド:

```bash
npm run migrate:create
npm run migrate
npm run migrate:status
```

完了条件:

- 空DBへmigrationを適用できる。
- 各公開状態・公開範囲のテストデータを管理画面で確認できる。

実施メモ（2026-07-17）:

- 既存DBは開発モードのschema pushで現行schemaになっていたため、既存データを消す `migrate:fresh` は使用しなかった。
- 一時的な空DBへ全migrationを適用し、2件とも成功することを確認した。
- 現行DBと検証DBのcolumn、index、constraint、enumが一致することを確認してから、現行DBを正式migration履歴へbaseline化した。
- `postgresAdapter` の `push` を無効化し、今後のschema変更はmigrationを正本とする。
- seedは既存の `scripts/seed.mts` へ追加し、slugによる冪等なupsertを維持した。

## 5. Phase 3: 共通Query Service

- [x] `lib/engineering-notes/types.ts` に入力・出力型を定義する。
- [x] `lib/engineering-notes/visibility.ts` に必須公開条件を実装する。
- [x] `lib/engineering-notes/queries.ts` に検索処理を実装する。
- [x] `lib/engineering-notes/mappers.ts` にallowlist方式の変換処理を実装する。
- [x] `lib/payload/getDevelopmentLogs.ts` を作成する。
- [x] `lib/payload/getArchitectureDecisions.ts` を作成する。
- [x] `Audience = public-site | trusted-mcp` を呼び出し元から必須指定にする。
- [x] 検索件数を初期10件、最大50件に制限する。
- [x] project、tag、日付、Work、キーワードの条件を実装する。
- [x] 公開日時が未来の記録を除外する。
- [x] relationshipの展開深度と出力サイズを制限する。

### テスト

- [x] public-siteではpublicだけを返すテストを書く。
- [x] trusted-mcpではpublishedのpublic/privateを返すテストを書く。
- [x] どちらもdraftを返さないテストを書く。
- [x] Payloadの生Documentにあるallowlist外フィールドを返さないテストを書く。
- [x] limit、日付境界、0件、relationship未設定をテストする。

完了条件:

- 公開条件を呼び出し側が上書きできない。
- 公開サイトとMCPで同じ検索基盤を安全に共有できる。

実施メモ（2026-07-17）:

- Node.js標準test runnerで、公開条件、limit、Where構築、allowlist Mapperの単体テストを追加した。
- 実PostgreSQLに接続する `npm run verify:engineering-notes` を追加し、Payloadのaccess control、field path、relationship検索を確認した。
- 実DBではpublic-siteが日誌1件・ADR 1件、trusted-mcpが公開済みの日誌2件・ADR 2件を取得し、draftはどちらにも含まれないことを確認した。

## 6. Phase 4: 読み取り専用MCPサーバー

### 6.1 SDKと起動基盤

- [x] MCP公式TypeScript SDKの現行安定版を公式リポジトリで再確認する。
- [x] SDKとスキーマ検証ライブラリをnpmで追加し、lockfileへ固定する。
- [x] `mcp/env.ts` で既存の `.env` 系ファイルを読み込む。
- [x] `mcp/errors.ts` に安全なエラー変換を実装する。
- [x] `mcp/schemas.ts` に共通入力スキーマを実装する。
- [x] `mcp/server.ts` でMCPサーバーとstdio transportを接続する。
- [x] SIGINT時にサーバーを終了できるようにする。
- [x] 診断ログをstderrへ出し、stdoutへ出さない。
- [x] `package.json` にMCP起動用scriptを追加する。

### 6.2 Tool

- [x] `search_development_logs` を実装する。
- [x] `get_recent_development_logs` を実装する。
- [x] `search_architecture_decisions` を実装する。
- [x] `get_project_history` を実装する。
- [x] `get_decision_context` を実装する。
- [x] `get_related_decisions` を実装する。
- [x] すべてのToolへ読み取り専用であることが分かる説明とannotationを設定する。
- [x] Tool結果を構造化出力スキーマで検証する。

### 6.3 MCPテスト

- [x] Tool一覧に6個のToolが表示されることを確認する。
- [x] 各Toolの正常系を確認する。
- [x] 不正な日付、空の必須項目、上限超過を確認する。
- [x] 0件時の結果を確認する。
- [x] DB停止時に秘密情報を含まないエラーになることを確認する。
- [x] stdoutに通常ログが混ざらないことを確認する。
- [x] privateは取得でき、draftは取得できないことを確認する。

完了条件:

- MCP Inspectorなどのクライアントから6 Toolを実行できる。
- 定義したアクセス境界と出力上限が守られる。

実装・検証記録（2026-07-17）:

- MCP TypeScript SDK `1.29.0` とZod `4.4.3` をexact versionで追加した。SDK v2はpre-alphaのため、公式がproduction向けとして案内するv1系を採用した。
- `mcp/dataSource.ts` で `audience: "trusted-mcp"` を固定し、6 ToolがPhase 3のQuery Serviceとallowlist Mapperを迂回できない構成にした。
- 全Toolへ入力・出力Zod schema、`readOnlyHint`、最大50件、説明用textと`structuredContent`を設定した。
- DB障害のfault injectionテストで、接続文字列、SQL、stack traceがTool応答へ含まれないことを確認した。
- `npm run verify:mcp` で実PostgreSQLとstdio MCP子プロセスへ接続し、6 Toolの実行、private取得、draft除外、stdoutへ通常ログが混ざらないことを確認した。

## 7. Phase 5: Codex接続と受け入れ確認

- [x] ローカルMCPサーバーをCodexのプロジェクト設定へ登録する。
- [x] 設定ファイルへDB接続文字列やsecretを直書きしない。
- [x] MCPサーバーを再起動してTool検出を確認する。
- [x] 代表質問をCodexから実行する。
- [x] どの日誌・ADRが根拠になったか識別できる出力を確認する。
- [x] privateの内容が意図したローカルクライアントだけへ返ることを確認する。

受け入れ質問:

1. `my_profileでPostgreSQLを採用した理由を教えてください。`
2. `問い合わせフォーム実装時の問題、原因、解決方法を整理してください。`
3. `指定したWorkに関連する設計判断を一覧にしてください。`
4. `直近の開発日誌から次にやることを抽出してください。`
5. `置き換え済みのADRと現在有効なADRの関係を説明してください。`

完了条件:

- CodexがMCP Toolを使い、保存済みデータに基づいて回答できる。
- 下書きや禁止情報が回答へ含まれない。

実装・検証記録（2026-07-17）:

- `.codex/config.toml`へ`engineering_notes`を登録し、6 Toolのallowlist、timeout、読み取り専用Toolの自動承認を設定した。
- DB接続文字列とPayload secretは設定へ記載せず、既存の`.env`系ファイルをMCP子プロセス内で読み込む構成を維持した。
- `codex mcp list`で、プロジェクト設定の`engineering_notes`がenabledとして検出されることを確認した。
- 新しい`codex exec`プロセスから5つの受け入れ質問を実行し、MCP Tool callと根拠のslug・decisionIdをJSONLで確認した。
- PostgreSQL採用理由は`ADR-0002`、フォーム実装は`implement-contact-form-storage`、置換関係は`ADR-0001`と`ADR-0002`を根拠として回答された。
- privateの`ADR-0001`と`investigate-works-fallback`はローカルCodexから取得でき、draftの`ADR-0004`、`plan-engineering-notes-pages`はTool結果と回答へ含まれなかった。
- Codexが指定した`limit: 100`は入力スキーマで拒否され、最大50件の境界が実クライアントでも守られることを確認した。

## 8. Phase 6: Engineering Notes公開画面

### 8.1 Next.js現行仕様の確認

- [x] `node_modules/next/dist/docs/` からApp Routerのデータ取得ガイドを読む。
- [x] キャッシュと再検証の現行仕様を読む。
- [x] 動的ルートとmetadataの現行仕様を読む。
- [x] 採用する方式を短いADRとして記録する。

### 8.2 画面実装

- [x] `/engineering-notes` の一覧ページを作成する。
- [x] 日誌とADRを識別できる表示にする。
- [x] project、tag、種別を表示する。
- [x] `/engineering-notes/logs/[slug]` を作成する。
- [x] `/engineering-notes/decisions/[slug]` を作成する。
- [x] 関連Workへのリンクを表示する。
- [x] 関連日誌・ADRへのリンクを表示する。
- [x] HeaderまたはFooterからの導線を追加するか決定する。
- [x] title、descriptionなどのmetadataを設定する。
- [x] 存在しないslugをnot-foundへ送る。

### 8.3 公開境界の確認

- [x] public + publishedを表示できる。
- [x] privateをURLから取得できない。
- [x] draftをURLから取得できない。
- [x] 未来のpublishedAtを持つ記録を取得できない。
- [x] Payload APIを直接呼んでもprivateを取得できない。

完了条件:

- 公開可能なEngineering Notesだけを閲覧できる。
- 実績と設計判断・開発過程を相互に移動できる。

実装・検証記録（2026-07-21）:

- Next.js 16.2.9の同梱ドキュメントからServer Componentのデータ取得、Cache Components未使用時のISR、Promise形式の動的`params`、`generateStaticParams`、`generateMetadata`、`notFound()`を確認した。
- 採用方式を`docs/adr/ADR-0005-engineering-notes-public-rendering.md`へ記録し、Server Component、5分ISR、React `cache()`、公開slugだけの静的生成を採用した。
- `/engineering-notes`、`/engineering-notes/logs/[slug]`、`/engineering-notes/decisions/[slug]`とHeader導線を実装した。
- 本番buildで公開日誌`implement-contact-form-storage`と公開ADR`choose-postgresql`だけが詳細ページとして静的生成されることを確認した。
- ブラウザで一覧、日誌詳細、ADR詳細、関連Work、metadataを確認し、privateの`initially-consider-mongodb`とdraftの`plan-engineering-notes-pages`が404になることを確認した。
- 未認証Payload REST APIへprivate条件・private slug・draft slugを直接指定し、すべて`totalDocs: 0`になることを確認した。
- access controlの単体テストで`publishedAt`未設定または現在以前だけを許可し、未来日時を除外するWhere条件を確認した。

## 9. Phase 7: 最終検証とドキュメント更新

- [x] formatterを実行する。
- [x] lintを実行する。
- [x] typecheckを実行する。
- [x] buildを実行する。
- [x] MCP関連テストを実行する。
- [x] access controlのテストを実行する。
- [x] migration statusを確認する。
- [x] `README.md` にEngineering NotesとMCPの概要を追記する。
- [x] MCPの起動方法、設定例、トラブルシュートを `docs/` に追記する。
- [x] `.env.example` に必要な変数が不足していないか確認する。
- [x] secretや個人情報がGit差分へ含まれていないか確認する。

想定確認コマンド:

```bash
npm run lint
npm run typecheck
npm run build
npm run migrate:status
git diff --check
```

完了条件:

- 全受け入れ条件と自動チェックが成功する。
- 新しい開発者がドキュメントだけでMCPを起動・確認できる。

実装・検証記録（2026-07-21）:

- Prettierを開発依存へ固定し、`format`と`format:check`スクリプト、生成物を除外する`.prettierignore`を追加した。
- READMEへEngineering Notes・MCPの概要と起動手順を追加し、Codex設定とトラブルシュートを`docs/development-journal-mcp-codex.md`へ集約した。
- `.env.example`をDocker ComposeのPostgreSQL設定と揃え、必須値・任意値・秘密値をコミットしない理由をコメントで明示した。
- formatter、typecheck、production build、MCPテスト（4件）、access controlを含むEngineering Notesテスト（12件）が成功した。
- lintはエラー0件で、既存の自動生成migrationに未使用引数のwarningが4件残ることを確認した。
- 2件のmigrationが適用済みであること、公開・非公開・draft境界、MCPの6 Tool、stdioのJSON-RPC出力を検証スクリプトで再確認した。
- Git差分の空白エラー、`.env`のignore状態、ソース差分に秘密値らしい文字列がないことを確認した。

## 10. 将来タスク: 書き込み支援

次の項目はMVP完了後に別途設計する。

- [ ] `draft_development_log` を追加する。
- [ ] `create_architecture_decision_draft` を追加する。
- [ ] `supersede_architecture_decision` を追加する。
- [ ] すべての書き込みをPayload draftとして保存する。
- [ ] Tool実行前のユーザー確認を必須にする。
- [ ] 作成者、実行元、変更内容の監査ログを残す。
- [ ] Git差分やコミットから下書き候補を作成する。
- [ ] 機密情報検出と保存拒否ルールを追加する。

## 11. 将来タスク: リモートMCP

ローカルstdioでは満たせない利用要件が確認できた場合だけ着手する。

- [ ] Streamable HTTPを採用する。
- [ ] OAuth 2.1準拠の認可方式を設計する。
- [ ] MCP resource URIとtoken audience検証を実装する。
- [ ] scopeをread/writeなど最小単位へ分割する。
- [ ] HTTPSを必須にする。
- [ ] レート制限と監査ログを追加する。
- [ ] CORS、DNS rebinding、token passthroughを確認する。
- [ ] Vercel上へ同居させるか、別サービスへ分離するか評価する。

## 12. 推奨コミット単位

1. `docs: add development journal MCP plan`
2. `feat(payload): add engineering note collections`
3. `feat(payload): add engineering note queries and access rules`
4. `feat(mcp): add read-only engineering notes server`
5. `test: cover engineering note visibility and MCP tools`
6. `feat(frontend): add engineering notes pages`
7. `docs: add MCP setup and operations guide`
