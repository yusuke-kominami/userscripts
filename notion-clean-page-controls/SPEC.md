# notion-clean-page-controls 仕様書

## 1. 機能概要

Notion ページ上部の不要なコントロールボタンを非表示にし、余白を縮小する UserScript。

## 2. 要件定義

### 2.1 変更内容

| 対象 | 適用前 | 適用後 |
|:---|:---|:---|
| `.layout.layout-wide` のマージン幅 | デフォルト値 | `--margin-width: 60px` |
| `.notion-page-controls` の上余白 | `padding-top: 80px` | `padding-top: 45px` |
| Add icon ボタン | 表示 | 非表示 |
| Add cover ボタン | 表示 | 非表示 |
| Add verification ボタン | 表示 | 非表示 |
| Add comment ボタン | 表示 | 非表示 |
| ページアイコン | 表示 | 非表示 |
| データ基盤タスクマスタのサブアイテムトグル | 閉じた状態 | 自動展開 |

### 2.2 対象ページ

- `319503c7791d803a8917c3dfcf9c97af` のみに適用（URL パス内にページ ID が含まれるかで判定）
- 他の Notion ページには影響しない

### 2.3 対象セレクタ

- `.layout.layout-wide` — レイアウトのマージン幅を 60px に固定
- `.notion-page-controls` — コンテナの余白調整
- `.notion-page-controls > div[role="button"]` — 各ボタンの非表示
- `.notion-page-controls > [data-popup-origin]` — verification ラッパーの非表示
- `.notion-record-icon[aria-label*="page icon"]` — ページアイコンの非表示

## 3. Tampermonkey 登録用ヘッダー

```javascript
// ==UserScript==
// @name         notion-clean-page-controls
// @description  Notion ページ上部の不要ボタンを非表示にし余白を縮小
// @version      2026-03-04
// @match        *://*.notion.so/*
// @require      file:///Users/yusuke.kominami/src/userscripts/notion-clean-page-controls/script.js
// @grant        none
// @run-at       document-start
// ==/UserScript==
```

## 4. 実装詳細

### 4.1 技術スタック

- **実行環境**: Tampermonkey (UserScript)
- **対象サイト**: `*://*.notion.so/*`（Tampermonkey の `@match`）
- **対象ページ**: `319503c7791d803a8917c3dfcf9c97af` のみ（スクリプト内で URL 判定）
- **言語**: JavaScript (Vanilla JS)
- **方式**: CSS インジェクション（`<style>` 要素を `<head>` に追加）

### 4.2 実装方式

`!important` 付きの CSS ルールを注入し、Notion の既存スタイルを上書きする。スタイル変更は CSS のみで軽量。サブアイテムトグルの自動展開は DOM 操作（ボタンクリック）で実現。

### 4.3 SPA 対応

Notion は SPA のため、ページ遷移時にスクリプトが再実行されない。以下の仕組みで URL 変化を検知し、CSS の注入/除去を切り替える：

- `MutationObserver`（`document.body` の子孫変更）で URL 変化を検知
- `popstate` イベントでブラウザの戻る/進むに対応
- 対象ページ以外では `<style>` 要素を除去

## 5. 制約事項

- Notion の DOM 構造（クラス名・属性）が変更されると動作しなくなる可能性がある
