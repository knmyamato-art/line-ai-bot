const express = require('express');
const line = require('@line/bot-sdk');

const app = express();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events || [];

    await Promise.all(events.map(handleEvent));

    res.status(200).end(); // ← 必ず200を返す
  } catch (err) {
    console.error(err);
    res.status(200).end(); // ← エラーでも200返す（検証用）
  }
});

async function handleEvent(event) {
  if (!event || event.type !== 'message' || event.message.type !== 'text') {
    return;
  }

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: 'Webhook接続成功です！',
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
