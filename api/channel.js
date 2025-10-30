// Vercelで実行されるNode.jsのサーバーレス関数です。
// 'youtubei.js'ライブラリをインポートし、YouTubeのチャンネル情報を取得します。

// YouTubeIクラスをインポート
const { YouTubeI } = require('youtubei.js');

/**
 * YouTubeのチャンネル情報を取得するサーバーレス関数
 * @param {object} req - HTTPリクエストオブジェクト
 * @param {object} res - HTTPレスポンスオブジェクト
 */
module.exports = async (req, res) => {
    // チャンネルIDを取得するためのヘルパー関数
    const getChannelId = () => {
        // GETリクエストのクエリパラメータ 'id' からチャンネルIDを取得します
        // 例: /api/channel?id=UC-gL3K6S5J99fE-Wq-s1_zQ
        if (req.query && req.query.id) {
            return req.query.id;
        }
        // POSTリクエストの場合はボディから取得することも可能ですが、ここではクエリパラメータに限定します
        return null;
    };

    const channelId = getChannelId();

    // チャンネルIDが指定されていない場合のエラー処理
    if (!channelId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: "チャンネルIDが指定されていません。",
            usage: "クエリパラメータ 'id' にチャンネルIDを含めてください。例: /api/channel?id=UC-gL3K6S5J99fE-Wq-s1_zQ"
        }));
        return;
    }

    // APIクライアントの初期化
    let youtube;
    try {
        youtube = await new YouTubeI().init();
    } catch (error) {
        console.error("YouTubeIの初期化エラー:", error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: "サーバー側でYouTube APIクライアントの初期化に失敗しました。",
            details: error.message 
        }));
        return;
    }

    console.log(`チャンネルID: ${channelId} の情報を検索中...`);

    // チャンネル情報の取得
    try {
        // getChannelDetails()はチャンネルに関するすべての公開情報を返します
        const channelDetails = await youtube.getChannelDetails(channelId);

        // 成功: 取得したすべての情報をJSONで返します
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: "success",
            channel_id: channelId,
            data: channelDetails
        }, null, 2)); // JSONを整形して表示します

    } catch (error) {
        console.error(`チャンネルID ${channelId} の取得エラー:`, error);

        // チャンネルが見つからない、またはその他のAPIエラーの場合
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: "チャンネル情報の取得に失敗しました。",
            details: error.message || "指定されたチャンネルIDが見つからないか、API呼び出しでエラーが発生しました。",
            channel_id: channelId
        }));
    }
};
