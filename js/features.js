/* NOLA HEALTH v2 feature screens: hub, food memory, glucose & meals, restaurant, budget planner, shopping list,
   family circle, supporting / clinician views, health report, academy, journey, memory, privacy. */
(function () {
  'use strict';
  const N = window.NolaApp, DB = window.NolaDB, E = window.NolaEngine, F = window.NolaFoods, CH = window.NolaCharts, AI = window.NolaAI;
  const PL = window.NolaPlanner, INS = window.NolaInsights, AC = window.NolaAcademy, SH = window.NolaShare, B = window.NolaBrain;
  const { S, esc, uid, dayKey, toast, md } = N;
  const $ = (s, el = document) => el.querySelector(s);
  const L = () => I18N.lang, R = Math.round, DAY = 864e5;
  const tr = o => o ? (o[L()] || o.en) : '';
  const fname = f => f ? (f.name[L()] || f.name.en) : '';
  const itemName = it => it.foodId && F.byId[it.foodId] ? fname(F.byId[it.foodId]) : (it.name || '?');
  const unit = () => N.settings().unit;
  const fmtG = mg => E.fmtGlucose(mg, unit());
  const dstr = ts => new Date(ts).toLocaleDateString(L() === 'am' ? 'am-ET' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const qp = k => new URLSearchParams((location.hash.split('?')[1] || '')).get(k);
  const hdr = (title, back = 'me', extra = '') => `<div class="hdr"><a class="iconbtn" href="#/${back}" aria-label="${t('back')}">‹</a><h1>${title}</h1>${extra}</div>`;
  const fbBtns = (kind, ref, extra = '') => { const v = (DB.get('feedback', []).find(x => x.kind === kind && x.ref === ref) || {}).vote || 0; return `<span class="fb">${extra}<button class="fbb ${v > 0 ? 'on' : ''}" data-action="fb" data-kind="${kind}" data-ref="${esc(ref)}" data-v="1" aria-label="${t('fb_up')}">👍</button><button class="fbb ${v < 0 ? 'on' : ''}" data-action="fb" data-kind="${kind}" data-ref="${esc(ref)}" data-v="-1" aria-label="${t('fb_down')}">👎</button></span>`; };
  const ROUTES = N.ROUTES, A = N.A;
  const flagCheck = (fl) => { if (fl) setTimeout(() => N.showAlert(fl), 250); };
  const textFlag = s => E.checkText(String(s || ''), unit());

  /* ---------- HUB tiles (used by Me/More screen) ---------- */
  const HUB = [
    ['coach', '✨', 'hub_ai', 'hub_ai_d'], ['insights', '🧠', 'hub_memory_food', 'hub_memory_food_d'], ['glucose', '🩸', 'hub_glucose', 'hub_glucose_d'],
    ['restaurant', '🍽️', 'hub_restaurant', 'hub_restaurant_d'], ['planner', '💰', 'hub_planner', 'hub_planner_d'], ['shopping', '🛒', 'hub_shopping', 'hub_shopping_d'],
    ['family', '👨‍👩‍👧', 'hub_family', 'hub_family_d'], ['clinician', '🩺', 'hub_clinician', 'hub_clinician_d'], ['academy', '🎓', 'hub_academy', 'hub_academy_d'],
    ['journey', '🌱', 'hub_journey', 'hub_journey_d'], ['memory', '🗂️', 'hub_remember', 'hub_remember_d'], ['privacy', '🔒', 'hub_privacy', 'hub_privacy_d'],
  ];
  HUB.push(['health', '❤️', 'h3_health', 'h3_health_d'], ['eat', '🍲', 'h3_eat', 'h3_eat_d'], ['today', '📋', 'h3_plan', 'h3_plan_d'], ['challenges', '🎯', 'ch_title', 'ch_hub_d'],
    ['reminders', '⏰', 'rem_title', 'rem_hub_d'], ['labs', '🧪', 'lab_title', 'lab_hub_d'], ['plan', '🧭', 'pg_title', 'pg_hub_d'], ['meds', '💊', 'md_title', 'md_hub_d'], ['diary', '📖', 'h3_food_history', 'h3_food_history_d'], ['settings', '⚙️', 'me_settings', 'set_hub_d']);
  const HUB_GROUPS = [['hg_daily', ['plan', 'today', 'eat', 'challenges', 'reminders']], ['hg_health', ['health', 'meds', 'glucose', 'labs', 'clinician', 'journey', 'diary']],
    ['hg_food', ['coach', 'insights', 'restaurant', 'planner', 'shopping', 'academy']], ['hg_people', ['family', 'memory', 'privacy', 'settings']]];
  function hubGrid() {
    const by = Object.fromEntries(HUB.map(h => [h[0], h]));
    return HUB_GROUPS.map(([g, ids]) => `<h2>${t(g)}</h2><div class="hub">${ids.map(r => by[r]).filter(Boolean).map(([r, i, k, d]) => `<a class="tile" href="#/${r}" data-hub="${r}"><span class="ti">${i}</span><b>${t(k)}</b><span class="tiny muted">${t(d)}</span></a>`).join('')}</div>`).join('');
  }

  /* ---------- FOOD MEMORY / INSIGHTS ---------- */
  ROUTES.insights = function () {
    const off = !INS.memOn('meals');
    if (off) return hdr(t('hub_memory_food')) + `<div class="card">${t('ins_off')}<br><a class="btn sm soft" href="#/memory" style="margin-top:10px">${t('hub_remember')}</a></div>`;
    const m = INS.foodMemory(), T = m.T;
    if (!m.enough) return hdr(t('hub_memory_food')) + `<div class="card center"><div style="font-size:40px">🧠</div><p>${t('ins_empty')}</p><a class="btn" href="#/scan">${t('dash_scan_cta')}</a></div>`;
    const grp = Object.entries(m.groups).map(([k, v]) => `<span class="gchip ${v ? 'on' : ''}">${v ? '✓' : '○'} ${t('grp_' + k)}</span>`).join('');
    const cmp = (k, label, u) => { const a = m.thisW ? m.thisW[k] : null, b = m.lastW ? m.lastW[k] : null; const arrow = a != null && b != null ? (a > b * 1.05 ? '↑' : a < b * 0.95 ? '↓' : '→') : ''; return `<tr><td>${label}</td><td><b>${a != null ? R(a) : '—'}</b> ${u}</td><td class="muted">${b != null ? R(b) + ' ' + u : '—'}</td><td>${arrow}</td></tr>`; };
    const total = (m.verdicts.good + m.verdicts.adjust + m.verdicts.alt) || 1;
    return hdr(t('hub_memory_food')) + `<p class="small muted">${t('ins_intro')}</p>
      <div class="card"><div class="row">${CH.ring(m.variety, 100, 96, m.variety, '/100')}<div><h3>${t('ins_variety')}</h3><div class="small muted">${t('ins_variety_d', { n: m.unique })}</div></div></div><div class="gchips">${grp}</div></div>
      <div class="grid2"><div class="card tight stat-card"><span class="big">${m.highNa}</span><span class="small">${t('ins_highna')}</span></div><div class="card tight stat-card"><span class="big">${m.sugary}</span><span class="small">${t('ins_sugary')}</span></div></div>
      <div class="card"><h3>${t('ins_frequent')}</h3><div class="chips">${m.frequent.map(x => `<span class="chip sm">${esc(x.id.startsWith('ai:') ? x.id.slice(3) : fname(F.byId[x.id]))} ×${x.n}</span>`).join('')}</div><div class="tiny muted" style="margin-top:6px">${t('ins_30d', { n: m.meals30 })}</div></div>
      <div class="card"><h3>${t('ins_trend')}</h3><table class="tbl"><tr><th></th><th>${t('ins_this_week')}</th><th>${t('ins_last_week')}</th><th></th></tr>${cmp('kcal', t('n_kcal'), 'kcal')}${cmp('na', t('n_na'), 'mg')}${cmp('c', t('n_c'), 'g')}${cmp('as', t('n_as'), 'g')}${cmp('fb', t('n_fb'), 'g')}</table><div class="tiny muted">${t('ins_daily_avg')} · ${t('n_na')} ${t('target')}: ${T.na} mg</div></div>
      <div class="card"><h3>${t('ins_verdicts')}</h3><div class="stack">${['good', 'adjust', 'alt'].map(v => `<i class="${v}" style="width:${m.verdicts[v] / total * 100}%"></i>`).join('')}</div><div class="tiny muted">${['good', 'adjust', 'alt'].map(v => `${t('verdict_' + v)}: ${m.verdicts[v]}`).join(' · ')}</div></div>
      <div class="card tip"><h3>💡 ${t('ins_suggestions')}</h3>${m.sugg.length ? `<ul class="clean">${m.sugg.map(k => `<li>${esc(t(k))} ${fbBtns('insight', k)}</li>`).join('')}</ul>` : `<p class="small">${t('ins_s_good')}</p>`}</div>
      <div class="note">ℹ️ ${t('ins_no_cause')}</div>
      <a class="btn block ghost" href="#/diary">${t('ins_history')}</a>`;
  };

  /* ---------- GLUCOSE & MEALS ---------- */
  S.gl = S.gl || { act: 'none', meal: null };
  ROUTES.glucose = function () {
    const gi = INS.glucoseInsights(), logs = DB.get('glogs', []).slice().sort((a, b) => b.ts - a.ts), u = unit();
    const recent = N.meals().filter(m => Date.now() - m.ts < 2 * DAY).sort((a, b) => b.ts - a.ts);
    const now = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
    const ph = u === 'mmol' ? '5.5' : '100';
    const pending = logs.filter(l => l.post == null);
    const pairs = gi.logs.slice(-10);
    const chart = pairs.length ? `<div class="pairs">${pairs.map(l => { const mx = Math.max(250, ...pairs.map(x => x.post)); return `<div class="pair" title="${esc(l.name || '')}"><div class="bars"><i class="pre" style="height:${l.pre / mx * 100}%"></i><i class="post ${l.post >= 180 ? 'hi' : ''}" style="height:${l.post / mx * 100}%"></i></div><span>+${R(l.post - l.pre)}</span><span class="tiny muted">${esc((l.name || t('meal_' + l.meal)).slice(0, 10))}</span></div>`; }).join('')}</div><div class="tiny muted"><i class="lg pre"></i> ${t('gl_pre')} <i class="lg post"></i> ${t('gl_post')} · ${t('gl_rise_mgdl')}</div>` : `<p class="small muted">${t('gl_no_pairs')}</p>`;
    const pat = [];
    gi.foods.slice(0, 4).forEach(f => pat.push(t('gl_pat_food', { f: fname(F.byId[f.id]) || f.id, rise: f.avg, n: f.n })));
    if (gi.activity) pat.push(t('gl_pat_act', { a: gi.activity.with, b: gi.activity.without, n1: gi.activity.n1, n2: gi.activity.n2 }));
    gi.times.forEach(x => pat.push(t('gl_pat_time', { m: t('meal_' + x.meal), rise: x.avg, n: x.n })));
    if (gi.highPost) pat.push(t('gl_pat_high', { n: gi.highPost, v: fmtG(180) }));
    return hdr(t('hub_glucose')) + `<p class="small muted">${t('gl_intro')}</p>
      ${pending.length ? `<div class="card amber-card"><h3>⏱ ${t('gl_pending')}</h3>${pending.map(l => `<div class="row between" style="margin-top:8px"><span class="small"><b>${esc(l.name || t('meal_' + l.meal))}</b> · ${t('gl_pre')} ${fmtG(l.pre)} · ${new Date(l.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><button class="btn sm" data-action="gl-add-post" data-id="${l.id}">+ ${t('gl_post')}</button></div>`).join('')}</div>` : ''}
      <div class="card"><h3>${t('gl_new')}</h3>
        ${recent.length ? `<label class="f">${t('gl_link_meal')}</label><div class="chips">${recent.slice(0, 6).map(m => `<button class="chip sm ${S.gl.meal === m.id ? 'on' : ''}" data-action="gl-link" data-id="${m.id}">${t('meal_' + m.meal)}: ${esc(m.items.map(itemName).join(', ').slice(0, 28))}</button>`).join('')}</div>` : ''}
        <label class="f" for="glName">${t('gl_meal_name')}</label><input class="in" id="glName" placeholder="${t('gl_meal_ph')}" value="${esc(S.gl.meal ? (N.meals().find(m => m.id === S.gl.meal) || { items: [] }).items.map(itemName).join(' + ') : '')}">
        <div class="grid2"><div><label class="f">${t('gl_meal_type')}</label><select class="in" id="glMeal">${['breakfast', 'lunch', 'dinner', 'snack'].map(m => `<option value="${m}" ${N.defaultMeal() === m ? 'selected' : ''}>${t('meal_' + m)}</option>`).join('')}</select></div><div><label class="f">${t('gl_time')}</label><input class="in" id="glTime" type="datetime-local" value="${now}"></div></div>
        <label class="f" for="glIng">${t('scan_ingredients')}</label><input class="in" id="glIng" placeholder="teff, shiro, onion, oil">
        <label class="f" for="glPortion">${t('scan_portion')}</label><input class="in" id="glPortion" placeholder="${t('gl_portion_ph')}">
        <div class="grid2"><div><label class="f">${t('gl_pre')} (${u === 'mmol' ? 'mmol/L' : 'mg/dL'})</label><input class="in" id="glPre" type="number" step="0.1" inputmode="decimal" placeholder="${ph}"></div><div><label class="f">${t('gl_post')} (${u === 'mmol' ? 'mmol/L' : 'mg/dL'})</label><input class="in" id="glPost" type="number" step="0.1" inputmode="decimal" placeholder="${t('optional')}"></div></div>
        <label class="f">${t('gl_post_min')}</label><div class="seg" id="glMin">${[60, 120].map(x => `<button type="button" class="${x === 120 ? 'on' : ''}" data-action="seg-pick" data-v="${x}">${x} min</button>`).join('')}</div>
        <label class="f">${t('gl_activity')}</label><div class="chips" id="glAct">${['none', 'walk10', 'walk30', 'other'].map(a => `<button type="button" class="chip sm ${S.gl.act === a ? 'on' : ''}" data-action="gl-act" data-v="${a}">${t('act2_' + a)}</button>`).join('')}</div>
        <label class="f" for="glMed">${t('gl_med')} <span class="muted small">(${t('optional')})</span></label><input class="in" id="glMed" placeholder="${t('gl_med_ph')}"><p class="tiny muted">${t('gl_med_note')}</p>
        <button class="btn block" data-action="gl-save" id="glSave">${t('save')}</button></div>
      <div class="card"><h3>${t('gl_compare')}</h3>${chart}</div>
      <div class="card"><h3>${t('gl_patterns')}</h3>${pat.length ? `<ul class="clean">${pat.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : `<p class="small muted">${t('gl_no_patterns')}</p>`}
        <div class="note">⚠️ ${t('gl_disclaimer')}</div></div>
      <h2>${t('rd_history')}</h2>${logs.length ? logs.map(l => `<div class="card tight"><div class="row between"><b>${esc(l.name || t('meal_' + l.meal))}</b><button class="link" data-action="gl-del" data-id="${l.id}" aria-label="${t('del')}">🗑</button></div>
        <div class="small">${t('gl_pre')}: <b>${fmtG(l.pre)}</b>${l.post != null ? ` → ${t('gl_post')} (${l.postMin || 120} min): <b>${fmtG(l.post)}</b> · <b>${l.post - l.pre >= 0 ? '+' : ''}${u === 'mmol' ? ((l.post - l.pre) / 18).toFixed(1) : R(l.post - l.pre)}</b>` : ''}</div>
        <div class="tiny muted">${t('meal_' + l.meal)} · ${new Date(l.ts).toLocaleString()} · ${t('act2_' + (l.activity || 'none'))}${l.portion ? ' · ' + esc(l.portion) : ''}${l.med ? ' · 💊 ' + esc(l.med) : ''}</div></div>`).join('') : `<p class="small muted">${t('rd_none')}</p>`}`;
  };
  A['gl-link'] = el => { S.gl.meal = S.gl.meal === el.dataset.id ? null : el.dataset.id; N.rerender(); };
  A['gl-act'] = el => { S.gl.act = el.dataset.v; el.parentNode.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === el)); };
  A['seg-pick'] = el => el.parentNode.querySelectorAll('button').forEach(c => c.classList.toggle('on', c === el));
  A['gl-save'] = () => {
    const u = unit(), pre = parseFloat($('#glPre').value), post = parseFloat($('#glPost').value);
    const preMg = E.toMgdl(pre, u), postMg = isNaN(post) ? null : E.toMgdl(post, u);
    if (!(preMg >= 15 && preMg <= 700) || (postMg != null && !(postMg >= 15 && postMg <= 700))) return toast(t('rd_invalid'));
    const ts = $('#glTime').value ? new Date($('#glTime').value).getTime() : Date.now();
    const linked = S.gl.meal && N.meals().find(m => m.id === S.gl.meal);
    const name = $('#glName').value.trim();
    let foods = linked ? linked.items.map(i => i.foodId).filter(Boolean) : [];
    if (!foods.length && name) name.split(/\+|,| with | and |፣|ና /i).forEach(p => { const f = F.match(p.trim()); if (f && !foods.includes(f.id)) foods.push(f.id); });
    const minBtn = $('#glMin .on');
    const l = { id: uid(), ts, meal: $('#glMeal').value, mealId: linked ? linked.id : null, foods, name: name || null, ingredients: $('#glIng').value.trim(), portion: $('#glPortion').value.trim(), pre: preMg, post: postMg, postMin: minBtn ? +minBtn.dataset.v : 120, activity: S.gl.act, med: $('#glMed').value.trim() };
    DB.set('glogs', DB.get('glogs', []).concat([l]));
    const rs = N.readings().slice(); rs.push({ id: uid(), type: 'glucose', ts, mg: preMg, ctx: 'before', glog: l.id }); if (postMg != null) rs.push({ id: uid(), type: 'glucose', ts: ts + l.postMin * 6e4, mg: postMg, ctx: 'after', glog: l.id }); DB.set('readings', rs);
    S.gl = { act: 'none', meal: null }; toast(t('rd_saved')); N.rerender();
    flagCheck(E.checkGlucose(preMg, u) || (postMg != null && E.checkGlucose(postMg, u)) || textFlag(l.ingredients + ' ' + l.name + ' ' + l.med));
  };
  A['gl-add-post'] = el => {
    const u = unit();
    N.openSheet(`<div class="row between"><h2 style="margin:0">${t('gl_post')}</h2><button class="iconbtn" data-action="close-sheet">✕</button></div><label class="f">${t('rd_value')} (${u === 'mmol' ? 'mmol/L' : 'mg/dL'})</label><input class="in" id="glPost2" type="number" step="0.1" inputmode="decimal">
      <label class="f">${t('gl_post_min')}</label><div class="seg" id="glMin2">${[60, 120].map(x => `<button type="button" class="${x === 120 ? 'on' : ''}" data-action="seg-pick" data-v="${x}">${x} min</button>`).join('')}</div>
      <button class="btn block" style="margin-top:14px" data-action="gl-save-post" data-id="${el.dataset.id}" id="glSavePost">${t('save')}</button>`);
  };
  A['gl-save-post'] = el => {
    const u = unit(), mg = E.toMgdl(parseFloat($('#glPost2').value), u); if (!(mg >= 15 && mg <= 700)) return toast(t('rd_invalid'));
    const min = +($('#glMin2 .on') || { dataset: { v: 120 } }).dataset.v;
    const logs = DB.get('glogs', []).map(l => l.id === el.dataset.id ? Object.assign({}, l, { post: mg, postMin: min }) : l); DB.set('glogs', logs);
    const l = logs.find(x => x.id === el.dataset.id); DB.set('readings', N.readings().concat([{ id: uid(), type: 'glucose', ts: l.ts + min * 6e4, mg, ctx: 'after', glog: l.id }]));
    N.closeSheet(); toast(t('rd_saved')); N.rerender(); flagCheck(E.checkGlucose(mg, u));
  };
  A['gl-del'] = el => { if (!confirm(t('del') + '?')) return; DB.set('glogs', DB.get('glogs', []).filter(l => l.id !== el.dataset.id)); DB.set('readings', N.readings().filter(r => r.glog !== el.dataset.id)); N.rerender(); };

  /* ---------- RESTAURANT ASSISTANT ---------- */
  S.rest = S.rest || { options: [], compare: [], style: 'restaurant', injera: true, status: 'idle', err: null };
  const parseJ = x => { const c = x.replace(/```(?:json)?/gi, ''); return JSON.parse(c.slice(c.indexOf('{'), c.lastIndexOf('}') + 1)); };
  function restOption(name, items, src) { return { id: uid(), name, items, src }; }
  function parseTyped(text) {
    const out = [], miss = [];
    text.split(/\n|;|,(?![^()]*\))/).map(s => s.trim()).filter(Boolean).forEach(line => {
      const parts = line.split(/\s+(?:with|and|\+|&)\s+|\+|\s+በ\s*|፣/i).map(s => s.trim()).filter(Boolean);
      const items = []; parts.forEach(p => { const f = F.match(p); if (f && !items.some(i => i.foodId === f.id)) items.push({ foodId: f.id, mult: 1, oil: 'normal', salt: 'normal', conf: null }); });
      if (!items.length) { miss.push(line); return; }
      out.push(restOption(line, items, 'typed'));
    });
    return { out, miss };
  }
  function restItems(o) {
    const st = S.rest.style, items = o.items.map(i => { const f = F.byId[i.foodId]; const x = Object.assign({}, i); if (st === 'restaurant' && f && (f.oil > 0 || f.salt)) { x.oil = 'high'; x.salt = 'high'; } return x; });
    const hasStaple = items.some(i => { const f = F.byId[i.foodId]; return f && (f.cat === 'staple' || f.cat === 'breakfast' || f.cat === 'drink' || f.cat === 'fruit' || f.cat === 'snack'); });
    if (S.rest.injera && !hasStaple && !items.some(i => i.custom)) items.push({ foodId: 'injera_teff', mult: 1, oil: 'normal', salt: 'normal', conf: null, auto: true });
    return items;
  }
  function rankOptions() {
    const pr = N.profile(), T = E.targets(pr), dm = E.isDiabetic(pr), htn = E.has(pr, 'htn'), chol = E.has(pr, 'chol') || E.has(pr, 'heart');
    return S.rest.options.map(o => {
      const items = restItems(o), a = E.analyze(items, pr, 'lunch'), tt = a.totals, sh = a.share;
      const score = { good: 0, adjust: 1, alt: 2 }[a.verdict] * 100 + (tt.c / a.carbGuide) * (dm ? 30 : 10) + (tt.na / (T.na * sh)) * (htn ? 30 : 12) + (tt.sf / (T.sf * sh)) * (chol ? 25 : 10) + (tt.kcal / (T.kcal * sh)) * 12 - Math.min(tt.fb, 15);
      return { o, items, a, score };
    }).sort((x, y) => x.score - y.score);
  }
  ROUTES.restaurant = function () {
    const r = S.rest, ai = AI.enabled(), ranked = rankOptions();
    const card = (x, i) => { const tt = x.a.totals, top = x.a.why.find(w => !w.good && w.lvl) || x.a.why[0]; const on = r.compare.includes(x.o.id);
      return `<div class="card tight rank"><div class="row between"><div class="row" style="gap:8px"><span class="rk">${i + 1}</span><b>${esc(x.o.name)}</b></div><span class="pill ${x.a.verdict}">${t('verdict_' + x.a.verdict)}</span></div>
        <div class="tiny muted" style="margin:4px 0">${esc(x.items.map(it => itemName(it) + (it.auto ? ' *' : '')).join(' + '))}</div>
        <div class="small">${R(tt.kcal)} kcal · ${R(tt.c)} g ${t('n_c')} · ${R(tt.na)} mg Na · ${R(tt.sf)} g ${t('n_sf')}</div>
        ${top ? `<div class="small" style="margin-top:4px">${top.good ? '✅' : '•'} ${esc(top.text)}</div>` : ''}
        <div class="row" style="margin-top:8px;gap:8px"><label class="check sm"><input type="checkbox" data-action-change="rest-cmp" data-id="${x.o.id}" ${on ? 'checked' : ''}><span class="small">${t('rest_compare')}</span></label><span class="grow"></span><button class="btn sm soft" data-action="rest-log" data-id="${x.o.id}">${t('rest_log')}</button><button class="iconbtn" data-action="rest-del" data-id="${x.o.id}" aria-label="${t('del')}">✕</button></div></div>`; };
    const cmp = ranked.filter(x => r.compare.includes(x.o.id));
    let table = '';
    if (cmp.length >= 2) {
      const rows = [['kcal', 'kcal', 1], ['p', 'g', -1], ['c', 'g', 1], ['s', 'g', 1], ['f', 'g', 1], ['sf', 'g', 1], ['fb', 'g', -1], ['na', 'mg', 1], ['k', 'mg', -1]];
      table = `<div class="card" id="cmpTable"><h3>${t('rest_side')}</h3><div class="scroll-x"><table class="tbl cmp"><tr><th></th>${cmp.map(x => `<th>${esc(x.o.name)}</th>`).join('')}</tr>
        <tr><td>${t('res_title')}</td>${cmp.map(x => `<td><span class="pill ${x.a.verdict}">${t('verdict_' + x.a.verdict)}</span></td>`).join('')}</tr>
        ${rows.map(([k, u, dir]) => { const vals = cmp.map(x => x.a.totals[k]); const best = dir > 0 ? Math.min(...vals) : Math.max(...vals); return `<tr><td>${t('n_' + k)}</td>${vals.map(v => `<td class="${Math.abs(v - best) < 0.5 ? 'best' : ''}">${R(v)} ${u}</td>`).join('')}</tr>`; }).join('')}</table></div><div class="tiny muted">${t('rest_best_note')}</div></div>`;
    }
    return hdr(t('hub_restaurant')) + `<p class="small muted">${t('rest_intro')}</p>
      <div class="card"><h3>${t('rest_add')}</h3>
        <div class="scan-btns" style="justify-content:flex-start;flex-wrap:wrap"><label class="btn sm ${ai ? '' : 'ghost'}"><input type="file" accept="image/*" capture="environment" id="menuIn" hidden>📜 ${t('rest_menu_photo')}</label><label class="btn sm ${ai ? '' : 'ghost'}"><input type="file" accept="image/*" capture="environment" id="restMealIn" hidden>📷 ${t('rest_meal_photo')}</label></div>
        ${ai ? '' : `<p class="tiny muted">📴 ${t('rest_ai_off')}</p>`}
        ${r.status === 'loading' ? `<div class="row"><div class="spinner sm"></div><span class="small">${t('scan_analyzing')}</span></div>` : ''}${r.err ? `<div class="banner amber">${esc(r.err)}</div>` : ''}
        <label class="f" for="restText">${t('rest_type')}</label><textarea class="in" id="restText" rows="3" placeholder="${t('rest_type_ph')}"></textarea>
        <button class="btn block" style="margin-top:10px" data-action="rest-add" id="restAdd">${t('rest_match')}</button>
        ${r.miss && r.miss.length ? `<div class="banner amber small">${t('rest_unmatched')}: ${esc(r.miss.join(', '))} <button class="link small" data-action="rest-pick">${t('scan_add_food')}</button></div>` : ''}</div>
      ${ranked.length ? `<div class="row between"><h2>${t('rest_ranked')}</h2><button class="link small" data-action="rest-clear">↺</button></div>
        <div class="card tight"><div class="row between"><span class="small">${t('rest_style')}</span><div class="seg" style="width:200px">${['restaurant', 'home'].map(v => `<button class="${r.style === v ? 'on' : ''}" data-action="rest-style" data-v="${v}">${t('rest_style_' + v)}</button>`).join('')}</div></div>
        <label class="check sm" style="margin-top:8px"><input type="checkbox" data-action-change="rest-injera" ${r.injera ? 'checked' : ''}><span class="small">${t('rest_with_injera')}</span></label></div>
        ${table}${ranked.map(card).join('')}<div class="card tip"><h3>💡 ${t('rest_tips')}</h3><ul class="clean"><li>${t('rest_tip1')}</li><li>${t('rest_tip2')}</li><li>${t('rest_tip3')}</li></ul></div>
        <div class="note">ℹ️ ${t('estimates_note')} ${t('rest_assume')}</div>` : `<div class="card center muted small">${t('rest_empty')}</div>`}`;
  };
  A['rest-add'] = () => {
    const txt = $('#restText').value; if (!txt.trim()) return;
    const fl = textFlag(txt); const { out, miss } = parseTyped(txt);
    S.rest.options = S.rest.options.concat(out); S.rest.miss = miss;
    if (!S.rest.compare.length && S.rest.options.length >= 2) S.rest.compare = S.rest.options.slice(0, 3).map(o => o.id);
    DB.set('restaurant', S.rest.options); N.rerender(); flagCheck(fl);
  };
  A['rest-pick'] = () => { S.restPick = true; N.openPicker(); };
  A['rest-del'] = el => { S.rest.options = S.rest.options.filter(o => o.id !== el.dataset.id); S.rest.compare = S.rest.compare.filter(x => x !== el.dataset.id); DB.set('restaurant', S.rest.options); N.rerender(); };
  A['rest-clear'] = () => { S.rest.options = []; S.rest.compare = []; S.rest.miss = []; DB.set('restaurant', []); N.rerender(); };
  A['rest-style'] = el => { S.rest.style = el.dataset.v; N.rerender(); };
  A['rest-log'] = el => {
    const o = S.rest.options.find(x => x.id === el.dataset.id); if (!o) return;
    S.draft = N.newDraft(); S.draft.items = restItems(o).map(i => Object.assign({}, i, { method: S.rest.style === 'restaurant' ? 'restaurant' : undefined })); location.hash = '#/scan';
  };
  async function restPhoto(file, kind) {
    if (!file) return;
    if (!AI.enabled()) { toast(t('rest_ai_off')); if (kind === 'meal') { S.draft = N.newDraft(); location.hash = '#/scan'; } return; }
    S.rest.status = 'loading'; S.rest.err = null; N.rerender();
    try {
      const img = await N.compressImage(file, N.settings().lowData ? 640 : 1024, 0.75);
      if (kind === 'meal') {
        const items = await AI.recognize(img); if (!items.length) throw new Error('no food found');
        S.rest.options.push(restOption(items.map(itemName).join(' + '), items, 'photo'));
      } else {
        const list = F.FOODS.map(f => `${f.id}: ${f.name.en}`).join('\n');
        const txt = await AI.chat([{ role: 'system', content: 'You read restaurant menus (Ethiopian and international). Reply with JSON only.' }, { role: 'user', content: [{ type: 'text', text: `List the dishes on this menu photo. Map each to the closest of these database ids (use null if none):\n${list}\nReturn {"dishes":[{"name":"as written","items":["db_id", "..."],"price":"if visible"}]}. Max 15 dishes.` }, { type: 'image_url', image_url: { url: img } }] }], { max_tokens: 900 });
        const j = parseJ(txt);
        (j.dishes || []).forEach(d => { const items = (d.items || []).filter(id => F.byId[id]).map(id => ({ foodId: id, mult: 1, oil: 'normal', salt: 'normal', conf: 0.6 })); if (!items.length) { const f = F.match(d.name); if (f) items.push({ foodId: f.id, mult: 1, oil: 'normal', salt: 'normal', conf: 0.5 }); } if (items.length) S.rest.options.push(restOption(d.name + (d.price ? ' (' + d.price + ')' : ''), items, 'menu')); });
        if (!(j.dishes || []).length) throw new Error('no dishes found');
      }
      S.rest.status = 'done'; DB.set('restaurant', S.rest.options);
    } catch (e) { S.rest.status = 'error'; S.rest.err = t('scan_ai_error', { e: e.message }); }
    N.rerender();
  }
  const _pick = A['pick-food'], _close = A['close-sheet'];
  A['pick-food'] = (el, ev) => { if (S.restPick) { const f = F.byId[el.dataset.id]; S.rest.options.push(restOption(fname(f), [{ foodId: f.id, mult: 1, oil: 'normal', salt: 'normal', conf: null }], 'typed')); DB.set('restaurant', S.rest.options); toast('+ ' + fname(f)); el.style.background = '#e8f5ec'; return; } _pick(el, ev); };
  A['close-sheet'] = () => { const was = S.restPick; S.restPick = false; _close(); if (was) N.rerender(); };

  /* ---------- BUDGET PLANNER ---------- */
  const COMMON = ['teff', 'wheat_flour', 'barley_flour', 'shiro', 'lentils', 'split_peas', 'fava', 'chickpeas', 'eggs', 'ayib', 'milk', 'onion', 'tomato', 'potato', 'cabbage', 'collards', 'carrot', 'pumpkin', 'banana', 'veg_oil', 'berbere', 'salt', 'rice', 'pasta'];
  const PREFER = ['shiro', 'misir', 'kik', 'gomen', 'ful', 'firfir', 'tibs', 'doro', 'asa', 'egg', 'ayib', 'genfo', 'beyaynetu', 'atkilt'];
  const PL_RS = ['vegetarian', 'vegan', 'glutenfree', 'lowsalt'];
  S.plan = S.plan || { avail: [] };
  const SWAP_KEYS = ['sw_beef', 'sw_kibbeh', 'sw_oats', 'sw_olive', 'sw_rice', 'sw_juice', 'sw_bread', 'sw_salmon'];
  ROUTES.planner = function () {
    const plan = DB.get('plan'), last = plan || {}, pr = N.profile();
    const form = `<div class="card"><h3>${t('pl_budget')}</h3><div class="grid2"><div><label class="f" for="plAmount">${t('pl_amount')} (ETB)</label><input class="in" id="plAmount" type="number" inputmode="numeric" min="1" value="${last.amount || 250}"></div>
        <div><label class="f">${t('pl_period')}</label><div class="seg" id="plPeriod">${['day', 'week'].map(p => `<button type="button" class="${(last.period || 'day') === p ? 'on' : ''}" data-action="seg-pick" data-v="${p}">${t('pl_per_' + p)}</button>`).join('')}</div></div></div>
        <label class="f" for="plPeople">${t('pl_people')}</label><input class="in" id="plPeople" type="number" min="1" max="12" inputmode="numeric" value="${last.people || 1}">
        <label class="check"><input type="checkbox" id="plFast" ${last.fastingSeason ? 'checked' : ''}><span class="small">${t('pl_fasting_season')}</span></label>
        ${(pr.restrictions || []).includes('fasting') ? `<p class="tiny muted">${t('pl_fast_wf')}</p>` : ''}
        <label class="f">${t('pl_prefer')}</label><div class="chips" id="plPrefer">${PREFER.map(k => { const f = F.byId[k] || F.match(k); return `<button type="button" class="chip sm ${((S.plan.prefer || last.prefer || [])).includes(k) ? 'on' : ''}" data-action="pl-prefer" data-v="${k}">${esc(f ? fname(f).split(' (')[0] : k)}</button>`; }).join('')}</div>
        <label class="f">${t('pl_rs')}</label><div class="chips" id="plRs">${PL_RS.map(k => `<button type="button" class="chip sm ${((S.plan.rs || last.restrictions || [])).includes(k) || (pr.restrictions || []).includes(k) ? 'on' : ''}" data-action="pl-rs" data-v="${k}" ${(pr.restrictions || []).includes(k) ? 'disabled title="profile"' : ''}>${t('r_' + k)}</button>`).join('')}</div>
        <label class="f">${t('pl_have')}</label><div class="chips" id="plHave">${COMMON.map(k => `<button type="button" class="chip sm ${(S.plan.avail.length ? S.plan.avail : last.available || []).includes(k) ? 'on' : ''}" data-action="pl-have" data-v="${k}">${esc(PL.ING[k][L() === 'am' ? 1 : 0])}</button>`).join('')}</div>
        <button class="btn block" style="margin-top:14px" data-action="pl-generate" id="plGen">${plan ? t('pl_regen') : t('pl_generate')}</button>
        <p class="tiny muted">💲 ${t('pl_price_label')} <a href="#/prices">${t('pl_edit_prices')}</a></p></div>`;
    if (!plan) return hdr(t('hub_planner')) + `<p class="small muted">${t('pl_intro')}</p>` + form;
    const T = E.targets(pr);
    const days = plan.days.map((d, i) => `<div class="card tight day"><div class="row between"><b>${new Date(d.date).toLocaleDateString(L() === 'am' ? 'am-ET' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}</b><span class="small ${d.cost > plan.daily * 1.001 ? 'warn-t' : 'muted'}">~${R(d.cost)} ETB</span></div>${d.fastingDay ? `<span class="pill info tiny">🌿 ${t('pl_fasting_day')}</span>` : ''}
      ${['breakfast', 'lunch', 'dinner', 'snack'].filter(s => d.meals[s]).map(s => { const m = d.meals[s], ds = PL.dish(m.dish); return `<div class="pmeal"><span class="tiny muted">${t('meal_' + s)}</span><div class="row between"><span class="small"><b>${esc(tr(ds.name))}</b> <span class="pill ${m.verdict} tiny">${t('verdict_' + m.verdict)}</span></span>${fbBtns('plan', m.dish, `<span class="tiny muted">~${R(m.cost)}</span>`)}</div></div>`; }).join('')}
      <div class="tiny muted">${R(d.totals.kcal)} / ${T.kcal} kcal · ${t('n_c')} ${R(d.totals.c)} g · Na ${R(d.totals.na)} mg</div></div>`).join('');
    const why = [t('pl_why_cheap'), ...B.personalWhy(pr)];
    return hdr(t('hub_planner')) + `<div class="card"><div class="row between"><div><div class="small muted">${t('pl_total')}</div><div style="font-size:24px;font-weight:800">~${R(plan.total)} ETB</div><div class="tiny muted">${t('pl_per_day_avg', { v: R(plan.total / 7), b: R(plan.daily) })} · ${t('pl_people_n', { n: plan.people })}</div></div>${CH.ring(Math.min(plan.total, plan.daily * 7), plan.daily * 7, 84, R(plan.total / (plan.daily * 7) * 100) + '%', t('pl_of_budget'))}</div>
        ${plan.overBudget ? `<div class="banner amber small">${t('pl_over')}</div>` : `<div class="banner green small">✓ ${t('pl_within')}</div>`}
        <div class="row" style="gap:8px;margin-top:8px"><a class="btn sm grow" href="#/shopping" id="toShopping">🛒 ${t('hub_shopping')}</a><a class="btn sm ghost" href="#/prices">${t('pl_edit_prices')}</a></div></div>
      <details class="card tight"><summary class="small"><b>${t('pl_why')}</b></summary><ul class="clean small">${why.map(w => `<li>${esc(w)}</li>`).join('')}</ul></details>
      ${days}<p class="tiny muted">${t('pl_fb_note')}</p>
      <div class="card" id="localAlts"><h3>🇪🇹 ${t('pl_local_alts')}</h3><ul class="clean small">${SWAP_KEYS.map(k => `<li>${esc(t(k))}</li>`).join('')}</ul></div>
      <h2>${t('pl_change')}</h2>${form}`;
  };
  A['pl-have'] = el => { const cur = S.plan.avail.length ? S.plan.avail : ((DB.get('plan') || {}).available || []).slice(); const v = el.dataset.v; S.plan.avail = cur.includes(v) ? cur.filter(x => x !== v) : cur.concat([v]); if (!S.plan.avail.length) S.plan.avail = []; el.classList.toggle('on'); };
  A['pl-prefer'] = el => { el.classList.toggle('on'); S.plan.prefer = Array.from(document.querySelectorAll('#plPrefer .chip.on')).map(c => c.dataset.v); };
  A['pl-rs'] = el => { el.classList.toggle('on'); S.plan.rs = Array.from(document.querySelectorAll('#plRs .chip.on:not([disabled])')).map(c => c.dataset.v); };
  A['pl-generate'] = () => {
    const amount = +$('#plAmount').value, people = +$('#plPeople').value || 1;
    if (!(amount > 0)) return toast(t('rd_invalid'));
    const period = ($('#plPeriod .on') || { dataset: { v: 'day' } }).dataset.v;
    const available = Array.from(document.querySelectorAll('#plHave .chip.on')).map(c => c.dataset.v);
    const prefer = Array.from(document.querySelectorAll('#plPrefer .chip.on')).map(c => c.dataset.v), restrictions = Array.from(document.querySelectorAll('#plRs .chip.on:not([disabled])')).map(c => c.dataset.v);
    const plan = PL.generate({ amount, period, people, fastingSeason: $('#plFast').checked, available, prefer, restrictions }); S.plan.prefer = null; S.plan.rs = null;
    PL.shoppingFromPlan(plan); S.plan.avail = []; toast(t('pl_done')); N.route();
  };
  ROUTES.prices = function () {
    const P = PL.prices(), over = DB.get('prices', {});
    return hdr(t('pl_prices'), 'planner') + `<div class="note">💲 ${t('pl_price_label')}</div><div class="card tight" id="priceFeed"><b>📡 ${t('pf_title')}</b> <span class="pill info tiny">${PL.priceFeed.status() === 'ready' ? t('pf_ready') : t('pf_none')}</span><p class="tiny muted" style="margin:4px 0 0">${t('pf_d')}</p></div>` + PL.CATS.map(c => `<h2>${t('shop_' + c)}</h2><div class="card tight">${Object.entries(PL.ING).filter(([, v]) => v[2] === c).map(([k, v]) => `<div class="stat"><span>${esc(v[L() === 'am' ? 1 : 0])}${over[k] != null ? ' <span class="pill info tiny">' + t('pl_edited') + '</span>' : ''}<br><span class="tiny muted">${t('pl_default')}: ${v[4]} ETB/${v[3]}</span></span><span class="row" style="gap:4px"><input class="in price" type="number" min="0" step="1" inputmode="decimal" data-price="${k}" value="${P[k]}"><span class="tiny">/${v[3]}</span></span></div>`).join('')}</div>`).join('') +
      `<div class="row" style="gap:8px;margin-top:10px"><button class="btn grow" data-action="price-save" id="priceSave">${t('save')}</button><button class="btn ghost" data-action="price-reset">${t('pl_reset')}</button></div>`;
  };
  A['price-save'] = () => { const o = {}; document.querySelectorAll('[data-price]').forEach(i => { const k = i.dataset.price, v = +i.value; if (v >= 0 && v !== PL.ING[k][4]) o[k] = v; }); DB.set('prices', o); const sl = DB.get('shopping'); if (sl) { const P = PL.prices(); sl.items.forEach(it => { if (it.ing && P[it.ing] != null) it.price = P[it.ing]; }); DB.set('shopping', sl); } toast(t('set_saved')); N.rerender(); };
  A['price-reset'] = () => { if (!confirm(t('pl_reset') + '?')) return; DB.set('prices', {}); N.rerender(); };

  /* ---------- SHOPPING LIST ---------- */
  ROUTES.shopping = function () {
    const sl = DB.get('shopping');
    if (!sl || !sl.items.length) return hdr(t('hub_shopping')) + `<div class="card center"><div style="font-size:40px">🛒</div><p class="small">${t('shop_empty')}</p><a class="btn" href="#/planner">${t('hub_planner')}</a></div>` + addForm();
    const nm = it => it.ing ? PL.ING[it.ing][L() === 'am' ? 1 : 0] : it.name;
    const left = sl.items.filter(i => !i.checked).reduce((s, i) => s + PL.itemCost(i), 0), all = sl.items.reduce((s, i) => s + PL.itemCost(i), 0);
    const swaps = shopSwaps(sl);
    return hdr(t('hub_shopping')) + `<div class="hero-photo sm">${N.settings().lowData ? '' : `<img class="photo" src="img/market.webp" alt="${esc(t('img_market'))}" loading="lazy" decoding="async" width="640" height="360">`}<div class="hp-text"><b>🛒 ${t('mk_title')}</b><span class="small">${t('mk_d')}</span></div></div>
      <div class="card tight" id="shopTotals"><div class="row between"><span class="small">${t('shop_left')}: <b id="shopLeft">~${R(left)} ETB</b></span><span class="tiny muted">${t('shop_total')}: <b id="shopAll">~${R(all)} ETB</b></span></div><div class="row" style="gap:8px;margin-top:8px"><button class="btn sm soft" data-action="shop-copy">📋 ${t('shop_copy')}</button><button class="btn sm ghost" data-action="shop-regen">↺ ${t('shop_regen')}</button></div></div>` +
      PL.CATS.map(c => { const its = sl.items.filter(i => i.cat === c); if (!its.length) return ''; return `<h2>${t('shop_' + c)}</h2><div class="card tight">${its.map(it => `<div class="shop-row v3 ${it.checked ? 'done' : ''}" data-shop="${it.id}"><div class="row between"><label class="check"><input type="checkbox" data-action-change="shop-check" data-id="${it.id}" ${it.checked ? 'checked' : ''}><span>${esc(nm(it))}</span></label><span class="row" style="gap:6px"><b class="small">~${R(PL.itemCost(it))} ETB</b><button class="iconbtn sm" data-action="shop-del" data-id="${it.id}" aria-label="${t('del')}">✕</button></span></div>
        <div class="shop-ctl"><input class="in qty" type="number" min="0" step="0.05" inputmode="decimal" data-action-change="shop-qty" data-id="${it.id}" value="${it.qty}" aria-label="${t('shop_qty')}"><select class="in unit" data-action-change="shop-unit" data-id="${it.id}" aria-label="${t('shop_unit')}">${unitOpts(it.unit)}</select>
        ${it.unit === 'birr' ? `<span class="tiny muted">${t('u3_birr_d')}</span>` : `<span class="tiny muted">×</span><input class="in price" type="number" min="0" step="1" inputmode="decimal" data-action-change="shop-price" data-id="${it.id}" value="${it.price != null ? it.price : ''}" placeholder="ETB" aria-label="${t('shop_price_ph')}"><span class="tiny muted">ETB/${esc(uLabel(it.unit))}</span>`}</div></div>`).join('')}</div>`; }).join('') +
      (swaps.length ? `<div class="card" id="shopSwaps"><h3>💡 ${t('sw_title')}</h3><ul class="clean small">${swaps.map(x => `<li>${esc(x)}</li>`).join('')}</ul><p class="tiny muted">${t('sw_note')}</p></div>` : '') +
      addForm() + `<p class="tiny muted">💲 ${t('pl_price_label')} ${t('shop_manual_note')}</p>`;
  };
  function uLabel(u) { const x = t('u3_' + u); return x === 'u3_' + u ? u : x; }
  function unitOpts(cur) { const us = PL.UNITS.includes(cur) ? PL.UNITS : PL.UNITS.concat([cur]); return us.map(u => `<option value="${esc(u)}" ${u === cur ? 'selected' : ''}>${esc(uLabel(u))}</option>`).join(''); }
  function shopSwaps(sl) {
    const P = PL.prices(), out = [], open = sl.items.filter(i => !i.checked), has = k => open.find(i => i.ing === k), named = re => open.find(i => !i.ing && re.test(i.name || ''));
    const b = has('beef'); if (b) out.push(t('sw_l_beef', { s: R((b.qty / 2) * (P.beef - P.lentils * 2)) }));
    const c = has('chicken'); if (c) out.push(t('sw_l_chicken', { s: R(c.qty * (P.chicken - P.chickpeas)) }));
    const k = has('kibbeh'); if (k) out.push(t('sw_l_kibbeh', { s: R(k.qty * P.kibbeh - k.qty * 2 * P.veg_oil) }));
    if (has('pasta') || has('rice')) out.push(t('sw_l_grain'));
    if (named(/soda|coca|cola|pepsi|juice|ለስላሳ|ጭማቂ/i)) out.push(t('sw_l_soda'));
    if (named(/sugar|ስኳር/i)) out.push(t('sw_l_sugar'));
    if (named(/white bread|bread|ዳቦ/i)) out.push(t('sw_l_bread'));
    if (named(/oats|quinoa|olive|salmon|almond|chia/i)) out.push(t('sw_l_imported'));
    return out.filter(x => !/-\d/.test(x));
  }
  function addForm() { return `<div class="card"><h3>+ ${t('shop_add')}</h3><input class="in" id="shopName" placeholder="${t('shop_name')}"><div class="grid3" style="margin-top:8px"><input class="in" id="shopQty" type="number" step="0.1" value="1"><select class="in" id="shopUnit">${unitOpts('kg')}</select><select class="in" id="shopCat">${PL.CATS.map(c => `<option value="${c}">${t('shop_' + c)}</option>`).join('')}</select></div><input class="in" id="shopPrice" type="number" min="0" placeholder="${t('shop_price_ph')}" style="margin-top:8px"><button class="btn block" style="margin-top:8px" data-action="shop-add" id="shopAdd">${t('shop_add')}</button></div>`; }
  function shopUpd(fn) { const sl = DB.get('shopping') || { created: Date.now(), items: [] }; fn(sl); DB.set('shopping', sl); }
  A['shop-add'] = () => { const n = $('#shopName').value.trim(); if (!n) return; shopUpd(sl => sl.items.push({ id: uid(), name: n, cat: $('#shopCat').value, qty: +$('#shopQty').value || 1, unit: $('#shopUnit').value || '', price: +$('#shopPrice').value || 0, checked: false })); N.rerender(); };
  A['shop-del'] = el => { shopUpd(sl => sl.items = sl.items.filter(i => i.id !== el.dataset.id)); N.rerender(); };
  A['shop-regen'] = () => { const p = DB.get('plan'); if (!p) return; if (!confirm(t('shop_regen') + '?')) return; PL.shoppingFromPlan(p); N.rerender(); };
  A['shop-copy'] = async () => {
    const sl = DB.get('shopping'), nm = it => it.ing ? PL.ING[it.ing][L() === 'am' ? 1 : 0] : it.name;
    const txt = 'NOLA HEALTH — ' + t('hub_shopping') + '\n' + PL.CATS.map(c => { const its = sl.items.filter(i => i.cat === c && !i.checked); return its.length ? `\n${t('shop_' + c)}:\n` + its.map(i => `- ${nm(i)} ${i.qty} ${i.unit}`).join('\n') : ''; }).join('');
    try { await navigator.clipboard.writeText(txt); toast(t('copied')); } catch (e) { N.openSheet(`<div class="row between"><h2 style="margin:0">${t('shop_copy')}</h2><button class="iconbtn" data-action="close-sheet">✕</button></div><textarea class="in" rows="12" readonly>${esc(txt)}</textarea>`); }
  };
  const C = {};
  C['shop-check'] = el => { shopUpd(sl => { const it = sl.items.find(i => i.id === el.dataset.id); if (it) it.checked = el.checked; }); N.rerender(); };
  C['shop-unit'] = el => { shopUpd(sl => { const it = sl.items.find(i => i.id === el.dataset.id); if (!it) return; const from = it.unit, to = el.value;
      if (from === 'kg' && to === 'quintal') { it.qty = Math.round(it.qty / 100 * 1000) / 1000; if (it.price != null) it.price = it.price * 100; }
      else if (from === 'quintal' && to === 'kg') { it.qty = Math.round(it.qty * 100 * 100) / 100; if (it.price != null) it.price = it.price / 100; }
      else if (to === 'birr') { it.qty = Math.round(PL.itemCost(it)) || it.qty; }
      it.unit = to; }); N.rerender(); };
  C['shop-price'] = el => { shopUpd(sl => { const it = sl.items.find(i => i.id === el.dataset.id); if (it) { it.price = Math.max(0, +el.value || 0); it.manualPrice = true; } }); N.rerender(); };
  C['shop-qty'] = el => { shopUpd(sl => { const it = sl.items.find(i => i.id === el.dataset.id); if (it) it.qty = Math.max(0, +el.value || 0); }); N.rerender(); };
  C['rest-cmp'] = el => { const id = el.dataset.id, c = S.rest.compare; if (el.checked) { if (c.length >= 3) { el.checked = false; return toast(t('rest_max3')); } c.push(id); } else S.rest.compare = c.filter(x => x !== id); N.rerender(); };
  C['rest-injera'] = el => { S.rest.injera = el.checked; N.rerender(); };

  /* ---------- FAMILY HEALTH CIRCLE ---------- */
  S.share = S.share || { cats: [], role: 'family', out: null };
  const ROLES = ['family', 'caregiver', 'clinician'];
  function shareForm(role) {
    const sel = S.share.cats;
    return `<div class="card" id="shareForm"><h3>${t('fam_create')}</h3>
      <label class="f" for="shWho">${t('fam_recipient')}</label><input class="in" id="shWho" placeholder="${t('fam_recipient_ph')}">
      <label class="f">${t('fam_role')}</label><div class="seg" id="shRole">${ROLES.map(r => `<button type="button" class="${(S.share.role || role) === r ? 'on' : ''}" data-action="sh-role" data-v="${r}">${t('role_' + r)}</button>`).join('')}</div>
      <label class="f">${t('fam_what')}</label><button type="button" class="btn sm soft" data-action="sh-preset" id="shPreset" style="margin-bottom:8px">👨‍👩‍👧 ${t('fam_preset_helper')}</button><p class="tiny muted" style="margin:0 0 6px">${t('fam_preset_helper_d')}</p><div class="catlist">${SH.CATS.map(c => `<label class="check"><input type="checkbox" data-action-change="sh-cat" data-v="${c}" ${sel.includes(c) ? 'checked' : ''}><span class="small">${t('shc_' + c)}${c === 'meds' ? ` <span class="pill adjust tiny">${t('fam_sensitive')}</span>` : ''}</span></label>`).join('')}</div>
      <label class="f">${t('fam_expires')}</label><div class="seg" id="shExp">${[7, 30, 90].map(d => `<button type="button" class="${d === 30 ? 'on' : ''}" data-action="seg-pick" data-v="${d}">${t('fam_days', { n: d })}</button>`).join('')}</div>
      <label class="f" for="shPass">${t('fam_pass')}</label><div class="row" style="gap:8px"><input class="in" id="shPass" autocomplete="off" minlength="8"><button class="btn sm ghost" data-action="sh-genpass">🎲</button></div><p class="tiny muted">${t('fam_pass_d')}</p>
      <label class="check"><input type="checkbox" id="shConsent"><span class="small">${t('fam_consent')}</span></label>
      <button class="btn block" data-action="sh-create" id="shCreate">🔐 ${t('fam_make')}</button></div>`;
  }
  A['sh-preset'] = () => { S.share.cats = ['profile', 'reminders', 'checkups', 'bp', 'glucose']; N.rerender(); };
  ROUTES.family = function () {
    const shares = SH.adapter.listShares().sort((a, b) => b.created - a.created), sup = DB.get('supporting', []);
    const out = S.share.out;
    return hdr(t('hub_family')) + `<div class="card info-card"><h3>🔒 ${t('fam_how')}</h3><ol class="small" style="padding-left:18px;margin:6px 0"><li>${t('fam_how1')}</li><li>${t('fam_how2')}</li><li>${t('fam_how3')}</li></ol><p class="tiny muted">${t('fam_no_server')}</p></div>
      ${out ? `<div class="card" id="shareOut"><h3>✅ ${t('fam_ready', { who: esc(out.share.recipient) })}</h3>${out.qr ? `<div class="qr">${out.qr}</div><p class="tiny muted center">${t('fam_qr_d')}</p>` : `<p class="small muted">${t('fam_qr_big')}</p>`}
        <textarea class="in mono" rows="3" readonly id="shText">${esc(out.text)}</textarea>
        <div class="row" style="gap:8px;margin-top:8px"><button class="btn sm grow" data-action="sh-copy">📋 ${t('fam_copy')}</button><button class="btn sm ghost grow" data-action="sh-download">⬇️ ${t('fam_file')}</button>${navigator.share ? `<button class="btn sm ghost" data-action="sh-native">↗</button>` : ''}</div>
        <div class="note">🔑 ${t('fam_send_sep', { p: esc(out.pass) })}</div><button class="link small" data-action="sh-done">${t('done')}</button></div>` : shareForm('family')}
      <h2>${t('fam_my_shares')}</h2>${shares.length ? shares.map(s => `<div class="card tight"><div class="row between"><b>${esc(s.recipient || '—')}</b><span class="pill ${s.status === 'active' ? 'good' : s.status === 'revoked' ? 'alt' : 'adjust'}">${t('st_' + s.status)}</span></div>
        <div class="tiny muted">${t('role_' + s.role)} · ${s.cats.map(c => t('shc_' + c)).join(', ')}</div><div class="tiny muted">${t('fam_created')} ${dstr(s.created)} · ${t('fam_expires')} ${dstr(s.expires)}</div>
        ${s.status === 'active' ? `<button class="btn sm ghost" style="margin-top:8px" data-action="sh-revoke" data-id="${s.id}">${t('fam_revoke')}</button>` : ''}${s.status === 'revoked' ? `<p class="tiny muted">${t('fam_revoked_note')}</p>` : ''}</div>`).join('') : `<p class="small muted">${t('fam_none')}</p>`}
      <h2>${t('fam_supporting')}</h2><a class="btn block soft" href="#/open-share" id="openShareBtn">📥 ${t('fam_open')}</a>
      ${sup.map(p => `<div class="card tight row between"><div><b>${esc(p.from || '—')}</b><div class="tiny muted">${t('role_' + p.role)} · ${t('fam_received')} ${dstr(p.opened)}${p.expires < Date.now() ? ' · ⌛ ' + t('st_expired') : ''}</div></div><div class="row" style="gap:6px"><a class="btn sm" href="#/supporting?id=${p.id}">${t('open')}</a><button class="iconbtn" data-action="sup-del" data-id="${p.id}" aria-label="${t('del')}">🗑</button></div></div>`).join('')}
      <div class="card"><h3>☁️ ${t('fam_live')}</h3><p class="small muted">${t('fam_live_d')}</p><span class="pill info">${t('server_inactive')}</span></div>`;
  };
  A['sh-role'] = el => { S.share.role = el.dataset.v; el.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); };
  C['sh-cat'] = el => { const v = el.dataset.v; S.share.cats = el.checked ? S.share.cats.concat([v]) : S.share.cats.filter(x => x !== v); };
  A['sh-genpass'] = () => { $('#shPass').value = SH.passphrase(); };
  A['sh-create'] = async () => {
    const who = $('#shWho').value.trim(), pass = $('#shPass').value, cats = S.share.cats.slice();
    if (!who) return toast(t('fam_need_who')); if (!cats.length) return toast(t('fam_need_cats')); if (pass.length < 8) return toast(t('fam_need_pass')); if (!$('#shConsent').checked) return toast(t('fam_need_consent'));
    if (cats.includes('meds') && !confirm(t('fam_meds_confirm'))) return;
    const btn = $('#shCreate'); btn.disabled = true; btn.textContent = '…';
    try {
      const exp = +($('#shExp .on') || { dataset: { v: 30 } }).dataset.v;
      const r = await SH.adapter.createShare({ recipient: who, role: S.share.role || 'family', cats, passphrase: pass, expiresDays: exp });
      S.share.out = { share: r.share, text: r.text, pass, qr: SH.qrSvg(r.text) }; S.share.cats = [];
      const ret = S.route; N.rerender(); if (ret === 'clinician') location.hash = '#/family';
    } catch (e) { toast('Error: ' + e.message); btn.disabled = false; }
  };
  A['sh-copy'] = async () => { try { await navigator.clipboard.writeText(S.share.out.text); toast(t('copied')); } catch (e) { $('#shText').select(); document.execCommand && document.execCommand('copy'); toast(t('copied')); } };
  A['sh-download'] = () => { const o = S.share.out; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([o.text], { type: 'text/plain' })); a.download = 'nola-share-' + (o.share.recipient || 'x').replace(/\W+/g, '_') + '.nola'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  A['sh-native'] = async () => { try { await navigator.share({ title: 'NOLA HEALTH', text: S.share.out.text }); } catch (e) {} };
  A['sh-done'] = () => { S.share.out = null; N.rerender(); };
  A['sh-revoke'] = async el => { if (!confirm(t('fam_revoke_q'))) return; await SH.adapter.revokeShare(el.dataset.id); toast(t('fam_revoked')); N.rerender(); };
  A['sup-del'] = el => { if (!confirm(t('del') + '?')) return; DB.set('supporting', DB.get('supporting', []).filter(p => p.id !== el.dataset.id)); N.rerender(); };

  ROUTES['open-share'] = function () {
    const scan = 'BarcodeDetector' in window && navigator.mediaDevices;
    return hdr(t('fam_open'), qp('from') || 'family') + `<p class="small muted">${t('open_intro')}</p><div class="card">
      <label class="f" for="osText">${t('open_paste')}</label><textarea class="in mono" id="osText" rows="4" placeholder="NOLA1.z.…"></textarea>
      <div class="row" style="gap:8px;margin-top:8px"><label class="btn sm ghost"><input type="file" id="osFile" accept=".nola,.txt,text/plain" hidden>📄 ${t('open_file')}</label>${scan ? `<button class="btn sm ghost" data-action="os-scan">📷 ${t('open_scan')}</button>` : `<span class="tiny muted">${t('open_noscan')}</span>`}</div>
      <label class="f" for="osPass">${t('fam_pass')}</label><input class="in" id="osPass" autocomplete="off">
      <button class="btn block" style="margin-top:12px" data-action="os-open" id="osOpen">🔓 ${t('open_btn')}</button><div id="osErr" class="small" style="color:var(--red);margin-top:6px"></div></div>
      <p class="tiny muted">${t('open_readonly')}</p>`;
  };
  A['os-open'] = async () => {
    const txt = $('#osText').value.trim(), pass = $('#osPass').value; const err = $('#osErr');
    if (!txt || !pass) { err.textContent = t('open_need'); return; }
    err.textContent = '…';
    try { const p = await SH.adapter.openShare(txt, pass); SH.saveReceived(p); location.hash = '#/supporting?id=' + p.id + (p.role === 'clinician' ? '&mode=clinician' : ''); }
    catch (e) { err.textContent = e.message === 'passphrase' ? t('open_bad_pass') : t('open_bad_format'); }
  };
  A['os-scan'] = async () => {
    N.openSheet(`<div class="row between"><h2 style="margin:0">${t('open_scan')}</h2><button class="iconbtn" data-action="close-sheet">✕</button></div><video id="qrVid" playsinline muted style="width:100%;border-radius:12px;background:#000"></video><p class="tiny muted">${t('open_scan_d')}</p>`);
    try {
      const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }), v = $('#qrVid'); v.srcObject = st; await v.play();
      const det = new BarcodeDetector({ formats: ['qr_code'] });
      const stop = () => { st.getTracks().forEach(x => x.stop()); };
      const loop = async () => { if (!document.body.contains(v)) return stop(); try { const r = await det.detect(v); if (r[0] && /^NOLA1\./.test(r[0].rawValue)) { stop(); N.closeSheet(); $('#osText').value = r[0].rawValue; toast('✓ QR'); return; } } catch (e) {} setTimeout(loop, 350); };
      loop();
    } catch (e) { N.closeSheet(); toast(t('open_noscan')); }
  };
  C['os-file'] = () => {};

  /* ---------- shared-data renderer (supporting view, clinician view, report) ---------- */
  const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
  function stats(d, mode) {
    const out = [], u = (d.profile && d.profile.unit) || unit(), clin = mode === 'clinician' || mode === 'report';
    const G = mg => E.fmtGlucose(mg, u);
    if (d.profile) { const p = d.profile; out.push(`<div class="card sec"><h3>👤 ${t('shc_profile')}</h3><div class="small">${esc(p.name || '—')} · ${p.age || '—'} · ${p.gender ? t('g_' + p.gender) : ''} · ${p.height || '—'} cm · ${p.weight || '—'} kg${p.height && p.weight ? ' · BMI ' + (Math.round(p.weight / Math.pow(p.height / 100, 2) * 10) / 10) : ''}</div></div>`); }
    if (d.conditions) { const c = d.conditions; out.push(`<div class="card sec"><h3>🩺 ${t('shc_conditions')}</h3><div class="small"><b>${t('f_conditions')}</b> ${c.conditions.filter(x => x !== 'none').map(x => t('c_' + x)).join(', ') || t('conds_none')}</div><div class="small"><b>${t('f_allergies')}</b> ${c.allergies.map(x => t('a_' + x)).join(', ') || '—'} ${esc(c.allergyOther || '')}</div><div class="small"><b>${t('f_restrictions')}</b> ${c.restrictions.map(x => t('r_' + x)).join(', ') || '—'}</div><div class="small"><b>${t('f_goals')}</b> ${c.goals.map(x => t('goal_' + x)).join(', ') || '—'}</div>${c.targets ? `<div class="tiny muted" style="margin-top:4px">${t('rep_targets')}: ${c.targets.kcal} kcal · ${t('n_c')} ${c.targets.c} g · Na ${c.targets.na} mg · ${t('n_sf')} ${c.targets.sf} g · ${t('n_fb')} ${c.targets.fb} g</div>` : ''}</div>`); }
    if (d.meds != null) out.push(`<div class="card sec"><h3>💊 ${t('shc_meds')}</h3><p class="small">${esc(d.meds || '—')}</p><p class="tiny muted">${t('rep_meds_note')}</p></div>`);
    if (d.bp) {
      const bp = d.bp.slice().sort((a, b) => a.ts - b.ts), n = bp.length;
      const inT = bp.filter(r => r.sys < 130 && r.dia < 80).length, hi = bp.filter(r => r.sys >= 140 || r.dia >= 90).length;
      out.push(`<div class="card sec"><h3>❤️ ${t('shc_bp')}</h3>${n ? `<div class="kv"><span>${t('rep_n')}</span><b>${n}</b><span>${t('rep_avg')}</span><b>${R(avg(bp.map(r => r.sys)))}/${R(avg(bp.map(r => r.dia)))}</b><span>${t('rep_range')}</span><b>${Math.min(...bp.map(r => r.sys))}–${Math.max(...bp.map(r => r.sys))} / ${Math.min(...bp.map(r => r.dia))}–${Math.max(...bp.map(r => r.dia))}</b><span>${t('rep_lt130')}</span><b>${R(inT / n * 100)}%</b><span>${t('rep_ge140')}</span><b>${hi}</b></div>
        ${CH.line([{ pts: bp.map(r => ({ x: r.ts, y: r.sys })), color: '#166534' }, { pts: bp.map(r => ({ x: r.ts, y: r.dia })), color: '#4ade80' }], { band: [80, 130] })}
        ${clin ? `<table class="tbl small"><tr><th>${t('rep_date')}</th><th>mmHg</th><th>♥</th></tr>${bp.slice(-12).reverse().map(r => `<tr><td>${dstr(r.ts)}</td><td>${r.sys}/${r.dia}</td><td>${r.pulse || ''}</td></tr>`).join('')}</table>` : ''}` : `<p class="small muted">${t('rd_none')}</p>`}</div>`);
    }
    if (d.glucose) {
      const g = d.glucose.slice().sort((a, b) => a.ts - b.ts), n = g.length, inR = g.filter(r => r.mg >= 70 && r.mg <= 180).length, low = g.filter(r => r.mg < 70).length;
      out.push(`<div class="card sec"><h3>🩸 ${t('shc_glucose')}</h3>${n ? `<div class="kv"><span>${t('rep_n')}</span><b>${n}</b><span>${t('rep_avg')}</span><b>${G(avg(g.map(r => r.mg)))}</b><span>${t('rep_tir')}</span><b>${R(inR / n * 100)}%</b><span>${t('rep_lows')}</span><b>${low}</b>${['fasting', 'before', 'after'].map(c => { const x = g.filter(r => r.ctx === c); return x.length ? `<span>${t('ctx_' + c)}</span><b>${G(avg(x.map(r => r.mg)))} (n=${x.length})</b>` : ''; }).join('')}</div>
        ${CH.line([{ pts: g.map(r => ({ x: r.ts, y: u === 'mmol' ? r.mg / 18 : r.mg })), color: '#0369a1' }], { band: u === 'mmol' ? [3.9, 10] : [70, 180] })}
        ${clin ? `<table class="tbl small"><tr><th>${t('rep_date')}</th><th>${u === 'mmol' ? 'mmol/L' : 'mg/dL'}</th><th></th></tr>${g.slice(-12).reverse().map(r => `<tr><td>${dstr(r.ts)}</td><td>${G(r.mg)}</td><td>${t('ctx_' + (r.ctx || 'random'))}</td></tr>`).join('')}</table>` : ''}` : `<p class="small muted">${t('rd_none')}</p>`}</div>`);
    }
    if (d.weight) { const w = d.weight.slice().sort((a, b) => a.ts - b.ts); out.push(`<div class="card sec"><h3>⚖️ ${t('shc_weight')}</h3>${w.length ? `<div class="kv"><span>${t('rep_first')}</span><b>${w[0].kg} kg (${dstr(w[0].ts)})</b><span>${t('rep_latest')}</span><b>${w[w.length - 1].kg} kg (${dstr(w[w.length - 1].ts)})</b></div>${w.length > 1 ? CH.line([{ pts: w.map(r => ({ x: r.ts, y: r.kg })), color: '#7c3aed' }]) : ''}` : `<p class="small muted">${t('rd_none')}</p>`}</div>`); }
    if (d.meals) {
      const ms = d.meals, byDay = {}; ms.forEach(m => { const k = new Date(m.ts).toDateString(); (byDay[k] = byDay[k] || []).push(m); });
      const days = Object.values(byDay), da = k => days.length ? R(avg(days.map(x => x.reduce((s, m) => s + (m.totals[k] || 0), 0)))) : '—';
      const cnt = {}; ms.flatMap(m => m.items).forEach(i => { const k = i.foodId ? fname(F.byId[i.foodId]) : i.name; cnt[k] = (cnt[k] || 0) + 1; });
      const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 8);
      const v = { good: 0, adjust: 0, alt: 0 }; ms.forEach(m => v[m.verdict]++);
      out.push(`<div class="card sec"><h3>🍽️ ${t('shc_meals')}</h3><div class="kv"><span>${t('rep_meals_n')}</span><b>${ms.length} (${days.length} ${t('rep_days')})</b><span>${t('rep_daily')} kcal</span><b>${da('kcal')}</b><span>${t('n_c')}</span><b>${da('c')} g</b><span>${t('n_na')}</span><b>${da('na')} mg</b><span>${t('n_sf')}</span><b>${da('sf')} g</b><span>${t('n_fb')}</span><b>${da('fb')} g</b><span>${t('n_as')}</span><b>${da('as')} g</b></div>
        <div class="tiny muted">${['good', 'adjust', 'alt'].map(x => `${t('verdict_' + x)}: ${v[x]}`).join(' · ')}</div><div class="chips" style="margin-top:6px">${top.map(([k, n]) => `<span class="chip sm">${esc(k)} ×${n}</span>`).join('')}</div>
        ${clin ? `<table class="tbl small"><tr><th>${t('rep_date')}</th><th>${t('rep_meal')}</th><th>kcal</th><th>Na</th></tr>${ms.slice().sort((a, b) => b.ts - a.ts).slice(0, 15).map(m => `<tr><td>${dstr(m.ts)}</td><td>${t('meal_' + m.meal)}: ${esc(m.items.map(i => i.foodId ? fname(F.byId[i.foodId]) : i.name).join(', '))}</td><td>${R(m.totals.kcal)}</td><td>${R(m.totals.na)}</td></tr>`).join('')}</table>` : ''}<p class="tiny muted">${t('estimates_note')}</p></div>`);
    }
    if (d.glogs) { const gl = d.glogs.filter(l => l.post != null); out.push(`<div class="card sec"><h3>📊 ${t('shc_glogs')}</h3>${gl.length ? `<table class="tbl small"><tr><th>${t('rep_date')}</th><th>${t('rep_meal')}</th><th>${t('gl_pre')}</th><th>${t('gl_post')}</th><th>Δ</th></tr>${gl.slice().sort((a, b) => b.ts - a.ts).slice(0, 15).map(l => `<tr><td>${dstr(l.ts)}</td><td>${esc(l.name || t('meal_' + l.meal))}${l.activity && l.activity !== 'none' ? ' · ' + t('act2_' + l.activity) : ''}</td><td>${G(l.pre)}</td><td>${G(l.post)}</td><td>${l.post - l.pre >= 0 ? '+' : ''}${u === 'mmol' ? ((l.post - l.pre) / 18).toFixed(1) : R(l.post - l.pre)}</td></tr>`).join('')}</table><p class="tiny muted">${t('gl_disclaimer')}</p>` : `<p class="small muted">${t('rd_none')}</p>`}</div>`); }
    if (d.plan) out.push(`<div class="card sec"><h3>💰 ${t('shc_plan')}</h3>${d.plan.days.slice(0, 7).map(x => `<div class="small"><b>${new Date(x.date).toLocaleDateString(L() === 'am' ? 'am-ET' : 'en-GB', { weekday: 'short' })}</b>: ${Object.values(x.meals).map(id => { const ds = PL.dish(id); return ds ? esc(tr(ds.name)) : id; }).join(' · ')}</div>`).join('')}</div>`);
    if (d.checkups) out.push(`<div class="card sec"><h3>📅 ${t('shc_checkups')}</h3>${d.checkups.length ? d.checkups.slice().sort((a, b) => b.date.localeCompare(a.date)).map(c => `<div class="small">• ${esc(c.date)} — ${t('ck_' + c.type)}${c.note ? ': ' + esc(c.note) : ''}${c.next ? ` · ${t('ck_next')}: <b>${esc(c.next)}</b>` : ''}</div>`).join('') : `<p class="small muted">—</p>`}</div>`);
    if (d.reminders) out.push(`<div class="card sec"><h3>⏰ ${t('shc_reminders')}</h3>${d.reminders.length ? d.reminders.map(r => `<div class="small">• ${esc(r.time || '')} — ${esc(r.title || t('rem_k_' + r.kind))}${r.date ? ' (' + esc(r.date) + ')' : r.days && r.days.length ? ' (' + r.days.map(x => t('dow_' + x)).join(' ') + ')' : ''}</div>`).join('') : `<p class="small muted">—</p>`}</div>`);
    if (d.journey) { const w = d.journey.week, m = d.journey.month; out.push(`<div class="card sec"><h3>🌱 ${t('shc_journey')}</h3><div class="kv"><span>${t('jr_week')}</span><b>${t('jr_sum_line', { d: w.activeDays, m: w.meals, a: w.actMin })}</b><span>${t('jr_month')}</span><b>${t('jr_sum_line', { d: m.activeDays, m: m.meals, a: m.actMin })}</b></div></div>`); }
    return out.join('');
  }
  A['sup-rem-import'] = el => {
    const p = DB.get('supporting', []).find(x => x.id === el.dataset.id); if (!p || !p.data.reminders) return;
    const who = p.from || t('role_family'), cur = DB.get('reminders', []); let n = 0;
    p.data.reminders.forEach(r => { if (cur.some(x => x.forWho === who && x.time === r.time && (x.title || '') === (r.title || '') && x.kind === r.kind)) return; cur.push({ id: uid(), kind: r.kind, title: r.title || '', time: r.time, days: r.days || [], date: r.date, on: true, forWho: who, created: Date.now(), fromShare: p.id }); n++; });
    DB.set('reminders', cur); toast('✓ ' + t('sup_rem_imported', { n })); };
  ROUTES.supporting = function () {
    const id = qp('id'), mode = qp('mode') || 'family', p = DB.get('supporting', []).find(x => x.id === id);
    if (!p) return hdr(t('fam_supporting'), 'family') + `<p class="muted">—</p>`;
    const exp = p.expires < Date.now(), d = p.data;
    const lastBP = d.bp && d.bp.slice().sort((a, b) => b.ts - a.ts)[0], lastG = d.glucose && d.glucose.slice().sort((a, b) => b.ts - a.ts)[0];
    const flag = (lastBP && Date.now() - lastBP.ts < 7 * DAY && E.checkBP(lastBP.sys, lastBP.dia)) || (lastG && Date.now() - lastG.ts < 7 * DAY && E.checkGlucose(lastG.mg, 'mg'));
    const nextApt = (d.checkups || []).map(c => c.next).filter(x => x && x >= dayKey(Date.now())).sort()[0];
    return hdr(mode === 'clinician' ? t('cl_view') : t('sup_title', { name: esc(p.from || '—') }), mode === 'clinician' ? 'clinician' : 'family') +
      `<div class="banner ${exp ? 'amber' : 'green'} small">👁 ${t('sup_readonly')} · ${t('fam_created')} ${dstr(p.created)} · ${t('fam_expires')} ${dstr(p.expires)}${exp ? '<br>⌛ ' + t('sup_expired') : ''}</div>
      ${flag ? `<div class="banner ${flag.level === 'emergency' ? 'red' : 'amber'} small">${flag.level === 'emergency' ? '🚨' : '⚠️'} ${t('sup_flag')}</div>` : ''}
      ${nextApt ? `<div class="banner green small">📅 ${t('sup_next_apt', { d: nextApt })}</div>` : ''}
      ${mode === 'clinician' ? `<div class="note">🩺 ${t('cl_self_reported')}</div>` : `<p class="small muted">${t('sup_tips')}</p>`}
      ${stats(d, mode)}${d.reminders && d.reminders.length && mode !== 'clinician' && !exp ? `<button class="btn block" data-action="sup-rem-import" data-id="${p.id}" id="supRemImport">⏰ ${t('sup_rem_import')}</button><p class="tiny muted">${t('sup_rem_import_d')}</p>` : ''}<p class="tiny muted">${t('sup_shared_cats')}: ${p.cats.map(c => t('shc_' + c)).join(', ')}</p>`;
  };

  /* ---------- CLINICIAN / REPORT ---------- */
  ROUTES.clinician = function () {
    const sup = DB.get('supporting', []).filter(p => p.role === 'clinician');
    return hdr(t('hub_clinician')) + `<div class="card"><h3>📄 ${t('cl_my_report')}</h3><p class="small muted">${t('cl_my_report_d')}</p><a class="btn block" href="#/report" id="openReport">${t('cl_make_report')}</a></div>
      <div class="card"><h3>🔐 ${t('cl_share')}</h3><p class="small muted">${t('cl_share_d')}</p><button class="btn block soft" data-action="cl-share" id="clShare">${t('cl_share_btn')}</button></div>
      <div class="card"><h3>👩‍⚕️ ${t('cl_view')}</h3><p class="small muted">${t('cl_view_d')}</p><a class="btn block ghost" href="#/open-share?from=clinician">📥 ${t('fam_open')}</a>
        ${sup.map(p => `<div class="row between" style="margin-top:8px"><span class="small"><b>${esc(p.from || '—')}</b> · ${dstr(p.opened)}</span><a class="btn sm" href="#/supporting?id=${p.id}&mode=clinician">${t('open')}</a></div>`).join('')}</div>
      <div class="card"><h3>✅ ${t('cl_verify')}</h3><div class="banner amber small">⚠️ ${t('cl_verify_inactive')}</div>
        <label class="f">${t('cl_v_name')}</label><input class="in" disabled><label class="f">${t('cl_v_prof')}</label><input class="in" disabled><label class="f">${t('cl_v_license')}</label><input class="in" disabled>
        <button class="btn block" disabled style="margin-top:10px">${t('cl_v_submit')}</button><p class="tiny muted">${t('cl_verify_d')}</p></div>`;
  };
  A['cl-share'] = () => { S.share = { cats: ['profile', 'conditions', 'bp', 'glucose', 'weight', 'meals', 'glogs', 'checkups'], role: 'clinician', out: null }; location.hash = '#/family'; setTimeout(() => { const f = $('#shareForm'); if (f) f.scrollIntoView({ block: 'start' }); }, 60); };
  S.rep = S.rep || { days: 30 };
  ROUTES.report = function () {
    const days = S.rep.days, pr = N.profile();
    const d = SH.collect(['profile', 'conditions', 'meds', 'bp', 'glucose', 'weight', 'meals', 'glogs', 'checkups', 'journey'].filter(c => c !== 'meds' || pr.meds), days);
    const s = INS.periodSummary(days);
    return `<div class="no-print">${hdr(t('rep_title'), 'clinician')}<div class="seg" style="margin-bottom:10px">${[7, 30, 90].map(x => `<button class="${days === x ? 'on' : ''}" data-action="rep-days" data-v="${x}">${t('fam_days', { n: x })}</button>`).join('')}</div>
      <button class="btn block" data-action="rep-print" id="repPrint">🖨️ ${t('rep_print')}</button><p class="tiny muted">${t('rep_print_d')}</p></div>
      <div class="report" id="report"><div class="rep-head"><div><b style="font-size:18px">NOLA HEALTH — ${t('rep_title')}</b><div class="tiny">${t('rep_period', { a: dstr(Date.now() - days * DAY), b: dstr(Date.now()) })} · ${t('rep_generated')} ${new Date().toLocaleString()}</div></div><img src="icons/icon.svg" width="40" height="40" alt=""></div>
      <div class="card sec"><h3>📈 ${t('rep_progress')}</h3><div class="kv"><span>${t('jr_active_days')}</span><b>${s.activeDays}/${days}</b><span>${t('rep_meals_n')}</span><b>${s.meals} (${t('verdict_good')}: ${s.good})</b><span>${t('jr_activity')}</span><b>${s.actMin} min</b><span>${t('shc_weight')}</span><b>${s.wtChange != null ? (s.wtChange > 0 ? '+' : '') + s.wtChange + ' kg' : '—'}</b><span>${t('hub_academy')}</span><b>${s.lessons}</b></div></div>
      ${stats(d, 'report')}<p class="tiny muted">${t('rep_disclaimer')}</p></div>`;
  };
  A['rep-days'] = el => { S.rep.days = +el.dataset.v; N.rerender(); };
  A['rep-print'] = () => { document.body.classList.add('printing'); setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove('printing'), 500); }, 50); };

  /* ---------- ACADEMY ---------- */
  function tipOfDay() { const all = AC.LESSONS.map(l => ({ tip: l.tip, src: l.src, id: l.id })); return all[Math.floor(Date.now() / DAY) % all.length]; }
  const art = l => `<div class="art" style="background:${l.color}"><span>${l.art[0]}</span><span>${l.art[1]}</span><span>${l.art[2]}</span></div>`;
  ROUTES.academy = function () {
    const done = (DB.get('academy', {}).done) || {}, n = Object.keys(done).length, tp = tipOfDay();
    return hdr(t('hub_academy')) + `<div class="card"><div class="row between"><div><h3>${t('ac_progress')}</h3><div class="small muted">${t('ac_done_n', { n, t: AC.LESSONS.length })}</div></div>${CH.ring(n, AC.LESSONS.length, 72, n + '/' + AC.LESSONS.length)}</div><div class="progress"><div style="width:${n / AC.LESSONS.length * 100}%"></div></div></div>
      <div class="card tip"><h3>💡 ${t('ac_tip_day')}</h3><p style="margin:6px 0">${esc(tr(tp.tip))}</p><div class="tiny muted">📚 ${esc(tp.src)}</div></div>
      <div class="lessons">${AC.LESSONS.map((l, i) => `<a class="lesson-card" href="#/lesson?id=${l.id}" data-lesson="${l.id}">${art(l)}<div class="grow"><div class="tiny muted">${t('ac_lesson')} ${i + 1}</div><b>${esc(tr(l.title))}</b>${done[l.id] ? `<div class="tiny" style="color:var(--good)">✓ ${t('ac_score', { s: done[l.id].score, t: l.quiz.length })}</div>` : ''}</div><span>›</span></a>`).join('')}</div>`;
  };
  S.quiz = S.quiz || {};
  ROUTES.lesson = function () {
    const id = qp('id'), i = AC.LESSONS.findIndex(l => l.id === id), l = AC.LESSONS[i]; if (!l) return ROUTES.academy();
    const q = S.quiz[id] || (S.quiz[id] = { ans: {}, submitted: false }), next = AC.LESSONS[i + 1];
    const score = l.quiz.filter((x, k) => q.ans[k] === x.a).length;
    return hdr(esc(tr(l.title)), 'academy') + `${art(l)}<div class="card"><ul class="clean lesson-pts">${l.points.map(p => `<li>${esc(tr(p))}</li>`).join('')}</ul><div class="banner green small">💡 ${esc(tr(l.tip))}</div><div class="tiny muted">📚 ${t('source')}: ${esc(l.src)}</div></div>
      <h2>📝 ${t('ac_quiz')}</h2>${l.quiz.map((x, k) => `<div class="card tight quiz" data-q="${k}"><b class="small">${k + 1}. ${esc(tr(x.q))}</b>${x.opts.map((o, j) => { const sel = q.ans[k] === j, cls = q.submitted ? (j === x.a ? 'right' : sel ? 'wrong' : '') : sel ? 'sel' : ''; return `<button class="qopt ${cls}" data-action="quiz-ans" data-id="${id}" data-k="${k}" data-j="${j}" ${q.submitted ? 'disabled' : ''}>${esc(tr(o))}</button>`; }).join('')}${q.submitted ? `<div class="tiny ${q.ans[k] === x.a ? 'good-t' : 'warn-t'}">${q.ans[k] === x.a ? '✓' : '✗'} ${esc(tr(x.why))}</div>` : ''}</div>`).join('')}
      ${q.submitted ? `<div class="card center"><h3>${t('ac_score', { s: score, t: l.quiz.length })}</h3><p class="small">${score === l.quiz.length ? t('ac_perfect') : t('ac_good_try')}</p><div class="row" style="gap:8px;justify-content:center"><button class="btn ghost sm" data-action="quiz-retry" data-id="${id}">↺ ${t('ac_retry')}</button>${next ? `<a class="btn sm" href="#/lesson?id=${next.id}">${t('ac_next')} →</a>` : `<a class="btn sm" href="#/academy">${t('done')}</a>`}</div></div>` : `<button class="btn block" data-action="quiz-submit" data-id="${id}" id="quizSubmit">${t('ac_check')}</button>`}`;
  };
  A['quiz-ans'] = el => { const q = S.quiz[el.dataset.id]; q.ans[+el.dataset.k] = +el.dataset.j; N.rerender(); };
  A['quiz-submit'] = el => {
    const id = el.dataset.id, l = AC.LESSONS.find(x => x.id === id), q = S.quiz[id];
    if (Object.keys(q.ans).length < l.quiz.length) return toast(t('ac_answer_all'));
    q.submitted = true; const score = l.quiz.filter((x, k) => q.ans[k] === x.a).length;
    const ac = Object.assign({ done: {} }, DB.get('academy', {})); const prev = ac.done[id]; ac.done[id] = { ts: Date.now(), score: Math.max(score, prev ? prev.score : 0) }; DB.set('academy', ac);
    INS.badges(); N.rerender();
  };
  A['quiz-retry'] = el => { S.quiz[el.dataset.id] = { ans: {}, submitted: false }; N.rerender(); };

  /* ---------- JOURNEY ---------- */
  S.jr = S.jr || { period: 7 };
  ROUTES.journey = function () {
    const pr = N.profile(), first = pr.created || Math.min(Date.now(), ...N.meals().map(m => m.ts), ...N.readings().map(r => r.ts));
    const daysWith = Math.max(1, Math.ceil((Date.now() - first) / DAY));
    const wt = INS.trend('weight', 'kg'), bs = INS.trend('bp', 'sys'), bd = INS.trend('bp', 'dia'), gl = INS.trend('glucose', 'mg');
    const s = INS.periodSummary(S.jr.period), badges = INS.badges();
    const trendCard = (icon, label, a, b, unitS, fmt = v => R(v)) => `<div class="card tight trend"><span class="ti">${icon}</span><div class="grow"><div class="small muted">${label}</div><div><b>${fmt(a)}</b> ${unitS} → <b>${fmt(b)}</b> ${unitS}</div></div><span class="${b < a ? 'good-t' : b > a ? 'warn-t' : 'muted'}">${b < a ? '↓' : b > a ? '↑' : '→'}</span></div>`;
    const ev = [];
    ev.push({ ts: first, i: '🌱', txt: t('jr_ev_start') });
    const ms = N.meals().slice().sort((a, b) => a.ts - b.ts); if (ms[0]) ev.push({ ts: ms[0].ts, i: '🍽️', txt: t('jr_ev_first_meal') });
    badges.filter(b => b.earned && b.ts).forEach(b => ev.push({ ts: b.ts, i: b.icon, txt: t('badge_' + b.id) }));
    DB.get('checkups', []).forEach(c => ev.push({ ts: new Date(c.date + 'T12:00').getTime(), i: '🩺', txt: t('ck_' + c.type) + (c.note ? ': ' + c.note : ''), id: c.id, ck: 1 }));
    DB.get('activities', []).slice(-10).forEach(a => ev.push({ ts: a.ts, i: '🚶', txt: t('act3_' + a.type) + ' · ' + a.min + ' min', id: a.id, act: 1 }));
    ev.sort((a, b) => b.ts - a.ts);
    const encourage = s.activeDays >= Math.min(5, S.jr.period) ? t('jr_enc_great') : s.activeDays >= 1 ? t('jr_enc_ok') : t('jr_enc_fresh');
    return hdr(t('hub_journey')) + `<div class="card hero-card"><div class="small">${t('jr_since', { d: dstr(first) })}</div><div style="font-size:28px;font-weight:800">${t('jr_days', { n: daysWith })}</div><p class="small" style="margin:4px 0 0">${encourage}</p></div>
      ${wt ? trendCard('⚖️', t('jr_weight'), wt.first, wt.last, 'kg', v => Math.round(v * 10) / 10) : ''}${bs ? trendCard('❤️', t('jr_bp'), bs.first, bs.last, '', v => R(v) + '/' + R(bs.first === v ? bd.first : bd.last)) : ''}${gl ? trendCard('🩸', t('jr_glucose'), gl.first, gl.last, '', v => fmtG(v)) : ''}
      ${!wt && !bs && !gl ? `<div class="card small muted">${t('jr_no_trend')}</div>` : ''}
      <div class="row between"><h2>${t('jr_summary')}</h2><div class="seg" style="width:180px">${[7, 30].map(p => `<button class="${S.jr.period === p ? 'on' : ''}" data-action="jr-period" data-v="${p}">${t(p === 7 ? 'jr_week' : 'jr_month')}</button>`).join('')}</div></div>
      <div class="card"><div class="kv"><span>${t('jr_active_days')}</span><b>${s.activeDays}/${S.jr.period}</b><span>${t('rep_meals_n')}</span><b>${s.meals} (✓ ${s.good})</b><span>${t('n_na')}</span><b>${s.naAvg != null ? s.naAvg + ' / ' + s.naT + ' mg' : '—'}</b><span>${t('shc_bp')}</span><b>${s.bpAvg || '—'} (n=${s.bpN})</b><span>${t('shc_glucose')}</span><b>${s.glAvg ? fmtG(s.glAvg) : '—'} (n=${s.glN})</b><span>${t('jr_activity')}</span><b>${s.actMin} min${S.jr.period === 7 ? ' / 150' : ''}</b><span>${t('hub_academy')}</span><b>${s.lessons}</b></div><p class="tiny muted">${t('jr_no_cure')}</p></div>
      <h2>${t('jr_badges')}</h2><div class="badges">${badges.map(b => `<div class="badge ${b.earned ? 'on' : ''}" title="${esc(t('badge_' + b.id + '_d'))}"><span>${b.icon}</span><span class="tiny">${t('badge_' + b.id)}</span></div>`).join('')}</div>
      <div class="grid2"><button class="btn soft" data-action="jr-add-act" id="addAct">🚶 ${t('jr_add_act')}</button><button class="btn soft" data-action="jr-add-ck" id="addCk">🩺 ${t('jr_add_ck')}</button></div>
      <h2>${t('jr_timeline')}</h2><div class="timeline">${ev.map(e => `<div class="ev"><span class="dot">${e.i}</span><div class="grow"><div class="small">${esc(e.txt)}</div><div class="tiny muted">${dstr(e.ts)}</div></div>${e.ck ? `<button class="link tiny" data-action="ck-del" data-id="${e.id}">🗑</button>` : e.act ? `<button class="link tiny" data-action="act-del" data-id="${e.id}">🗑</button>` : ''}</div>`).join('')}</div>`;
  };
  A['jr-period'] = el => { S.jr.period = +el.dataset.v; N.rerender(); };
  A['jr-add-act'] = () => N.openSheet(`<div class="row between"><h2 style="margin:0">${t('jr_add_act')}</h2><button class="iconbtn" data-action="close-sheet">✕</button></div><label class="f">${t('jr_act_type')}</label><div class="chips" id="actType">${['walk', 'run', 'housework', 'sport', 'dance', 'other'].map((a, i) => `<button type="button" class="chip ${i === 0 ? 'on' : ''}" data-action="rd-ctx" data-v="${a}">${t('act3_' + a)}</button>`).join('')}</div><label class="f">${t('jr_minutes')}</label><input class="in" id="actMin" type="number" inputmode="numeric" value="30"><label class="f">${t('rep_date')}</label><input class="in" id="actDate" type="date" value="${dayKey(Date.now())}"><button class="btn block" style="margin-top:14px" data-action="act-save" id="actSave">${t('save')}</button>`);
  A['act-save'] = () => { const min = +$('#actMin').value; if (!(min > 0 && min <= 600)) return toast(t('rd_invalid')); const d = $('#actDate').value; const ts = d && d !== dayKey(Date.now()) ? new Date(d + 'T12:00').getTime() : Date.now(); DB.set('activities', DB.get('activities', []).concat([{ id: uid(), ts, type: ($('#actType .on') || { dataset: { v: 'walk' } }).dataset.v, min }])); N.closeSheet(); INS.badges(); toast(t('rd_saved')); N.rerender(); };
  A['jr-add-ck'] = () => N.openSheet(`<div class="row between"><h2 style="margin:0">${t('jr_add_ck')}</h2><button class="iconbtn" data-action="close-sheet">✕</button></div><label class="f">${t('rep_date')}</label><input class="in" id="ckDate" type="date" value="${dayKey(Date.now())}"><label class="f">${t('ck_type')}</label><select class="in" id="ckType">${['doctor', 'dietitian', 'lab', 'eye', 'foot', 'dental', 'other'].map(c => `<option value="${c}">${t('ck_' + c)}</option>`).join('')}</select><label class="f">${t('ck_note')}</label><input class="in" id="ckNote" placeholder="${t('ck_note_ph')}"><label class="f">${t('ck_next')} <span class="muted small">(${t('optional')})</span></label><input class="in" id="ckNext" type="date"><button class="btn block" style="margin-top:14px" data-action="ck-save" id="ckSave">${t('save')}</button>`);
  A['ck-save'] = () => { const date = $('#ckDate').value; if (!date) return toast(t('rd_invalid')); const note = $('#ckNote').value.trim(); DB.set('checkups', DB.get('checkups', []).concat([{ id: uid(), date, type: $('#ckType').value, note, next: $('#ckNext').value || null }])); N.closeSheet(); INS.badges(); toast(t('rd_saved')); N.rerender(); flagCheck(textFlag(note)); };
  A['ck-del'] = el => { if (!confirm(t('del') + '?')) return; DB.set('checkups', DB.get('checkups', []).filter(c => c.id !== el.dataset.id)); N.rerender(); };
  A['act-del'] = el => { if (!confirm(t('del') + '?')) return; DB.set('activities', DB.get('activities', []).filter(c => c.id !== el.dataset.id)); N.rerender(); };

  /* ---------- WHAT NOLA REMEMBERS ---------- */
  const MEMCATS = ['meals', 'readings', 'prefs', 'feedback', 'chat'];
  ROUTES.memory = function () {
    const mem = Object.assign({ likes: [], dislikes: [], off: {} }, DB.get('memory', {})), pr = N.profile(), fb = DB.get('feedback', []);
    const tog = c => `<label class="switch"><input type="checkbox" data-action-change="mem-toggle" data-v="${c}" ${INS.memOn(c) ? 'checked' : ''}><span></span></label>`;
    const counts = { meals: N.meals().length, readings: N.readings().length, prefs: mem.likes.length + mem.dislikes.length, feedback: fb.length, chat: DB.get('chat', []).length };
    return hdr(t('hub_remember')) + `<p class="small muted">${t('mem_intro')}</p>
      <div class="card"><div class="row between"><h3>👤 ${t('mem_profile')}</h3><button class="btn sm ghost" data-action="edit-profile">✎ ${t('edit')}</button></div><div class="small">${N.condLabel(pr)}</div><div class="tiny muted">${t('f_allergies')}: ${(pr.allergies || []).map(a => t('a_' + a)).join(', ') || '—'} · ${t('f_goals')}: ${(pr.goals || []).map(g => t('goal_' + g)).join(', ') || '—'}</div><p class="tiny muted">${t('mem_profile_d')}</p></div>
      ${MEMCATS.map(c => `<div class="card tight"><div class="row between"><div><b>${t('mem_' + c)}</b><div class="tiny muted">${t('mem_' + c + '_d')} · ${t('mem_items', { n: counts[c] })}</div></div>${tog(c)}</div>
        ${c === 'prefs' ? `<div class="chips" style="margin-top:8px">${mem.likes.map(x => `<span class="chip sm on">👍 ${esc(x)} <button class="x" data-action="mem-rm" data-k="likes" data-v="${esc(x)}" aria-label="${t('del')}">✕</button></span>`).join('')}${mem.dislikes.map(x => `<span class="chip sm">👎 ${esc(x)} <button class="x" data-action="mem-rm" data-k="dislikes" data-v="${esc(x)}" aria-label="${t('del')}">✕</button></span>`).join('')}</div>
          <div class="row" style="gap:6px;margin-top:8px"><input class="in" id="memNew" placeholder="${t('mem_food_ph')}"><button class="btn sm soft" data-action="mem-add" data-k="likes">👍</button><button class="btn sm soft" data-action="mem-add" data-k="dislikes">👎</button></div>` : ''}
        ${c === 'feedback' && fb.length ? `<details style="margin-top:6px"><summary class="tiny">${t('mem_show')}</summary>${fb.slice(-20).reverse().map(f => `<div class="tiny row between"><span>${f.vote > 0 ? '👍' : '👎'} ${t('fbk_' + f.kind)} · ${esc(fbLabel(f))}</span><button class="link tiny" data-action="fb-rm" data-kind="${f.kind}" data-ref="${esc(f.ref)}">✕</button></div>`).join('')}</details>` : ''}
        ${counts[c] ? `<button class="link tiny" style="color:var(--red)" data-action="mem-clear" data-v="${c}">🗑 ${t('mem_delete_all')}</button>` : ''}</div>`).join('')}
      <div class="card tight"><div class="row between"><div><b>${t('mem_other')}</b><div class="tiny muted">${t('mem_other_d')}</div></div></div><div class="row wrap" style="gap:6px;margin-top:8px"><button class="btn sm ghost" data-action="mem-clear" data-v="glogs">🗑 ${t('hub_glucose')}</button><button class="btn sm ghost" data-action="mem-clear" data-v="plan">🗑 ${t('hub_planner')}</button><button class="btn sm ghost" data-action="mem-clear" data-v="journey">🗑 ${t('mem_journey')}</button></div></div>
      <div class="note">🛡️ ${t('mem_no_infer')}</div>`;
  };
  function fbLabel(f) { if (f.kind === 'plan') { const d = PL.dish(f.ref); return d ? tr(d.name) : f.ref; } if (f.kind === 'insight') return t(f.ref).slice(0, 50); return (f.topic || '') + (f.text ? ': ' + f.text.slice(0, 40) : ''); }
  C['mem-toggle'] = el => { const mem = Object.assign({ likes: [], dislikes: [], off: {} }, DB.get('memory', {})); mem.off = Object.assign({}, mem.off, { [el.dataset.v]: !el.checked }); DB.set('memory', mem); toast(t('set_saved')); };
  A['mem-rm'] = el => { const mem = Object.assign({ likes: [], dislikes: [], off: {} }, DB.get('memory', {})); mem[el.dataset.k] = (mem[el.dataset.k] || []).filter(x => x !== el.dataset.v); DB.set('memory', mem); N.rerender(); };
  A['mem-add'] = el => { const v = $('#memNew').value.trim(); if (!v) return; B.remember(el.dataset.k === 'likes' ? 'like' : 'dislike', v); N.rerender(); };
  A['fb-rm'] = el => { DB.set('feedback', DB.get('feedback', []).filter(f => !(f.kind === el.dataset.kind && f.ref === el.dataset.ref))); N.rerender(); };
  A['mem-clear'] = el => {
    const c = el.dataset.v; if (!confirm(t('mem_delete_q'))) return;
    if (c === 'meals') DB.set('meals', []); if (c === 'readings') DB.set('readings', []); if (c === 'feedback') DB.set('feedback', []); if (c === 'chat') { DB.set('chat', []); S.chatMem = []; }
    if (c === 'prefs') { const m = DB.get('memory', {}); m.likes = []; m.dislikes = []; DB.set('memory', m); }
    if (c === 'glogs') { DB.set('glogs', []); DB.set('readings', N.readings().filter(r => !r.glog)); }
    if (c === 'plan') { DB.set('plan', null); DB.set('shopping', null); }
    if (c === 'journey') { DB.set('activities', []); DB.set('checkups', []); DB.set('badges', {}); }
    toast(t('diary_deleted')); N.rerender();
  };
  A.fb = el => {
    const { kind, ref } = el.dataset, v = +el.dataset.v; const cur = (DB.get('feedback', []).find(x => x.kind === kind && x.ref === ref) || {}).vote;
    if (cur === v) { DB.set('feedback', DB.get('feedback', []).filter(f => !(f.kind === kind && f.ref === ref))); N.rerender(); return; }
    let extra = {}; if (kind === 'chat') { const m = N.chatList().find(x => x.id === ref); if (m) extra = { topic: m.topic || 'default', text: (m.text || '').slice(0, 80) }; }
    if (!B.addFeedback(kind, ref, v, extra)) return toast(t('mem_fb_off'));
    toast(v > 0 ? t('fb_thanks_up') : t('fb_thanks_down')); N.rerender();
  };

  /* ---------- PRIVACY & SECURITY ---------- */
  ROUTES.privacy = function () {
    const enc = DB.encrypted, s = N.settings();
    return hdr(t('hub_privacy')) + `<div class="card"><h3>🛡️ ${t('pv_status')}</h3><div class="kv"><span>${t('pv_storage')}</span><b>${DB.usingIDB ? 'IndexedDB' : 'localStorage'} · ${t('pv_on_device')}</b><span>${t('pv_encryption')}</span><b>${enc ? '🔒 AES-GCM-256 (PBKDF2 210k)' : '— ' + t('pv_not_enc')}</b><span>${t('pv_ai')}</span><b>${AI.enabled() ? t('pv_ai_on') : t('pv_ai_off')}</b></div></div>
      <div class="card"><h3>🔢 ${t('pv_pin')}</h3>${enc ? `<p class="small">${t('pv_pin_on')}</p><div class="row wrap" style="gap:8px"><button class="btn sm" data-action="pv-lock" id="lockNow">🔒 ${t('pv_lock_now')}</button><button class="btn sm ghost" data-action="pv-change">${t('pv_change')}</button><button class="btn sm ghost" data-action="pv-remove">${t('pv_remove')}</button></div>
        <label class="check" style="margin-top:10px"><input type="checkbox" data-action-change="pv-autolock" ${s.autoLock ? 'checked' : ''}><span class="small">${t('pv_autolock')}</span></label>` :
        `<p class="small muted">${t('pv_pin_d')}</p><label class="f" for="pin1">${t('pv_new_pin')}</label><input class="in" id="pin1" type="password" inputmode="numeric" autocomplete="new-password" maxlength="12"><label class="f" for="pin2">${t('pv_confirm_pin')}</label><input class="in" id="pin2" type="password" inputmode="numeric" autocomplete="new-password" maxlength="12">
        <div class="banner amber small" style="margin-top:10px">⚠️ ${t('pv_forget_warn')}</div><button class="btn block" data-action="pv-set" id="pinSet">${t('pv_set')}</button>`}</div>
      <div class="card"><h3>💾 ${t('pv_backup')}</h3><p class="small muted">${t('pv_backup_d')}</p><label class="f" for="bkPass">${t('fam_pass')}</label><input class="in" id="bkPass" type="password" autocomplete="new-password">
        <div class="row" style="gap:8px;margin-top:10px"><button class="btn sm grow" data-action="bk-export" id="bkExport">⬇️ ${t('pv_export')}</button><label class="btn sm ghost grow"><input type="file" id="bkFile" accept=".nolabackup,.txt" hidden>⬆️ ${t('pv_import')}</label></div><p class="tiny muted">${t('pv_backup_key')}</p></div>
      <div class="card"><h3>📜 ${t('pv_how')}</h3><ul class="clean small"><li>${t('pv_how1')}</li><li>${t('pv_how2')}</li><li>${t('pv_how3')}</li><li>${t('pv_how4')}</li></ul></div>`;
  };
  const pinOk = p => /^\d{4,12}$/.test(p);
  A['pv-set'] = async () => { const a = $('#pin1').value, b = $('#pin2').value; if (!pinOk(a)) return toast(t('pv_pin_rule')); if (a !== b) return toast(t('pv_pin_mismatch')); const bt = $('#pinSet'); bt.disabled = true; bt.textContent = '…'; await DB.enableLock(a); toast(t('pv_pin_set')); N.rerender(); };
  A['pv-lock'] = async () => { await DB.flush(); location.reload(); };
  async function askPin(title) { return new Promise(res => { N.openSheet(`<div class="row between"><h2 style="margin:0">${title}</h2><button class="iconbtn" data-action="close-sheet">✕</button></div><label class="f">${t('pv_current_pin')}</label><input class="in" id="pinCur" type="password" inputmode="numeric" autocomplete="current-password"><button class="btn block" style="margin-top:12px" id="pinCurOk">${t('next')}</button>`); $('#pinCurOk').onclick = async () => { const p = $('#pinCur').value; if (!(await DB.verify(p))) { toast(t('lock_wrong')); return; } N.closeSheet(); res(p); }; }); }
  A['pv-remove'] = async () => { await askPin(t('pv_remove')); if (!confirm(t('pv_remove_q'))) return; await DB.disableLock(); toast(t('pv_pin_removed')); N.rerender(); };
  A['pv-change'] = async () => { await askPin(t('pv_change')); const n = prompt(t('pv_new_pin')); if (!n || !pinOk(n)) return toast(t('pv_pin_rule')); const n2 = prompt(t('pv_confirm_pin')); if (n !== n2) return toast(t('pv_pin_mismatch')); await DB.disableLock(); await DB.enableLock(n); toast(t('pv_pin_set')); N.rerender(); };
  C['pv-autolock'] = el => { N.saveSettings({ autoLock: el.checked }); toast(t('set_saved')); };
  A['bk-export'] = async () => {
    const pass = $('#bkPass').value; if (pass.length < 8) return toast(t('fam_need_pass'));
    const data = DB.dump(); if (data.settings) data.settings.aiKey = '';
    const txt = await window.NolaCrypto.sealText(pass, { t: 'nola-backup', v: 2, ts: Date.now(), data });
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' })); a.download = 'nola-health-' + dayKey(Date.now()) + '.nolabackup'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast(t('pv_exported'));
  };
  async function importBackup(file) {
    const pass = $('#bkPass').value; if (!pass) return toast(t('open_need'));
    const txt = await file.text();
    try { const p = await window.NolaCrypto.openText(pass, txt); if (!p || p.t !== 'nola-backup') throw new Error('format'); if (!confirm(t('pv_import_q'))) return; const keep = N.settings().aiKey; Object.entries(p.data).forEach(([k, v]) => DB.set(k, v)); if (p.data.settings) N.saveSettings({ aiKey: keep }); toast(t('set_imported')); location.hash = '#/home'; N.route(); }
    catch (e) { toast(e.message === 'passphrase' ? t('open_bad_pass') : t('open_bad_format')); }
  }

  /* ---------- LOCK SCREEN ---------- */
  function lockScreen() {
    return `<div class="lock"><img src="icons/icon.svg" width="72" height="72" alt=""><h1>${t('lock_title')}</h1><p class="small muted">${t('lock_d')}</p>
      <input class="in pin" id="lockPin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="12" aria-label="PIN" autofocus>
      <button class="btn block" data-action="unlock" id="unlockBtn">${t('lock_unlock')}</button><div id="lockErr" class="small" style="color:var(--red);min-height:20px;margin-top:6px"></div>
      <button class="link small" data-action="lock-forgot">${t('lock_forgot')}</button></div>`;
  }
  A.unlock = async () => {
    const p = $('#lockPin').value, b = $('#unlockBtn'); if (!p) return; b.disabled = true; b.textContent = '…';
    const ok = await DB.unlock(p);
    if (!ok) { b.disabled = false; b.textContent = t('lock_unlock'); $('#lockErr').textContent = t('lock_wrong'); $('#lockPin').value = ''; return; }
    N.afterUnlock();
  };
  A['lock-forgot'] = async () => { if (!confirm(t('lock_forgot_q'))) return; if (!confirm(t('set_reset_q'))) return; await DB.clear(); location.hash = '#/onboarding'; location.reload(); };

  /* ---------- change / input wiring ---------- */
  document.addEventListener('change', ev => {
    const el = ev.target, k = el.dataset && el.dataset.actionChange;
    if (k && C[k]) C[k](el, ev);
    if (el.id === 'menuIn') restPhoto(el.files[0], 'menu');
    if (el.id === 'restMealIn') restPhoto(el.files[0], 'meal');
    if (el.id === 'osFile' && el.files[0]) el.files[0].text().then(x => { $('#osText').value = x.trim(); toast('✓'); });
    if (el.id === 'bkFile' && el.files[0]) importBackup(el.files[0]);
  });
  document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.id === 'lockPin') A.unlock(); });
  window.NolaFeatures = { hubGrid, lockScreen, fbBtns, stats };
})();
