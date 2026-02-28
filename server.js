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
