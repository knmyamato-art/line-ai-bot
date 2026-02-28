const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');

const app = express();

// ===== 環境変数 =====
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

// ===== ★ここにあなたのGAS URLを貼る =====
const GAS_URL = "ここに取得したAppsScriptのURLを貼る";

// ===== ユーザー状態保存（簡易メモリ）=====
const userStates = {};

// ===== Webhook =====
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

// ===== メイン処理 =====
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  const userMessage = event.message.text.trim();

  // ===== 初回 =====
  if (!userStates[userId]) {
    userStates[userId] = { step: 1 };

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text:
        '🏠 不動産AIヒアリングへようこそ\n\n' +
        'ご相談内容を選んでください。\n\n' +
        '① 売却\n' +
        '② 購入\n' +
        '③ 相続\n' +
        '④ 投資用\n\n' +
        '番号で入力してください。'
    });
  }

  const state = userStates[userId];

  // ===== STEP1 =====
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
        text: '番号で入力してください。\n①売却\n②購入\n③相続\n④投資用'
      });
    }

    state.category = types[userMessage];
    state.step = 2;

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: `${state.category}のご相談ですね。\n物件のエリア（市区町村）を教えてください。`
    });
  }

  // ===== STEP2 =====
  if (state.step === 2) {
    state.area = userMessage;
    state.step = 3;

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '物件種別を教えてください。（例：戸建て / マンション / 土地 / 一棟アパートなど）'
    });
  }

  // ===== STEP3 =====
  if (state.step === 3) {
    state.propertyType = userMessage;
    state.step = 4;

    if (state.category === "売却") {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '築年数は何年くらいですか？（数字で入力）'
      });
    }

    if (state.category === "購入") {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: 'ご予算はいくらを想定していますか？'
      });
    }

    if (state.category === "相続") {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '相続人は何名いらっしゃいますか？（数字で入力）'
      });
    }

    if (state.category === "投資用") {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '希望利回りは何％ですか？（例：6.5）'
      });
    }
  }

  // ===== STEP4 =====
  if (state.step === 4) {
    state.detail = userMessage;

    let advice = "";

    if (state.category === "売却") {
      advice = "売却成功のポイントは相場確認と販売戦略です。詳細査定をおすすめします。";
    }

    if (state.category === "購入") {
      advice = "購入時は物件価格に加え諸費用7〜10%を考慮しましょう。";
    }

    if (state.category === "相続") {
      advice = "相続は名義変更と税務申告期限に注意が必要です。";
    }

    if (state.category === "投資用") {
      advice = "利回りだけでなく空室率や管理費も確認しましょう。";
    }

    const summary =
      "【ヒアリング内容】\n" +
      `種別：${state.category}\n` +
      `エリア：${state.area}\n` +
      `物件種別：${state.propertyType}\n\n` +
      "【簡易AI診断】\n" +
      advice;

    // ===== Google Sheetsへ保存 =====
    try {
      await axios.post(GAS_URL, {
        userId: userId,
        category: state.category,
        area: state.area,
        propertyType: state.propertyType,
        detail: state.detail
      });
    } catch (error) {
      console.error("GAS保存エラー:", error.message);
    }

    delete userStates[userId];

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: summary
    });
  }
}

// ===== サーバー起動 =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
