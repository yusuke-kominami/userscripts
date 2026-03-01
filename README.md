# userscripts

各種 Web サービス向けの UserScript (Tampermonkey) をまとめて管理するリポジトリです。

## 📦 スクリプト一覧

| スクリプト | 説明 | 対象サイト |
|:---|:---|:---|
| [rakuro-flex-hours](rakuro-flex-hours/) | ラクローにフルフレックス向け必要労働時間を表示 | raku-ro.com |

## 🛠 動作環境

* Google Chrome (推奨)
* 拡張機能: [Tampermonkey](https://www.tampermonkey.net/)

## 💻 開発・インストール方法

### 1. ブラウザの設定（初回のみ）

ChromeでローカルファイルをTampermonkeyから読み込むために、以下の設定が必要です。

1. Chromeの拡張機能管理画面（`chrome://extensions/`）を開く
2. **Tampermonkey** の「詳細」をクリック
3. **「ファイルの URL へのアクセスを許可する」** を **ON** にする

### 2. Tampermonkeyへの登録

1. Tampermonkeyのアイコンをクリックし、「新規スクリプトを追加」を選択
2. エディタの内容を全て削除し、以下のように入力して保存：

```javascript
// ==UserScript==
// @name         rakuro-flex-hours
// @description  ラクローに必要労働時間を表示
// @match        *://*.raku-ro.com/*
// @require      file:///Users/<ユーザー名>/src/<リポジトリ>/rakuro-flex-hours/script.js
// @run-at       document-end
// ==/UserScript==
```

3. `@require` のパスを、あなたの環境の `script.js` の絶対パスに書き換える
4. 保存して対象サイトのページを開くと、自動的にスクリプトが実行されます

### 開発時の注意

- 各機能ディレクトリ内の `script.js` を編集したら、対象ページをリロードするだけで変更が反映されます
- Tampermonkeyへのコピペは不要です
