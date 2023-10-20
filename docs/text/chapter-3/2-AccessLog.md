# アクセスログを導入して、計測する

## nginx について
nginxはWebサーバーアプリケーションで、リバースプロキシやロードバランサ、HTTPキャッシュなどの様々な機能を持っています。
ISUCONでは、サーバーに来たリクエストをメインのアプリケーションに転送するリバースプロキシとして初期状態から稼働していることが多いです。

現在の状態では、`:80`に来たリクエストを`:8000`で稼働している`isucari.golang.service`に転送する設定がされています。

## アクセスログ集計ツールの導入
今回は`alp`というアクセスログ集計ツールを使います。  
URLごとの処理時間の合計や平均、何回リクエストが来たかなどを見やすく集計してくれます。  

```shell
mkdir ~/tools && cd ~/tools
wget https://github.com/tkuchiki/alp/releases/download/v1.0.21/alp_linux_amd64.tar.gz
tar zxvf alp_linux_amd64.tar.gz
sudo install alp /usr/local/bin
```

## nginx のアクセスログの形式を変更する
nginx のアクセスログの形式を変更します。  
`/etc/nginx/nginx.conf`を開き、以下のように変更します。
```
log_format ltsv "time:$time_local"
                "\thost:$remote_addr"
                "\tforwardedfor:$http_x_forwarded_for"
                "\treq:$request"
                "\tstatus:$status"
                "\tmethod:$request_method"
                "\turi:$request_uri"
                "\tsize:$body_bytes_sent"
                "\treferer:$http_referer"
                "\tua:$http_user_agent"
                "\treqtime:$request_time"
                "\tcache:$upstream_http_x_cache"
                "\truntime:$upstream_http_x_runtime"
                "\tapptime:$upstream_response_time"
                "\tvhost:$host";

access_log /var/log/nginx/access.log ltsv;
```
```shell
sudo nano /etc/nginx/nginx.conf
```
