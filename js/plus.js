/* NOLA HEALTH v5 logic (no DOM): meal plans, cook-today, budget, summaries, overdue records,
   goal fit, reminder routines, doctor helpers (glossary, symptoms, side effects, memory, summary).
   All nutrition values are ESTIMATES from the local food database. */
(function () {
  const E = () => window.NolaEngine, DI = () => window.NolaDishes, F = () => window.NolaFoods, t = (k, v) => window.I18N.t(k, v);
  const DAY = 864e5, SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];
  const dk = d => { d = new Date(d); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const STAPLE = ['salt', 'veg_oil', 'berbere', 'turmeric', 'tea', 'coffee', 'garlic', 'ginger', 'kibbeh', 'lemon'];

  /* ---------- dishes ---------- */
  const foodsOf = d => d.items.map(x => F().byId[x[0]]).filter(Boolean);
  const isAnimal = d => foodsOf(d).some(f => f.tags.includes('meat') || f.tags.includes('fish') || f.allergens.includes('egg'));
  const isVeg = d => !foodsOf(d).some(f => f.tags.includes('meat') || f.tags.includes('fish'));
  const isFasting = d => foodsOf(d).every(f => f.tags.includes('fasting') || f.tags.includes('vegan'));
  function dishCost(d) { const I = DI().ING; return Math.round(Object.entries(d.ing || {}).reduce((a, [k, q]) => a + (I[k] ? q * I[k][4] : 0), 0)); }
  const fastingOn = (pr, date) => (pr.restrictions || []).includes('fasting') && [3, 5].includes(new Date(date).getDay());
  function dietOk(d, diet) { return diet === 'veg' ? isVeg(d) : diet === 'nonveg' ? isAnimal(d) : true; }
  function score(d, pr, slot) {
    const items = DI().dishItems(d, pr), a = E().analyze(items, pr, slot), T = a.targets, x = a.totals;
    const sev = { good: 0, adjust: 1, alt: 2 }[a.verdict];
    const s = sev * 100 + (x.na / T.na) * 30 + (x.sf / T.sf) * 15 + (E().isDiabetic(pr) ? (x.c / (T.c * 0.33)) * 25 : 0) - Math.min(x.fb, 12) * 2 + (x.p >= 12 ? -4 : 0);
    return { d, items, a, s, sev, cost: dishCost(d) };
  }
  function candidates(pr, slot, o) {
    o = o || {}; const fd = o.date != null ? fastingOn(pr, o.date) : false;
    let list = DI().DISHES.filter(d => d.slots.includes(DI().SLOT[slot]) && DI().allowed(d, pr, fd) && dietOk(d, o.diet || 'any')).map(d => score(d, pr, slot));
    if (!list.length && o.diet && o.diet !== 'any') list = DI().DISHES.filter(d => d.slots.includes(DI().SLOT[slot]) && DI().allowed(d, pr, fd)).map(d => score(d, pr, slot));
    return list.sort((p, q) => p.s - q.s);
  }
  /* one day: best dish per slot with variety (used = {dishId: count}) and an optional budget (ETB / person / day) */
  function dayPlan(pr, o) {
    o = Object.assign({ diet: 'any', budget: 0, date: Date.now(), used: {}, fixed: {} }, o || {});
    const meals = {};
    SLOTS.forEach((slot, i) => {
      const c = candidates(pr, slot, o); if (!c.length) return;
      const fx = o.fixed[slot] && c.find(x => x.d.id === o.fixed[slot]);
      const pick = fx || c.map(x => Object.assign({}, x, { r: x.s + (o.used[x.d.id] || 0) * 45 + (Object.values(meals).some(m => m.d.id === x.d.id) ? 500 : 0) + (o.budget ? x.cost * 0.15 : 0) })).sort((p, q) => p.r - q.r)[0];
      meals[slot] = pick;
    });
    if (o.budget) {
      let guard = 0; const cost = () => Object.values(meals).reduce((a, m) => a + m.cost, 0);
      while (cost() > o.budget && guard++ < 8) {
        const slot = Object.keys(meals).filter(k => !o.fixed[k]).sort((p, q) => meals[q].cost - meals[p].cost)[0]; if (!slot) break;
        const cur = meals[slot], alt = candidates(pr, slot, o).filter(x => x.cost < cur.cost && x.d.id !== cur.d.id && x.sev <= Math.max(1, cur.sev)).sort((p, q) => p.cost - q.cost || p.s - q.s)[0];
        if (!alt) break; meals[slot] = alt;
      }
    }
    const all = Object.values(meals).flatMap(m => m.items), totals = E().mealTotals(all), T = E().targets(pr);
    return { date: dk(o.date), fasting: fastingOn(pr, o.date), meals, totals, targets: T, cost: Object.values(meals).reduce((a, m) => a + m.cost, 0), overBudget: !!o.budget && Object.values(meals).reduce((a, m) => a + m.cost, 0) > o.budget };
  }
  function weekPlan(pr, o) {
    const used = {}, days = [], start = new Date(); start.setHours(12, 0, 0, 0);
    for (let i = 0; i < 7; i++) { const p = dayPlan(pr, Object.assign({}, o, { date: +start + i * DAY, used, fixed: {} })); Object.values(p.meals).forEach(m => used[m.d.id] = (used[m.d.id] || 0) + 1); days.push(p); }
    return days;
  }
  function alternatives(pr, slot, notIds, o) { return candidates(pr, slot, o).filter(x => !notIds.includes(x.d.id)).slice(0, 2); }
  function affordable(pr, slot, o) { return candidates(pr, slot, o).filter(x => x.sev === 0).sort((p, q) => p.cost - q.cost).slice(0, 3); }
  /* What can I cook today? have = ingredient ids at home */
  const mainIng = d => Object.keys(d.ing || {}).filter(k => !STAPLE.includes(k));
  function pantry() { const I = DI().ING; return Object.keys(I).filter(k => !STAPLE.includes(k) && DI().DISHES.some(d => d.ing[k] != null)); }
  function cookToday(pr, have, o) {
    have = have || []; if (!have.length) return [];
    return DI().DISHES.filter(d => DI().allowed(d, pr, false) && dietOk(d, (o && o.diet) || 'any')).map(d => {
      const need = mainIng(d), missing = need.filter(k => !have.includes(k)), slot = { b: 'breakfast', l: 'lunch', d: 'dinner', s: 'snack' }[d.slots[0]];
      return Object.assign(score(d, pr, slot), { missing, used: need.length - missing.length, slot });
    }).filter(x => x.used > 0 && x.missing.length <= 1).sort((p, q) => p.missing.length - q.missing.length || p.sev - q.sev || q.used - p.used || p.s - q.s).slice(0, 8);
  }
  const ingName = (k, l) => { const r = DI().ING[k]; return r ? (l === 'am' ? r[1] : r[0]) : k; };
  function tips(pr) {
    const out = ['y_tip_plate', 'y_tip_water', 'y_tip_teff'];
    if (E().isDiabetic(pr) || E().has(pr, 'pre')) out.unshift('y_tip_dm_pair', 'y_tip_walk');
    if (E().has(pr, 'htn') || E().has(pr, 'heart')) out.unshift('y_tip_salt');
    if (E().has(pr, 'chol') || E().has(pr, 'heart')) out.unshift('y_tip_oil');
    if (E().has(pr, 'anemia')) out.unshift('y_tip_iron');
    if ((pr.goals || []).includes('lose')) out.unshift('y_tip_portion');
    out.push('y_tip_fruit', 'y_tip_slow');
    return [...new Set(out)].slice(0, 5);
  }

  /* ---------- My Health ---------- */
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  function weekSummary(rs, ms, now) {
    now = now || Date.now(); const w0 = now - 7 * DAY, p0 = now - 14 * DAY;
    const inW = (r, a, b) => r.ts > a && r.ts <= b;
    const bp = rs.filter(r => r.type === 'bp'), gl = rs.filter(r => r.type === 'glucose'), wt = rs.filter(r => r.type === 'weight').sort((a, b) => a.ts - b.ts);
    const bw = bp.filter(r => inW(r, w0, now)), bpv = bp.filter(r => inW(r, p0, w0)), gw = gl.filter(r => inW(r, w0, now)), gpv = gl.filter(r => inW(r, p0, w0));
    const wl = wt.filter(r => r.ts <= now).slice(-1)[0], wb = wt.filter(r => inW(r, p0, w0)).slice(-1)[0] || wt.filter(r => inW(r, w0, now))[0];
    const mw = ms.filter(m => m.ts > w0 && m.ts <= now);
    return {
      bp: { n: bw.length, sys: avg(bw.map(r => r.sys)), dia: avg(bw.map(r => r.dia)), psys: avg(bpv.map(r => r.sys)), pdia: avg(bpv.map(r => r.dia)) },
      glucose: { n: gw.length, mg: avg(gw.map(r => r.mg)), pmg: avg(gpv.map(r => r.mg)) },
      weight: { n: wt.filter(r => inW(r, w0, now)).length, kg: wl ? wl.kg : null, delta: wl && wb && wl !== wb ? Math.round((wl.kg - wb.kg) * 10) / 10 : null },
      meals: { n: mw.length, good: mw.filter(m => m.verdict === 'good').length },
    };
  }
  function overdue(pr, rs, rems, now) {
    now = now || Date.now(); const out = [], g = pr.goals || [], last = ty => rs.filter(r => r.type === ty).reduce((a, r) => Math.max(a, r.ts), 0) || null;
    const need = (k, every) => { const l = last(k); if (!l) out.push({ k, last: null, every }); else if (now - l > every * DAY) out.push({ k, last: l, every, days: Math.floor((now - l) / DAY) }); };
    if (E().has(pr, 'htn') || E().has(pr, 'heart') || g.includes('bp')) need('bp', 7);
    if (E().isDiabetic(pr)) need('glucose', 7); else if (E().has(pr, 'pre') || g.includes('glucose')) need('glucose', 30);
    need('weight', ['lose', 'gain', 'maintain'].some(x => g.includes(x)) ? 7 : 30);
    const conds = (pr.conditions || []).filter(c => !['none', 'unsure'].includes(c));
    if (conds.length && !(rems || []).some(r => ['checkup', 'appointment'].includes(r.kind) && r.on !== false && (!r.date || r.date >= dk(now)))) out.push({ k: 'checkup' });
    if (!pr.height || !pr.weight) out.push({ k: 'profile' });
    return out;
  }
  function change(rs, type, days, now) {
    now = now || Date.now(); const w = rs.filter(r => r.type === type && r.ts > now - days * DAY && r.ts <= now).sort((a, b) => a.ts - b.ts);
    if (w.length < 2) return null; const a = w[0], b = w[w.length - 1];
    return type === 'bp' ? { from: a.sys + '/' + a.dia, to: b.sys + '/' + b.dia, d: b.sys - a.sys, d2: b.dia - a.dia, n: w.length } : type === 'glucose' ? { from: a.mg, to: b.mg, d: b.mg - a.mg, n: w.length } : { from: a.kg, to: b.kg, d: Math.round((b.kg - a.kg) * 10) / 10, n: w.length };
  }
  function inRange(r, dm) { const f = ['fasting', 'before'].includes(r.ctx); return dm ? (f ? r.mg >= 80 && r.mg <= 130 : r.mg >= 70 && r.mg < 180) : (f ? r.mg >= 70 && r.mg < 100 : r.mg >= 70 && r.mg < 140); }
  function goalProgress(pr, rs, ms, adh, now) {
    now = now || Date.now(); const out = [], g = pr.goals || [], wt = rs.filter(r => r.type === 'weight').sort((a, b) => a.ts - b.ts);
    g.forEach(k => {
      if (['lose', 'gain', 'maintain'].includes(k)) {
        const cur = wt.length ? wt[wt.length - 1].kg : +pr.weight, start = wt.length ? wt[0].kg : +pr.weight, tg = +pr.targetWeight;
        if (tg && k !== 'maintain' && start !== tg) { const pct = Math.max(0, Math.min(100, Math.round((start - cur) / (start - tg) * 100))); out.push({ k, text: t('y_gp_weight', { s: start, c: cur, t: tg }), pct }); }
        else out.push({ k, text: t(k === 'maintain' ? 'y_gp_maintain' : 'y_gp_weight_nt', { c: cur || '—' }), pct: null });
      } else if (k === 'bp') {
        const l = rs.filter(r => r.type === 'bp').sort((a, b) => b.ts - a.ts)[0];
        out.push({ k, text: l ? t(l.sys < 130 && l.dia < 80 ? 'y_gp_bp_ok' : 'y_gp_bp_hi', { v: l.sys + '/' + l.dia }) : t('y_gp_none'), pct: null });
      } else if (k === 'glucose') {
        const w = rs.filter(r => r.type === 'glucose' && r.ts > now - 14 * DAY), n = w.filter(r => inRange(r, E().isDiabetic(pr))).length;
        out.push({ k, text: w.length ? t('y_gp_glu', { n, t: w.length }) : t('y_gp_none'), pct: w.length ? Math.round(n / w.length * 100) : null });
      } else if (k === 'eat') {
        const w = ms.filter(m => m.ts > now - 7 * DAY); out.push({ k, text: t('y_gp_eat', { n: w.filter(m => m.verdict === 'good').length, t: w.length }), pct: w.length ? Math.round(w.filter(m => m.verdict === 'good').length / w.length * 100) : null });
      } else if (k === 'chol') out.push({ k, text: t('y_gp_chol'), pct: null });
      else { const a = adh && adh[k]; out.push({ k, text: a && a.due ? t('y_gp_rem', { n: a.done, t: a.due }) : t('y_gp_rem_none'), pct: a && a.due ? Math.round(a.done / a.due * 100) : null }); }
    });
    return out;
  }

  /* ---------- Scan ---------- */
  const INGR = {
    injera_teff: 'y_in_injera', injera_mixed: 'y_in_injera_mix', injera_white: 'y_in_injera_white', shiro: 'y_in_shiro', misir: 'y_in_misir', misir_alicha: 'y_in_misir_alicha', kik: 'y_in_kik', gomen: 'y_in_gomen',
    tikil_gomen: 'y_in_tikil', atkilt: 'y_in_atkilt', tibs: 'y_in_tibs', doro: 'y_in_doro', kitfo: 'y_in_kitfo', ful: 'y_in_ful', firfir: 'y_in_firfir', tsom_firfir: 'y_in_tsom_firfir', genfo: 'y_in_genfo',
    enkulal_firfir: 'y_in_enkulal', egg: 'y_in_egg', rice: 'y_in_rice', pasta: 'y_in_pasta', selata: 'y_in_selata', timatim: 'y_in_timatim', azifa: 'y_in_azifa', gomen_besiga: 'y_in_gomen_besiga', asa: 'y_in_asa',
    shimbra_asa: 'y_in_shimbra_asa', fosolia: 'y_in_fosolia', duba_wot: 'y_in_duba', beyaynetu: 'y_in_beyaynetu', chechebsa: 'y_in_chechebsa', kinche: 'y_in_kinche', ayib: 'y_in_ayib', bread_whole: 'y_in_bread', shorba: 'y_in_shorba',
  };
  function ingredientsOf(it) { if (it.ingredients && it.ingredients.length) return Array.isArray(it.ingredients) ? it.ingredients.filter(Boolean).join(', ') : String(it.ingredients); const k = it.foodId && INGR[it.foodId]; return k ? t(k) : t('y_in_unknown'); }
  function goalFit(a, pr, slot) {
    const T = a.targets, x = a.totals, sh = slot === 'snack' ? 0.15 : 0.33, out = [], g = (pr.goals || []).slice();
    if (E().isDiabetic(pr) && !g.includes('glucose')) g.push('glucose');
    if ((E().has(pr, 'htn') || E().has(pr, 'heart')) && !g.includes('bp')) g.push('bp');
    if (E().has(pr, 'chol') && !g.includes('chol')) g.push('chol');
    const r = Math.round;
    g.forEach(k => {
      if (k === 'glucose') out.push({ ok: x.c <= a.carbGuide * 1.15, text: t(x.c <= a.carbGuide * 1.15 ? 'y_fit_glu_ok' : 'y_fit_glu_no', { c: r(x.c), t: a.carbGuide }) });
      else if (k === 'bp') out.push({ ok: x.na <= T.na * sh, text: t(x.na <= T.na * sh ? 'y_fit_bp_ok' : 'y_fit_bp_no', { n: r(x.na), t: r(T.na * sh) }) });
      else if (k === 'chol') out.push({ ok: x.sf <= T.sf * sh, text: t(x.sf <= T.sf * sh ? 'y_fit_chol_ok' : 'y_fit_chol_no', { n: E().r(x.sf, 1), t: r(T.sf * sh) }) });
      else if (k === 'lose') out.push({ ok: x.kcal <= T.kcal * sh * 1.1, text: t(x.kcal <= T.kcal * sh * 1.1 ? 'y_fit_lose_ok' : 'y_fit_lose_no', { n: r(x.kcal), t: r(T.kcal * sh) }) });
      else if (k === 'gain') out.push({ ok: x.kcal >= T.kcal * sh * 0.9 && x.p >= 12, text: t(x.kcal >= T.kcal * sh * 0.9 && x.p >= 12 ? 'y_fit_gain_ok' : 'y_fit_gain_no', { n: r(x.kcal), p: r(x.p) }) });
      else if (k === 'eat' || k === 'energy') out.push({ ok: x.fb >= 6, text: t(x.fb >= 6 ? 'y_fit_eat_ok' : 'y_fit_eat_no', { n: r(x.fb) }) });
      else if (k === 'maintain') out.push({ ok: x.kcal <= T.kcal * sh * 1.25, text: t('y_fit_maintain', { n: r(x.kcal), t: r(T.kcal * sh) }) });
    });
    return out;
  }
  function compare(A, B) {
    const rows = [['kcal', -1], ['p', 1], ['c', -1], ['f', -1], ['sf', -1], ['fb', 1], ['na', -1]];
    return rows.map(([k, dir]) => { const a = A.totals[k] || 0, b = B.totals[k] || 0, close = Math.abs(a - b) <= Math.max(a, b) * 0.08; return { k, a, b, better: close ? 0 : (dir > 0 ? (a > b ? 1 : 2) : (a < b ? 1 : 2)) }; });
  }

  /* ---------- Reminders ---------- */
  const FREQ_T = { once: [['08:00']], twice: [['08:00'], ['20:00']], three: [['07:00'], ['13:00'], ['19:00']], night: [['21:00']], weekly: [['08:00', [1]]] };
  function suggestions(pr, rems) {
    const have = new Set((rems || []).map(r => r.sug).filter(Boolean)), g = pr ? pr.goals || [] : [], out = [];
    const add = (sug, kind, title, time, goal, days) => { if (!have.has(sug)) out.push({ sug, kind, title, time, goal, days: days || [] }); };
    if (pr) {
      (pr.medList || []).forEach(m => { (FREQ_T[m.freq] || (m.freq === 'asneeded' ? [] : [['08:00']])).forEach(([tm, days], i) => add('med:' + m.id + ':' + i, 'medicine', (m.name || '') + (m.dose ? ' ' + m.dose : ''), tm, 'meds', days)); });
      if (E().has(pr, 'htn') || E().has(pr, 'heart') || g.includes('bp')) add('bp', 'bp', t('y_s_bp'), '08:00', 'bp');
      if (E().isDiabetic(pr) || g.includes('glucose')) add('sugar', 'sugar', t('y_s_sugar'), '07:00', 'glucose');
      if (['lose', 'gain', 'maintain'].some(x => g.includes(x))) add('weight', 'weight', t('y_s_weight'), '07:30', g.find(x => ['lose', 'gain', 'maintain'].includes(x)), [1]);
    }
    add('water', 'water', t('y_s_water'), '10:00', 'water');
    if (!pr || g.includes('active') || g.includes('energy') || g.includes('lose')) add('walk', 'goal', t(pr && (E().has(pr, 'heart') || E().age(pr) >= 65) ? 'x_g_walk_gentle' : 'x_g_walk'), '17:30', 'active');
    if (!pr || g.includes('eat')) add('veg', 'goal', t('x_g_veg'), '12:30', 'eat');
    return out;
  }
  function routine(pr, which) {
    const meds = pr && (pr.medList || []).length, dm = pr && E().isDiabetic(pr), bp = pr && (E().has(pr, 'htn') || E().has(pr, 'heart') || (pr.goals || []).includes('bp'));
    return which === 'morning' ? [['water', 'y_rt_m_water', '07:00'], dm && ['sugar', 'y_s_sugar', '07:15'], bp && ['bp', 'y_s_bp', '07:30'], meds && ['medicine', 'y_rt_m_meds', '08:00'], ['goal', 'y_rt_m_breakfast', '08:15']].filter(Boolean)
      : [['goal', 'y_rt_e_walk', '18:00'], meds && ['medicine', 'y_rt_e_meds', '20:00'], ['goal', 'y_rt_e_screen', '21:30'], ['goal', 'y_rt_e_sleep', '22:00']].filter(Boolean);
  }
  const motivation = (d) => { d = d || new Date(); const n = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / DAY); return t('y_mot_' + (n % 14)); };

  /* ---------- Doctor helpers (general education only — never a diagnosis or prescription) ---------- */
  const GLOSS = [['hba1c', /hba1c|\ba1c\b|ሄሞግሎቢን ኤ1ሲ|ኤ1ሲ/i], ['ldl', /\bldl\b/i], ['hdl', /\bhdl\b/i], ['egfr', /egfr|gfr/i], ['creatinine', /creatinine|ክሬቲኒን/i],
    ['tg', /triglycer|ትራይግሊሰራይድ/i], ['hb', /hemoglobin|haemoglobin|\bhgb\b|\bhb\b|ሄሞግሎቢን/i], ['systolic', /systolic|ሲስቶሊክ|upper number/i], ['diastolic', /diastolic|ዲያስቶሊክ|lower number/i],
    ['htn', /hypertension|ሃይፐርቴንሽን/i], ['pre', /prediabet|ቅድመ.?ስኳር/i], ['chol', /cholesterol|ኮሌስትሮል/i], ['insulin', /insulin|ኢንሱሊን/i], ['bmi', /\bbmi\b|body mass/i],
    ['anemia', /an(a)?emi|የደም ማነስ/i], ['gi', /glycemic|glycaemic|\bgi\b/i]];
  const ASKWHAT = /what (is|are|does|do)|mean|meaning|explain|define|ምን ማለት|ምንድን|ምንድነው|ትርጉም|አስረዳ/i;
  function glossary(q) {
    q = String(q || ''); if (!ASKWHAT.test(q)) return [];
    return GLOSS.filter(([, re]) => re.test(q)).slice(0, 3).map(([k]) => '**' + t('y_gt_' + k) + '** — ' + t('y_gl_' + k));
  }
  const SYM = [['headache', /headache|head ache|migraine|ራስ ምታት|ራሴን/i], ['fever', /fever|temperature|ትኩሳት/i], ['cough', /cough|ሳል/i], ['diarrhea', /diarr|loose stool|ተቅማጥ/i],
    ['stomach', /stomach|abdominal|belly|heartburn|gastri|ሆዴ|ሆድ|ጨጓራ/i], ['dizzy', /dizz|lighthead|faint|ማዞር|ያዞረኛል/i], ['tired', /tired|fatigue|weak|exhaust|ድካም|ደከመኝ/i], ['back', /back pain|backache|ወገብ|ጀርባ/i]];
  function symptoms(q) {
    const m = SYM.find(([, re]) => re.test(String(q || ''))); if (!m) return []; const k = m[0];
    return ['**' + t('y_sym_' + k) + '**', '• ' + t('y_sy_causes') + ' ' + t('y_sy_' + k + '_c'), '• ' + t('y_sy_care') + ' ' + t('y_sy_' + k + '_s'), '• ' + t('y_sy_see') + ' ' + t('y_sy_' + k + '_d'), '🚨 ' + t('y_sy_urgent') + ' ' + t('y_sy_' + k + '_u'), t('y_sy_note')];
  }
  const CONDQ = [['dm', /diabet|ስኳር በሽታ|የስኳር/i], ['htn', /hypertension|high blood pressure|ደም ግፊት/i], ['chol', /high cholesterol|cholesterol|ኮሌስትሮል/i], ['anemia', /an(a)?emi|የደም ማነስ/i], ['kidney', /kidney disease|\bckd\b|ኩላሊት/i], ['pre', /prediabet|ቅድመ.?ስኳር/i]];
  const CONDASK = /what is|what are|tell me about|explain|about|ምንድን|ምንድነው|ስለ|አስረዳ/i;
  function condition(q) {
    q = String(q || ''); if (!CONDASK.test(q)) return []; const m = CONDQ.slice().sort((a, b) => (a[0] === 'pre' ? -1 : 0) - (b[0] === 'pre' ? -1 : 0)).find(([, re]) => re.test(q)); if (!m) return [];
    return ['**' + t('y_cx_' + m[0] + '_t') + '**', t('y_cx_' + m[0]), t('y_cx_note')];
  }
  const SEG = { biguanide: 'biguanide', sulfonylurea: 'sulfonylurea', insulin: 'insulin', dpp4: 'dpp4', ccb: 'ccb', ccb_gf: 'ccb', acei: 'acei', arb: 'arb', thiazide: 'diuretic', loop: 'diuretic', ksparing: 'diuretic',
    beta: 'beta', central: 'central', statin: 'statin', statin_gf: 'statin', antiplatelet: 'antiplatelet', warfarin: 'warfarin', iron: 'iron', vitamin: 'vitamin', calcium: 'calcium', ppi: 'ppi', thyroid: 'thyroid',
    bronch: 'bronch', steroid: 'steroid', analgesic: 'analgesic', nsaid: 'nsaid', antibiotic: 'antibiotic', quinolone: 'antibiotic', tetracycline: 'antibiotic', nitroimidazole: 'nitroimidazole', arv: 'arv', xo: 'xo', aed: 'aed', tb: 'tb' };
  const SEQ = /side.?effect|adverse|reaction|ጎንዮሽ|የጎን ጉዳት/i;
  function sideEffects(q, pr) {
    q = String(q || ''); if (!SEQ.test(q)) return []; const MD = window.NolaMeds, n = MD.norm || (s => String(s).toLowerCase());
    let hits = MD.LIST.filter(m => n(q).includes(n(m.en).split(/[ ,(]/)[0]) || q.includes(m.am.split(' ')[0]));
    if (!hits.length && pr) hits = (pr.medList || []).map(m => m.medId && MD.byId[m.medId]).filter(Boolean);
    if (!hits.length) return [t('y_se_which')];
    const out = ['**' + t('y_se_title') + '**'];
    hits.slice(0, 3).forEach(m => { const g = SEG[m.cls]; out.push('• **' + (window.I18N.lang === 'am' ? m.am : m.en) + '**: ' + t(g ? 'y_se_' + g : 'y_se_unknown')); });
    out.push(t('y_se_end')); return out;
  }
  const FACT = [/\bi (?:am|'m) allergic to ([^.,;!?]{2,40})/i, /\bi have ([^.,;!?]{3,40})/i, /\bi take ([^.,;!?]{3,40})/i, /\bi(?: am|'m) (pregnant|breastfeeding|vegetarian|vegan|fasting)/i, /\bi (?:don't|do not) (?:eat|drink) ([^.,;!?]{2,30})/i,
    /(?:አለርጂ አለብኝ)\s*([^.,;!?።]{0,30})/, /([^.,;!?።]{2,30})\s*አለብኝ/, /([^.,;!?።]{2,30})\s*እወስዳለሁ/, /(እርጉዝ ነኝ|ጡት አጠባለሁ)/];
  function extractFacts(q) {
    q = String(q || ''); const out = [];
    FACT.forEach((re, i) => { const m = q.match(re); if (!m) return; let v = m[0].trim(); if (/\?$/.test(q.trim()) && i < 3 && /^(do|does|can|should|is)\b/i.test(q.trim())) return; if (v.length > 4) out.push(v.replace(/\s+/g, ' ').slice(0, 60)); });
    return [...new Set(out)].slice(0, 3);
  }
  const TOPIC = [['bp', /pressure|\bbp\b|hypertension|systolic|diastolic|ግፊት/i], ['sugar', /sugar|glucose|diabet|hba1c|a1c|insulin|ስኳር/i], ['chol', /cholesterol|ldl|hdl|triglycer|ኮሌስትሮል/i],
    ['kidney', /kidney|creatinine|egfr|ኩላሊት/i], ['meds', /medic|pill|tablet|drug|side.?effect|መድሃኒት|መድኃኒት|ጎንዮሽ/i], ['food', /food|eat|meal|diet|injera|ምግብ|እንጀራ/i], ['weight', /weight|bmi|ክብደት/i],
    ['symptom', /pain|ache|fever|cough|dizz|tired|diarr|stomach|ህመም|ትኩሳት|ሳል|ማዞር|ተቅማጥ/i], ['lab', /lab|test|result|report|ምርመራ|ውጤት/i]];
  function topicsOf(msgs) { const txt = (msgs || []).map(m => m.text || '').join(' \n '); return TOPIC.filter(([, re]) => re.test(txt)).map(([k]) => k); }
  function doctorQuestions(pr, topics) {
    const tp = (topics || []).slice(); if (pr) { if (E().has(pr, 'htn')) tp.push('bp'); if (E().isDiabetic(pr)) tp.push('sugar'); if ((pr.medList || []).length) tp.push('meds'); }
    const u = [...new Set(tp)].filter(k => k !== 'symptom' || true).slice(0, 4), out = u.map(k => t('y_dq_' + k));
    out.push(t('y_dq_general')); return out.slice(0, 5);
  }
  function summary(list, pr, facts) {
    const us = (list || []).filter(m => m.role === 'user'), tp = topicsOf(us), out = ['**' + t('y_sum_title') + '**'];
    out.push('• ' + t('y_sum_count', { n: us.length })); if (tp.length) out.push('• ' + t('y_sum_topics', { t: tp.map(k => t('y_top_' + k)).join(', ') }));
    const flags = (list || []).filter(m => m.role === 'bot' && /🚨/.test(m.text || '')).length; if (flags) out.push('• 🚨 ' + t('y_sum_flags'));
    if (facts && facts.length) out.push('• 🧠 ' + t('y_sum_facts', { f: facts.map(f => f.text).join('; ') }));
    out.push('', '**' + t('y_dq_title') + '**'); doctorQuestions(pr, tp).forEach(q => out.push('• ' + q)); out.push('', t('y_sum_note')); return out;
  }
  function limits(pr, rs, q) {
    const out = []; q = String(q || '');
    if (!pr) out.push(t('y_lim_profile'));
    const rec = ty => (rs || []).some(r => r.type === ty && r.ts > Date.now() - 30 * DAY);
    if (/pressure|\bbp\b|ግፊት/i.test(q) && !rec('bp')) out.push(t('y_lim_bp'));
    if (/sugar|glucose|ስኳር/i.test(q) && !rec('glucose')) out.push(t('y_lim_sugar'));
    out.push(t('y_lim_exam')); return out;
  }

  window.NolaPlus = { SLOTS, STAPLE, dk, isAnimal, isVeg, isFasting, dishCost, fastingOn, candidates, dayPlan, weekPlan, alternatives, affordable, cookToday, pantry, mainIng, ingName, tips,
    weekSummary, overdue, change, inRange, goalProgress, ingredientsOf, goalFit, compare, suggestions, routine, motivation, glossary, symptoms, condition, sideEffects, extractFacts, topicsOf, doctorQuestions, summary, limits };
})();
