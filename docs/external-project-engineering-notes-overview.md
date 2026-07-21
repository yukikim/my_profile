# 外部プロジェクト開発記録 作業概要

## 1. 文書の目的

本書は、`my_profile` または別プロジェクトで行った作業から、Development LogとArchitecture Decision Record（ADR）の下書きを作成し、`my_profile` のPayload CMSへ安全に蓄積する取り組みの目的、対象範囲、進め方を定義する。

具体的なデータ形式、登録境界、重複処理、セキュリティ方針は[`external-project-engineering-notes-design.md`](./external-project-engineering-notes-design.md)、実際の作成・登録手順は[`external-project-engineering-notes-prompts.md`](./external-project-engineering-notes-prompts.md)を参照する。

## 2. 背景

現在の `my_profile` には、次の仕組みがある。

- `DevelopmentLogs` Collectionで実装内容、問題、原因、解決方法、学び、次の作業を管理する。
- `ArchitectureDecisions` Collectionで判断の背景、選択肢、採用理由、影響を管理する。
- `project` フィールドで記録をプロジェクト単位に分類する。
- 公開可能な記録をEngineering Notes画面へ表示する。
- 読み取り専用MCPから、公開済みの記録をCodexで検索する。

以前は記録の作成をPayload管理画面からの手入力に依存していた。現在は、各プロジェクトでCodexが作業内容をJSONへ整理し、`my_profile`のローカルCLIが検証後にPayload draftを作成する運用を利用できる。

## 3. 目標

### 3.1 主目標

1. `my_profile` と別プロジェクトのどちらからでも、Development LogまたはADRの下書きを作成できるようにする。
2. 作業内容を、現在のPayload Collectionに合う構造へ整理する。
3. 生成した記録は必ず下書き・非公開として扱い、人が確認してから公開する。
4. プロジェクト名、slug、ADR IDの命名を統一し、MCPから検索しやすくする。
5. APIキー、接続情報、顧客情報などを記録へ混入させない。

### 3.2 運用上の目標

- JSON下書きはdry-runで検証し、利用者が`--apply`を明示した場合だけ1件作成する。
- CLIはcreate-onlyとし、更新・削除・公開を提供しない。
- 必要性が明確になった場合だけ、書き込み専用MCP Toolへ発展させる。
- 既存の読み取り専用MCPは変更せず、作成処理と検索処理の権限を分離する。

## 4. 完成イメージ

```text
作業対象プロジェクト
├─ my_profile
├─ go-todo
├─ payload-sample
└─ その他のプロジェクト
          │
          ▼
Codexが作業結果を構造化
          │
          ▼
Development Log / ADRの下書き
          │
          ▼
Payload CMSへdraft + privateで登録
          │
          ▼
管理画面で内容と公開範囲を確認
     ┌────┴──────────┐
     ▼               ▼
privateで公開     publicで公開
     │               ├─ Engineering Notes
     └──────┬────────┘
            ▼
       読み取り専用MCP
```

## 5. 基本ワークフロー

1. 対象プロジェクトで実装、調査、修正、設計判断を行う。
2. Codexが定義済みJSON形式でDevelopment LogまたはADRを1件生成する。
3. 利用者が秘密情報と事実関係を確認する。
4. `my_profile`のCLIをdry-runし、重複、禁止情報、relationshipを確認する。
5. 利用者が`--apply`を明示し、Payloadへ`draft + private`として1件登録する。
6. Payload管理画面で内容、relationship、公開範囲をレビューする。
7. 管理画面から`private`または`public`として公開する。
8. 公開ページと読み取り専用MCPで公開境界を確認する。

## 6. Development LogとADRの使い分け

| 種別            | 記録する内容                                         | 代表例                                     |
| --------------- | ---------------------------------------------------- | ------------------------------------------ |
| Development Log | 実際に行った作業、発生した問題、原因、解決方法、学び | ビルドエラーの修正、フォーム保存処理の実装 |
| ADR             | 複数案を比較し、今後にも影響する方針を選んだ理由     | DB選定、キャッシュ方式、認証方式           |

次の条件に当てはまる場合は、両方を作成して関連付ける。

- 実装作業の中で長期的な設計方針を決めた。
- 問題解決によって既存ADRを置き換える必要が生じた。
- 作業経緯と最終判断を別々の観点で残す価値がある。

## 7. 現在のリリース範囲

### 対象

- Codexを使ったDevelopment Log下書きの作成
- Codexを使ったADR下書きの作成
- JSON schema検証と秘密情報候補の検査
- dry-runと明示的な`--apply`を持つローカル登録CLI
- slug、ADR ID、relationshipの事前検証
- `project` を使った複数プロジェクトの分類
- Payload管理画面でのレビューと公開
- `draft + private` を初期状態とするレビュー運用
- slug、ADR ID、タグの命名規則
- 保存禁止情報の確認手順

### 初期リリース対象外

- 作成直後の自動公開
- 既存の読み取り専用MCPへの書き込みTool追加
- Git commitごとの自動記録
- 外部プロジェクトからPostgreSQLへの直接接続
- インターネットへ公開する登録API
- AIだけによる公開可否の決定
- 既存記録の自動上書き

## 8. 実装済みステップと将来拡張

### 完了: 手動登録で形式を固める

Codexが作成した下書きを利用者が確認し、Payload管理画面へ手動登録する。複数プロジェクトで試し、必須項目、粒度、命名規則が実用的か確認する。

### 完了: 下書きファイルを標準化する

Development LogとADRのJSON形式を定義する。Codexの出力を機械検証できるようにし、手動転記時の項目漏れを減らす。

### 完了: ローカル登録スクリプトを追加する

`my_profile` 内で下書きファイルを検証し、Payload Local APIを使って `draft + private` で登録する。登録前に差分、警告、重複を表示する。

### 任意: 作成支援をMCP化する

複数プロジェクトから同じ操作を繰り返す必要が生じた場合、下書き作成専用Toolを検討する。Toolは公開処理を持たず、既存の読み取り専用MCPとは権限と設定を分離する。

## 9. 成功条件

- `my_profile` 以外のプロジェクト名を持つ記録をPayloadへ保存できる。
- Development LogとADRを迷わず使い分けられる。
- 必須項目が欠けた記録を登録前に検出できる。
- 新規記録が必ず `draft + private` で始まる。
- slugとADR IDの重複を登録前に検出できる。
- 秘密情報を含む可能性がある場合、登録を中止して人が確認できる。
- 公開操作はPayload管理画面でのみ行われる。
- 公開後の記録を既存の読み取り専用MCPからプロジェクト単位で検索できる。

## 10. 設計上の重要な判断

- 記録の正本は `my_profile` のPayload CMSとPostgreSQLとする。
- 作業対象プロジェクトへDB接続情報やPayload secretを配布しない。
- 作成と公開を分離し、自動処理が行うのは下書き作成までとする。
- 初期値は `status: draft`、`visibility: private`、Payloadの `_status: draft` とする。
- 外部プロジェクトの `relatedWorks` は対応するWorkが存在する場合だけ設定する。
- AIが生成した内容は事実確認前の候補であり、人によるレビューを必須とする。
- 現在の読み取り専用MCPは、登録機能の実装後も読み取り専用のまま維持する。
