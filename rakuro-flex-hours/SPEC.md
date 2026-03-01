# rakuro-flex-hours 仕様書

## 1. 機能概要

ラクローの勤怠管理画面に、**今日以降1日あたりに必要な労働時間**を自動計算して表示する UserScript。

フルフレックス制において、月の規定時間を満たすために「今後どれくらい働けばいいか」を可視化することで、ペース配分をサポートする。

## 2. 要件定義

### 2.1 基本要件

- 昨日までの実労働時間を集計する
- 月の所定労働時間との差分を計算する
- 残りの営業日数で均等に割り、今日以降1日あたりの必要労働時間を算出する
- 計算結果をテーブルに新規カラムとして追加表示する

### 2.2 表示仕様

#### カラム名
- **「必要労働時間」**

#### 表示位置
- テーブルの「労働 / 休憩」カラムの右隣に追加

#### 表示内容
- **今日以降の行**: 計算した必要労働時間（例: `7:30`）
- **昨日以前の行**: `-` を表示
- **規定時間超過の場合**: `0:00` を表示

#### 表示形式
- `H:MM` 形式（例: `7:30`、`10:15`）

## 3. 計算ロジック

### 3.1 計算式

```
今後1日あたりの必要労働時間 = (所定労働時間 - 昨日までの実労働時間) / 残りの日数
```

### 3.2 計算の詳細

1. **所定労働時間の取得**
   - ページ内の「所定労働時間:」というテキストを含む要素から抽出
   - 形式: `HH:MM`（例: `144:00`）

2. **昨日までの実労働時間の集計**
   - テーブルの各行から日付と「労働 / 休憩」の値を取得
   - 今日の日付より前の行の労働時間を合計
   - 形式: `HH:MM / HH:MM`（労働 / 休憩）の左側の値を使用

3. **残りの日数のカウント**
   - 今日以降の営業日数をカウント
   - 土日祝日は除外する

4. **必要時間の計算**
   - 差分を残り日数で割る
   - 0未満にならないよう、最小値を0に設定

### 3.3 エッジケース

- **残り日数が0の場合**: 0:00 を表示
- **既に規定時間を超過している場合**: 0:00 を表示
- **所定労働時間が取得できない場合**: 処理を中断

## 4. 実装詳細

### 4.1 技術スタック

- **実行環境**: Tampermonkey (UserScript)
- **対象サイト**: `*://*.raku-ro.com/*`
- **言語**: JavaScript (Vanilla JS)

### 4.2 主要な関数

#### `timeToMinutes(timeStr)`
- 時間文字列（HH:MM）を分に変換

#### `minutesToTime(minutes)`
- 分を時間文字列（HH:MM）に変換

#### `parseDate(dateStr)`
- 日付文字列（YYYY-MM-DD）をDateオブジェクトに変換

#### `getTodayString()`
- 今日の日付をYYYY-MM-DD形式で取得

#### `addRequiredWorkingHours()`
- メイン処理：必要労働時間を計算し、テーブルに追加

#### `waitForElement(selector, callback, maxAttempts)`
- DOMの読み込み完了を待つヘルパー関数

### 4.3 DOM操作

#### ヘッダーの追加
```javascript
const requiredHeader = document.createElement('div');
requiredHeader.className = 'th th-required-time';
requiredHeader.setAttribute('data-v-dc39b466', '');
requiredHeader.innerHTML = '<span data-v-dc39b466="">必要労働時間</span>';
headerBreakTime.parentNode.insertBefore(requiredHeader, headerBreakTime.nextSibling);
```

#### データセルの追加
```javascript
const requiredCell = document.createElement('div');
requiredCell.className = 'td td-required-time px-2';
requiredCell.setAttribute('data-v-d60458cb', '');
requiredCell.innerHTML = `<div class="text-center text-nowrap">${requiredTimeStr}</div>`;
breakTimeCell.parentNode.insertBefore(requiredCell, breakTimeCell.nextSibling);
```

### 4.4 SPA対応

- `MutationObserver` を使用してページ遷移を検知
- URL変更時に自動で再実行

## 5. データ取得方法

### 5.1 所定労働時間

**セレクタ**: `td` 要素の中から「所定労働時間:」を含むテキストを検索

**抽出パターン**: 
```
所定労働時間:
144:00
```

### 5.2 日付

**セレクタ**: `.timeline-table__row` 内の `[data-test-id]` 属性

**形式**: `YYYY-MM-DD`（例: `2026-02-01`）

### 5.3 労働時間

**セレクタ**: `.td-break-time__value`

**形式**: `労働時間 / 休憩時間`（例: `8:25 / 1:00`）

**抽出**: `/` で分割して左側の値を使用

### 5.4 土日祝日の判定

**セレクタ**: `.timeline-date`

**判定方法**: CSSクラスで判別
- `date-type-legal_holiday`: 法定休日（法休） - 日曜日など
- `date-type-excess_statutory_holiday`: 所定休日（所休） - 土曜日、祝日など

**処理**: 上記いずれかのクラスを持つ日は営業日から除外

## 6. UI設計

### 6.1 レイアウト

```
| 勤怠申請 | 始業 | 終業 | 労働 / 休憩 | 必要労働時間 | 修正理由 |
|----------|------|------|-------------|--------------|----------|
| ...      | ...  | ...  | 8:25 / 1:00 | 7:30         | ...      |
| ...      | ...  | ...  | 8:59 / 1:00 | 7:30         | ...      |
```

### 6.2 スタイリング

- 既存のクラス名を使用して自然に統合
- `.th-required-time`: ヘッダー用
- `.td-required-time`: データセル用
- `text-center text-nowrap`: テキスト中央揃え、折り返しなし

## 7. デバッグ

### 7.1 コンソールログ

スクリプトは以下のログを出力：

- `[rakuro-userscript] スクリプト開始`
- `[rakuro-userscript] メイン処理開始`
- `[rakuro-userscript] 所定労働時間: XX:XX`
- `[rakuro-userscript] 今日の日付: YYYY-MM-DD`
- `[rakuro-userscript] 昨日までの労働時間: XX:XX`
- `[rakuro-userscript] 昨日までの営業日数: N`
- `[rakuro-userscript] 残りの営業日数: N`
- `[rakuro-userscript] 今後1日あたりの必要労働時間: XX:XX`
- `[rakuro-userscript] ヘッダーカラムを追加しました`
- `[rakuro-userscript] 完了`

### 7.2 デバッグ方法

1. ブラウザの開発者ツール（F12）を開く
2. コンソールタブを確認
3. `[rakuro-userscript]` でフィルタリング

## 8. 制約事項

### 8.1 現在の制約

- 有給休暇（全休・半休）は考慮していない
- 所定労働時間はページから取得するため、手動で設定できない
- 今日の日付はクライアントの時刻に依存する

### 8.2 前提条件

- ラクローの勤怠管理画面（月次カレンダー表示）で動作
- テーブル構造が変更されると動作しなくなる可能性がある
- Vue.jsの属性（`data-v-*`）を使用しているため、Vue.jsのバージョン変更で影響を受ける可能性がある
