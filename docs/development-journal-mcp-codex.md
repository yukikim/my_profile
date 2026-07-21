# 開発日誌・設計判断MCP Codex接続ガイド

## 1. 目的

Phase 4で実装したstdio MCPサーバーを、このリポジトリを信頼して開いたCodexから利用する。Codexの回答では、根拠となった開発日誌の`slug`またはADRの`decisionId`を識別できるようにする。

このMCPは公開済み記録の読み取り専用であり、下書き作成・更新・公開・削除を行わない。外部プロジェクトからJSON下書きを作成し、ローカルCLIで登録する手順は[`external-project-engineering-notes-prompts.md`](./external-project-engineering-notes-prompts.md)を参照する。

## 2. プロジェクト設定

接続設定は`.codex/config.toml`に置く。プロジェクト設定には次の情報だけを記載する。

- MCPサーバーの起動コマンド
- プロジェクトの作業ディレクトリ
- 起動・Tool実行timeout
- 利用を許可する6つの読み取り専用Tool

`DATABASE_URI`と`PAYLOAD_SECRET`は設定ファイルへ書かない。MCPプロセスは`mcp/env.ts`を通じて、既存の`.env`系ファイルをプロジェクトrootから読み込む。

## 3. Codexでの有効化

1. PostgreSQLを起動する。
2. Codexでこのリポジトリを信頼済みプロジェクトとして開く。
3. MCP設定を追加・変更した後は、Codexアプリまたは拡張機能を再起動する。
4. MCPサーバー一覧で`engineering_notes`が有効であることを確認する。
5. 6つのToolが表示されることを確認する。

CLIでは、プロジェクトrootで`codex mcp list`を実行して設定の読込状態を確認できる。

## 4. 受け入れ質問

次の質問では、回答本文に根拠となる日誌slugまたはADR decisionIdを含める。

1. `my_profileでPostgreSQLを採用した理由を教えてください。`
2. `問い合わせフォーム実装時の問題、原因、解決方法を整理してください。`
3. `starter-showcaseに関連する設計判断を一覧にしてください。`
4. `直近30日の開発日誌から次にやることを抽出してください。`
5. `置き換え済みのADRと現在有効なADRの関係を説明してください。`

期待する主な根拠:

| 質問               | 使用するTool                  | 根拠として識別できる値           |
| ------------------ | ----------------------------- | -------------------------------- |
| PostgreSQL採用理由 | `get_decision_context`        | `ADR-0002`                       |
| 問い合わせフォーム | `search_development_logs`     | `implement-contact-form-storage` |
| Work関連ADR        | `get_related_decisions`       | `ADR-0001`、`ADR-0002`           |
| 直近の次アクション | `get_recent_development_logs` | 各日誌の`slug`                   |
| ADRの置換関係      | `get_related_decisions`       | `ADR-0001`、`ADR-0002`           |

## 5. 受け入れ結果

2026-07-17に、新しい`codex exec`プロセスから上記5問を一度に実行した。CodexのJSONLイベントで、`server: "engineering_notes"`のMCP Tool callと次の根拠を確認した。

| 質問               | Codexが実際に使用したTool       | 確認した根拠                                                   |
| ------------------ | ------------------------------- | -------------------------------------------------------------- |
| PostgreSQL採用理由 | `search_architecture_decisions` | `ADR-0002`                                                     |
| 問い合わせフォーム | `search_development_logs`       | `implement-contact-form-storage`                               |
| Work関連ADR        | `search_architecture_decisions` | `ADR-0001`、`ADR-0002`                                         |
| 直近の次アクション | `get_recent_development_logs`   | `investigate-works-fallback`、`implement-contact-form-storage` |
| ADRの置換関係      | `get_related_decisions`         | `ADR-0001`、`ADR-0002`                                         |

`ADR-0001`と`investigate-works-fallback`はprivateだが、信頼済みローカルCodexから取得できた。一方、draftの`ADR-0004`と`plan-engineering-notes-pages`は取得結果にも回答にも含まれなかった。

Codexが検索時に誤って`limit: 100`を指定した呼び出しは、MCPの入力スキーマによって拒否された。その後の最大50件以内の呼び出しは成功しており、実クライアントからも取得上限が迂回できないことを確認した。

## 6. 安全性の確認

- MCPは`trusted-mcp`として公開済みのpublic/private記録を取得できる。
- draftはPhase 3のQuery Serviceで除外される。
- Payload Documentはallowlist Mapperを通し、ユーザー情報や内部フィールドを返さない。
- DB接続文字列、secret、SQL、stack traceをTool応答へ含めない。
- ローカルのプロジェクト設定であり、ChatGPT webや外部MCPクライアントへ自動公開されない。

## 7. 起動と検証

プロジェクトrootでPostgreSQLを起動し、migrationとseedを適用する。

```bash
docker compose up -d postgres
npm run migrate
npm run seed
```

MCPプロトコル、実DB境界、Codex設定は次の順で確認できる。

```bash
npm run test:mcp
npm run verify:engineering-notes
npm run verify:mcp
codex mcp list
```

`npm run mcp`をterminalから直接実行した場合、stdio MCPはクライアントからのJSON-RPC入力を待つため、通常のWebサーバーのような操作画面は表示されない。

## 8. トラブルシュート

### `engineering_notes`が検出されない

1. このリポジトリがCodexで信頼済みになっているか確認する。
2. `.codex/config.toml`の`cwd`が現在のプロジェクトrootと一致するか確認する。
3. `codex mcp list`でenabledになっているか確認する。
4. 設定変更後にCodexアプリまたはIDE拡張を再起動する。

### DB接続エラーになる

```bash
docker compose ps
docker compose up -d postgres
npm run migrate:status
```

`.env`の`DATABASE_URI`を確認する。接続文字列を`.codex/config.toml`へコピーせず、MCPプロセスがプロジェクトrootの`.env`系ファイルから読み込む構成を維持する。

### Toolは見えるが結果が0件になる

- `npm run seed`を実行したか確認する。
- 記録の`status`とPayloadの`_status`がpublishedか確認する。
- public画面の場合は`visibility: public`か確認する。
- `publishedAt`が未来日時になっていないか確認する。
- draftはMCPでも取得できないため、管理画面で公開してから再確認する。

### MCP通信がJSON解析エラーになる

stdioではstdoutがJSON-RPC専用になる。通常ログを`console.log`で出さず、診断はstderrへ出す。現在のMCP起動時はPayload loggerもstderrへ切り替えている。

### 安全性をまとめて再確認する

```bash
npm run test:engineering-notes
npm run test:mcp
npm run verify:engineering-notes
npm run verify:mcp
```

実DB検証では、public/private/draftの境界、未認証Payload API、構造化出力、秘密情報のマスキング、stdoutの通信純度を確認する。
