# notion-clean-page-controls 仕様書

## 1. 機能概要

Notion ページ上部の不要なコントロールボタンを非表示にし、余白を縮小する UserScript。

## 2. 要件定義

### 2.1 変更内容

| 対象 | 適用前 | 適用後 |
|:---|:---|:---|
| `.notion-page-controls` の上余白 | `padding-top: 80px` | `padding-top: 50px` |
| Add icon ボタン | 表示 | 非表示 |
| Add cover ボタン | 表示 | 非表示 |
| Add verification ボタン | 表示 | 非表示 |
| Add comment ボタン | 表示 | 非表示 |

### 2.2 対象セレクタ

- `.notion-page-controls` — コンテナの余白調整
- `.notion-page-controls > div[role="button"]` — 各ボタンの非表示
- `.notion-page-controls > [data-popup-origin]` — verification ラッパーの非表示

## 3. Tampermonkey 登録用ヘッダー

```javascript
// ==UserScript==
// @name         notion-clean-page-controls
// @description  Notion ページ上部の不要ボタンを非表示にし余白を縮小
// @version      2026-03-04
// @match        *://*.notion.so/*
// @require      file:///Users/yusuke.kominami/src/userscripts/notion-clean-page-controls/script.js
// @run-at       document-start
// ==/UserScript==
```

## 4. 実装詳細

### 4.1 技術スタック

- **実行環境**: Tampermonkey (UserScript)
- **対象サイト**: `*://*.notion.so/*`
- **言語**: JavaScript (Vanilla JS)
- **方式**: CSS インジェクション（`<style>` 要素を `<head>` に追加）

### 4.2 実装方式

`!important` 付きの CSS ルールを注入し、Notion の既存スタイルを上書きする。DOM 操作ではなく CSS のみで変更するため、SPA のページ遷移にも耐性がある。

## 5. 制約事項

- Notion の DOM 構造（クラス名・属性）が変更されると動作しなくなる可能性がある
