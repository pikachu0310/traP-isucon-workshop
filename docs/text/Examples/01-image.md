# 画像挿入のやり方

## 挿入の手順

ここでは、画像を挿入するやり方について説明します。

まず、ファイルエクスプローラなどでこのプロジェクトの中に
`public/assets/image/Mahalia_Jackthon.png`というファイルがあることを確認してください。
今回はこれを表示します。

最初から結論を出すと、普段のMDと同じように、

`![Mahalia_Jackthon](/assets/image/Mahalia_Jackthon.png "Mahalia_Jackthon")`で挿入することができます。
![Mahalia_Jackthon](/assets/image/Mahalia_Jackthon.png "Mahalia_Jackthon")

注意点としては、
- 画像はpublic以下に保存すること
- 挿入時のファイルの指定はpublicディレクトリからのパスを指定すること

が挙げられます。

## 具体例
画像を`public/assets/image/hogehoge/sample.png`という形で保存したとき、
`![sample](/assets/image/hogehoge/sample.png "hogehoge.png")`で挿入することができます。


## HTMLがわかる人向け
MDからHTMLに変換しているので、HTMLの表現方法を使うこともできます。

`<img src="/assets/image/Mahalia_Jackthon.png" alt="Mahalia_Jackthon" title="Mahalia_Jackthon">`
<img src="/assets/image/Mahalia_Jackthon.png" alt="Mahalia_Jackthon" title="Mahalia_Jackthon">
