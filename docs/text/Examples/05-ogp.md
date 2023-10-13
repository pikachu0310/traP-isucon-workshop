<script setup>
        import OGPComponent from '/.vitepress/components/ogp.vue'
</script>

# リンクカードの挿入について

## 挿入の手順

このこのテンプレート環境では、リンクカードを簡単に挿入することができます。

やり方は次のとおりです。

1. リンクカードを挿入したいmdファイルの冒頭に次のように記述します。

```html
    <script setup>
        import OGPComponent from '/.vitepress/components/ogp.vue'
</script>
```

2. リンクカードを挿入したいところに、次のように記述します。

```html
<OGPComponent url="https://trap.jp/" />
```

3. これでリンクカードが挿入されます。
<OGPComponent url="https://trap.jp/" />

4. 例
<OGPComponent url="https://twitter.com/traPtitech" />

## リンクカードの挿入についての注意点

この機能を利用する際には、次の点に注意してください。
- 一部のサイトでは、OGPのデータが表示されない場合があります。

- {fork_repository}-serverというshowcaseアプリを起動する必要があります。

詳しくは[配信の仕方](/text/chapter-1/#配信)を参照してください。

また、具体的な設定は[このプロジェクトの設定](https://ns.trap.jp/repos/e20c2f996b5d70917b8cfd)も参考にしてください。