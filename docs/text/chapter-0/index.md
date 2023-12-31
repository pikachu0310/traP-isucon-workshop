# この講習会について + ISUCONについて
## この講習会の対象者
- ISUCONに初参加！でも何から始めたらいいか分からない～という方
- Web サーバーのチューニング(高速化)に興味がある方
- ISUCONってそもそも何だ？何も分からないけど、ちょっと興味あるよって方

## ISUCONってそもそも何？
**超簡単に言うと、**Web サーバーのチューニング(高速化)を競うコンテスト**です。**  

遅いウェブサービスがあるので、「ユーザーから見た挙動」を変更することなく、正しい挙動を維持したままレスポンスを高速にして欲しい、という要件に答えるために Web サーバーのチューニングを行うコンテストです。  

言い換えると、わざと激遅に作られたWebサービスが渡されるので、8時間という時間の中、最大3人チームでレギュレーションの中で限界までレスポンスを高速化し、その点数を競うコンテストです。優勝賞金は100万円！
:::tip ISUCONの正式名称
ISUCON(イスコン)は、「**いい感じに スピードアップ コンテスト**(**I**ikanjini **S**peed **U**p **Con**test)」の略です。本当です。
:::
:::tip 点数はどうやって付けられるの？
点数はベンチマーカーというツールによって計測されます。具体的には大量のリクエストを高速に送ることで負荷をかけ、正常なレスポンスなら点数アップ、正常でなければ点数ダウンのような形式で点数がつけられます。  
このリクエストが正常なら何点などの詳しい詳細は、当日配られるマニュアルに書いてあります。しかし、基本的には一番遅いところをどんどん改善していく事で、点数がどんどん上がっていくので、改善に集中しましょう。
:::
:::tip ISUCONは、アプリの実装がとても美しく書かれているため、勉強になる。
ISUCONでは、複数の言語で全く同じ実装がされたアプリケーションが配布されているので、好きな言語で参加できます。  
そして、各言語の思想に乗っ取って、とても美しく、激遅のコードが書かれています。もはやギャグですが、美しいコードであることには間違いないので、言語を学ぶ上での勉強にもなります。(by 公式ハンズオン)
:::
:::tip 予戦と本戦について
例年は、予戦と本戦と別れて開催されています。前回のISUCON12では、698組(うち学生98組)のチームが予戦に参加ました。この中から、本戦に行けるのはわずか30チームのみです。上位25チームと、上位25チームを除いた学生上位5チームが本戦に進出できます。狭き門なので、予戦突破を目標にする人も多いです。
ところが、今年度のISUCON13では、本戦のみの開催となりました。なので、ISUCON13に参加する人は全員本戦出場です！楽しみ～～～～～！
:::

## この講習会の目標
- **本番で1つ以上の改善を行えるようになる！**
- 公式解説や参加者writeupを理解できる/実践できるようになるための**基礎知識を学ぶ。**
:::warning
※優勝したり上位に入るためのテクニックは扱いません。
:::

## ISUCONに参加する上での気持ちについて
- 初参加で完璧にやろうと気負わなくていい！
- **本番でなんらかの改善を入れて、少しでも点数を上げられれば、十分すぎるくらい凄い！**
- ~~最近は学生枠での本戦出場もすごく難しい…… (学生つよつよも多い、**主にtraP**)~~ 今年は全員本戦です！

:::tip はじめてのことを試して学ぼう！
「やったことがないことはやらない」は**勝つため**には重要です。  
しかし、ISUCON初参加/web初心者は **「やったことがない」にぶつかるのは当たり前です。**

大会の時間中に「やったことはないけれど、これで改善できるかもしれない」まで至れるのはとても良いことです。  
はじめてのことを試してみて、それで学びを得られのであれば、十分参加の意義があります。
:::