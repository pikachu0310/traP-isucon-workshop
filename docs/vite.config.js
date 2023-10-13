// vite.config.js

module.exports = {
    server: {
        proxy: {
            // 開発環境のプロキシ設定
            '/api': {
                target: 'http://localhost:3000/',
            }
        }
    },
    // build: {
    //     // ビルド環境の設定
    //     // ...
    // }
}
