# kmanul.org — サイト公開手順書
## GitHub Pages + kmanul.org ドメイン接続ガイド

---

## 📁 ファイル構成

```
kmanul-site/
├── index.html          ← ホーム（kimyo-na-manul）
├── manul-schole.html   ← まぬるすこれ
├── ringo.html          ← りんごの樹
├── sns.html            ← SNS・メディア
├── assets/
│   ├── style.css       ← 共通スタイル
│   ├── main.js         ← 共通JavaScript
│   ├── logo.png        ← ★ ロゴ画像をここに置く（後述）
│   └── favicon.ico     ← ★ ファビコンをここに置く（後述）
└── README.md           ← この手順書
```

---

## STEP 1 ｜ ロゴ画像を用意する

1. 送ったロゴ画像（`Untitled_design_-_12.PNG`）を
   `assets/logo.png` という名前に変更して `assets/` フォルダに入れる
2. ファビコン（`assets/favicon.ico`）は、以下サービスで無料作成できます：
   → https://favicon.io/favicon-converter/
   （ロゴ画像をアップロードして `favicon.ico` をダウンロード）

---

## STEP 2 ｜ GitHubリポジトリを作る

1. https://github.com にアクセス・ログイン
2. 右上「＋」→「New repository」をクリック
3. 設定：
   - Repository name: `kmanul-site`（なんでもOK）
   - **Public** を選ぶ（GitHub Pages 無料枠の条件）
   - 「Create repository」をクリック

---

## STEP 3 ｜ ファイルをアップロードする

### 方法A：ブラウザから（技術知識不要・おすすめ）

1. 作成したリポジトリのページを開く
2. 「uploading an existing file」リンクをクリック
3. `kmanul-site` フォルダの中身を**すべて**ドラッグ＆ドロップ
   （`index.html`, `manul-schole.html`, `ringo.html`, `sns.html`, `assets/` フォルダごと）
4. 「Commit changes」をクリック

### 方法B：Git コマンド（慣れている方向け）

```bash
git clone https://github.com/あなたのユーザー名/kmanul-site.git
cp -r kmanul-site/* kmanul-site-repo/
cd kmanul-site-repo
git add .
git commit -m "initial commit"
git push origin main
```

---

## STEP 4 ｜ GitHub Pages を有効にする

1. リポジトリの「Settings」タブを開く
2. 左メニュー「Pages」をクリック
3. 「Branch」を `main` に設定 → 「Save」
4. しばらく待つと
   `https://あなたのユーザー名.github.io/kmanul-site/`
   でサイトが公開されます

---

## STEP 5 ｜ kmanul.org ドメインを接続する

### 5-1. GitHub側でカスタムドメインを設定

1. Settings → Pages → 「Custom domain」欄に
   `kmanul.org` と入力 → Save
2. リポジトリのルートに `CNAME` ファイルが自動作成される（これは正常）

### 5-2. ドメイン管理画面でDNSを設定

ドメインを購入したレジストラ（お名前.com・Xserver・Cloudflare等）の
DNS管理画面で以下のレコードを追加してください：

#### Aレコード（4つすべて追加）
| タイプ | ホスト | 値 |
|--------|--------|-----|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

#### CNAMEレコード（www用）
| タイプ | ホスト | 値 |
|--------|--------|-----|
| CNAME | www | あなたのユーザー名.github.io |

### 5-3. HTTPS（SSL）を有効にする

DNS設定が反映されたら（最大48時間）：

1. GitHub Settings → Pages に戻る
2. 「Enforce HTTPS」チェックボックスにチェック
3. 完了！ `https://kmanul.org` でアクセスできるようになります

---

## STEP 6 ｜ コンテンツを更新する方法

HTMLファイルをテキストエディタ（VSCode推奨）で編集し、
GitHubにアップロードし直すだけです。

- お知らせ追加 → `index.html` の `news-list` セクションを編集
- SNSリンク更新 → `sns.html` の各カードの `href` を修正
- りんごの樹の情報追加 → `ringo.html` を編集

---

## よくある質問

**Q: ロゴが表示されない**
A: `assets/logo.png` が正しい場所にあるか確認してください。
   ファイル名は大文字小文字まで一致させてください。

**Q: ドメインが反映されない**
A: DNS反映には最大48時間かかります。
   確認サイト: https://dnschecker.org/#A/kmanul.org

**Q: お問い合わせフォームを動かしたい**
A: 現在フォームはデザインのみです。
   動作させるには Formspree（無料）がおすすめです：
   1. https://formspree.io でアカウント作成
   2. フォームIDを取得
   3. `manul-schole.html` の `<form>` タグに
      `action="https://formspree.io/f/あなたのID"` を追加

---

## サポートが必要な場合

各ページのお問い合わせフォームを動作させる設定や、
Googleアナリティクス設置など、追加対応が必要な場合は
引き続きお申し付けください。

---

© 2024 NPO法人 kimyo-na-manul
