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

- [ ] `lib/engineering-notes/types.ts` に入力・出力型を定義する。
- [ ] `lib/engineering-notes/visibility.ts` に必須公開条件を実装する。
- [ ] `lib/engineering-notes/queries.ts` に検索処理を実装する。
- [ ] `lib/engineering-notes/mappers.ts` にallowlist方式の変換処理を実装する。
- [ ] `lib/payload/getDevelopmentLogs.ts` を作成する。
- [ ] `lib/payload/getArchitectureDecisions.ts` を作成する。
- [ ] `Audience = public-site | trusted-mcp` を呼び出し元から必須指定にする。
- [ ] 検索件数を初期10件、最大50件に制限する。
- [ ] project、tag、日付、Work、キーワードの条件を実装する。
- [ ] 公開日時が未来の記録を除外する。
- [ ] relationshipの展開深度と出力サイズを制限する。

### テスト

- [ ] public-siteではpublicだけを返すテストを書く。
- [ ] trusted-mcpではpublishedのpublic/privateを返すテストを書く。
- [ ] どちらもdraftを返さないテストを書く。
- [ ] Payloadの生Documentにあるallowlist外フィールドを返さないテストを書く。
- [ ] limit、日付境界、0件、relationship未設定をテストする。

完了条件:

- 公開条件を呼び出し側が上書きできない。
- 公開サイトとMCPで同じ検索基盤を安全に共有できる。

## 6. Phase 4: 読み取り専用MCPサーバー

### 6.1 SDKと起動基盤

- [ ] MCP公式TypeScript SDKの現行安定版を公式リポジトリで再確認する。
- [ ] SDKとスキーマ検証ライブラリをnpmで追加し、lockfileへ固定する。
- [ ] `mcp/env.ts` で既存の `.env` 系ファイルを読み込む。
- [ ] `mcp/errors.ts` に安全なエラー変換を実装する。
- [ ] `mcp/schemas.ts` に共通入力スキーマを実装する。
- [ ] `mcp/server.ts` でMCPサーバーとstdio transportを接続する。
- [ ] SIGINT時にサーバーを終了できるようにする。
- [ ] 診断ログをstderrへ出し、stdoutへ出さない。
- [ ] `package.json` にMCP起動用scriptを追加する。

### 6.2 Tool

- [ ] `search_development_logs` を実装する。
- [ ] `get_recent_development_logs` を実装する。
- [ ] `search_architecture_decisions` を実装する。
- [ ] `get_project_history` を実装する。
- [ ] `get_decision_context` を実装する。
- [ ] `get_related_decisions` を実装する。
- [ ] すべてのToolへ読み取り専用であることが分かる説明とannotationを設定する。
- [ ] Tool結果を構造化出力スキーマで検証する。

### 6.3 MCPテスト

- [ ] Tool一覧に6個のToolが表示されることを確認する。
- [ ] 各Toolの正常系を確認する。
- [ ] 不正な日付、空の必須項目、上限超過を確認する。
- [ ] 0件時の結果を確認する。
- [ ] DB停止時に秘密情報を含まないエラーになることを確認する。
- [ ] stdoutに通常ログが混ざらないことを確認する。
- [ ] privateは取得でき、draftは取得できないことを確認する。

完了条件:

- MCP Inspectorなどのクライアントから6 Toolを実行できる。
- 定義したアクセス境界と出力上限が守られる。

## 7. Phase 5: Codex接続と受け入れ確認

- [ ] ローカルMCPサーバーをCodexのプロジェクト設定へ登録する。
- [ ] 設定ファイルへDB接続文字列やsecretを直書きしない。
- [ ] MCPサーバーを再起動してTool検出を確認する。
- [ ] 代表質問をCodexから実行する。
- [ ] どの日誌・ADRが根拠になったか識別できる出力を確認する。
- [ ] privateの内容が意図したローカルクライアントだけへ返ることを確認する。

受け入れ質問:

1. `my_profileでPostgreSQLを採用した理由を教えてください。`
2. `問い合わせフォーム実装時の問題、原因、解決方法を整理してください。`
3. `指定したWorkに関連する設計判断を一覧にしてください。`
4. `直近の開発日誌から次にやることを抽出してください。`
5. `置き換え済みのADRと現在有効なADRの関係を説明してください。`

完了条件:

- CodexがMCP Toolを使い、保存済みデータに基づいて回答できる。
- 下書きや禁止情報が回答へ含まれない。

## 8. Phase 6: Engineering Notes公開画面

### 8.1 Next.js現行仕様の確認

- [ ] `node_modules/next/dist/docs/` からApp Routerのデータ取得ガイドを読む。
- [ ] キャッシュと再検証の現行仕様を読む。
- [ ] 動的ルートとmetadataの現行仕様を読む。
- [ ] 採用する方式を短いADRとして記録する。

### 8.2 画面実装

- [ ] `/engineering-notes` の一覧ページを作成する。
- [ ] 日誌とADRを識別できる表示にする。
- [ ] project、tag、種別を表示する。
- [ ] `/engineering-notes/logs/[slug]` を作成する。
- [ ] `/engineering-notes/decisions/[slug]` を作成する。
- [ ] 関連Workへのリンクを表示する。
- [ ] 関連日誌・ADRへのリンクを表示する。
- [ ] HeaderまたはFooterからの導線を追加するか決定する。
- [ ] title、descriptionなどのmetadataを設定する。
- [ ] 存在しないslugをnot-foundへ送る。

### 8.3 公開境界の確認

- [ ] public + publishedを表示できる。
- [ ] privateをURLから取得できない。
- [ ] draftをURLから取得できない。
- [ ] 未来のpublishedAtを持つ記録を取得できない。
- [ ] Payload APIを直接呼んでもprivateを取得できない。

完了条件:

- 公開可能なEngineering Notesだけを閲覧できる。
- 実績と設計判断・開発過程を相互に移動できる。

## 9. Phase 7: 最終検証とドキュメント更新

- [ ] formatterを実行する。
- [ ] lintを実行する。
- [ ] typecheckを実行する。
- [ ] buildを実行する。
- [ ] MCP関連テストを実行する。
- [ ] access controlのテストを実行する。
- [ ] migration statusを確認する。
- [ ] `README.md` にEngineering NotesとMCPの概要を追記する。
- [ ] MCPの起動方法、設定例、トラブルシュートを `docs/` に追記する。
- [ ] `.env.example` に必要な変数が不足していないか確認する。
- [ ] secretや個人情報がGit差分へ含まれていないか確認する。

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
