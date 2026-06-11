# おやじ狩り狩り タイピングゲーム

ブラウザで遊べる、バトル形式の日本語ローマ字タイピングゲームです。

## ゲームモード

- 通常モード
- 火災予防モード

火災予防モードでは、表示文が10文字を超える文章を一度もミスせず入力すると、制限時間が5秒加算されます。

## 実行方法

依存パッケージやビルド作業は不要です。ローカルHTTPサーバーを起動してアクセスしてください。

```bash
python3 -m http.server 8000
```

ブラウザで `http://localhost:8000` を開きます。

## データ更新

火災予防ワードのCSVを更新した場合は、フォールバックデータも再生成してください。

```bash
node scripts/build-fire-fallback.js
```

## 構文チェック

```bash
node --check app.js
node --check fire_prevention_words_fallback.js
node --check scripts/build-fire-fallback.js
```

## セキュリティ

- 動的な画面出力には `textContent` を使用しています。
- Content Security Policyを設定しています。
- CSVのサイズ、行数、必須列、値、文字数を検証しています。
- `_headers` 対応ホスティングでは、HTTPS向けのセキュリティヘッダーを適用できます。
- 公開・脆弱性報告に関する詳細は [SECURITY.md](SECURITY.md) を参照してください。
