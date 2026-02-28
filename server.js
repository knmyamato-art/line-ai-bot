const express = require('express');
const line = require('@line/bot-sdk');

const app = express();

// ===== 環境変数 =====
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);

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

  // 初回メッセージ
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

  // ===== STEP1：種別選択 =====
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

  // ===== STEP2：エリア =====
  if (state.step === 2) {
    state.area = userMessage;
    state.step = 3;

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '物件種別を教えてください。\n（例：戸建て / マンション / 土地 / 一棟アパートなど）'
    });
  }

  // ===== STEP3：物件種別 =====
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

  // ===== STEP4：無料AI診断 =====
  if (state.step === 4) {
    state.detail = userMessage;

    let advice = "";

    if (state.category === "売却") {
      const years = parseInt(userMessage);
      if (!isNaN(years)) {
        if (years >= 20) {
          advice = "築20年以上はリフォーム有無で価格差が出やすいです。現状売却と改装後売却の比較がおすすめです。";
        } else {
          advice = "築浅物件は市場評価が安定しています。近隣成約事例の確認が重要です。";
        }
      } else {
        advice = "築年数に応じた価格戦略が重要です。詳細査定をおすすめします。";
      }
    }

    if (state.category === "購入") {
      advice = "物件価格に加え諸費用（約7〜10%）を考慮してください。住宅ローン事前審査が重要です。";
    }

    if (state.category === "相続") {
      const heirs = parseInt(userMessage);
      if (!isNaN(heirs) && heirs > 1) {
        advice = "相続人が複数の場合は共有トラブル防止のため早期協議がおすすめです。";
      } else {
        advice = "単独相続でも名義変更や税務申告期限に注意が必要です。";
      }
    }

    if (state.category === "投資用") {
      const yieldValue = parseFloat(userMessage);
      if (!isNaN(yieldValue)) {
        if (yieldValue < 5) {
          advice = "利回り5%未満は資産価値重視型投資です。エリア将来性確認が重要です。";
        } else if (yieldValue < 8) {
          advice = "標準的利回りです。空室率と管理費を確認しましょう。";
        } else {
          advice = "高利回り物件はリスク要因（築年数・立地）を必ず確認してください。";
        }
      } else {
        advice = "利回りによって投資戦略が変わります。詳細分析がおすすめです。";
      }
    }

    const summary =
      "【ヒアリング内容】\n" +
      `種別：${state.category}\n` +
      `エリア：${state.area}\n` +
      `物件種別：${state.propertyType}\n\n` +
      "【簡易AI診断】\n" +
      advice;

    delete userStates[userId];

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: summary
    });
  }
}

// ===== サーバー起動（Render必須）=====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
