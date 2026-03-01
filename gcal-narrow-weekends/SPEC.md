# gcal-narrow-weekends 仕様書

## 概要

Google カレンダーの週次表示において、休日（土曜・日曜）の列幅を狭めるユーザースクリプト。
平日の予定を見やすくしつつ、休日の列も表示は維持する。

## 対象

- **サイト**: `calendar.google.com`
- **表示モード**: 週次表示のみ（カラムヘッダーが 7 つの場合に動作）
- **想定設定**: 月曜始まり（土曜・日曜が末尾 2 列）

## 機能仕様

### 列幅の調整

- 休日列の `flex` を `0.3 1 0%` に変更（通常は `1 1 0%`）
- 平日 5 列が `flex: 1`、休日 2 列が `flex: 0.3` → 休日は平日の約 30% の幅になる

### 休日列の判定

- `[role="columnheader"]` 内の `<h2>` 要素の `aria-label` を参照
- 「土曜日」「日曜日」「Saturday」「Sunday」のいずれかを含む列を休日と判定

### レイアウト修正対象

Google カレンダーの週次表示は **flexbox** で構成されており、以下の 6 セクションを修正:

| セクション | コンテナ | 子要素 | 判定方法 |
|:---|:---|:---|:---|
| ヘッダー行 | `.EYcIbe` | `[role="columnheader"]` | aria-label |
| 背景ストライプ | `.djb5I` | `.INK2ed` (7個) | index |
| 勤務場所 / 終日背景 | `.NFVL1c` | `.E42vBe` (7個) | index |
| 終日イベント背景 | `ul.bOyeud` | `li.gZ8fdb` (7個) | index |
| 終日イベントセル | `.PTdDEc` | `.qLWd9c[role="gridcell"]` (7個) | index |
| 時間グリッド | `.Tmdkcc` | `.BiKU4b[data-column-index]` | data-column-index |

### 動的対応

- **SPA 遷移**: URL 変更を `MutationObserver` で検知し再適用
- **DOM 変更**: `MutationObserver` で子要素・style 属性の変更を監視
- **リサイズ**: `resize` イベントで再計算・再適用
- **スロットリング**: デバウンス 200ms で過剰な再適用を防止

## Google カレンダーの DOM 構造

```
div[role="grid"] .pbeTDb
└── div .BfTITd (data-start-date-key, data-end-date-key)
    ├── div .UqLcs                        ← 時間ラベル列
    ├── div[role="presentation"] .Zf8VQe  ← メインコンテンツ
    │   ├── div .R9tCRe                   ← 背景ストライプ (.djb5I > .INK2ed x7)
    │   ├── div[role="row"] .fhpo2c       ← ヘッダー行
    │   │   └── div .EYcIbe              ← flex container
    │   │       ├── div .FDbe8b           ← 時間ガター
    │   │       ├── div .yzWBv[role="columnheader"] x7  ← ★flex: 1 1 0%
    │   │       └── div .VPNtpe           ← 末尾スペーサ
    │   ├── div[role="row"] .RnuVVe       ← 勤務場所行
    │   │   └── div .NFVL1c              ← flex container
    │   │       └── div .E42vBe[role="gridcell"] x7     ← ★flex: 1 1 0%
    │   ├── div[role="row"] .Qotkjb       ← 終日イベント行
    │   │   └── div .ZDEHt
    │   │       ├── ul .bOyeud            ← 背景 (li.gZ8fdb x7)
    │   │       └── div .PTdDEc           ← イベントセル (.qLWd9c x7)
    │   └── div .mDPmMe                   ← 時間グリッド
    │       └── div[role="row"] .Tmdkcc
    │           ├── div .aLC8Le           ← 時間線 (div.sJ9Raf x24)
    │           ├── div .EDDeke           ← スペーサ
    │           └── div .BiKU4b[role="gridcell"][data-column-index] x7  ← ★flex: 1 1 0%
```

## Tampermonkey 登録用メタデータ

```javascript
// ==UserScript==
// @name         gcal-narrow-weekends
// @description  Google カレンダー週次表示の休日列幅を縮小
// @version      2026-03-01
// @match        *://calendar.google.com/*
// @require      file:///Users/<ユーザー名>/src/userscripts/gcal-narrow-weekends/script.js
// @run-at       document-end
// ==/UserScript==
```

## デバッグ

ブラウザの開発者ツールのコンソールで `[gcal-narrow-weekends]` をフィルタすると、以下のログを確認可能:
- スクリプト読み込み完了
- 適用された要素数と休日列のインデックス
- ページ遷移の検知
