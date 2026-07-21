# 外部プロジェクト開発記録 Phase 1 試行記録

## 1. 試行条件

- 実施日: 2026-07-21
- 登録先: ローカルの `my_profile` Payload Admin
- 対象プロジェクト: `my_profile`、`go-todo`
- 登録状態: `status: draft`、`visibility: private`、Payload Draft
- 公開操作: 実施しない
- relationship: DB IDを直接入力せず、管理画面の候補から選択する

事実確認には、対象repositoryのcommit、diff、テスト結果、既存タスク文書を使った。`.env` の値、認証情報、利用者固有の絶対pathは保存本文へ含めていない。

## 2. Development Log: my_profile

| 項目             | 登録内容                                                                                                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| title            | Engineering Notesの公開一覧と詳細画面を実装                                                                                                                                   |
| slug             | `my-profile-add-engineering-notes-public-pages`                                                                                                                               |
| logDate          | `2026-07-21`                                                                                                                                                                  |
| project          | `my_profile`                                                                                                                                                                  |
| summary          | 公開可能なDevelopment LogとADRを一覧・詳細画面へ表示し、非公開または下書きの記録を除外する経路を実装した。                                                                    |
| implementation   | Engineering Notesの一覧画面、Development Log詳細画面、ADR詳細画面、表示コンポーネント、公開用取得処理を追加した。アクセス制御と公開条件をテストし、検証スクリプトも更新した。 |
| problem          | Collectionへ保存した記録をWebサイトで閲覧する公開画面と、公開条件をまとめて判定する取得経路が存在しなかった。                                                                 |
| cause            | Phase 5まではPayload Collection、検索処理、読み取り専用MCPまでを対象とし、Web公開画面は後続Phaseとして分離していた。                                                          |
| resolution       | 公開用mapperと一覧・詳細routeを追加し、公開条件の単体テストと実DB検証を実施した。commit `cf1d58f` の変更とテスト追加を根拠として確認した。                                    |
| lessonsLearned   | 公開判定を画面ごとに重複させず取得層へ集約すると、一覧、詳細、APIで公開条件のずれを防ぎやすい。                                                                               |
| nextActions      | 外部プロジェクトの記録作成手順を試し、入力項目とレビュー手順を固める。                                                                                                        |
| relatedWorks     | `starter-showcase` を管理画面で選択できることを確認する。                                                                                                                     |
| relatedDecisions | 未設定。今回のWeb公開ADRはrepository内Markdownであり、Payload Documentとの同一性を確認できないため推測で関連付けない。                                                        |
| tags             | `nextjs`, `payload`, `engineering-notes`, `access-control`                                                                                                                    |

根拠:

- commit `cf1d58f`（2026-07-21）
- `app/(frontend)/engineering-notes/page.tsx`
- `app/(frontend)/engineering-notes/logs/[slug]/page.tsx`
- `app/(frontend)/engineering-notes/decisions/[slug]/page.tsx`
- `lib/engineering-notes/public.ts`
- `tests/engineering-notes/public.test.ts`

## 3. Development Log: go-todo

| 項目             | 登録内容                                                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| title            | Todo APIを役割別のレイヤー構成へ整理                                                                                                                                                                          |
| slug             | `go-todo-split-api-layers`                                                                                                                                                                                    |
| logDate          | `2026-07-03`                                                                                                                                                                                                  |
| project          | `go-todo`                                                                                                                                                                                                     |
| summary          | Todo APIの動作を維持しながら、起動、HTTP、処理ルール、永続化、モデルを役割別packageへ分割した。                                                                                                               |
| implementation   | `cmd/api` をcomposition rootとし、`internal/handler`、`internal/service`、`internal/repository`、`internal/model`、`internal/db`へ既存処理を移した。READMEへrequestからPostgreSQLまでの呼び出し順を記録した。 |
| problem          | 起動処理、HTTP処理、入力規則、PostgreSQL操作がroot直下の複数ファイルへ置かれ、各責務と依存方向を学習時に追いにくかった。                                                                                      |
| cause            | 機能追加を優先してroot package内で分割しており、package境界として責務を表していなかった。                                                                                                                     |
| resolution       | `handler → service → repository → PostgreSQL` の依存方向に整理し、commit `fcbf7f89` の差分と既存テストの配置変更で確認した。                                                                                  |
| lessonsLearned   | package名を技術名ではなく責務に合わせると、HTTPやDBを差し替えるときの影響範囲と、テスト対象の境界が分かりやすくなる。                                                                                         |
| nextActions      | serviceとhandlerのテスト範囲を継続して拡充する。                                                                                                                                                              |
| relatedWorks     | 未設定。`go-todo`に対応するWork Documentは確認できない。                                                                                                                                                      |
| relatedDecisions | `GO-TODO-ADR-0001` を管理画面で関連付ける。                                                                                                                                                                   |
| tags             | `go`, `layered-architecture`, `repository`, `postgresql`                                                                                                                                                      |

根拠:

- commit `fcbf7f89`（2026-07-03）
- `cmd/api/main.go`
- `internal/handler/router.go`
- `internal/service/todo_service.go`
- `internal/repository/todo_repository.go`
- `README.md` のレイヤー分割説明

## 4. ADR: go-todo

| 項目                 | 登録内容                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| decisionId           | `GO-TODO-ADR-0001`                                                                                                                    |
| title                | Todoの永続化先にPostgreSQLを採用                                                                                                      |
| slug                 | `go-todo-choose-postgresql`                                                                                                           |
| project              | `go-todo`                                                                                                                             |
| decisionStatus       | `accepted`                                                                                                                            |
| context              | 当初はTodoをプロセス内のmapへ保持していたため、再起動後もデータを保持でき、repository層の学習にも利用できる永続化先が必要になった。   |
| option 1             | PostgreSQL: SQLとDB接続、repository実装を実環境に近い構成で学習できる。一方でローカルDB起動とschema管理が必要になる。                 |
| option 2             | メモリ上のmapを継続: 構築が単純でHTTP処理の学習に集中できる。一方で再起動またはプロセス障害でデータが消え、永続化とDB境界を学べない。 |
| decision             | TodoRepositoryの永続化先としてPostgreSQLを採用する。                                                                                  |
| rationale            | 再起動をまたぐ保存要件を満たし、SQL、DB接続、repository層を同じ学習プロジェクトで確認できるため。                                     |
| positiveConsequences | Todoを再起動後も保持できる。永続化処理をrepositoryへ分離できる。                                                                      |
| negativeConsequences | 開発前にPostgreSQLを起動する必要がある。schema作成と接続エラーを扱う必要がある。                                                      |
| decidedAt            | `2026-06-30`                                                                                                                          |
| supersedes           | 未設定。置き換え対象の既存ADRはない。                                                                                                 |
| relatedWorks         | 未設定。`go-todo`に対応するWork Documentは確認できない。                                                                              |
| relatedLogs          | `go-todo-split-api-layers` を管理画面で関連付ける。                                                                                   |
| tags                 | `go`, `database`, `postgresql`, `repository`, `persistence`                                                                           |

根拠:

- 初期READMEの「DBを使わず、メモリ上のmapで管理する」という構成
- commit `89f4fdd0`（2026-06-30、PostgreSQL保存の実装）
- `internal/db/db.go`
- `internal/repository/todo_repository.go`

## 5. 登録結果

本文や認証情報は記録せず、識別子と状態だけを記録する。

| 種別            | slug / decisionId                               | Document ID | draft | private | relationship                                           |
| --------------- | ----------------------------------------------- | ----------- | ----- | ------- | ------------------------------------------------------ |
| Development Log | `my-profile-add-engineering-notes-public-pages` | 5           | yes   | yes     | Work `スターター実績`                                  |
| Development Log | `go-todo-split-api-layers`                      | 6           | yes   | yes     | ADR `Todoの永続化先にPostgreSQLを採用`                 |
| ADR             | `GO-TODO-ADR-0001`                              | 5           | yes   | yes     | Development Log `Todo APIを役割別のレイヤー構成へ整理` |

## 6. 運用上の観察

### 入力項目の不足

- 根拠を保存する専用フィールドはない。Phase 1では `resolution` の末尾と本試行記録にcommitを残した。
- 外部プロジェクトのrepository名を構造化して保存するフィールドはない。初期方針どおり `project` を検索キーとして使用できるため、Phase 2でschema変更は行わない。

### 重複する項目

- ADRの `decisionStatus` とコンテンツの `status` は名前が似ているが、前者は判断の採用状態、後者は公開状態であり削除できない。
- 独自 `status: draft` とPayload Draftは二重に見えるが、公開判定が両方を要求するため、レビューでは両方を確認する必要がある。

### 分かりにくい表現

- relationshipの候補検索はslugやADR IDではなく、管理画面の `useAsTitle` に設定されたtitleで行う。`starter-showcase` では候補が出ず、「スターター実績」で選択できた。
- 配列の追加ボタンを連続操作すると、空の行を作りやすい。保存前に各 `Item` と `Label` の必須入力を見直す必要がある。
- `Published` は独自status、画面上部の「ステータス: ドラフト」はPayload Draftを表す。レビュー手順では日本語名だけでなく役割も併記する。

### relationship選択

- Work、Development Log、ADRのすべてを管理画面から選択できた。
- `go-todo`に対応するWorkは存在しないため、外部プロジェクト2件の `relatedWorks` は空のまま保存できた。
- `go-todo-split-api-layers` と `GO-TODO-ADR-0001` は、両Document作成後に相互relationshipを設定できた。

### 公開境界の確認

- 未認証REST APIで3件をslugまたはADR ID指定して検索し、すべて `totalDocs: 0` だった。新規下書きは公開経路へ出ていない。
- 既存の `verify:engineering-notes` と `verify:mcp` は、DB上の既存 `plan-engineering-notes-pages` がPublished扱いになっているため失敗した。今回の3件ではなく、現在のseed定義と既存DBデータの不一致である。
- 既存MCP自体は `project: my_profile` の検索結果を返せることを確認した。公開前レビューでは、テストfixtureの再seedまたは既存Documentの状態整理を別作業として行う。

### Phase 2のJSON化前に修正する事項

- JSONではrelationshipをslugまたはADR IDで受け、登録側がtitle検索へ依存せずDocument IDへ解決する。
- 配列の空要素と重複をschema検証で拒否し、手動操作で発生した空行を機械的に検出する。
- 生成入力へ `status`、`visibility`、`_status` を含めず、登録処理で安全な3状態を固定する。
- 根拠は本文へ大量に転記せず、下書き作成時のレビュー情報として扱う。

## 7. レビュー結果

- [x] 3件をcommit、diff、対象ファイルと照合した。
- [x] API key、接続情報、個人情報、利用者固有の絶対pathを本文へ保存していない。
- [x] 未確認のrelationshipを推測で設定していない。
- [x] slug 2件とADR ID 1件は登録時のunique検証を通過した。
- [x] 公開可否は人が判断するまで `private` とする基準を維持した。
- [x] `status: draft`、`visibility: private`、Payload Draftを管理画面で確認した。
- [x] 既存MCPで `project` 検索が実行できることを確認した。
- [x] 今回の3件は公開せず、未認証APIから取得できないことを確認した。
