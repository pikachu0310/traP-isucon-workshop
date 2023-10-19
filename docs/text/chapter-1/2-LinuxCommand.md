# Linuxの操作に慣れよう！

**基本的にLinuxコマンドを叩いて環境を操作するので、慣れておきましょう！**

以下に、超基本的なLinuxコマンドだけ載せておきます。
```shell
ssh isucon@000.00.000.000 # サーバーに接続(数字はサーバーのIPアドレスに置き換えて)
ls -la # ディレクトリ内のファイル一覧を表示
cd ~ # ディレクトリ移動
pwd # 現在のディレクトリを表示
mkdir directory # ディレクトリ作成
nano file.txt # ファイルを作成/編集
cat file.txt # ファイルの中身を表示
mv file.txt directory # ファイル移動
rm directory/file.txt # ファイル削除
rm directory -r # ディレクトリ削除
```

:::details Linuxコマンド慣れるのにオススメなゲームや教材
#### [Hacknet | Steam](https://store.steampowered.com/app/365450/Hacknet/?l=japanese)
ハッカーとしてサーバー上で操作をして進めていくゲーム。  
一部なんちゃってなコマンドもあるけれど、基本的な操作はLinuxコマンドと大体同じ。  
「コマンドを打つとめっちゃ文字が流れてくる」ことに慣れるのにおすすめ。  

#### [Bandit | OverTheWire](https://overthewire.org/wargames/bandit/)
実際にLinuxコマンドを使いながら問題を解いていく。  
全てのコマンドを覚える必要はないけれど、「こういうことができるコマンドがある」と知っておけるのは大事。

#### [Linux入門の入門 | さくら, 茗荷 |本 | 通販 | Amazon](https://www.amazon.co.jp/Linux%E5%85%A5%E9%96%80%E3%81%AE%E5%85%A5%E9%96%80-%E8%8C%97%E8%8D%B7-%E3%81%95%E3%81%8F%E3%82%89/dp/4873100941)
よく使うコマンドがまとまった小冊子。  
「こういう操作をしたいけれどなんのコマンドを使えばいいかわからない」というときは、この本をペラペラ眺めてみると良い。

:::