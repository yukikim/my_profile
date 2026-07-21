# 外部プロジェクト開発記録 基本設計

## 1. 文書の目的

本書は、`my_profile` または別プロジェクトの作業結果からDevelopment LogとArchitecture Decision Record（ADR）の下書きを作成し、`my_profile` のPayload CMSへ登録するためのデータ形式、処理境界、検証、命名、セキュリティの基本設計を定義する。

作業の目的、段階的な進め方、対象範囲は [`external-project-engineering-notes-overview.md`](./external-project-engineering-notes-overview.md) を参照する。

## 2. 現在のシステムとの関係

既存実装は次の役割を持つ。

| 要素                    | 現在の役割                   | 本設計での扱い                         |
| ----------------------- | ---------------------------- | -------------------------------------- |
| `DevelopmentLogs`       | 実装・問題解決の記録         | 既存Collectionをそのまま正本として使う |
| `ArchitectureDecisions` | 設計判断とトレードオフの記録 | 既存Collectionをそのまま正本として使う |
| Payload Admin           | 作成、編集、レビュー、公開   | 初期運用と最終公開に使う               |
| PostgreSQL              | Engineering Notesの保存      | 外部プロジェクトから直接接続しない     |
| 読み取り専用MCP         | published記録の検索          | 書き込み機能を追加せず維持する         |
| Engineering Notes画面   | public記録の表示             | 公開後の表示先として使う               |

Collection schemaの変更は初期段階では行わない。既存の `project`、`status`、`visibility`、Payload draftsを利用する。

## 3. システム構成

### 3.1 初期構成

```text
対象プロジェクト
    │
    │ 作業差分、エラー、判断内容
    ▼
Codex
    │
    │ 人が確認できる構造化下書き
    ▼
利用者
    │
    │ Payload Adminから手動登録
    ▼
my_profile / Payload CMS / PostgreSQL
```

初期構成では、CodexはPayloadへの書き込みを行わない。利用者が下書きを確認して管理画面へ登録する。

### 3.2 将来のローカル登録構成

```text
対象プロジェクト
    │
    ▼
CodexがJSON下書きを生成
    │
    ▼
my_profileのローカル登録スクリプト
    ├─ schema検証
    ├─ 禁止情報の検査
    ├─ slug / decisionId重複検査
    ├─ relationship解決
    └─ 登録内容の事前表示
          │
          ▼ 利用者が実行
Payload Local API
          │
          ▼
draft + private
```

登録スクリプトは `my_profile` 内だけで実行し、別プロジェクトへ `DATABASE_URI` や `PAYLOAD_SECRET` を配布しない。

## 4. 作成単位

1回の下書き作成は、次のいずれか1件を基本単位とする。

- Development Log 1件
- ADR 1件

1つの作業に両方が必要な場合も、別々の下書きとして作成してからrelationshipで関連付ける。これにより、実施記録と設計判断の責務を混在させない。

## 5. プロジェクト識別

### 5.1 `project` の値

`project` は、人が理解でき、MCP検索でも安定して使える固定名とする。

推奨形式:

```text
lowercase-kebab-case
```

例:

```text
my-profile
go-todo
go-todo2
payload-sample
```

既に登録済みの値がある場合は、表記を変更せず既存値へ合わせる。`my_profile` のような既存値と新しい命名規則が異なる場合、既存記録との検索互換性を優先する。

### 5.2 外部プロジェクトの識別情報

下書き生成時には、最低限次を入力情報として渡す。

- `project`: 保存に使う固定プロジェクト名
- プロジェクトの表示名
- repository pathまたはrepository名
- 作業日または判断日
- 対象範囲となるファイル、機能、Issueなど

repositoryの絶対パスは作成時の参考情報として利用してよいが、Payloadへ保存する本文には原則含めない。

## 6. 命名規則

### 6.1 Development Log slug

Collection全体で一意になるよう、プロジェクト識別子を含める。

```text
<project>-<action-or-topic>
```

例:

```text
go-todo-add-postgresql-repository
payload-sample-fix-migration-startup
my-profile-add-engineering-notes
```

### 6.2 ADR ID

複数プロジェクト間で衝突しないよう、プロジェクト識別子を接頭辞に含める。

```text
<PROJECT>-ADR-<4桁連番>
```

例:

```text
GO-TODO-ADR-0001
PAYLOAD-SAMPLE-ADR-0001
MY-PROFILE-ADR-0003
```

既存の `ADR-0001` 形式の記録は変更しない。新規に複数プロジェクトを扱う記録から名前空間付きIDを使用する。

### 6.3 ADR slug

```text
<project>-<decision-topic>
```

例:

```text
go-todo-choose-postgresql
payload-sample-use-local-payload-api
```

## 7. Development Log下書き設計

### 7.1 必須項目

| 項目      | 内容                       |
| --------- | -------------------------- |
| `title`   | 作業の結果が分かるタイトル |
| `slug`    | Collection全体で一意なslug |
| `logDate` | 実際に作業した日時         |
| `project` | 固定プロジェクト名         |
| `summary` | 作業全体の短い要約         |

### 7.2 任意項目

| 項目                 | 内容                       |
| -------------------- | -------------------------- |
| `implementation`     | 実装・変更した内容         |
| `problem`            | 発生した現象、エラー、制約 |
| `cause`              | 調査で確認した根本原因     |
| `resolution`         | 対処内容と確認方法         |
| `lessonsLearned`     | 再利用できる知識と再発防止 |
| `nextActions`        | 残作業と次の確認事項       |
| `relatedWorkSlugs`   | 関連付けたいWork slug      |
| `relatedDecisionIds` | 関連付けたいADR ID         |
| `tags`               | 検索用キーワード           |

### 7.3 下書きJSON例

JSON形式はPhase 2で確定する。初期案は次のとおりとする。

```json
{
  "kind": "development-log",
  "title": "Todoの保存先をPostgreSQLへ変更",
  "slug": "go-todo-add-postgresql-repository",
  "logDate": "2026-07-21T00:00:00.000Z",
  "project": "go-todo",
  "summary": "メモリ保存をPostgreSQL repositoryへ置き換えた。",
  "implementation": "repository interfaceとPostgreSQL実装を追加した。",
  "problem": "アプリ再起動後にTodoが消えていた。",
  "cause": "Todoをプロセスのメモリ上だけで保持していた。",
  "resolution": "PostgreSQLへ永続化し、再起動後も取得できることをテストした。",
  "lessonsLearned": "保存方式をinterfaceの背後へ分離すると差し替えやすい。",
  "nextActions": ["migrationの適用手順をREADMEへ追加する。"],
  "relatedWorkSlugs": [],
  "relatedDecisionIds": ["GO-TODO-ADR-0001"],
  "tags": ["go", "postgresql", "repository"]
}
```

`status`、`visibility`、Payloadの `_status` は生成側から指定させず、登録側で安全な初期値へ固定する。

## 8. ADR下書き設計

### 8.1 必須項目

| 項目             | 内容                                   |
| ---------------- | -------------------------------------- |
| `decisionId`     | Collection全体で一意なADR ID           |
| `title`          | 判断内容が分かるタイトル               |
| `slug`           | Collection全体で一意なslug             |
| `project`        | 固定プロジェクト名                     |
| `decisionStatus` | `proposed` / `accepted` / `superseded` |
| `context`        | 判断が必要になった背景と制約           |
| `options`        | 比較した候補。最低1件                  |
| `decision`       | 採用した方針                           |
| `rationale`      | 採用理由                               |

### 8.2 任意項目

| 項目                   | 内容                             |
| ---------------------- | -------------------------------- |
| `positiveConsequences` | 採用によって得られる利点         |
| `negativeConsequences` | 受け入れる制約や将来コスト       |
| `decidedAt`            | 判断日                           |
| `supersedesDecisionId` | 置き換えるADR ID                 |
| `relatedWorkSlugs`     | 関連付けたいWork slug            |
| `relatedLogSlugs`      | 関連付けたいDevelopment Log slug |
| `tags`                 | 検索用キーワード                 |

### 8.3 下書きJSON例

```json
{
  "kind": "architecture-decision",
  "decisionId": "GO-TODO-ADR-0001",
  "title": "Todoの保存先にPostgreSQLを採用する",
  "slug": "go-todo-choose-postgresql",
  "project": "go-todo",
  "decisionStatus": "accepted",
  "context": "再起動後もTodoを保持できる永続化方式が必要になった。",
  "options": [
    {
      "name": "PostgreSQL",
      "description": "repository層からPostgreSQLへ保存する。",
      "pros": ["SQLの学習と本番運用へつなげられる。"],
      "cons": ["ローカルDBとmigrationの管理が必要になる。"]
    },
    {
      "name": "SQLite",
      "description": "単一ファイルへ保存する。",
      "pros": ["ローカル構築が簡単。"],
      "cons": ["想定する本番構成との差が大きい。"]
    }
  ],
  "decision": "PostgreSQLを採用する。",
  "rationale": "学習対象と想定する本番構成を統一できるため。",
  "positiveConsequences": ["ローカルと本番で同じSQLを利用できる。"],
  "negativeConsequences": ["migration管理が必要になる。"],
  "decidedAt": "2026-07-21T00:00:00.000Z",
  "relatedWorkSlugs": [],
  "relatedLogSlugs": ["go-todo-add-postgresql-repository"],
  "tags": ["database", "postgresql"]
}
```

## 9. 登録時の固定値

自動登録を実装する場合、生成ファイルの値にかかわらず次を固定する。

| 項目              | 固定値    | 理由                         |
| ----------------- | --------- | ---------------------------- |
| `status`          | `draft`   | 内容確認前の公開を防ぐ       |
| `visibility`      | `private` | 公開範囲を人が判断する       |
| Payload `_status` | `draft`   | 未確認データを公開版にしない |

自動登録処理はpublish操作を提供しない。公開はPayload管理画面で認証済み利用者が行う。

## 10. relationship解決

下書きJSONではDB IDを使用せず、人が確認できる識別子を使用する。

| 関係            | 入力に使う識別子 |
| --------------- | ---------------- |
| Work            | `slug`           |
| Development Log | `slug`           |
| ADR             | `decisionId`     |
| 置換対象ADR     | `decisionId`     |

登録側は識別子をPayloadのDocument IDへ解決する。

- 1件だけ見つかった場合はrelationshipを設定する。
- 見つからない場合は警告し、初期段階ではrelationshipを設定せず登録を継続できる。
- 複数件見つかった場合はデータ不整合として登録を中止する。
- 外部プロジェクトに対応するWorkがない場合、`relatedWorks` は空でよい。

## 11. 検証設計

### 11.1 schema検証

- 必須項目が存在する。
- 文字列をtrimした結果が空にならない。
- 日付がISO 8601として解釈できる。
- `options` が1件以上存在する。
- `decisionStatus` が許可値である。
- 配列要素に空文字や重複がない。
- 文字数と配列件数が設定した上限内である。

### 11.2 重複検証

初期登録はcreate-onlyとし、次の場合は自動上書きしない。

- 同じDevelopment Log slugが存在する。
- 同じADR `decisionId` が存在する。
- 同じADR slugが存在する。

重複時は既存Documentを示して処理を中止する。更新機能は、差分表示と対象IDの明示を設計した後に別機能として追加する。

### 11.3 内容検証

機械的に検出可能な禁止情報候補を警告する。

- API key、token、password、secret
- `DATABASE_URI`などの接続文字列
- `.env` の値
- 顧客名、個人情報、非公開URL
- 未修正の脆弱性を悪用できる具体的手順
- 長大なログ、stack trace、ソースコード全文

自動検出だけで安全性を保証せず、人による確認を必須とする。

## 12. 権限と実行境界

### 12.1 管理画面からの登録

既存Collectionのaccess controlに従い、`admin`、`editor`、`author` が作成・更新できる。削除は `admin` または `editor` に限定される。

### 12.2 ローカル登録スクリプト

- `my_profile` の信頼済みローカル環境だけで実行する。
- 接続情報は既存の `.env` 系ファイルから読み込む。
- 接続情報を入力JSON、コマンド引数、ログへ出さない。
- Payload Local APIを利用する場合も、登録可能なCollectionと固定値をコード側で制限する。
- 実行ログには作成したDocument ID、種別、slugだけを出し、本文や秘密情報を出さない。

### 12.3 MCP

現在の `engineering_notes` MCPは読み取り専用のまま維持する。

将来、作成支援をMCP化する場合は別サーバーまたは別Tool allowlistとして構成し、次を必須とする。

- Tool名は `create_development_log_draft`、`create_architecture_decision_draft` など、下書き作成であることを明示する。
- `readOnlyHint: false` を設定する。
- 自動承認を使用しない。
- `draft + private` をサーバー側で固定する。
- publish、delete、既存Documentの上書きを提供しない。
- 呼び出しごとに利用者の承認を必要とする。

## 13. エラー方針

| コード案                | 条件                          | 処理                         |
| ----------------------- | ----------------------------- | ---------------------------- |
| `INVALID_INPUT`         | 必須項目、形式、上限の違反    | 登録しない                   |
| `DUPLICATE_SLUG`        | slugが既に存在する            | 既存記録を示して中止         |
| `DUPLICATE_DECISION_ID` | ADR IDが既に存在する          | 既存記録を示して中止         |
| `RELATION_NOT_FOUND`    | relationship対象が存在しない  | 警告し、確認を求める         |
| `SENSITIVE_CONTENT`     | 禁止情報候補を検出した        | 登録を中止して確認を求める   |
| `DATABASE_UNAVAILABLE`  | PayloadまたはDBへ接続できない | 秘密情報を隠して中止         |
| `CREATE_FAILED`         | Payload createが失敗した      | 安全な概要だけを表示して中止 |

部分的な登録を避けるため、1ファイル1Documentを基本とする。将来複数件を一括登録する場合は、事前検証を全件へ行い、成功・失敗の扱いを別途定義する。

## 14. 想定ファイル構成

Phase 3でローカル登録を実装する場合、次の構成を候補とする。

```text
lib/engineering-notes/drafts/
├─ types.ts             # 入力型
├─ schemas.ts           # 入力検証
├─ sensitiveContent.ts  # 禁止情報候補の検査
├─ relationships.ts     # slug / decisionIdの解決
└─ createDraft.ts       # draft + private固定の登録処理

scripts/
└─ importEngineeringNoteDraft.mts
```

下書きJSONの保存場所は対象プロジェクト側で固定せず、登録コマンドへ明示的なファイルパスを渡す。下書きをGit管理する場合は、秘密情報を含まないことを人が確認してから追加する。

## 15. テスト方針

### 単体テスト

- Development LogとADRの正常入力を受理する。
- 必須項目不足を拒否する。
- 固定値を入力側から上書きできない。
- 重複slugとADR IDを拒否する。
- relationship識別子を正しく解決する。
- 禁止情報候補を検出する。

### 実DB検証

- 新規DocumentがPayload draftとして保存される。
- `status: draft`、`visibility: private` になる。
- 公開サイト、未認証API、読み取り専用MCPから取得できない。
- 管理画面では内容を確認できる。
- 管理画面から公開した後だけ、設定したvisibilityに応じて取得できる。

## 16. 未決事項

Phase 2開始前に次を決定する。

- JSON schemaをリポジトリへ正式に配置するか。
- プロジェクト名の既存 `my_profile` 表記を維持するか、将来正規化するか。
- ADR IDの採番を手動にするか、登録側で候補を提示するか。
- 禁止情報検査で登録を中止する条件と、警告だけにする条件。
- relationshipが見つからない場合に登録を継続するか、常に中止するか。
- 下書きファイルを一時ファイルとして扱うか、各プロジェクトの履歴としてGit管理するか。
