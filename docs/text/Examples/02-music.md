# 音声挿入のやり方

## 挿入の手順

ここでは、音声を挿入するやり方について説明します。

まず、ファイルエクスプローラなどでこのプロジェクトの中に
`public/assets/other/FireWorks.mp3`というファイルがあることを確認してください。
今回はこれを表示します。

やり方としては、HTMLの記法で対応できます。

`<audio src="/assets/other/FireWorks.mp3" controls></audio>`
<audio src="/assets/other/FireWorks.mp3" controls></audio>


注意点としては、
- 音声はpublic以下に保存すること
- 挿入時のファイルの指定はpublicディレクトリからのパスを指定すること

が挙げられます。

## 具体例
音声を`public/assets/other/hogehoge/sample.mp3`という形で保存したとき、
`![sample](/assets/other/hogehoge/sample.mp3 "hogehoge.mp3")`で挿入することができます。
