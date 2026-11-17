/* NOLA HEALTH v3 — Ethiopia-first, simple experience.
   New home (5 big actions), My Health hub, What should I eat?, My daily plan, daily challenges,
   reminders (in-app + Notification API), medical-report explainer, language selector, offline AI queue,
   NOLA FOOD SCORE card and the scan step indicator. */
(function () {
  'use strict';
  const N = window.NolaApp, DB = window.NolaDB, E = window.NolaEngine, F = window.NolaFoods, CH = window.NolaCharts, AI = window.NolaAI;
  const PL = window.NolaPlanner, B = window.NolaBrain, SC = window.NolaScore, AC = window.NolaAcademy;
  const { S, esc, uid, dayKey, toast } = N;
  const $ = (s, el = document) => el.querySelector(s);
  const L = () => I18N.lang, R = Math.round, DAY = 864e5;
  const tr = o => o ? (o[L()] || o.en) : '';
  const ROUTES = N.ROUTES, A = N.A;
  const today = () => dayKey(Date.now());
  const hdr = (title, back = 'home') => `<div class="hdr"><a class="iconbtn" href="#/${back}" aria-label="${t('back')}">‹</a><h1>${title}</h1></div>`;
  const low = () => !!N.settings().lowData;
  const photo = (name, alt) => low() ? '' : `<img class="photo" src="img/${name}.webp" alt="${esc(alt)}" loading="lazy" decoding="async" width="640" height="360">`;
  const mealsToday = () => N.meals().filter(m => dayKey(m.ts) === today());
  const readingToday = ty => N.readings().some(r => r.type === ty && dayKey(r.ts) === today());
  const foodsToday = () => mealsToday().flatMap(m => m.items).map(i => i.foodId && F.byId[i.foodId]).filter(Boolean);
  const naWatch = pr => E.has(pr, 'htn') || E.has(pr, 'heart') || E.has(pr, 'kidney') || (pr.restrictions || []).includes('lowsalt');
  const COLHEX = { green: '#15803d', yellow: '#d97706', red: '#c2410c' };

  /* ---------- loading indicator ---------- */
  let loadN = 0;
  function loading(on, txt) { loadN = Math.max(0, loadN + (on ? 1 : -1)); const el = $('#loader'); if (!el) return; el.hidden = loadN === 0; if (on) $('#loaderText').textContent = txt || t('v3_loading'); }

  /* ---------- language picker (first run + settings) ---------- */
  function langPicker(first) {
    const cur = L();
    return `<div class="langpick ${first ? 'first' : ''}" id="langPick">${first ? `<div class="lp-title">🌐 ${t('v3_choose_lang')} · ${L() === 'am' ? 'Choose your language' : 'ቋንቋ ይምረጡ'}</div>` : ''}
      ${I18N.REGISTRY.map(r => r.status === 'ready'
        ? `<button class="lp ${cur === r.code ? 'on' : ''}" data-action="set-lang" data-v="${r.code}" aria-pressed="${cur === r.code}"><b>${esc(r.native)}</b>${r.native !== r.name ? `<span class="tiny muted">${esc(r.name)}</span>` : ''}${cur === r.code ? '<span class="lp-ok">✓</span>' : ''}</button>`
        : `<button class="lp soon" disabled aria-disabled="true"><b>${esc(r.native)}</b><span class="tiny muted">${esc(r.name)} · ${t('v3_coming_soon')}</span></button>`).join('')}</div>`;
  }

  /* ---------- scan steps ---------- */
  function steps(n) {
    const st = ['v3_step_photo', 'v3_step_check', 'v3_step_result'];
    return `<ol class="steps" aria-label="${t('v3_steps')}">${st.map((k, i) => `<li class="${i + 1 < n ? 'done' : i + 1 === n ? 'on' : ''}"><span>${i + 1 < n ? '✓' : i + 1}</span>${t(k)}</li>`).join('')}</ol>`;
  }

  /* ---------- NOLA FOOD SCORE card ---------- */
  function scoreCard(sc) {
    const rows = sc.factors.filter(f => f.pts !== 0 || ['carbs', 'netcarbs', 'sodium', 'fiber'].includes(f.key)).map(f => {
      const v = f.val != null ? `${f.val}${f.guide != null ? ' / ' + f.guide : ''} ${f.unit || ''}` : '';
      return `<li class="${f.pts > 0 ? 'plus' : f.pts < 0 ? 'minus' : ''}"><span>${t('sc_f_' + f.key)}<span class="tiny muted"> ${esc(v)}</span></span><b>${f.pts > 0 ? '+' : ''}${f.pts}</b></li>`;
    }).join('');
    return `<div class="card score-card" id="scoreCard"><div class="row"><div class="score-ring">${CH.ring(sc.score, 100, 86, String(sc.score), '/100', COLHEX[sc.color])}</div>
      <div class="grow"><div class="tiny muted" style="letter-spacing:.6px;font-weight:700">NOLA FOOD SCORE</div><div class="sc-big" id="scoreVal" data-score="${sc.score}">${sc.score}<span class="small muted"> / 100</span></div><div class="small">${t('sc_lbl_' + sc.color)}</div></div></div>
      <p class="tiny muted" style="margin:8px 0 0">ℹ️ ${t('sc_note')}</p>
      <details class="sc-why" id="scoreWhy"><summary class="small"><b>${t('sc_why')}</b></summary><ul class="clean sc-list"><li><span>${t('sc_start')}</span><b>100</b></li>${rows}${sc.adjusted ? `<li><span>${t('sc_adjusted', { raw: sc.raw })}</span><b>→ ${sc.score}</b></li>` : ''}</ul>
      <p class="tiny muted">${t('sc_formula')}</p></details></div>`;
  }

  /* ---------- challenges ---------- */
  const CHS = [
    { id: 'log_bp', i: '❤️', auto: () => readingToday('bp'), go: 'bp' },
    { id: 'add_veg', i: '🥬', auto: () => foodsToday().some(f => f.cat === 'veg' || f.tags.includes('vegetable')) },
    { id: 'swap_drink', i: '🥤' },
    { id: 'walk', i: '🚶', auto: () => DB.get('activities', []).some(a => dayKey(a.ts) === today()) },
    { id: 'log_meals', i: '📸', auto: () => mealsToday().length >= 2, href: 'scan' },
    { id: 'learn', i: '🎓', auto: () => Object.values((DB.get('academy', {}) || {}).done || {}).some(x => x && dayKey(x.ts) === today()), href: 'academy' },
    { id: 'water', i: '💧' },
    { id: 'log_glucose', i: '🩸', when: pr => E.isDiabetic(pr), auto: () => readingToday('glucose'), go: 'glucose' },
    { id: 'less_salt', i: '🧂', when: pr => naWatch(pr) },
    { id: 'legumes', i: '🫘', auto: () => foodsToday().some(f => f.tags.includes('legume')) },
  ];
  const BADGES = [['ch_first', '🌱'], ['ch_streak3', '🔥'], ['ch_streak7', '🏅'], ['ch_10', '⭐'], ['ch_30', '🏆'], ['ch_week', '🎯']];
  function chState() { const s = Object.assign({ days: {}, goal: 7, badges: {} }, DB.get('challenges', {})); s.days = s.days || {}; s.badges = s.badges || {}; return s; }
  function chToday(pr) {
    const st = chState(), k = today();
    if (!st.days[k] || !st.days[k].ids) {
      const pool = CHS.filter(c => !c.when || c.when(pr)), n = Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / DAY), ids = [];
      for (let i = 0; ids.length < 3 && i < pool.length * 3; i++) { const c = pool[(n * 3 + i * 4) % pool.length]; if (!ids.includes(c.id)) ids.push(c.id); }
      st.days[k] = { ids, done: {} };
    }
    let changed = false;
    st.days[k].ids.forEach(id => { const c = CHS.find(x => x.id === id); if (c && c.auto && !st.days[k].done[id] && c.auto()) { st.days[k].done[id] = Date.now(); changed = true; } });
    DB.set('challenges', st);
    if (changed) checkBadges(st);
    return st;
  }
  function chStreak(st) {
    const has = d => { const x = st.days[dayKey(d)]; return x && Object.keys(x.done || {}).length > 0; };
    const d = new Date(); if (!has(d)) d.setDate(d.getDate() - 1);
    let n = 0; while (has(d) && n < 400) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function chWeek(st) { let n = 0; for (let i = 0; i < 7; i++) { const d = new Date(); d.setDate(d.getDate() - i); const x = st.days[dayKey(d)]; if (x) n += Object.keys(x.done || {}).length; } return n; }
  function chTotal(st) { return Object.values(st.days).reduce((s, x) => s + Object.keys(x.done || {}).length, 0); }
  function checkBadges(st) {
    const tot = chTotal(st), streak = chStreak(st), wk = chWeek(st), earned = [];
    const rules = { ch_first: tot >= 1, ch_streak3: streak >= 3, ch_streak7: streak >= 7, ch_10: tot >= 10, ch_30: tot >= 30, ch_week: wk >= st.goal };
    Object.entries(rules).forEach(([k, ok]) => { if (ok && !st.badges[k]) { st.badges[k] = Date.now(); earned.push(k); } });
    if (earned.length) { DB.set('challenges', st); setTimeout(() => toast('🏅 ' + t('ch_new_badge', { b: t('bdg_' + earned[0]) })), 400); }
  }
  function chCard(c, st, compact) {
    const done = !!(st.days[today()].done || {})[c.id];
    const go = c.go ? `<button class="btn sm soft" data-action="add-reading" data-type="${c.go}">${t('ch_do_now')}</button>` : c.href ? `<a class="btn sm soft" href="#/${c.href}">${t('ch_do_now')}</a>` : '';
    return `<div class="chal ${done ? 'done' : ''}" data-ch="${c.id}"><span class="ci">${c.i}</span><div class="grow"><b>${t('ch_' + c.id)}</b>${compact ? '' : `<div class="tiny muted">${t('ch_' + c.id + '_d')}</div>`}</div>
      ${done ? `<span class="pill good">✓ ${t('ch_done')}</span>` : `<span class="row" style="gap:6px">${compact ? '' : go}<button class="btn sm" data-action="ch-done" data-id="${c.id}">${t('ch_i_did')}</button></span>`}</div>`;
  }
  ROUTES.challenges = function () {
    const pr = N.profile(), st = chToday(pr), td = st.days[today()], streak = chStreak(st), wk = chWeek(st);
    const y = new Date(); y.setDate(y.getDate() - 1); const yd = st.days[dayKey(y)];
    const missed = yd && yd.ids && !Object.keys(yd.done || {}).length && !Object.keys(td.done).length;
    const allDone = td.ids.every(id => td.done[id]);
    return hdr('🎯 ' + t('ch_title')) + `<p class="small muted">${t('ch_intro')}</p>
      ${missed ? `<div class="banner green small">🤗 ${t('ch_kind_missed')}</div>` : ''}${allDone ? `<div class="banner green small">🎉 ${t('ch_all_done')}</div>` : ''}
      <div class="card"><div class="row between"><div><div class="tiny muted">${t('ch_streak')}</div><div class="big-n">🔥 ${streak} <span class="small muted">${t('ch_days')}</span></div></div>
        <div style="text-align:right"><div class="tiny muted">${t('ch_week_goal')}</div><div class="big-n">${Math.min(wk, st.goal)} / ${st.goal}</div></div></div>
        <div class="track lg"><div style="width:${Math.min(100, wk / st.goal * 100)}%"></div></div>
        <div class="row between" style="margin-top:10px"><span class="tiny muted">${t('ch_set_goal')}</span><div class="seg" style="width:180px">${[3, 5, 7, 10].map(g => `<button class="${st.goal === g ? 'on' : ''}" data-action="ch-goal" data-v="${g}">${g}</button>`).join('')}</div></div></div>
      <h2>${t('ch_today')}</h2><div id="chList">${td.ids.map(id => chCard(CHS.find(c => c.id === id), st)).join('')}</div>
      <p class="tiny muted">🚶 ${t('ch_walk_note')}</p>
      <h2>${t('ch_badges')}</h2><div class="badges">${BADGES.map(([k, i]) => `<div class="bdg ${st.badges[k] ? 'on' : ''}" data-badge="${k}"><span>${i}</span><b>${t('bdg_' + k)}</b><span class="tiny muted">${st.badges[k] ? new Date(st.badges[k]).toLocaleDateString() : t('bdg_' + k + '_how')}</span></div>`).join('')}</div>`;
  };
  A['ch-done'] = el => { const st = chToday(N.profile()), d = st.days[today()]; d.done[el.dataset.id] = Date.now(); DB.set('challenges', st); checkBadges(st); toast('✓ ' + t('ch_well_done')); N.rerender(); };
  A['ch-goal'] = el => { const st = chState(); st.goal = +el.dataset.v; DB.set('challenges', st); N.rerender(); };

  /* ---------- reminders ---------- */
  const RK = ['meal', 'water', 'medicine', 'checkup', 'appointment', 'walk', 'routine'];
  const RI = { meal: '🍽️', water: '💧', medicine: '💊', checkup: '🩺', appointment: '📅', walk: '🚶', routine: '⏰' };
  const rems = () => DB.get('reminders', []);
  const remOnDay = (r, d = new Date()) => r.on !== false && (r.date ? r.date === dayKey(d) : (!r.days || !r.days.length || r.days.includes(d.getDay())));
  const remTitle = r => r.title || t('rem_k_' + r.kind);
  const todayRems = () => rems().filter(r => remOnDay(r)).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const hm = d => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  S.rem = S.rem || { kind: 'meal', repeat: 'daily', days: [] };
  function notifState() { return !('Notification' in window) ? 'unsupported' : Notification.permission; }
  function remRow(r, withTools) {
    const doneT = r.doneDay === today(), past = r.time && r.time < hm(new Date()) && remOnDay(r);
    return `<div class="rem ${doneT ? 'done' : ''}" data-rem="${r.id}"><span class="ci">${RI[r.kind] || '⏰'}</span><div class="grow"><b>${esc(remTitle(r))}</b>
      <div class="tiny muted">${esc(r.time || '')} · ${r.date ? esc(r.date) : r.days && r.days.length ? r.days.map(d => t('dow_' + d)).join(' ') : t('rem_daily')}${r.forWho ? ' · ' + t('rem_for', { n: esc(r.forWho) }) : ''}${!doneT && past && !withTools ? ' · ' + t('rem_when_ready') : ''}</div></div>
      ${withTools ? `<label class="switch sm" title="${t('rem_on')}"><input type="checkbox" data-action-change="rem-on" data-id="${r.id}" ${r.on !== false ? 'checked' : ''}><span></span></label><button class="iconbtn sm" data-action="rem-del" data-id="${r.id}" aria-label="${t('del')}">✕</button>`
        : doneT ? `<span class="pill good">✓</span>` : `<button class="btn sm soft" data-action="rem-done" data-id="${r.id}">${t('rem_done')}</button>`}</div>`;
  }
  ROUTES.reminders = function () {
    const ns = notifState(), list = rems(), tl = todayRems(), f = S.rem;
    return hdr('⏰ ' + t('rem_title'), 'health') + `<p class="small muted">${t('rem_intro')}</p>
      <div class="card"><div class="row between"><div><b>🔔 ${t('rem_notif')}</b><div class="tiny muted" id="notifState">${t('rem_n_' + ns)}</div></div>
        ${ns === 'default' ? `<button class="btn sm" data-action="rem-perm" id="remPerm">${t('rem_allow')}</button>` : ns === 'granted' ? `<button class="btn sm ghost" data-action="rem-test" id="remTest">${t('rem_test')}</button>` : ''}</div>
        <p class="tiny muted" style="margin:8px 0 0">${t('rem_honest')}</p></div>
      <h2>${t('rem_today')}</h2><div class="card tight">${tl.length ? tl.map(r => remRow(r)).join('') : `<p class="small muted">${t('rem_none_today')}</p>`}</div>
      <div class="card" id="remForm"><h3>+ ${t('rem_add')}</h3>
        <div class="chips">${RK.map(k => `<button type="button" class="chip ${f.kind === k ? 'on' : ''}" data-action="rem-kind" data-v="${k}">${RI[k]} ${t('rem_k_' + k)}</button>`).join('')}</div>
        <label class="f" for="remTitle">${t('rem_what')}</label><input class="in" id="remTitle" placeholder="${esc(t('rem_k_' + f.kind))}" maxlength="80" value="${esc(f.title || '')}">
        ${f.kind === 'medicine' ? `<p class="tiny muted">💊 ${t('rem_med_note')}</p>` : ''}
        <div class="grid2"><div><label class="f" for="remTime">${t('rem_time')}</label><input class="in" id="remTime" type="time" value="${esc(f.time || (f.kind === 'meal' ? '12:30' : f.kind === 'water' ? '10:00' : '08:00'))}"></div>
          <div><label class="f">${t('rem_repeat')}</label><div class="seg" id="remRepeat">${['daily', 'days', 'once'].map(x => `<button type="button" class="${f.repeat === x ? 'on' : ''}" data-action="rem-repeat" data-v="${x}">${t('rem_r_' + x)}</button>`).join('')}</div></div></div>
        ${f.repeat === 'days' ? `<div class="chips" id="remDays" style="margin-top:8px">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button type="button" class="chip sm ${f.days.includes(d) ? 'on' : ''}" data-action="rem-day" data-v="${d}">${t('dow_' + d)}</button>`).join('')}</div>` : ''}
        ${f.repeat === 'once' ? `<label class="f" for="remDate">${t('rem_date')}</label><input class="in" id="remDate" type="date" value="${esc(f.date || today())}">` : ''}
        <label class="f" for="remFor">${t('rem_for_who')}</label><input class="in" id="remFor" placeholder="${t('rem_for_ph')}" maxlength="40" value="${esc(f.forWho || '')}">
        <p class="tiny muted">👨‍👩‍👧 ${t('rem_helper_note')}</p>
        <button class="btn block" data-action="rem-save" id="remSave">${t('save')}</button></div>
      <h2>${t('rem_all')}</h2><div class="card tight" id="remAll">${list.length ? list.map(r => remRow(r, true)).join('') : `<p class="small muted">${t('rem_none')}</p>`}</div>`;
  };
  function keepRemForm() { const g = id => { const e = $('#' + id); return e ? e.value : undefined; }; const f = S.rem; f.title = g('remTitle'); f.time = g('remTime'); f.forWho = g('remFor'); f.date = g('remDate') || f.date; }
  A['rem-kind'] = el => { keepRemForm(); if (S.rem.kind !== el.dataset.v) S.rem.time = undefined; S.rem.kind = el.dataset.v; N.rerender(); };
  A['rem-repeat'] = el => { keepRemForm(); S.rem.repeat = el.dataset.v; N.rerender(); };
  A['rem-day'] = el => { const d = +el.dataset.v; S.rem.days = S.rem.days.includes(d) ? S.rem.days.filter(x => x !== d) : S.rem.days.concat([d]); el.classList.toggle('on'); };
  A['rem-save'] = () => {
    const f = S.rem, time = $('#remTime').value; if (!/^\d{2}:\d{2}$/.test(time)) return toast(t('rem_need_time'));
    if (f.repeat === 'days' && !f.days.length) return toast(t('rem_need_days'));
    const title = $('#remTitle').value.trim(), forWho = $('#remFor').value.trim();
    const fl = E.checkText(title, N.settings().unit); if (fl) N.showAlert(fl);
    const r = { id: uid(), kind: f.kind, title, time, on: true, created: Date.now(), forWho };
    if (f.repeat === 'days') r.days = f.days.slice(); if (f.repeat === 'once') r.date = ($('#remDate') || {}).value || today();
    DB.set('reminders', rems().concat([r])); S.rem = { kind: f.kind, repeat: 'daily', days: [] }; toast('✓ ' + t('rem_saved')); N.rerender();
    if (notifState() === 'default') setTimeout(() => toast(t('rem_tip_allow')), 2400);
  };
  A['rem-del'] = el => { if (!confirm(t('del') + '?')) return; DB.set('reminders', rems().filter(r => r.id !== el.dataset.id)); N.rerender(); };
  A['rem-done'] = el => { DB.set('reminders', rems().map(r => r.id === el.dataset.id ? Object.assign({}, r, { doneDay: today() }) : r)); N.closeSheet(); toast('✓ ' + t('ch_well_done')); N.rerender(); };
  A['rem-perm'] = async () => { if (!('Notification' in window)) return toast(t('rem_n_unsupported')); try { await Notification.requestPermission(); } catch (e) {} toast(t('rem_n_' + notifState())); N.rerender(); };
  A['rem-test'] = () => fire({ id: 'test', kind: 'routine', title: t('rem_test_title'), time: hm(new Date()) });
  function fire(r) {
    const body = (RI[r.kind] || '⏰') + ' ' + remTitle(r) + (r.forWho ? ' — ' + t('rem_for', { n: r.forWho }) : '');
    if (notifState() === 'granted') {
      const opts = { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'nola-' + r.id, lang: L() };
      (navigator.serviceWorker && navigator.serviceWorker.getRegistration ? navigator.serviceWorker.getRegistration() : Promise.resolve(null))
        .then(reg => { if (reg && reg.showNotification) return reg.showNotification('NOLA HEALTH', opts); new Notification('NOLA HEALTH', opts); }).catch(() => {});
    }
    if (!DB.locked && $('#sheet').hidden) N.openSheet(`<div class="center"><div style="font-size:44px">${RI[r.kind] || '⏰'}</div><h2 style="margin:6px 0">${esc(remTitle(r))}</h2><p class="muted small">${esc(r.time || '')}${r.forWho ? ' · ' + t('rem_for', { n: esc(r.forWho) }) : ''}</p>
      ${r.id !== 'test' ? `<button class="btn block" data-action="rem-done" data-id="${r.id}" id="remDoneNow">✓ ${t('rem_done')}</button>` : ''}<button class="btn block ghost" style="margin-top:8px" data-action="close-sheet">${t('rf_ok')}</button></div>`);
    else toast(body);
  }
  function tick() {
    if (DB.locked || !N.profile || !DB.get) return;
    const now = new Date(), cur = hm(now), stamp = today() + ' ' + cur; let changed = false;
    const list = rems().map(r => { if (remOnDay(r, now) && r.time === cur && r.fired !== stamp && r.doneDay !== today()) { changed = true; fire(r); return Object.assign({}, r, { fired: stamp }); } return r; });
    if (changed) DB.set('reminders', list);
  }
  setInterval(tick, 15000);

  /* ---------- What should I eat? ---------- */
  function fastingToday(pr) { const d = new Date().getDay(); return (pr.restrictions || []).includes('fasting') && (d === 3 || d === 5); }
  function rankDishes(slot, pr, n = 3) {
    const P = PL.prices(), plan = DB.get('plan'), perMeal = plan ? plan.daily / Math.max(1, plan.people) / 3.3 : null, fd = fastingToday(pr);
    const recent = new Set(N.meals().filter(m => m.ts > Date.now() - 2 * DAY).flatMap(m => m.items.map(i => i.foodId)));
    const cands = PL.DISHES.filter(d => d.slots.includes(PL.SLOT[slot]) && PL.allowed(d, pr, fd));
    return cands.map(d => {
      const items = PL.dishItems(d, pr), a = E.analyze(items, pr, slot), sc = SC.compute(a, items, pr, slot);
      const cost = Object.entries(d.ing).reduce((s, [k, q]) => s + q * (P[k] || 0), 0), rec = d.items.some(x => recent.has(x[0])), pref = PL.prefScore(d);
      const rank = sc.score - pref / 3 - (rec ? 12 : 0) - (perMeal && cost > perMeal * (slot === 'snack' ? 0.4 : 1) ? 15 : 0) - cost / 25;
      return { d, items, a, sc, cost, rec, pref, rank, perMeal, fd };
    }).sort((x, y) => y.rank - x.rank).slice(0, n).map(x => Object.assign(x, { why: dishWhy(x, pr) }));
  }
  function dishWhy(x, pr) {
    const out = [], T = x.a.targets, tot = x.a.totals, dm = E.isDiabetic(pr);
    if (x.fd) out.push(t('eat_why_fasting'));
    if (dm && tot.c - (tot.fb > 5 ? tot.fb / 2 : 0) <= x.a.carbGuide * 1.1) out.push(t('eat_why_carbs', { c: R(tot.c), g: x.a.carbGuide }));
    if (naWatch(pr) && tot.na <= T.na * x.a.share) out.push(t('eat_why_salt'));
    if (tot.fb >= 8) out.push(t('eat_why_fiber', { fb: R(tot.fb) }));
    if (x.perMeal && x.cost <= x.perMeal) out.push(t('eat_why_budget', { c: R(x.cost) })); else if (x.cost < 70) out.push(t('eat_why_cheap', { c: R(x.cost) }));
    if (x.pref < 0) out.push(t('eat_why_liked'));
    if (x.sc.score < 70 && x.a.tips[0]) out.push(x.a.tips[0]);
    if (!out.length) out.push(t('eat_why_fits'));
    return out.slice(0, 3);
  }
  S.eatSlot = null;
  ROUTES.eat = function () {
    const pr = N.profile(), slot = S.eatSlot || N.defaultMeal(), list = rankDishes(slot, pr, 3), plan = DB.get('plan');
    return hdr('🍲 ' + t('h3_eat')) + `<div class="hero-photo">${photo('plate', t('img_plate'))}<div class="hp-text"><b>${t('eat_intro_t')}</b><span class="small">${t('eat_intro')}</span></div></div>
      <div class="seg big" id="eatSlot">${['breakfast', 'lunch', 'dinner', 'snack'].map(m => `<button class="${slot === m ? 'on' : ''}" data-action="eat-slot" data-v="${m}">${t('meal_' + m)}</button>`).join('')}</div>
      ${list[0] && list[0].fd ? `<div class="banner green small">🌿 ${t('eat_why_fasting')}</div>` : ''}
      <div id="eatList">${list.map((x, i) => `<div class="card eat-card" data-dish="${x.d.id}"><div class="row between"><div class="grow"><div class="tiny muted">${t('eat_option', { n: i + 1 })}</div><h3 style="margin:2px 0">${esc(tr(x.d.name))}</h3>
          <div class="small muted">~${R(x.a.totals.kcal)} kcal · ~${R(x.cost)} ${t('etb')}* · ${t('n_c')} ${R(x.a.totals.c)} g</div></div>
          <div class="mini-score ${x.sc.color}" title="NOLA FOOD SCORE">${x.sc.score}</div></div>
        <ul class="clean small why-mini">${x.why.map(w => `<li>✓ ${esc(w)}</li>`).join('')}</ul>
        <div class="row" style="gap:8px;margin-top:8px"><button class="btn sm grow" data-action="eat-log" data-id="${x.d.id}" data-slot="${slot}">📸 ${t('eat_log')}</button>${window.NolaFeatures.fbBtns('plan', x.d.id)}</div></div>`).join('') || `<div class="card muted">${t('eat_none')}</div>`}</div>
      <p class="tiny muted">* ${t('pl_price_label')} · ${t('eat_score_note')}</p>
      <div class="row" style="gap:8px"><a class="btn ghost grow" href="#/planner">💰 ${plan ? t('eat_see_plan') : t('eat_make_plan')}</a><a class="btn ghost grow" href="#/restaurant">🍽️ ${t('hub_restaurant')}</a></div>`;
  };
  A['eat-slot'] = el => { S.eatSlot = el.dataset.v; N.rerender(); };
  A['eat-log'] = el => {
    const d = PL.dish(el.dataset.id); if (!d) return;
    S.draft = N.newDraft(); S.draft.meal = el.dataset.slot || N.defaultMeal(); S.draft.items = PL.dishItems(d, N.profile()).map(x => Object.assign({}, x));
    location.hash = '#/scan'; setTimeout(() => toast(t('eat_check_then')), 300);
  };

  /* ---------- My daily plan ---------- */
  function dailyItems(pr) {
    const ms = mealsToday(), plan = DB.get('plan'), pd = plan && plan.days.find(d => dayKey(d.date) === today()), out = [];
    ['breakfast', 'lunch', 'dinner'].forEach(slot => {
      const dish = pd && pd.meals[slot] ? PL.dish(pd.meals[slot].dish) : ((rankDishes(slot, pr, 1)[0] || {}).d);
      out.push({ k: 'meal_' + slot, i: { breakfast: '🌅', lunch: '🍛', dinner: '🌙' }[slot], txt: t('meal_' + slot) + (dish ? ': ' + tr(dish.name) : ''), auto: ms.some(m => m.meal === slot), sub: dish ? (pd ? t('td_from_plan') : t('td_suggested')) : '', act: dish ? `<button class="btn sm soft" data-action="eat-log" data-id="${dish.id}" data-slot="${slot}">📸 ${t('td_log')}</button>` : '' });
    });
    if (E.has(pr, 'htn') || E.has(pr, 'heart') || N.readings().some(r => r.type === 'bp')) out.push({ k: 'bp', i: '❤️', txt: t('td_bp'), auto: readingToday('bp'), act: `<button class="btn sm soft" data-action="add-reading" data-type="bp">+ ${t('td_add')}</button>` });
    if (E.isDiabetic(pr)) out.push({ k: 'glucose', i: '🩸', txt: t('td_glucose'), auto: readingToday('glucose'), act: `<button class="btn sm soft" data-action="add-reading" data-type="glucose">+ ${t('td_add')}</button>` });
    out.push({ k: 'veg', i: '🥬', txt: t('td_veg'), auto: foodsToday().some(f => f.cat === 'veg') });
    out.push({ k: 'water', i: '💧', txt: t('td_water'), sub: t('td_water_d') });
    out.push({ k: 'walk', i: '🚶', txt: t('td_walk'), sub: t('td_walk_d') });
    todayRems().forEach(r => out.push({ k: 'rem_' + r.id, i: RI[r.kind] || '⏰', txt: remTitle(r), sub: r.time + (r.forWho ? ' · ' + t('rem_for', { n: r.forWho }) : ''), auto: r.doneDay === today() }));
    return out;
  }
  ROUTES.today = function () {
    const pr = N.profile(), st = (DB.get('daily', {}) || {})[today()] || {}, items = dailyItems(pr);
    const isDone = x => x.auto || !!st[x.k], n = items.filter(isDone).length, h = new Date().getHours();
    const ch = chToday(pr), td = ch.days[today()];
    return hdr('📋 ' + t('h3_plan')) + `<p class="small muted">${t('td_intro')}</p>
      <div class="card"><div class="row">${CH.ring(n, items.length, 74, n + '/' + items.length, '', '#15803d')}<div><b>${n === items.length ? t('td_all') : n === 0 && h >= 18 ? t('td_kind') : t('td_progress', { n, t: items.length })}</b><div class="tiny muted">${new Date().toLocaleDateString(L() === 'am' ? 'am-ET' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div></div></div></div>
      <div class="card tight checklist" id="dailyList">${items.map(x => `<div class="todo ${isDone(x) ? 'done' : ''}" data-todo="${x.k}"><label class="check big"><input type="checkbox" data-action-change="td-check" data-k="${x.k}" ${isDone(x) ? 'checked' : ''} ${x.auto ? 'disabled' : ''}><span class="ci">${x.i}</span><span class="grow"><b>${esc(x.txt)}</b>${x.sub ? `<span class="tiny muted"> ${esc(x.sub)}</span>` : ''}${x.auto ? `<span class="tiny" style="color:var(--good)"> · ✓ ${t('td_auto')}</span>` : ''}</span></label>${!isDone(x) && x.act ? x.act : ''}</div>`).join('')}</div>
      <h2>🎯 ${t('ch_today')}</h2>${td.ids.map(id => chCard(CHS.find(c => c.id === id), ch, true)).join('')}
      <div class="row" style="gap:8px;margin-top:10px"><a class="btn ghost grow" href="#/challenges">${t('ch_title')} →</a><a class="btn ghost grow" href="#/reminders">⏰ ${t('rem_title')}</a></div>
      <p class="tiny muted">${t('td_note')}</p>`;
  };

  /* ---------- HOME ---------- */
  function goals(pr) {
    const out = [], st = chToday(pr), wk = chWeek(st);
    out.push({ i: '🎯', label: t('g_challenges'), cur: Math.min(wk, st.goal), max: st.goal, txt: `${Math.min(wk, st.goal)} / ${st.goal}` });
    const wkMeals = N.meals().filter(m => m.ts > Date.now() - 7 * DAY).length;
    out.push({ i: '📸', label: t('g_meals'), cur: Math.min(wkMeals, 14), max: 14, txt: `${wkMeals} / 14` });
    if (pr.targetWeight && pr.weight) {
      const ws = N.readings().filter(r => r.type === 'weight').sort((a, b) => a.ts - b.ts), start = ws.length ? ws[0].kg : pr.weight, cur = pr.weight, tgt = +pr.targetWeight;
      const tot = Math.abs(start - tgt), done = Math.max(0, Math.min(tot, (start - cur) * Math.sign(start - tgt)));
      out.push({ i: '⚖️', label: t('g_weight', { t: tgt }), cur: tot ? done : 1, max: tot || 1, txt: `${cur} → ${tgt} kg` });
    }
    if (E.has(pr, 'htn') || E.has(pr, 'heart')) { const b = N.readings().filter(r => r.type === 'bp' && r.ts > Date.now() - 14 * DAY); if (b.length) { const ok = b.filter(r => r.sys < 130 && r.dia < 80).length; out.push({ i: '❤️', label: t('g_bp'), cur: ok, max: b.length, txt: `${ok} / ${b.length}` }); } }
    if (E.isDiabetic(pr)) { const g = N.readings().filter(r => r.type === 'glucose' && r.ts > Date.now() - 14 * DAY); if (g.length) { const ok = g.filter(r => r.mg >= 70 && r.mg <= 180).length; out.push({ i: '🩸', label: t('g_glucose'), cur: ok, max: g.length, txt: `${ok} / ${g.length}` }); } }
    return out;
  }
  ROUTES.home = function () {
    const pr = N.profile(), T = E.targets(pr), ms = mealsToday(), tot = E.mealTotals(ms.flatMap(m => m.items));
    const first = esc((pr.name || '').trim().split(' ')[0]);
    const bar = (label, v, max, unit, lim = true, cls = '') => { const p = Math.min(100, max ? v / max * 100 : 0); return `<div class="sbar ${cls}"><div class="row between small"><span>${label}</span><span><b>${R(v)}</b> / ${R(max)} ${unit}</span></div><div class="track"><div class="${lim && v > max ? 'over' : ''}" style="width:${p}%"></div></div></div>`; };
    const lat = ty => N.latest(ty), bp = lat('bp'), g = lat('glucose'), w = lat('weight');
    const ch = chToday(pr), td = ch.days[today()], next = td.ids.map(id => CHS.find(c => c.id === id)).find(c => !td.done[c.id]);
    const tr3 = todayRems().slice(0, 3);
    const tip = N.TIPS[Math.floor(Date.now() / DAY) % N.TIPS.length];
    return `<div class="greet3"><h1 id="greet">${t('v3_hello', { name: first })}</h1><p class="muted">${t('v3_hello_sub')}</p></div>
      ${N.readingBanners()}
      <a class="act-scan" href="#/scan" id="ctaScan">${photo('beyaynetu', t('img_beyaynetu'))}<span class="as-in"><span class="as-ic">📷</span><span><b>${t('h3_scan')}</b><span class="small">${t('h3_scan_d')}</span></span></span></a>
      <div class="acts">${[['health', '❤️', 'h3_health', 'h3_health_d', 'actHealth'], ['eat', '🍲', 'h3_eat', 'h3_eat_d', 'actEat'], ['coach', '💬', 'h3_ask', 'h3_ask_d', 'actAsk'], ['today', '📋', 'h3_plan', 'h3_plan_d', 'actPlan']]
        .map(([r, i, k, d, id]) => `<a class="act" href="#/${r}" id="${id}"><span class="ai">${i}</span><b>${t(k)}</b><span class="tiny muted">${t(d)}</span></a>`).join('')}</div>
      <h2>${t('dash_today')}</h2><div class="card" id="todaySummary">
        ${bar(t('n_kcal'), tot.kcal, T.kcal, 'kcal')}${bar(t('n_c'), tot.c, T.c, 'g')}${bar(t('h3_salt'), tot.na, T.na, 'mg')}${bar(t('n_as'), tot.as, T.as, 'g', true, 'adv')}${bar(t('n_fb'), tot.fb, T.fb, 'g', false, 'adv')}
        <div class="latest3" data-action="go" data-to="health">${[['bp', '❤️', bp ? bp.sys + '/' + bp.dia : '—'], ['glucose', '🩸', g ? N.fmtG(g.mg) : '—'], ['weight', '⚖️', w ? w.kg + ' kg' : '—']].map(([k, i, v]) => `<div><span class="tiny muted">${i} ${t('log_' + k)}</span><b>${v}</b></div>`).join('')}</div>
        <div class="quick">${[['bp', '❤️'], ['glucose', '🩸'], ['weight', '⚖️']].map(([k, i]) => `<button data-action="add-reading" data-type="${k}"><span class="e">${i}</span>+ ${t('log_' + k)}</button>`).join('')}</div></div>
      ${next ? `<div class="card chal-home" data-action="go" data-to="challenges"><div class="row between"><span class="tiny muted">🎯 ${t('ch_today')} · ${Object.keys(td.done).length}/${td.ids.length}</span><span class="tiny muted">🔥 ${chStreak(ch)}</span></div><div class="row" style="margin-top:6px"><span style="font-size:26px">${next.i}</span><b class="grow">${t('ch_' + next.id)}</b><span class="link small">›</span></div></div>`
        : `<div class="card chal-home" data-action="go" data-to="challenges"><b>🎉 ${t('ch_all_done')}</b></div>`}
      <h2>⏰ ${t('rem_today')}</h2><div class="card tight" id="homeRems">${tr3.length ? tr3.map(r => remRow(r)).join('') : `<p class="small muted" style="margin:4px">${t('rem_none_today')} <a href="#/reminders">${t('rem_add')}</a></p>`}</div>
      <h2>${t('dash_meals_today')}</h2>${ms.length ? ms.map(N.mealRow).join('') : `<div class="card muted small">${t('dash_no_meals')}</div>`}
      <h2>📈 ${t('g_title')}</h2><div class="card" id="goalCard">${goals(pr).map(x => `<div class="sbar"><div class="row between small"><span>${x.i} ${esc(x.label)}</span><b>${esc(x.txt)}</b></div><div class="track"><div style="width:${Math.min(100, x.cur / x.max * 100)}%"></div></div></div>`).join('')}</div>
      <div class="card tip adv"><div class="row"><span style="font-size:22px">💡</span><h3 style="margin:0">${t('dash_tip')}</h3></div><p style="margin:8px 0 4px">${esc(tr(tip))}</p><div class="tiny muted">${t('source')}: ${tip.src}</div></div>`;
  };

  /* ---------- MY HEALTH hub ---------- */
  function statusBP(r) { const c = B.bpCat(r.sys, r.dia); return { c, cls: c === 'normal' ? 'good' : c === 'elevated' || c === 'low' ? 'adjust' : 'alt' }; }
  function statusG(r) { const hi = r.ctx === 'fasting' || r.ctx === 'before' ? 130 : 180; return r.mg < 70 ? { k: 'gs_low', cls: 'alt' } : r.mg > 250 ? { k: 'gs_vhigh', cls: 'alt' } : r.mg > hi ? { k: 'gs_high', cls: 'adjust' } : { k: 'gs_ok', cls: 'good' }; }
  ROUTES.health = function () {
    const bp = N.latest('bp'), g = N.latest('glucose'), w = N.latest('weight'), when = r => r ? new Date(r.ts).toLocaleDateString(L() === 'am' ? 'am-ET' : 'en-GB', { day: 'numeric', month: 'short' }) : '';
    const sb = bp && statusBP(bp), sg = g && statusG(g), pr = N.profile(), b = E.bmi(pr);
    const tile = (ty, i, val, st, extra) => `<div class="card htile" data-h="${ty}"><div class="row"><span class="hi">${i}</span><div class="grow"><b>${t('log_' + ty)}</b><div class="hv">${val}</div>${st || ''}${extra || ''}</div></div>
      <div class="row" style="gap:8px;margin-top:10px"><button class="btn grow" data-action="add-reading" data-type="${ty}" id="hAdd_${ty}">+ ${t('h3_add')}</button><button class="btn ghost" data-action="rd-open" data-v="${ty}">📈 ${t('h3_history')}</button></div></div>`;
    const tools = [['glucose', '🍽️', 'hub_glucose'], ['labs', '🧪', 'lab_title'], ['report', '📄', 'rep_title'], ['diary', '📖', 'h3_food_history'], ['insights', '🧠', 'hub_memory_food'], ['journey', '🌱', 'hub_journey'],
      ['reminders', '⏰', 'rem_title'], ['challenges', '🎯', 'ch_title'], ['clinician', '🩺', 'hub_clinician'], ['family', '👨‍👩‍👧', 'hub_family'], ['academy', '🎓', 'hub_academy'], ['learn', '🛡️', 'me_learn']];
    return `<h1>❤️ ${t('h3_health')}</h1><p class="small muted">${t('h3_health_intro')}</p>
      ${tile('bp', '❤️', bp ? `${bp.sys}/${bp.dia} <span class="small muted">mmHg · ${when(bp)}</span>` : '—', sb ? `<span class="pill ${sb.cls}">${t('bpcat_' + sb.c)}</span>` : `<span class="tiny muted">${t('h3_none_yet')}</span>`)}
      ${tile('glucose', '🩸', g ? `${N.fmtG(g.mg)} <span class="small muted">· ${t('ctx_' + (g.ctx || 'random'))} · ${when(g)}</span>` : '—', sg ? `<span class="pill ${sg.cls}">${t(sg.k)}</span>` : `<span class="tiny muted">${t('h3_none_yet')}</span>`)}
      ${tile('weight', '⚖️', w ? `${w.kg} kg <span class="small muted">· ${when(w)}</span>` : (pr.weight ? pr.weight + ' kg' : '—'), b ? `<span class="pill info">${t('bmi')} ${b} · ${t('bmi_' + E.bmiCat(b))}</span>` : '')}
      <p class="tiny muted">${t('h3_ranges_note')}</p>
      <h2>${t('h3_more_tools')}</h2><div class="tools">${tools.map(([r, i, k]) => `<a class="tool" href="#/${r}" data-tool="${r}"><span>${i}</span>${t(k)}</a>`).join('')}</div>
      <div class="card" style="border-left:4px solid var(--red)"><b>🚨 ${t('h3_emergency')}</b><p class="small" style="margin:6px 0">${t('h3_emergency_d')}</p><a class="btn block callbtn" href="tel:907">📞 ${t('rf_call')}</a></div>`;
  };
  A['rd-open'] = el => { S.rdTab = el.dataset.v; location.hash = '#/readings'; };

  /* ---------- medical report explainer ---------- */
  const LABS = [['hba1c', '%', '0.1', '6.5'], ['fpg', 'glu', '0.1', '100'], ['tc', 'mg/dL', '1', '190'], ['ldl', 'mg/dL', '1', '110'], ['hdl', 'mg/dL', '1', '50'], ['tg', 'mg/dL', '1', '140'], ['egfr', 'mL/min/1.73m²', '1', '90']];
  function labExplain(k, v, pr) {
    const dm = E.isDiabetic(pr), fem = pr.gender === 'female';
    let lvl = 'ok', key = '';
    if (k === 'hba1c') { if (dm) { key = v < 7 ? 'lab_a1c_dm_ok' : v < 9 ? 'lab_a1c_dm_high' : 'lab_a1c_dm_vhigh'; lvl = v < 7 ? 'ok' : v < 9 ? 'watch' : 'talk'; } else { key = v < 5.7 ? 'lab_a1c_ok' : v < 6.5 ? 'lab_a1c_pre' : 'lab_a1c_high'; lvl = v < 5.7 ? 'ok' : v < 6.5 ? 'watch' : 'talk'; } }
    if (k === 'fpg') { if (v < 70) { key = 'lab_fpg_low'; lvl = 'talk'; } else if (dm) { key = v <= 130 ? 'lab_fpg_dm_ok' : v < 250 ? 'lab_fpg_dm_high' : 'lab_fpg_vhigh'; lvl = v <= 130 ? 'ok' : v < 250 ? 'watch' : 'urgent'; } else { key = v < 100 ? 'lab_fpg_ok' : v < 126 ? 'lab_fpg_pre' : 'lab_fpg_high'; lvl = v < 100 ? 'ok' : v < 126 ? 'watch' : 'talk'; } }
    if (k === 'tc') { key = v < 200 ? 'lab_tc_ok' : v < 240 ? 'lab_tc_border' : 'lab_tc_high'; lvl = v < 200 ? 'ok' : v < 240 ? 'watch' : 'talk'; }
    if (k === 'ldl') { key = v < 100 ? 'lab_ldl_ok' : v < 130 ? 'lab_ldl_near' : v < 160 ? 'lab_ldl_border' : v < 190 ? 'lab_ldl_high' : 'lab_ldl_vhigh'; lvl = v < 130 ? 'ok' : v < 160 ? 'watch' : 'talk'; }
    if (k === 'hdl') { const lowT = fem ? 50 : 40; key = v < lowT ? 'lab_hdl_low' : v >= 60 ? 'lab_hdl_good' : 'lab_hdl_ok'; lvl = v < lowT ? 'watch' : 'ok'; }
    if (k === 'tg') { key = v < 150 ? 'lab_tg_ok' : v < 200 ? 'lab_tg_border' : v < 500 ? 'lab_tg_high' : 'lab_tg_vhigh'; lvl = v < 150 ? 'ok' : v < 200 ? 'watch' : v < 500 ? 'talk' : 'urgent'; }
    if (k === 'egfr') { key = v >= 90 ? 'lab_egfr_ok' : v >= 60 ? 'lab_egfr_mild' : v >= 30 ? 'lab_egfr_mod' : v >= 15 ? 'lab_egfr_low' : 'lab_egfr_vlow'; lvl = v >= 90 ? 'ok' : v >= 60 ? 'watch' : v >= 15 ? 'talk' : 'urgent'; }
    const tip = { hba1c: 'lab_tip_glucose', fpg: 'lab_tip_glucose', tc: 'lab_tip_ldl', ldl: 'lab_tip_ldl', hdl: 'lab_tip_hdl', tg: 'lab_tip_tg', egfr: 'lab_tip_kidney' }[k];
    return { k, v, lvl, text: t(key, { v }), tip: lvl === 'ok' ? '' : t(tip) };
  }
  function labsFrom(vals, pr) { return LABS.map(([k]) => k).filter(k => vals[k] != null && vals[k] !== '' && !isNaN(+vals[k])).map(k => labExplain(k, +vals[k], pr)); }
  const LVL_I = { ok: '🟢', watch: '🟡', talk: '🟠', urgent: '🔴' };
  S.lab = S.lab || { vals: {}, res: null, src: null };
  ROUTES.labs = function () {
    const pr = N.profile(), unit = N.settings().unit, v = S.lab.vals, ai = AI.enabled(), past = DB.get('labs', []);
    const fld = ([k, u, step, ph]) => `<div><label class="f" for="lab_${k}">${t('lab_' + k)} <span class="tiny muted">(${u === 'glu' ? (unit === 'mmol' ? 'mmol/L' : 'mg/dL') : u})</span></label><input class="in" id="lab_${k}" data-lab="${k}" type="number" step="${step}" inputmode="decimal" placeholder="${u === 'glu' && unit === 'mmol' ? '5.5' : ph}" value="${v[k] != null ? esc(k === 'fpg' && unit === 'mmol' ? +(v[k] / 18).toFixed(1) : v[k]) : ''}"></div>`;
    return hdr('🧪 ' + t('lab_title'), 'health') + `<p class="small muted">${t('lab_intro')}</p>
      <div class="card"><h3>📷 ${t('lab_photo')}</h3>${ai ? `<p class="tiny muted">${t('lab_photo_ai')}</p><label class="btn ghost block"><input type="file" accept="image/*" id="labPhoto" hidden>📷 ${t('lab_photo_btn')}</label>${navigator.onLine ? '' : `<p class="tiny" style="color:var(--adj)">📶 ${t('lab_needs_net')}</p>`}`
        : `<p class="small muted">${t('lab_photo_nokey')}</p><a class="btn sm ghost" href="#/settings">⚙️ ${t('me_settings')}</a>`}
        ${S.lab.err ? `<div class="banner amber small">${esc(S.lab.err)} ${S.lab.lastImg ? `<button class="btn sm" data-action="lab-retry">↻ ${t('v3_retry')}</button>` : ''}</div>` : ''}
        ${S.lab.src === 'ai' ? `<div class="banner amber small">🔎 ${t('lab_ai_check')}</div>` : ''}<p class="tiny muted">${t('lab_pdf_note')}</p></div>
      <div class="card"><h3>✍️ ${t('lab_type')}</h3><div class="grid2">${LABS.map(fld).join('')}</div>
        <button class="btn block" style="margin-top:14px" data-action="lab-explain" id="labExplain">${t('lab_explain')}</button></div>
      ${S.lab.res ? `<div id="labRes"><h2>${t('lab_results')}</h2>${S.lab.res.length ? S.lab.res.map(r => `<div class="card lab ${r.lvl}" data-labres="${r.k}"><div class="row between"><b>${LVL_I[r.lvl]} ${t('lab_' + r.k)}</b><span class="pill ${r.lvl === 'ok' ? 'good' : r.lvl === 'watch' ? 'adjust' : 'alt'}">${t('lvl_' + r.lvl)}</span></div><p class="small" style="margin:6px 0">${esc(r.text)}</p>${r.tip ? `<p class="tiny muted" style="margin:0">🍲 ${esc(r.tip)}</p>` : ''}</div>`).join('') : `<p class="muted small">${t('lab_none')}</p>`}
        <div class="note">🩺 ${t('lab_not_dx')}</div>${S.lab.res.some(r => r.lvl === 'urgent') ? `<a class="btn block callbtn" href="tel:907">📞 ${t('rf_call')}</a>` : ''}
        <div class="row" style="gap:8px;margin-top:8px"><button class="btn ghost grow" data-action="lab-profile" id="labProfile">👤 ${t('lab_to_profile')}</button><button class="btn ghost grow" data-action="ask" data-q="${esc(t('lab_ask_q'))}">💬 ${t('h3_ask')}</button></div></div>` : ''}
      ${past.length ? `<h2>${t('lab_history')}</h2><div class="card tight">${past.slice(-5).reverse().map(p => `<div class="stat"><span class="small">${new Date(p.ts).toLocaleDateString()}</span><span class="tiny muted">${Object.entries(p.vals).map(([k, x]) => t('lab_' + k).split(' (')[0] + ' ' + x).join(' · ')}</span></div>`).join('')}</div>` : ''}
      <p class="tiny muted">${t('lab_sources')}</p>`;
  };
  function readLabInputs() { const unit = N.settings().unit, vals = {}; document.querySelectorAll('[data-lab]').forEach(i => { if (i.value !== '') { let x = parseFloat(i.value); if (i.dataset.lab === 'fpg' && unit === 'mmol') x = Math.round(x * 18); vals[i.dataset.lab] = x; } }); return vals; }
  A['lab-explain'] = () => {
    const vals = readLabInputs(), pr = N.profile();
    const bad = Object.entries(vals).find(([k, x]) => !(x > 0 && x < ({ hba1c: 25, fpg: 900, egfr: 200 }[k] || 2000)));
    if (bad) return toast(t('rd_invalid'));
    S.lab.vals = vals; S.lab.res = labsFrom(vals, pr);
    if (Object.keys(vals).length) DB.set('labs', DB.get('labs', []).concat([{ id: uid(), ts: Date.now(), vals, src: S.lab.src || 'typed' }]).slice(-30));
    if (vals.fpg) { const fl = E.checkGlucose(vals.fpg, N.settings().unit); if (fl && fl.level === 'emergency') N.showAlert(fl); }
    N.rerender(); setTimeout(() => { const r = $('#labRes'); if (r) r.scrollIntoView({ behavior: low() ? 'auto' : 'smooth' }); }, 60);
  };
  A['lab-profile'] = () => {
    const v = S.lab.vals, pr = N.profile(), map = { hba1c: 'hba1c', tc: 'cholTotal', ldl: 'ldl', hdl: 'hdl', tg: 'trig' };
    Object.entries(map).forEach(([k, pk]) => { if (v[k] != null) pr[pk] = v[k]; }); pr.updated = Date.now(); DB.set('profile', pr); toast('✓ ' + t('profile_saved'));
  };
  async function labAI(img) {
    if (!navigator.onLine) { S.lab.err = t('lab_needs_net'); N.rerender(); return; }
    S.lab.err = null; loading(true, t('lab_reading')); 
    try {
      const sys = 'You read medical laboratory reports. Copy ONLY numbers that are clearly printed on the report. Never guess, estimate or invent a value. If a test is not on the report, use null. Reply with JSON only.';
      const prompt = 'Extract these results if present: {"hba1c_percent":null,"fasting_glucose_mg_dl":null,"total_cholesterol_mg_dl":null,"ldl_mg_dl":null,"hdl_mg_dl":null,"triglycerides_mg_dl":null,"egfr":null}. Convert mmol/L to mg/dL only for glucose (x18) and cholesterol/LDL/HDL (x38.67) and triglycerides (x88.57), and say nothing else.';
      const txt = await AI.chat([{ role: 'system', content: sys }, { role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: img, detail: low() ? 'low' : 'high' } }] }], { max_tokens: 300, timeout: 60000, temperature: 0 });
      const s = txt.replace(/```(?:json)?/gi, ''), j = JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1));
      const m = { hba1c: j.hba1c_percent, fpg: j.fasting_glucose_mg_dl, tc: j.total_cholesterol_mg_dl, ldl: j.ldl_mg_dl, hdl: j.hdl_mg_dl, tg: j.triglycerides_mg_dl, egfr: j.egfr }, vals = {};
      Object.entries(m).forEach(([k, x]) => { if (x != null && !isNaN(+x) && +x > 0) vals[k] = Math.round(+x * 10) / 10; });
      S.lab.vals = vals; S.lab.src = 'ai'; S.lab.res = null; S.lab.lastImg = null;
      if (!Object.keys(vals).length) S.lab.err = t('lab_ai_none');
    } catch (e) { S.lab.err = t('scan_ai_error', { e: e.message }); }
    loading(false); N.rerender();
  }
  A['lab-retry'] = () => { if (S.lab.lastImg) labAI(S.lab.lastImg); };
  document.addEventListener('change', async ev => {
    const el = ev.target;
    if (el.id === 'labPhoto' && el.files[0]) { try { const img = await N.compressImage(el.files[0], low() ? 900 : 1400, 0.8); S.lab.lastImg = img; labAI(img); } catch (e) { toast('Photo error'); } }
    if (el.dataset.actionChange === 'td-check') { const all = DB.get('daily', {}) || {}, d = all[today()] || {}; d[el.dataset.k] = el.checked; all[today()] = d; Object.keys(all).sort().slice(0, -30).forEach(k => delete all[k]); DB.set('daily', all); if (el.checked) toast('✓ ' + t('ch_well_done')); N.rerender(); }
    if (el.dataset.actionChange === 'rem-on') { DB.set('reminders', rems().map(r => r.id === el.dataset.id ? Object.assign({}, r, { on: el.checked }) : r)); N.rerender(); }
  });
  /* typed lab values in chat → explanation (no diagnosis) */
  const LAB_RX = { hba1c: /(?:hba1c|a1c|ኤ ?1 ?ሲ|ሄሞግሎቢን ኤ1ሲ)\D{0,12}?(\d{1,2}(?:\.\d)?)/i, ldl: /\bldl\D{0,12}?(\d{2,3})/i, hdl: /\bhdl\D{0,12}?(\d{2,3})/i, tg: /(?:triglycerides?|\btg\b|ትራይግሊሰራይድ)\D{0,12}?(\d{2,4})/i,
    tc: /(?:total cholesterol|cholesterol|ኮሌስትሮል)\D{0,12}?(\d{3})/i, egfr: /\begfr\D{0,12}?(\d{1,3})/i, fpg: /(?:fasting (?:blood )?(?:sugar|glucose)|\bfbs\b|\bfpg\b)\D{0,12}?(\d{2,3})/i };
  function labAnswer(q, pr) {
    const vals = {}; Object.entries(LAB_RX).forEach(([k, re]) => { const m = String(q).match(re); if (m) vals[k] = parseFloat(m[1]); });
    if (vals.tc && (vals.ldl === vals.tc || vals.hdl === vals.tc)) delete vals.tc;
    const res = labsFrom(vals, pr); if (!res.length) return null;
    return { text: t('lab_chat_title') + '\n' + res.map(r => `${LVL_I[r.lvl]} **${t('lab_' + r.k)} ${r.v}** — ${r.text}`).join('\n') + '\n\n' + t('lab_not_dx'), why: [t('lab_why')], sources: ['ADA 2025', 'AHA/ACC', 'NCEP ATP III', 'KDIGO'], links: [['labs', t('lab_title')]], topic: 'labs' };
  }

  /* ---------- offline AI queue ---------- */
  const queue = {
    list: () => DB.get('aiQueue', []) || [],
    add(q) { const id = uid(); DB.set('aiQueue', queue.list().concat([{ id, q, ts: Date.now() }])); updNet(); return id; },
    async run() {
      if (queue.busy || !navigator.onLine || !AI.enabled() || DB.locked) return;
      const l = queue.list(); if (!l.length) return;
      queue.busy = true; DB.set('aiQueue', []); toast('📶 ' + t('q_sending', { n: l.length })); updNet();
      try { await N.runQueued(l); } finally { queue.busy = false; }
    },
  };
  function updNet() {
    const b = $('#netBadge'); if (!b) return; const n = queue.list().length;
    b.hidden = navigator.onLine && !n; b.textContent = navigator.onLine ? (n ? '⏳ ' + n : '') : '📴 ' + t('offline_badge') + (n ? ' · ⏳ ' + n : '');
  }
  window.addEventListener('online', () => { updNet(); setTimeout(() => queue.run(), 600); });
  window.addEventListener('offline', updNet);

  /* re-render home/today when the day changes or app becomes visible; flush queue */
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !DB.locked) { updNet(); queue.run(); if (['home', 'today', 'challenges'].includes(S.route)) N.rerender(); } });
  setTimeout(() => { updNet(); queue.run(); tick(); }, 1500);

  window.NolaV3 = { langPicker, steps, scoreCard, labAnswer, labExplain, labsFrom, queue, rankDishes, chToday, chStreak, dailyItems, loading, fire, tick, updNet };
})();
