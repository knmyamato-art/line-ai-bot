const express = require('express');
const line = require('@line/bot-sdk');

const app = express();

// 環境変数
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

// Webhookエンドポイント
app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events || [];

    await Promise.all(events.map(handleEvent));

    res.status(200).end();
  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(200).end(); // 検証エラー回避
  }
});

// イベント処理
async function handleEvent(event) {
  console.log("Event received:", JSON.stringify(event));

  if (event.type === 'message' && event.message.type === 'text') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'テスト返信成功🔥',
    });
  }

  return Promise.resolve(null);
}

// Render用ポート設定
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
