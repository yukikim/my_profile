# 外部プロジェクト開発記録 実装タスク

## 1. この文書の目的

本書は、`my_profile` または別プロジェクトの作業内容からDevelopment LogとArchitecture Decision Record（ADR）の下書きを作成し、`my_profile` のPayload CMSへ安全に登録するための実装手順をPhase単位で定義する。

次の文書を前提とする。

- [`external-project-engineering-notes-overview.md`](./external-project-engineering-notes-overview.md): 目的、対象範囲、段階的な進め方
- [`external-project-engineering-notes-design.md`](./external-project-engineering-notes-design.md): データ形式、登録境界、命名、検証、セキュリティ設計

各Phaseの完了条件を満たしてから次へ進む。Phase 1までは運用確認、Phase 2以降をコード実装とする。

## 2. 全体方針

- 記録の正本は `my_profile` のPayload CMSとPostgreSQLとする。
- 既存の `DevelopmentLogs` と `ArchitectureDecisions` Collectionを利用する。
- 外部プロジェクトからPostgreSQLへ直接接続しない。
- 自動処理は下書き作成までとし、公開処理を実装しない。
- 登録時は `status: draft`、`visibility: private`、Payloadの `_status: draft` を強制する。
- 初期実装は1ファイル1Document、create-onlyとする。
- 既存の `engineering_notes` MCPは読み取り専用のまま維持する。
- 書き込みMCPは、ローカル登録スクリプトの運用実績ができた後の任意Phaseとする。

## 3. Phase 0: 実装前の決定

### 3.1 既存実装の再確認

- [x] `collections/DevelopmentLogs.ts` の必須項目、default、relationshipを確認する。
- [x] `collections/ArchitectureDecisions.ts` の必須項目、default、relationshipを確認する。
- [x] `payload-types.ts` で2つのCollectionの生成型を確認する。
- [x] `scripts/seed.mts` のPayload初期化、upsert、draft作成方法を確認する。
- [x] `mcp/env.ts` と `mcp/payload.ts` の環境変数読込、終了処理を再利用できるか確認する。
- [x] 現在のPayloadバージョンで、Local APIからdraftを作成する正しいoptionを型定義とローカル実装から確認する。
- [x] Collection schemaを変更せず実装できることを確認する。

### 3.2 未決事項の決定

- [x] `project` は既存値を優先し、初期実装では自動正規化しないと決定する。
- [x] ADR IDは生成側が明示し、登録側では自動採番しないと決定する。
- [x] relationship未検出は警告とし、`--apply` 時に利用者の明示許可を要求するか決定する。
- [x] 秘密情報検査の「即時拒否」と「警告」の分類を決定する。
- [x] 下書きJSONをGit管理する場合の保存・削除方針を決定する。
- [x] 文字数、配列件数、ファイルサイズの上限を決定する。

### 3.3 CLI仕様の決定

初期案:

```bash
npm run import:engineering-note -- --file /absolute/path/to/draft.json
npm run import:engineering-note -- --file /absolute/path/to/draft.json --apply
```

- [x] `--file` を必須にする。
- [x] `--apply` がない場合はdry-runとする。
- [x] `--apply` 以外に書き込みを有効化するoptionを設けない。
- [x] 標準出力へ本文、環境変数、接続文字列を出さない。
- [x] 終了コードを成功、入力エラー、検証エラー、DBエラーで区別するか決定する。

完了条件:

- 未決事項が基本設計または本書へ反映されている。
- Payloadへ渡すdraft作成optionが現行バージョンの型と一致している。
- Collection schema変更とmigrationが不要だと確認できている。

## 4. Phase 1: 手動登録による運用確認

### 4.1 下書き作成テンプレート

- [x] Development Log用のCodex依頼テンプレートを作成する。
- [x] ADR用のCodex依頼テンプレートを作成する。
- [x] テンプレートへ `project`、作業日、対象範囲、根拠、保存禁止情報を含める。
- [x] 不明な内容を推測で補完せず、未確認として示す規則を含める。
- [x] Development LogとADRのどちらを作るべきか判断する確認項目を含める。

文書候補:

```text
docs/external-project-engineering-notes-prompts.md
```

### 4.2 手動登録の試行

- [x] `my_profile` の作業からDevelopment Logを1件作成する。
- [x] 別プロジェクトの作業からDevelopment Logを1件作成する。
- [x] 別プロジェクトの設計判断からADRを1件作成する。
- [x] Payload管理画面へすべて `draft + private` で登録する。
- [x] slugとADR IDが既存Documentと衝突しないことを確認する。
- [x] 必要なrelationshipを管理画面で設定できることを確認する。
- [x] 入力項目の不足、重複、分かりにくい表現を記録する。

### 4.3 レビュー手順の確認

- [x] 事実関係を作業差分、テスト結果、エラー内容と照合する。
- [x] API key、接続情報、個人情報が含まれないことを確認する。
- [x] `private` と `public` の判断基準を確認する。
- [x] 公開前に `status`、`visibility`、Payloadの公開状態を確認する。
- [x] 公開後に既存MCPから `project` で検索できることを確認する。

実施結果とPhase 2へ引き継ぐ運用上の課題は
[`external-project-engineering-notes-phase1-report.md`](./external-project-engineering-notes-phase1-report.md)を参照する。

完了条件:

- 2つ以上のプロジェクトで下書き作成手順を再現できる。
- Development LogとADRの項目粒度が実用的である。
- JSON化前に修正すべき運用上の問題が整理されている。

## 5. Phase 2: 下書き入力モデルとschema

### 5.1 ファイル構成

- [x] `lib/engineering-notes/drafts/types.ts` を追加する。
- [x] `lib/engineering-notes/drafts/schemas.ts` を追加する。
- [x] `lib/engineering-notes/drafts/normalize.ts` を追加する。
- [x] `tests/engineering-notes/drafts.test.ts` を追加する。

### 5.2 入力型

- [x] `kind: "development-log" | "architecture-decision"` を判別キーにする。
- [x] Development Log入力型を基本設計のJSON案に合わせて定義する。
- [x] ADR入力型を基本設計のJSON案に合わせて定義する。
- [x] `status`、`visibility`、`_status` を入力型へ含めない。
- [x] relationshipはDB IDではなくslugまたはADR IDで受け取る。
- [x] Payloadの生成型と入力型を分離する。

### 5.3 schema検証

- [x] Zod schemaで必須項目を検証する。
- [x] 文字列をtrimし、空文字を拒否する。
- [x] `logDate` と `decidedAt` をISO 8601として検証する。
- [x] ADRの `options` を最低1件必須にする。
- [x] `decisionStatus` を許可値へ限定する。
- [x] 配列の空文字と重複を正規化または拒否する。
- [x] slugの文字種を検証する。
- [x] ADR IDの形式を検証する。
- [x] ファイルサイズ、文字数、配列件数の上限を実装する。
- [x] 未知のフィールドを拒否する。

### 5.4 テスト

- [x] Development Logの正常入力を受理する。
- [x] ADRの正常入力を受理する。
- [x] 必須項目不足を拒否する。
- [x] 不正な日付を拒否する。
- [x] 空のADR `options` を拒否する。
- [x] `status` や `visibility` を含む入力を拒否する。
- [x] 未知のフィールドを拒否する。
- [x] trim、配列重複除去、上限を確認する。

想定確認コマンド:

```bash
npm run test:engineering-notes
npm run typecheck
npm run lint
```

完了条件:

- 2種類のJSONを型安全に判別・検証できる。
- PayloadやDBへ接続せず入力エラーを検出できる。
- 公開状態を入力ファイルから指定できない。

## 6. Phase 3: 秘密情報・重複・relationshipの事前検証

### 6.1 秘密情報検査

- [x] `lib/engineering-notes/drafts/sensitiveContent.ts` を追加する。
- [x] オブジェクト内の全文字列を検査対象にする。
- [x] password、secret、token、API key候補を検出する。
- [x] DB接続文字列、`.env` 形式、秘密鍵形式を検出する。
- [x] 長大なログ、stack trace、コード全文の候補を検出する。
- [x] 検出結果へ本文を含めず、フィールドパスと理由だけを返す。
- [x] 即時拒否と警告を区別する。

### 6.2 重複検査

- [x] `lib/engineering-notes/drafts/duplicates.ts` を追加する。
- [x] Development Log slugの完全一致を検索する。
- [x] ADR slugの完全一致を検索する。
- [x] ADR `decisionId` の完全一致を検索する。
- [x] 重複時に既存Document ID、slug、ADR IDだけを返す。
- [x] create-onlyとし、更新・upsertを実装しない。

### 6.3 relationship解決

- [x] `lib/engineering-notes/drafts/relationships.ts` を追加する。
- [x] Work slugをDocument IDへ解決する。
- [x] Development Log slugをDocument IDへ解決する。
- [x] ADR IDをDocument IDへ解決する。
- [x] `supersedesDecisionId` をADR Document IDへ解決する。
- [x] 0件を警告、複数件をデータ不整合エラーにする。
- [x] relationship未指定を正常として扱う。
- [x] 外部プロジェクトに対応するWorkがなくても登録可能にする。

### 6.4 テスト

- [x] 秘密情報候補を検出できる。
- [x] 検査結果に秘密値そのものが含まれない。
- [x] 重複slugとADR IDを拒否できる。
- [x] 各relationshipを識別子から解決できる。
- [x] relationship 0件、1件、複数件を確認する。
- [x] DBエラーを安全なエラーへ変換できる。

完了条件:

- 書き込み前に秘密情報、重複、relationshipを検証できる。
- 検証結果へ接続情報、SQL、stack trace、本文全体が含まれない。
- 既存Documentを自動更新しない。

## 7. Phase 4: dry-run CLI

### 7.1 CLI基盤

- [x] `scripts/importEngineeringNoteDraft.mts` を追加する。
- [x] `package.json` に `import:engineering-note` scriptを追加する。
- [x] `--file` の絶対パスまたは現在位置から解決した明示パスだけを受け取る。
- [x] 対象ファイルが通常ファイルであることを確認する。
- [x] JSONを読み込み、Phase 2のschemaで検証する。
- [x] Phase 3の秘密情報、重複、relationship検証を呼び出す。
- [x] `--apply` がない場合は必ずdry-runで終了する。
- [x] 未知のCLI optionを拒否する。

Phase 4のdry-run関数は `--apply` を受け付けず、Phase 5のCLI入口が明示的にcreate-only処理へ分岐する。

### 7.2 dry-run出力

出力例:

```text
mode: dry-run
kind: development-log
project: go-todo
slug: go-todo-add-postgresql-repository
duplicate: none
relationships: 1 resolved, 1 warning
sensitive-content: none
result: ready to create as draft + private
```

- [x] kind、project、slugまたはADR IDを表示する。
- [x] 固定される公開状態を表示する。
- [x] relationshipの解決件数と警告を表示する。
- [x] 秘密情報検査の結果を表示する。
- [x] 本文、環境変数、DB接続情報を表示しない。
- [x] dry-runでは `payload.create` を呼ばない。

### 7.3 CLIテスト

- [x] `--file` 不足を拒否する。
- [x] 存在しないファイルを拒否する。
- [x] JSON解析エラーを安全に表示する。
- [x] schema違反をフィールド単位で表示する。
- [x] dry-runでDBへ書き込まれないことを確認する。
- [x] 秘密情報候補を含む入力を拒否する。

想定確認コマンド:

```bash
npm run import:engineering-note -- --file /absolute/path/to/draft.json
npm run test:engineering-notes
npm run typecheck
npm run lint
```

完了条件:

- JSONを指定して安全にdry-runできる。
- `--apply` なしではPayloadへ変更が発生しない。
- 利用者が登録前に識別子、警告、固定状態を確認できる。

## 8. Phase 5: Payload下書き登録

### 8.1 登録処理

- [x] `lib/engineering-notes/drafts/createDraft.ts` を追加する。
- [x] `kind` に応じて対象Collectionを固定する。
- [x] Development Log入力をPayloadのfield構造へ変換する。
- [x] ADR入力をPayloadのfield構造へ変換する。
- [x] `nextActions`、`tags`、`options`、pros/consなどの配列をPayload形式へ変換する。
- [x] 解決済みrelationshipだけをDocument IDとして設定する。
- [x] `status: draft` と `visibility: private` をコード側で固定する。
- [x] Payloadのdraft optionをコード側で固定する。
- [x] publish、delete、update、upsert処理を実装しない。
- [x] Payload/DB終了処理を `finally` で実行する。

### 8.2 `--apply` の安全境界

- [x] `--apply` がある場合だけ登録処理を呼び出す。
- [x] schema、秘密情報、重複検証のいずれかが失敗したら登録しない。
- [x] 未解決relationshipを許可する条件をPhase 0の決定どおり実装する。
- [x] 作成直前にもCollection、kind、slugまたはADR ID、固定状態を表示する。
- [x] 成功時はDocument ID、kind、slugまたはADR IDだけを表示する。
- [x] 失敗時は接続文字列、SQL、stack traceを表示しない。
- [x] 同じファイルの再実行は重複エラーとなり、2件目を作成しない。

### 8.3 実DB検証

- [x] Development Logを `--apply` で1件作成する。
- [x] ADRを `--apply` で1件作成する。
- [ ] Payload管理画面から両方を確認する。
- [x] `status: draft`、`visibility: private`、Payload draftであることを確認する。
- [x] 公開サイトから取得できないことを確認する。
- [x] 未認証Payload APIから取得できないことを確認する。
- [x] 読み取り専用MCPから取得できないことを確認する。
- [ ] 管理画面から公開後、visibilityに応じて取得できることを確認する。

想定確認コマンド:

```bash
docker compose up -d postgres
npm run migrate:status
npm run import:engineering-note -- --file /absolute/path/to/draft.json
npm run import:engineering-note -- --file /absolute/path/to/draft.json --apply
npm run verify:engineering-notes
npm run verify:mcp
```

完了条件:

- 2種類の記録を必ずPayload draftかつprivateとして作成できる。
- 作成直後の記録が公開サイト、未認証API、読み取り専用MCPへ漏れない。
- 既存記録を更新・削除・公開する経路が存在しない。

## 9. Phase 6: 他プロジェクトからの受け入れ確認

### 9.1 対象プロジェクト

性質の異なる2プロジェクト以上で確認する。

- [x] `my_profile` 自身の作業
- [x] Goなど別言語のプロジェクト
- [x] PayloadまたはNext.jsを使う別プロジェクト

### 9.2 受け入れシナリオ

- [x] 実装完了からDevelopment Log JSONを作成する。
- [x] エラー調査から問題・原因・解決を持つDevelopment Log JSONを作成する。
- [x] 技術選定から複数optionsを持つADR JSONを作成する。
- [x] Development LogとADRを相互に関連付ける。
- [x] 対応するWorkがない記録を作成する。
- [x] 重複したslugまたはADR IDを意図的に指定して拒否を確認する。
- [x] 秘密情報候補を含むfixtureで拒否を確認する。

### 9.3 公開後の検索確認

- [x] Payload管理画面で内容をレビューする。
- [x] 1件をprivate publishedとして公開する。
- [x] 1件をpublic publishedとして公開する。
- [x] private記録が公開ページに表示されないことを確認する。
- [x] public記録がEngineering Notesへ表示されることを確認する。
- [x] MCPの `search_development_logs` でproject絞り込みを確認する。
- [x] MCPの `search_architecture_decisions` でADRを確認する。
- [x] MCPの `get_project_history` で両方を時系列取得する。
- [x] 回答に根拠となるslugまたはADR IDが含まれることを確認する。

完了条件:

- 他プロジェクトでも同じJSON形式とCLIを利用できる。
- 言語やframeworkに依存せず記録を作成できる。
- 作成、レビュー、公開、MCP検索まで一連の運用を再現できる。

## 10. Phase 7: ドキュメントと運用整備

- [ ] `README.md` に下書き登録機能の概要とリンクを追加する。
- [ ] `docs/external-project-engineering-notes-prompts.md` を完成させる。
- [ ] Development LogとADRのJSONサンプルを用意する。
- [ ] dry-runと `--apply` の実行例を追加する。
- [ ] エラーコードと対処方法を追加する。
- [ ] 下書きファイルをGit管理する場合の注意を追加する。
- [ ] 秘密情報を入力しない注意を目立つ位置へ追加する。
- [ ] Payload管理画面でのレビュー・公開手順を追加する。
- [ ] 既存のMCP接続ガイドから本機能の文書へリンクするか決定する。

最終確認コマンド:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:engineering-notes
npm run test:mcp
npm run build
```

完了条件:

- 初めて利用する人が文書だけでdry-run、登録、レビューを実行できる。
- 全テスト、typecheck、lint、buildが成功する。
- 既存の読み取り専用MCPと公開ページに回帰がない。

## 11. Phase 8: 書き込みMCPの検討（任意）

このPhaseは、ローカル登録スクリプトを複数プロジェクトで継続利用し、MCP化する明確な利点が確認できた場合だけ実施する。

### 11.1 実装判断

- [ ] CLI利用回数と手作業の負担を確認する。
- [ ] MCP化が単なるCLI呼び出しより有用か評価する。
- [ ] 読み取りMCPと別サーバーにするか、別Tool allowlistにするか決定する。
- [ ] Tool呼び出しごとの承認方法を決定する。
- [ ] 監査ログと失敗時の追跡方法を決定する。

### 11.2 Tool候補

```text
validate_engineering_note_draft
create_development_log_draft
create_architecture_decision_draft
```

- [ ] validate Toolは副作用なしでCLIのdry-runと同じ結果を返す。
- [ ] create Toolは `readOnlyHint: false` とする。
- [ ] create Toolを自動承認の対象にしない。
- [ ] `draft + private` をMCPサーバー側で固定する。
- [ ] publish、delete、update、upsert Toolを提供しない。
- [ ] 入力・出力schemaをCLIと共有する。
- [ ] 秘密情報、重複、relationship検証をCLIと共有する。

### 11.3 受け入れ確認

- [ ] Codexからvalidate Toolを実行できる。
- [ ] 利用者の承認後だけcreate Toolが実行される。
- [ ] 作成結果がPayload draftかつprivateになる。
- [ ] draftが読み取り専用MCPと公開ページへ漏れない。
- [ ] Tool応答へDB接続情報、SQL、stack trace、本文全体が含まれない。
- [ ] 現在の読み取り専用6 Toolの動作が変わらない。

完了条件:

- 書き込み権限が読み取りMCPから分離されている。
- MCPから公開・更新・削除できない。
- CLIとMCPで同じ検証・登録処理を利用している。

## 12. マイルストーン

| マイルストーン           | 完了Phase  | 到達状態                                            |
| ------------------------ | ---------- | --------------------------------------------------- |
| M1: 運用確立             | Phase 0〜1 | Codexの下書きを管理画面へ安全に手動登録できる       |
| M2: 入力標準化           | Phase 2〜3 | JSONを機械検証し、登録前の危険を検出できる          |
| M3: ローカル登録         | Phase 4〜5 | dry-run後にPayload draftを作成できる                |
| M4: 複数プロジェクト運用 | Phase 6〜7 | 他プロジェクトから作成・公開・MCP検索まで再現できる |
| M5: MCP作成支援          | Phase 8    | 必要な場合だけ承認付き下書き作成Toolを利用できる    |

初回の実装対象はM3までとする。M4は実プロジェクトでの受け入れ、M5は運用実績に基づく任意拡張として扱う。
