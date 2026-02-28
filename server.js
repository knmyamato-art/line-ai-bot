const userStates = {};

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

  // STEP1: 種類選択
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

  // STEP2: エリア
  if (state.step === 2) {
    state.area = userMessage;
    state.step = 3;

    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '物件種別を教えてください。\n（例：戸建て / マンション / 土地 / アパート一棟など）'
    });
  }

  // STEP3: 物件種別
  if (state.step === 3) {
    state.propertyType = userMessage;
    state.step = 4;

    // 分岐質問
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

  // STEP4: 最終回答
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
