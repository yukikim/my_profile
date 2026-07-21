# Engineering Notes 外部プロジェクト下書き作成・登録ガイド

## 1. この文書でできること

別リポジトリの実装結果、障害調査、技術選定から、`my_profile` のDevelopment LogまたはArchitecture Decision Record（ADR）を作成する。初めて利用する人が、次の一連の操作を文書だけで再現できることを目的とする。

1. Codexへ根拠を渡してJSON下書きを作る。
2. 副作用のないdry-runで入力内容を検証する。
3. `--apply`を明示してPayload draftへ1件登録する。
4. Payload管理画面で人がレビューする。
5. privateまたはpublicとして公開し、公開画面と読み取り専用MCPを確認する。

データ形式と安全境界の詳細は[`external-project-engineering-notes-design.md`](./external-project-engineering-notes-design.md)、読み取りMCPの接続方法は[`development-journal-mcp-codex.md`](./development-journal-mcp-codex.md)を参照する。

> [!CAUTION]
> API key、token、password、cookie、秘密鍵、`.env`の値、`DATABASE_URI`、顧客情報、非公開URLをJSONへ入力しない。CLIの検出は補助機能であり、安全性を保証するものではない。値を見つけた場合は伏せ字にして保存するのではなく、値そのものをJSONから削除する。

## 2. 前提条件

登録コマンドは、対象プロジェクトではなく`my_profile`のプロジェクトrootで実行する。

```bash
cp .env.example .env
npm install
docker compose up -d postgres
npm run migrate
```

初回だけ管理者やサンプルデータが必要な場合は、内容と開発用初期値を確認してから`npm run seed`を実行する。CLIは`my_profile`の既存`.env`を読み込むため、対象プロジェクトへDB接続情報やPayload secretをコピーしない。

## 3. Development LogとADRの選び方

| 残したい内容                       | 作成する記録                  |
| ---------------------------------- | ----------------------------- |
| 実装、修正、調査、検証の結果       | Development Log               |
| 問題・原因・解決方法               | Development Log               |
| 複数候補を比較した長期的な技術判断 | ADR                           |
| 実装結果と、その背景にある技術判断 | Development LogとADRを1件ずつ |

Development Logは「何を実施し、どう確認したか」、ADRは「なぜその方針を選んだか」を扱う。単なる作業結果に、根拠のない比較候補を足してADRを作らない。

## 4. Codexへ渡す共通情報

```text
project（既存記録と同じ固定名）:
プロジェクト表示名:
参照するrepository名またはpath:
作業日または判断日（ISO 8601、timezone付き）:
対象機能・Issue・ファイル:

確認できた事実:
-

根拠:
- commit / diff:
- test / lint / build結果:
- error messageの必要最小限の部分:
- 仕様書またはIssue:

relationship候補:
- Work slug:
- Development Log slug:
- ADR ID:

未確認事項:
-
```

repositoryの絶対pathは根拠を読むためだけに使い、保存するJSON本文へ含めない。`project`は新規ならlowercase-kebab-caseを推奨するが、`my_profile`のような既存表記がある場合は検索互換性を優先して既存値を使う。

## 5. Codex依頼テンプレート

### 5.1 実装完了のDevelopment Log

```text
以下の入力情報と、実際に確認できるrepositoryの差分・テスト結果だけを使い、
my_profileのEngineering Notes登録CLIへ渡すDevelopment Log JSONを1件作成してください。

[共通情報を貼る]

規則:
- kindは"development-log"とする。
- title、slug、logDate、project、summaryを必ず含める。
- 実装内容はimplementation、再利用できる知識はlessonsLearnedへ分ける。
- 残作業がある場合だけnextActionsへ入れる。
- slugはプロジェクト名を含むlowercase-kebab-caseにする。
- 確認できない任意項目は推測せず省略する。
- status、visibility、_status、DB IDは出力しない。
- relationshipはWork slugまたはADR IDで指定する。
- 秘密情報、個人情報、絶対path、長大なログ、ソースコード全文を含めない。
- 返答はCLIへそのまま保存できるJSONコードブロック1つだけにする。
```

### 5.2 障害調査のDevelopment Log

```text
以下の入力情報と、実際のエラー・調査結果・修正差分だけを使い、
my_profileのEngineering Notes登録CLIへ渡すDevelopment Log JSONを1件作成してください。

[共通情報を貼る]

規則:
- kindは"development-log"とする。
- title、slug、logDate、project、summaryを必ず含める。
- problemには観測した現象、causeには確認した根本原因、resolutionには対処と確認方法を書く。
- error messageは原因の識別に必要な短い要約だけにする。
- 原因が未確認なら推測で埋めず、causeを省略して確認作業をnextActionsへ入れる。
- status、visibility、_status、DB IDは出力しない。
- 秘密情報、個人情報、絶対path、長大なログ、stack trace全文を含めない。
- 返答はCLIへそのまま保存できるJSONコードブロック1つだけにする。
```

### 5.3 技術選定のADR

```text
以下の入力情報と、実際に比較した候補・判断根拠だけを使い、
my_profileのEngineering Notes登録CLIへ渡すADR JSONを1件作成してください。

[共通情報を貼る]

規則:
- kindは"architecture-decision"とする。
- decisionId、title、slug、project、decisionStatus、context、options、decision、rationaleを必ず含める。
- decisionIdは"<PROJECT>-ADR-<4桁連番>"、slugはプロジェクト名を含むlowercase-kebab-caseにする。
- decisionStatusはproposed、accepted、supersededのいずれかにする。
- optionsには実際に比較した候補だけを入れ、prosとconsを分ける。
- 根拠にない候補、利点、欠点、採用理由を推測で補わない。
- status、visibility、_status、DB IDは出力しない。
- relationshipはWork slug、Development Log slug、ADR IDで指定する。
- 秘密情報、個人情報、絶対path、長大なログ、ソースコード全文を含めない。
- 返答はCLIへそのまま保存できるJSONコードブロック1つだけにする。
```

## 6. JSONサンプル

検証済みサンプルは次に置く。

- [Development Log JSON](./examples/engineering-notes/development-log.json)
- [ADR JSON](./examples/engineering-notes/architecture-decision.json)

JSONは1ファイル1Documentとする。入力schemaに`status`、`visibility`、`_status`が存在しないのは、登録処理が必ず`draft + private + Payload draft`へ固定するためである。

サンプルを直接`--apply`すると例示データがDBへ作成される。通常はコピーを作り、内容と識別子を実際の作業へ置き換えてから使う。

## 7. dry-run

最初は`--apply`を付けずに実行する。この段階ではPayloadへ作成しない。

```bash
npm run import:engineering-note -- --file /absolute/path/to/draft.json
```

成功例:

```text
mode: dry-run
kind: development-log
project: example-go-api
slug: example-go-api-add-postgresql-repository
duplicate: none
relationships: 0 resolved, 0 warning
sensitive-content: none
status: draft
visibility: private
payload-draft: true
result: ready to create as draft + private
```

次をレビューする。

- `kind`、`project`、`slug`、ADRの場合は`decision-id`が意図どおりか。
- `duplicate: none`か。
- relationship warningが意図した欠落か、識別子の誤記か。
- sensitive warningがないか。
- 固定状態が`draft / private / true`か。

## 8. `--apply`による登録

dry-run結果と元JSONを人が確認した後だけ、同じファイルへ`--apply`を付ける。

```bash
npm run import:engineering-note -- --file /absolute/path/to/draft.json --apply
```

作成前に`action: create one draft`を含む事前表示が出て、成功後は次の最小情報だけが表示される。

```text
result: created
document-id: 123
kind: development-log
slug: example-go-api-add-postgresql-repository
```

CLIはcreate-onlyである。同じslugまたはADR IDで再実行しても更新や2件目の作成はせず、重複エラーで停止する。CLIからpublish、update、deleteはできない。

## 9. エラーコードと対処

| 表示されるコード             | 主な原因                                      | 対処                                                                      |
| ---------------------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| `INVALID_ARGUMENTS`          | 未知option、位置引数、option重複              | `--file`と任意の`--apply`だけに直す                                       |
| `MISSING_FILE`               | `--file`またはその値がない                    | JSONファイルpathを指定する                                                |
| `FILE_NOT_FOUND`             | pathのファイルが存在しない                    | 絶対pathまたは現在の作業directoryを確認する                               |
| `FILE_NOT_REGULAR`           | directoryなど通常ファイル以外                 | 1件のJSON通常ファイルを指定する                                           |
| `FILE_UNREADABLE`            | ファイルを読み取れない                        | 権限と文字コードを確認する                                                |
| `INVALID_JSON`               | JSON構文が壊れている                          | comma、quote、braceを修正する                                             |
| `INVALID_INPUT`              | 必須項目、形式、上限、未知fieldの違反         | 出力された`field:`のpathとcodeを確認する                                  |
| `SENSITIVE_CONTENT`          | 秘密情報候補を検出                            | 値をJSONから削除し、必要なら認証情報をローテーションする                  |
| `DUPLICATE_ENGINEERING_NOTE` | slugまたはADR IDが既存Documentと衝突          | `existing:`を確認し、別記録なら新しい識別子にする。更新目的で再実行しない |
| `RELATION_DATA_INTEGRITY`    | 1識別子に複数Documentが一致                   | 管理画面で重複データを整理してから再実行する                              |
| `DATABASE_UNAVAILABLE`       | PostgreSQL停止、migration未適用、`.env`不整合 | `docker compose ps`、`npm run migrate:status`、`.env`を確認する           |
| `CREATE_FAILED`              | Payload createが失敗                          | schemaとmigrationを確認し、dry-runからやり直す                            |
| `INTERNAL_ERROR`             | 未分類の内部エラー                            | 秘密値を貼らず、再現コマンドと安全なエラーコードだけで調査する            |

`RELATION_NOT_FOUND`は通常、登録を止めないwarningとして`relationship-warning:`に表示される。外部プロジェクトに対応するWorkがない場合は空配列でよい。必要な関連先のはずなら、slugまたはADR IDを修正する。

すべての失敗は`result: not created`で終了する。エラー時に部分的なDocumentは作成しない。

## 10. 下書きファイルとGit

一時的な下書きは、可能ならrepository外の一時directoryに置く。Git管理する場合は、チームで再利用する安全なサンプルや公開可能な記録に限定する。

登録前とcommit前に確認する。

```bash
git status --short
git diff --cached
```

- `.gitignore`だけを秘密情報対策にしない。
- 実際のtokenやpasswordを伏せ字へ置き換えたファイルも、不要ならcommitしない。
- ローカル固有の絶対path、個人名、メールアドレス、内部URLを除く。
- 長大なログ、stack trace、ソースコード全文を記録へ貼らない。
- 秘密値をcommitした場合は、単にcommitを消すだけでなく認証情報をローテーションする。

このリポジトリの`docs/examples/engineering-notes/`は、実在の秘密情報を含まない学習用サンプルだけを置く。

## 11. Payload管理画面でレビュー・公開する

1. `npm run dev`でサイトを起動し、`http://localhost:3000/admin`へログインする。
2. `Development Logs`または`Architecture Decisions`から、CLIが表示したslugまたはADR IDを探す。
3. 元のcommit、diff、テスト結果と各fieldを照合する。
4. relationship、公開可否、`publishedAt`を確認する。
5. レビュー中はcustom `Status: Draft`、`Visibility: Private`、Payload上のDraftを維持する。
6. private公開では`Status: Published`、`Visibility: Private`にして「変更内容を公開」を実行する。
7. Web公開では`Status: Published`、`Visibility: Public`にして「変更内容を公開」を実行する。

`decisionStatus: accepted`は設計判断の状態であり、コンテンツの公開状態ではない。accepted ADRでもレビュー前はDraftのままにする。

公開後の期待値:

| 状態              | Engineering Notes画面    | 信頼済み読み取りMCP |
| ----------------- | ------------------------ | ------------------- |
| public published  | 表示する                 | 取得できる          |
| private published | 表示しない。直接URLも404 | 取得できる          |
| draft             | 表示しない               | 取得しない          |

## 12. 公開後の確認

公開ページと実DB境界:

```bash
npm run verify:engineering-notes
```

読み取り専用MCP:

```bash
npm run verify:mcp
codex mcp list
```

Codexへ質問する場合は、`project`で絞り込み、回答へ根拠となるDevelopment Log slugまたはADR IDを含めるよう依頼する。書き込みCLIと`engineering_notes` MCPは別の境界であり、既存MCPには作成・更新・公開・削除Toolを追加しない。

## 13. 最終チェックリスト

- [ ] 根拠とJSONの内容が一致する。
- [ ] 保存禁止情報と絶対pathがない。
- [ ] `project`表記、slug、ADR IDが命名規則どおりである。
- [ ] `status`、`visibility`、`_status`をJSONへ入れていない。
- [ ] dry-runが成功し、warningを確認した。
- [ ] `--apply`前に元JSONを人が読んだ。
- [ ] 管理画面でPayload draftとしてレビューした。
- [ ] 公開範囲を人が決定した。
- [ ] public/private/draftの公開境界を確認した。
- [ ] MCP回答で根拠slugまたはADR IDを確認した。
