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

  let advice = "";

  if (state.category === "売却") {
    const years = parseInt(userMessage);

    if (!isNaN(years)) {
      if (years >= 20) {
        advice = "築20年以上の場合、リフォーム有無で価格が大きく変わります。現状売却かリフォーム後売却か比較検討がおすすめです。";
      } else {
        advice = "比較的新しい物件は市場評価が安定しています。近隣相場との比較が重要です。";
      }
    } else {
      advice = "築年数に応じて価格戦略が変わります。詳細査定をおすすめします。";
    }
  }

  if (state.category === "購入") {
    advice = "購入時は物件価格だけでなく、諸費用（約7〜10%）も考慮する必要があります。住宅ローンの事前審査も重要です。";
  }

  if (state.category === "相続") {
    const heirs = parseInt(userMessage);

    if (!isNaN(heirs) && heirs > 1) {
      advice = "相続人が複数いる場合、共有名義によるトラブルを避けるため早めの協議がおすすめです。";
    } else {
      advice = "単独相続の場合でも名義変更や税務手続きが必要です。期限に注意しましょう。";
    }
  }

  if (state.category === "投資用") {
    const yieldValue = parseFloat(userMessage);

    if (!isNaN(yieldValue)) {
      if (yieldValue < 5) {
        advice = "利回り5%未満の場合、エリア将来性や資産価値重視の投資戦略が考えられます。";
      } else if (yieldValue >= 5 && yieldValue < 8) {
        advice = "標準的な利回り水準です。空室リスクと管理費を確認しましょう。";
      } else {
        advice = "高利回り物件はリスクも高い可能性があります。立地や築年数の確認が重要です。";
      }
    } else {
      advice = "想定利回りによって投資戦略は変わります。詳細分析がおすすめです。";
    }
  }

  const summary =
    `【ヒアリング内容】\n` +
    `種別：${state.category}\n` +
    `エリア：${state.area}\n` +
    `物件種別：${state.propertyType}\n\n` +
    `【簡易AI診断】\n${advice}`;

  delete userStates[userId];

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: summary
  });
}
