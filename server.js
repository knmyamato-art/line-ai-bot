const express = require('express');
const line = require('@line/bot-sdk');

const app = express();

// 環境変数
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

// ユーザー状態保存
const userStates = {};

// Webhook
app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events || [];
    await Promise.all(events.map(handleEvent));
    res.status(200).end();
  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(200).end();
  }
});

// イベント処理
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  const userMessage = event.message.text;

  if (!userStates[userId]) {
    userStates[userId] = { step: 1 };

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'こんにちは！\n不動産についてのご相談ですね。\n\n①売却\n②購入\n③相続\n④投資用\n\n番号でお選びください。',
    });
  }

  const state = userStates[userId];

  if (state.step === 1) {
    const types = {
      "1": "売却",
      "2": "購入",
      "3": "相続",
      "4": "投資用"
    };

    if (!types[userMessage]) {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '番号でお選びください。\n①売却\n②購入\n③相続\n④投資用'
      });
    }

    state.category = types[userMessage];
    state.step = 2;

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `${state.category}のご相談ですね。\n物件のエリア（市区町村）を教えてください。`
    });
  }

  if (state.step === 2) {
    state.area = userMessage;
    state.step = 3;

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '物件種別を教えてください。\n（例：戸建て / マンション / 土地 / アパート一棟など）'
    });
  }

  if (state.step === 3) {
    state.propertyType = userMessage;
    state.step = 4;

    if (state.category === "売却") {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '築年数は何年くらいですか？'
      });
    }

    if (state.category === "購入") {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'ご予算はいくらくらいをお考えですか？'
      });
    }

    if (state.category === "相続") {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '相続人は何名いらっしゃいますか？'
      });
    }

    if (state.category === "投資用") {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'ご希望の利回りはどれくらいですか？'
      });
    }
  }

  if (state.step === 4) {
    state.detail = userMessage;

    console.log("不動産ヒアリング結果:", state);

    delete userStates[userId];

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'ヒアリングありがとうございました！\n担当者よりご連絡いたします。'
    });
  }
}

// Render用ポート
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
