/* NOLA AI companion brain: intent parsing (log readings from natural language with confirmation),
   safe guidance (AHA / ADA), personal "why" rationale, context for the optional AI model, memory & feedback.
   It never diagnoses, never prescribes, never changes medication. */
(function () {
  const DB = () => window.NolaDB, E = () => window.NolaEngine, F = () => window.NolaFoods, P = () => window.NolaPlanner, INS = () => window.NolaInsights;
  const DAY = 864e5;
  const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
  const L = () => I18N.lang;
  /* ---------- intent parsing ---------- */
  function parse(text, unit) {
    const q = String(text || '').trim(), lq = q.toLowerCase();
    // memory: likes / dislikes
    let m = lq.match(/\bi\s+(?:really\s+)?(?:don'?t|do not|dont)\s+(?:like|eat|want)\s+([a-z\u1200-\u137f' ]{2,30})/i) || q.match(/([\u1200-\u137f ]{2,20})\s*አልወድም/);
    if (m) return { kind: 'dislike', value: clean(m[1]) };
    m = lq.match(/\bi\s+(?:really\s+)?(?:like|love|enjoy)\s+([a-z\u1200-\u137f' ]{2,30})/i) || q.match(/([\u1200-\u137f ]{2,20})\s*(?:እወዳለሁ|እወዳለው)/);
    if (m && !/\bto\b/.test(m[1])) return { kind: 'like', value: clean(m[1]) };
    // blood pressure numbers
    m = q.match(/(\d{2,3})\s*(?:\/|over|በ|ላይ)\s*(\d{2,3})/i);
    if (m) {
      const s = +m[1], d = +m[2];
      if (s >= 60 && s <= 260 && d >= 30 && d <= 180 && s > d) {
        const pm = q.match(/(?:pulse|heart ?rate|hr|ምት)\D{0,10}(\d{2,3})/i);
        return { kind: 'bp', sys: s, dia: d, pulse: pm ? +pm[1] : null };
      }
    }
    // glucose numbers
    m = q.match(/(sugar|glucose|\bbg\b|ስኳር|ግሉኮስ)[^\d]{0,30}(\d{1,3}(?:[.,]\d)?)/i) || q.match(/(\d{1,3}(?:[.,]\d)?)\s*(mg\/?dl|mmol)/i);
    if (m) {
      const raw = m[1] && /\d/.test(m[1]) ? m[1] : m[2]; let v = parseFloat(String(raw).replace(',', '.'));
      const mm = /mmol/i.test(q) || (v < 35 && /[.,]/.test(raw)) || (unit === 'mmol' && v < 35);
      const mg = Math.round(mm ? v * 18 : v);
      if (mg >= 20 && mg <= 700) {
        const ctx = /fasting|morning|woke|ጾም|ጠዋት|ባዶ ሆድ/i.test(q) ? 'fasting' : /before|በፊት/i.test(q) ? 'before' : /after|post|በኋላ|ከተመገብኩ/i.test(q) ? 'after' : 'random';
        return { kind: 'glucose', mg, ctx, shown: E().fmtGlucose(mg, unit) };
      }
    }
    // weight
    m = q.match(/(weigh(?:t|ed)?|ክብደ[ትቴ]|ኪሎ)[^\d]{0,20}(\d{2,3}(?:[.,]\d)?)/i) || q.match(/(\d{2,3}(?:[.,]\d)?)\s*(kg|kilo|ኪሎ)/i);
    if (m) { const v = parseFloat(String(/\d/.test(m[1]) ? m[1] : m[2]).replace(',', '.')); if (v >= 20 && v <= 300) return { kind: 'weight', kg: v }; }
    // commands
    const cmds = [
      ['scan', /\bscan\b|open (the )?(camera|scanner)|take a (photo|picture)|ስካን|ካሜራ|ፎቶ አንሳ/i],
      ['record_bp', /(record|log|add|enter|save|track|መዝግብ|አስገባ|ልመዘግብ|መመዝገብ).{0,25}(blood pressure|\bbp\b|ግፊት)|(blood pressure|ግፊት).{0,15}(record|log|መዝግብ)/i],
      ['record_glucose', /(record|log|add|enter|save|track|መዝግብ|አስገባ).{0,25}(sugar|glucose|ስኳር)/i],
      ['today', /what (should|can|do) i eat today|eat today|today'?s (meals?|plan|menu)|ዛሬ ምን (ልብላ|እበላ|ልመገብ)/i],
      ['dinner', /(healthy )?dinner idea|idea for dinner|what (should|can) i (have|eat|cook) for dinner|for dinner|ለእራት|የእራት/i],
      ['report', /explain (my )?(latest |last |medical |lab |test |blood )?(report|results?|readings?|summary|numbers)|my (latest |medical |lab )?report|medical report|lab results?|health summary|ሪፖርቴን|ሪፖርት|ማጠቃለያ|ውጤቴን/i],
      ['restaurant', /restaurant|menu|eating out|ምግብ ቤት|ሬስቶራንት|ሜኑ/i],
      ['budget', /budget|cheap|afford|birr|\betb\b|በጀት|ርካሽ|ብር/i],
    ];
    for (const [k, re] of cmds) if (re.test(q)) return { kind: 'cmd', cmd: k };
    return null;
  }
  function clean(s) { return String(s).replace(/\b(very much|so much|anymore|a lot|at all|much|too|please)\b/gi, '').replace(/[.!?,]+$/, '').trim(); }

  /* ---------- guidance ---------- */
  function bpCat(s, d) { if (s >= 180 || d >= 120) return 'crisis'; if (s >= 140 || d >= 90) return 'stage2'; if (s >= 130 || d >= 80) return 'stage1'; if (s >= 120) return 'elevated'; if (s < 90 || d < 60) return 'low'; return 'normal'; }
  function bpGuidance(sys, dia) {
    const cat = bpCat(sys, dia), rs = DB().get('readings', []).filter(r => r.type === 'bp' && Date.now() - r.ts < 14 * DAY);
    const high = rs.filter(r => r.sys >= 140 || r.dia >= 90).length;
    const lines = [t('nai_bp_saved', { v: sys + '/' + dia }), t('nai_bp_cat_' + cat)];
    if (['elevated', 'stage1', 'stage2', 'crisis', 'low'].includes(cat)) lines.push(t('nai_bp_repeat'));
    if (high >= 2) lines.push(t('nai_bp_pattern', { n: high }));
    else if (cat === 'stage2') lines.push(t('nai_bp_discuss'));
    if (['stage1', 'stage2', 'crisis'].includes(cat)) lines.push(t('nai_no_meds'));
    return { text: lines.join('\n'), why: [t('nai_why_bp')], sources: ['AHA 2017/2025 BP categories'] };
  }
  function glucoseGuidance(mg, ctx, unit) {
    const pr = DB().get('profile', {}), dm = E().isDiabetic(pr), v = E().fmtGlucose(mg, unit), lines = [t('nai_g_saved', { v, ctx: t('ctx_' + ctx) })];
    const lo = E().fmtGlucose(80, unit), hi = E().fmtGlucose(130, unit), post = E().fmtGlucose(180, unit);
    if (mg < 70) lines.push(t('nai_g_low'));
    else if (mg >= 250) lines.push(t('nai_g_veryhigh'));
    else if (dm) {
      if (ctx === 'after') lines.push(mg < 180 ? t('nai_g_in_after', { post }) : t('nai_g_above_after', { post }));
      else if (ctx === 'random') lines.push(mg < 180 ? t('nai_g_in_random') : t('nai_g_above_after', { post }));
      else lines.push(mg >= 80 && mg <= 130 ? t('nai_g_in_pre', { lo, hi }) : mg < 80 ? t('nai_g_below_pre', { lo, hi }) : t('nai_g_above_pre', { lo, hi }));
    } else {
      if ((ctx === 'fasting' || ctx === 'before') && mg >= 100) lines.push(t('nai_g_nondm_above'));
      else if (ctx !== 'fasting' && ctx !== 'before' && mg >= 140) lines.push(t('nai_g_nondm_above_after'));
      else lines.push(t('nai_g_nondm_ok'));
    }
    lines.push(t('nai_g_snapshot'));
    return { text: lines.join('\n'), why: [t(dm ? 'nai_why_g_dm' : 'nai_why_g')], sources: ['ADA Standards of Care 2025'] };
  }
  /* ---------- suggestions ---------- */
  function recentFoodIds(days) { const since = Date.now() - days * DAY; return new Set(DB().get('meals', []).filter(m => m.ts >= since).flatMap(m => m.items.map(i => i.foodId))); }
  function bestDish(slot, pr, exclude = []) {
    const PL = P(), recent = INS().memOn('meals') ? recentFoodIds(2) : new Set(), fastWD = (pr.restrictions || []).includes('fasting'), dow = new Date().getDay();
    const fastingDay = fastWD && (dow === 3 || dow === 5);
    const prices = PL.prices();
    const cands = PL.DISHES.filter(d => d.slots.includes(PL.SLOT[slot]) && PL.allowed(d, pr, fastingDay) && !exclude.includes(d.id)).map(d => {
      const items = PL.dishItems(d, pr), a = E().analyze(items, pr, slot);
      const cost = Object.entries(d.ing).reduce((s, [k, q]) => s + q * prices[k], 0);
      const s = { good: 0, adjust: 1, alt: 2 }[a.verdict] * 50 + (recent.has(d.items[0][0]) ? 25 : 0) + (INS().memOn('prefs') ? PL.prefScore(d) : 0) + cost / 10;
      return { d, a, s, cost };
    }).sort((x, y) => x.s - y.s);
    return { pick: cands[0], fastingDay };
  }
  function dishLine(x) { return `**${x.d.name[L()] || x.d.name.en}** — ${t('verdict_' + x.a.verdict)} · ~${Math.round(x.a.totals.kcal)} kcal · ~${Math.round(x.cost)} ETB*`; }
  function today(pr) {
    const plan = DB().get('plan'), key = new Date().toDateString();
    const pd = plan && plan.days.find(d => new Date(d.date).toDateString() === key);
    const lines = [t('nai_today_title')], why = [];
    if (pd) {
      ['breakfast', 'lunch', 'dinner', 'snack'].forEach(s => { const m = pd.meals[s]; if (m) { const d = P().dish(m.dish); lines.push(`• ${t('meal_' + s)}: **${d.name[L()] || d.name.en}** (${t('verdict_' + m.verdict)}, ~${Math.round(m.cost)} ETB*)`); } });
      why.push(t('nai_why_from_plan'));
    } else {
      let fd = false; const used = [];
      ['breakfast', 'lunch', 'dinner', 'snack'].forEach(s => { const r = bestDish(s, pr, used); fd = fd || r.fastingDay; if (r.pick) { used.push(r.pick.d.id); lines.push(`• ${t('meal_' + s)}: ${dishLine(r.pick)}`); } });
      if (fd) why.push(t('nai_why_fasting_day'));
    }
    why.push(...personalWhy(pr));
    lines.push(t('nai_price_note'));
    return { text: lines.join('\n'), why, sources: ['ADA Plate Method', 'WHO', 'AHA'], links: [['planner', t('hub_planner')]] };
  }
  function dinner(pr) {
    const r = bestDish('dinner', pr, []), r2 = bestDish('dinner', pr, r.pick ? [r.pick.d.id] : []);
    const lines = [t('nai_dinner_title')];
    if (r.pick) lines.push('1. ' + dishLine(r.pick)); if (r2.pick) lines.push('2. ' + dishLine(r2.pick));
    lines.push(t('nai_dinner_tip'), t('nai_price_note'));
    const why = personalWhy(pr); if (r.fastingDay) why.unshift(t('nai_why_fasting_day'));
    return { text: lines.join('\n'), why, sources: ['ADA Plate Method', 'AHA'], fbRef: r.pick ? r.pick.d.id : null };
  }
  function personalWhy(pr) {
    const out = [], c = pr.conditions || [], T = E().targets(pr);
    if (E().isDiabetic(pr)) out.push(t('nai_why_dm', { c: T.c }));
    if (c.includes('htn')) out.push(t('nai_why_htn', { na: T.na }));
    if (c.includes('chol') || c.includes('heart')) out.push(t('nai_why_chol'));
    if (c.includes('kidney')) out.push(t('nai_why_kidney'));
    if ((pr.goals || []).includes('lose') || c.includes('obesity')) out.push(t('nai_why_lose', { kcal: T.kcal }));
    if ((pr.allergies || []).length) out.push(t('nai_why_allergy', { a: pr.allergies.map(a => t('a_' + a)).join(', ') }));
    const mem = DB().get('memory', {});
    if (INS().memOn('prefs') && (mem.dislikes || []).length) out.push(t('nai_why_dislikes', { x: mem.dislikes.join(', ') }));
    if (INS().memOn('meals')) { const fm = INS().foodMemory(); if (fm.thisW && fm.thisW.na > T.na && c.includes('htn')) out.push(t('nai_why_na_week', { na: Math.round(fm.thisW.na), t: T.na })); }
    if (!out.length) out.push(t('nai_why_general'));
    return out;
  }
  function report(pr, unit) {
    const s = INS().periodSummary(7), s30 = INS().periodSummary(30), lines = [t('nai_rep_title')], why = [];
    const rs = DB().get('readings', []), last = ty => rs.filter(r => r.type === ty).sort((a, b) => b.ts - a.ts)[0];
    const bp = last('bp'), g = last('glucose'), w = last('weight');
    if (bp) lines.push(t('nai_rep_bp', { v: bp.sys + '/' + bp.dia, cat: t('bpcat_' + bpCat(bp.sys, bp.dia)), avg: s.bpAvg || '—', n: s.bpN }));
    if (g) lines.push(t('nai_rep_g', { v: E().fmtGlucose(g.mg, unit), ctx: t('ctx_' + (g.ctx || 'random')), avg: s.glAvg ? E().fmtGlucose(s.glAvg, unit) : '—', n: s.glN }));
    if (w) lines.push(t('nai_rep_w', { v: w.kg, ch: s30.wtChange != null ? (s30.wtChange > 0 ? '+' : '') + s30.wtChange + ' kg' : '—' }));
    lines.push(t('nai_rep_meals', { n: s.meals, good: s.good, na: s.naAvg != null ? s.naAvg : '—', t: s.naT }));
    const gi = INS().glucoseInsights(); if (gi.n) lines.push(t('nai_rep_glog', { n: gi.n, rise: gi.avgRise }));
    if (!bp && !g && !s.meals) lines.push(t('nai_rep_empty'));
    lines.push(t('nai_rep_next'), t('nai_rep_labs_hint'));
    why.push(t('nai_why_report'));
    return { text: lines.join('\n'), why, sources: ['AHA', 'ADA'], links: [['labs', t('lab_title')], ['report', t('rep_title')], ['journey', t('hub_journey')]] };
  }
  /* ---------- rule-based answer with why ---------- */
  function answer(q, pr) {
    const a = window.NolaCoach.answer(q, pr, L()), topic = window.NolaCoach.detect(q);
    const why = topic === 'meds' ? [t('nai_why_meds')] : personalWhy(pr);
    const fb = feedbackFor(topic); if (fb < 0) a.text += '\n\n' + t('nai_fb_adjust');
    return { text: a.text, sources: a.sources, why, topic };
  }
  /* ---------- AI context ---------- */
  function context(pr, unit) {
    const parts = [], mem = DB().get('memory', {});
    if (INS().memOn('meals')) {
      const since = Date.now() - 7 * DAY, ms = DB().get('meals', []).filter(m => m.ts >= since).slice(-14);
      if (ms.length) parts.push('MEALS LAST 7 DAYS (user-logged, estimates): ' + ms.map(m => `${new Date(m.ts).toDateString()} ${m.meal}: ${m.items.map(i => i.foodId ? F().byId[i.foodId].name.en : i.name).join(' + ')} (${Math.round(m.totals.kcal)} kcal, ${Math.round(m.totals.na)} mg Na, verdict ${m.verdict})`).join('; '));
      const fm = INS().foodMemory(); parts.push(`FOOD MEMORY: variety score ${fm.variety}/100; high-sodium meals this week ${fm.highNa}; sugary drinks this week ${fm.sugary}.`);
    }
    if (INS().memOn('readings')) {
      const rs = DB().get('readings', []).sort((a, b) => b.ts - a.ts);
      const bp = rs.filter(r => r.type === 'bp').slice(0, 5).map(r => `${r.sys}/${r.dia} (${new Date(r.ts).toDateString()})`), g = rs.filter(r => r.type === 'glucose').slice(0, 5).map(r => `${E().fmtGlucose(r.mg, unit)} ${r.ctx || ''} (${new Date(r.ts).toDateString()})`), w = rs.filter(r => r.type === 'weight').slice(0, 3).map(r => r.kg + ' kg');
      parts.push(`RECENT READINGS (self-measured): BP ${bp.join(', ') || 'none'}; glucose ${g.join(', ') || 'none'}; weight ${w.join(', ') || 'none'}.`);
      const gi = INS().glucoseInsights(); if (gi.n) parts.push(`MEAL-GLUCOSE LOGS: ${gi.n} paired logs, average rise ${gi.avgRise} mg/dL. Do not predict; observations only.`);
    }
    if (INS().memOn('prefs')) parts.push(`LIKES: ${(mem.likes || []).join(', ') || 'none'}; DISLIKES (never suggest): ${(mem.dislikes || []).join(', ') || 'none'}.`);
    if (INS().memOn('feedback')) { const neg = Object.entries(fbByTopic()).filter(([, v]) => v < 0).map(([k]) => k); if (neg.length) parts.push('User found earlier answers on these topics unhelpful; adjust style: ' + neg.join(', ')); }
    const plan = DB().get('plan'); if (plan) parts.push(`BUDGET: about ${Math.round(plan.daily)} ETB/day for ${plan.people} person(s).`);
    return parts.join('\n') + `\nALWAYS: end with a short line starting "Why:" explaining which of the user's data or which guideline led to the advice. Never diagnose, never prescribe or change medication, never invent lab results, never guarantee recovery; if readings are repeatedly high or there are red-flag symptoms, recommend a health professional (Ethiopia ambulance 907).`;
  }
  /* ---------- feedback ---------- */
  function fbByTopic() { const o = {}; DB().get('feedback', []).filter(x => x.kind === 'chat').forEach(x => { o[x.topic || 'default'] = (o[x.topic || 'default'] || 0) + x.vote; }); return o; }
  function feedbackFor(topic) { if (!INS().memOn('feedback')) return 0; return fbByTopic()[topic] || 0; }
  function addFeedback(kind, ref, vote, extra) {
    if (!INS().memOn('feedback')) return false;
    const list = DB().get('feedback', []).filter(x => !(x.kind === kind && x.ref === ref));
    list.push(Object.assign({ kind, ref, vote, ts: Date.now() }, extra || {})); DB().set('feedback', list.slice(-300)); return true;
  }
  function remember(kind, value) {
    const mem = Object.assign({ likes: [], dislikes: [], off: {} }, DB().get('memory', {}));
    const v = value.toLowerCase(); mem.likes = (mem.likes || []).filter(x => x !== v); mem.dislikes = (mem.dislikes || []).filter(x => x !== v);
    (kind === 'like' ? mem.likes : mem.dislikes).push(v); DB().set('memory', mem);
  }
  window.NolaBrain = { parse, bpCat, bpGuidance, glucoseGuidance, today, dinner, report, answer, context, personalWhy, addFeedback, remember, feedbackFor };
})();
