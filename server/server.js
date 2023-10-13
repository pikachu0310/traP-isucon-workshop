const express = require('express');
const ogs = require('open-graph-scraper');
const app = express();
const userAgent ='bot'

const ogpCache = {}; // OGPデータを格納するオブジェクト
const cacheDuration = 3600000*24; // キャッシュの有効期間（ミリ秒単位、24時間）



app.get('/api/ogp', async (req, res) => {
    const url = req.query.url;

    // キャッシュに保存されている場合、キャッシュを返す
    if (ogpCache[url] && Date.now() - ogpCache[url].timestamp < cacheDuration) {
        console.log('Returning cached OGP data');
        res.json(ogpCache[url].data);
        return;
    }

    const options = { url: url ,fetchOptions: { headers: { 'user-agent': userAgent } }};
    ogs(options)
        .then((data) => {
            const { error, result } = data;
            if (error) {
                console.error('Error fetching OGP:', error);
                res.status(500).json({ error: 'Failed to fetch OGP' });
            } else {
                const ogImage = result.ogImage;
                const twitterImage = result.twitterImage;

                let imageUrl = null;
                if (ogImage && ogImage.length > 0) {
                    imageUrl = ogImage[0].url;
                } else if (twitterImage && twitterImage.length > 0) {
                    imageUrl = twitterImage[0].url;
                }

                const ogpData = {
                    title: result.ogTitle,
                    description: result.ogDescription,
                    image: imageUrl,
                };

                // キャッシュに保存
                ogpCache[url] = {
                    data: ogpData,
                    timestamp: Date.now(),
                };

                console.log('Fetched OGP data:', ogpData);
                res.json(ogpData);
            }
        })
        .catch((error) => {
            console.error('Error fetching OGP:', error);
            res.status(500).json({ error: 'Failed to fetch OGP' });
        });
});

app.listen(3000, () => {
    console.log('Backend server is running on port 3000');
});
