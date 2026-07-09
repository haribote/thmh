# Tehon-Mihon (thmh)

[English](README.md) | [日本語](README.ja.md)

AI 時代に最適化された UI コンポーネントカタログです。
コードからカタログを自動生成し、Vite プラグインとして配信し、MCP でエージェントに公開します。

## 概要

thmh はコンポーネントのコードを直接読みます。
型とバリアント定義を静的解析してバリアントの全組み合わせを生成するため、Story を 1 行も書く必要はありません。

カタログはアプリ本体の Vite dev サーバーに同居します。
`vite.config.ts` にプラグインを 1 行加えるだけで、alias、Tailwind、環境変数といったアプリ本体の設定をそのまま継承するため、設定の二重管理が消えます。

解析結果は `catalog.json` に集約されます。
人間向けの UI、エージェント向けの MCP サーバー、CI での検証は、いずれもこの `catalog.json` を唯一のソースとして動作します。

MCP サーバーは `search_components` や `get_component_detail` といったツールを公開します。
コーディングエージェントが既存のコンポーネントを検索して再利用できるため、AI が似たコンポーネントを乱造する問題を避けられます。

カタログ UI は `/__thmh/` で配信されます。
アプリを持たないリポジトリ、たとえばデザインシステム専用のリポジトリでは、代わりに `thmh` CLI を使えます。

## 名前について

Tehon-Mihon は「手本・見本」。日本語です。

AI にとっての UI 実装ガイドラインとしての **手本**。
エージェントが従うべき模範を示します。

人間にとってのビジュアルカタログとしての **見本**。
人が見て理解するためのサンプルを並べます。

一つのマニフェストから二冊の本が同時に生まれます。

## 動かしてみる

前提として、Node.js 24 以上と pnpm 11 が必要です(バージョンは `package.json` の `packageManager` に従います)。

```bash
git clone <このリポジトリ> && cd thmh
pnpm install
pnpm build
pnpm dev:example
```

`dev:example` は各パッケージをビルドしたうえで、`examples/react-app` の Vite dev サーバーを起動します。
起動したら、次の URL を開いてください。

- `http://localhost:5173/`: サンプルアプリ本体です。
- `http://localhost:5173/__thmh/`: カタログです。サンプルの `Button` が、バリアントごとにすべてレンダリングされた状態で並びます。
- `http://localhost:5173/__thmh/api/catalog.json`: 同じ情報をマニフェストとして取得できます。

`examples/react-app/src/components/ui/button.tsx` を編集して保存すると、数秒でカタログが再解析され、画面が自動的に更新されます。
dev サーバーの再起動は不要です。

dev サーバーを立てずにマニフェストだけを生成したい場合は、ビルド済みのアプリに対して CLI を実行してください。

```bash
node packages/thmh/dist/cli.js build --root examples/react-app --out catalog.json
```

テストは次のコマンドで実行できます。

```bash
pnpm test
```
