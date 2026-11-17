/* NOLA HEALTH v3.1 — medicines list (onboarding + My Health), profile migration, personalised
   health plan (goals, today, weekly progress, trends) and medication information for NOLA AI.
   Medicine information is general and informational only: NOLA never recommends starting,
   stopping or changing a medicine or dose, and never identifies a medicine from a photo. */
(function () {
  'use strict';
  const N = window.NolaApp, DB = window.NolaDB, E = window.NolaEngine, MD = window.NolaMeds, F = window.NolaFoods, CH = window.NolaCharts;
  const { S, esc, uid, dayKey, toast } = N;
  const $ = (s, el = document) => el.querySelector(s);
  const L = () => I18N.lang, R = Math.round, DAY = 864e5;
  const ROUTES = N.ROUTES, A = N.A;
  const today = () => dayKey(Date.now());
  const hdr = (title, back = 'health') => `<div class="hdr"><a class="iconbtn" href="#/${back}" aria-label="${t('back')}">‹</a><h1>${title}</h1></div>`;
  const en = k => (I18N.LANGS.en[k] || k);
  const FREQ = ['once', 'twice', 'three', 'night', 'asneeded', 'weekly', 'other'];
  const BP_CLS = ['ccb', 'ccb_gf', 'acei', 'arb', 'thiazide', 'beta', 'central'], DM_CLS = ['biguanide', 'sulfonylurea', 'insulin', 'dpp4'];

  /* ---------- medicines helpers ---------- */
  const refOf = m => (m.medId && MD.byId[m.medId]) || MD.find(m.name);
  const medName = m => { const r = m.medId && MD.byId[m.medId]; return r ? (L() === 'am' ? r.am + ' (' + r.en + ')' : r.en) : m.name; };
  const classes = pr => (pr.medList || []).map(refOf).filter(Boolean).map(r => r.cls);
  function syncMeds(d) {
    d.medList = d.medList || [];
    d.meds = d.noMeds ? '' : d.medList.map(m => [m.name, m.dose, m.freq ? en('mf_' + m.freq) : ''].filter(Boolean).join(' ')).join(', ');
    return d;
  }
  function parseLegacy(str) {
    return String(str || '').split(/[,;\n]+/).map(s => s.trim()).filter(Boolean).map(part => {
      const ref = MD.find(part), dm = part.match(/(\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|g|iu|units?|ml)\b.*)$/i);
      return { id: uid(), medId: ref ? ref.id : null, name: ref ? ref.en : part.replace(dm ? dm[1] : '', '').trim() || part, dose: dm ? dm[1].trim() : '', freq: '', reason: '', photo: false, legacy: part };
    });
  }
  /* migrate v1–v3 profiles to v3.1 without losing anything */
  function migrate() {
    const pr = DB.get('profile'); if (!pr || pr.v31) return false;
    if (!pr.medList) { pr.medsLegacy = pr.meds || ''; pr.medList = parseLegacy(pr.meds); }
    pr.condDetails = pr.condDetails || {}; pr.medAllergies = pr.medAllergies || [];
    syncMeds(pr); if (!pr.medList.length && pr.medsLegacy) pr.meds = pr.medsLegacy;
    pr.v31 = 1; DB.set('profile', pr); return true;
  }

  /* ---------- medicines editor (shared by onboarding step 3 and My medicines) ---------- */
  const src = ctx => ctx === 'ob' ? S.ob.d : N.profile();
  const blank = () => ({ edit: null, medId: null, name: '', dose: '', freq: '', reason: '', photo: null, photoDel: false, yes: false });
  S.med = S.med || blank();
  function sug(q) { return MD.search(q, 8).map(m => `<button type="button" class="chip sm" data-action="med-pick" data-id="${m.id}">${esc(L() === 'am' ? m.am : m.en)}</button>`).join('') || `<span class="tiny muted">${t('md_none_found')}</span>`; }
  function medCard(m, ctx) {
    const ph = (DB.get('medPhotos', {}) || {})[m.id];
    const sub = [m.dose, m.freq ? t('mf_' + m.freq) : '', m.reason].filter(Boolean).map(esc).join(' · ');
    return `<div class="card tight med" data-med="${m.id}"><div class="row"><span class="ci">💊</span><div class="grow"><b>${esc(medName(m))}</b>${sub ? `<div class="small muted">${sub}</div>` : ''}</div>
      ${ph ? `<img class="med-ph" src="${ph}" alt="${esc(t('md_photo_alt'))}">` : ''}<button type="button" class="iconbtn sm" data-action="med-edit" data-id="${m.id}" data-ctx="${ctx}" aria-label="${t('edit')}">✎</button><button type="button" class="iconbtn sm" data-action="med-del" data-id="${m.id}" data-ctx="${ctx}" aria-label="${t('del')}">✕</button></div></div>`;
  }
  function medEditor(ctx) {
    const d = src(ctx) || {}, list = d.medList || [], f = S.med, showForm = !d.noMeds && (list.length || f.yes || f.edit);
    return `<p class="muted">${t('md_q')}</p>
      <div class="seg big" id="medYN"><button type="button" class="${!d.noMeds && (list.length || f.yes) ? 'on' : ''}" data-action="med-yn" data-v="yes" data-ctx="${ctx}" id="medYes">💊 ${t('md_yes')}</button><button type="button" class="${d.noMeds ? 'on' : ''}" data-action="med-yn" data-v="no" data-ctx="${ctx}" id="noMeds">🚫 ${t('md_no')}</button></div>
      ${d.noMeds ? `<div class="banner green small" id="noMedsNote">✓ ${t('md_no_note')}</div>` : ''}
      <div id="medList">${list.map(m => medCard(m, ctx)).join('')}</div>
      ${showForm ? `<div class="card" id="medForm"><h3>${f.edit ? '✎ ' + t('md_edit') : '+ ' + t(list.length ? 'md_add_more' : 'md_add')}</h3>
        <label class="f" for="medSearch">🔎 ${t('md_search')}</label><input class="in" id="medSearch" placeholder="${esc(t('md_search_ph'))}" autocomplete="off">
        <div class="chips" id="medSug" style="margin-top:6px">${sug('')}</div>
        <label class="f" for="medName">${t('md_name')}</label><input class="in" id="medName" value="${esc(f.name)}" maxlength="80" placeholder="${esc(t('md_name_ph'))}">
        <div class="grid2"><div><label class="f" for="medDose">${t('md_dose')}</label><input class="in" id="medDose" value="${esc(f.dose)}" maxlength="40" placeholder="${esc(t('md_dose_ph'))}"></div>
          <div><label class="f" for="medFreq">${t('md_freq')}</label><select class="in" id="medFreq"><option value="">—</option>${FREQ.map(x => `<option value="${x}" ${f.freq === x ? 'selected' : ''}>${t('mf_' + x)}</option>`).join('')}</select></div></div>
        <label class="f" for="medReason">${t('md_reason')}</label><input class="in" id="medReason" value="${esc(f.reason)}" maxlength="80" placeholder="${esc(t('md_reason_ph'))}">
        <div class="row wrap" style="margin-top:10px;gap:8px"><label class="btn sm ghost"><input type="file" accept="image/*" capture="environment" id="medPhoto" hidden>📷 ${t('md_photo')}</label><span id="medPhPrev">${f.photo ? `<img class="med-ph" src="${f.photo}" alt="">` : ''}</span></div>
        <p class="tiny muted">${t('md_photo_note')}</p>
        <div class="row" style="gap:8px;margin-top:8px">${f.edit ? `<button type="button" class="btn ghost" data-action="med-cancel">${t('cancel')}</button>` : ''}<button type="button" class="btn grow" data-action="med-add" data-ctx="${ctx}" id="medAdd">${f.edit ? t('save') : '+ ' + t('md_save')}</button></div></div>` : ''}
      <p class="tiny muted">🩺 ${t('md_never')}</p>`;
  }
  function persist(ctx, d) { if (ctx !== 'ob') { syncMeds(d); d.updated = Date.now(); DB.set('profile', d); } }
  function addMed(ctx, quiet) {
    const f = S.med, name = (f.name || '').trim(); if (!name) { if (!quiet) toast(t('md_need_name')); return false; }
    const d = src(ctx); d.medList = d.medList || [];
    const picked = f.medId && MD.byId[f.medId], sameName = picked && [picked.en, picked.am].some(x => x.toLowerCase() === name.toLowerCase());
    const ref = sameName ? picked : MD.find(name);
    const id = f.edit || uid(), old = d.medList.find(m => m.id === id) || {};
    const photos = DB.get('medPhotos', {}) || {};
    if (f.photo) photos[id] = f.photo; else if (f.photoDel) delete photos[id];
    DB.set('medPhotos', photos);
    const m = Object.assign({}, old, { id, medId: ref ? ref.id : null, name: ref && sameName ? ref.en : name, dose: (f.dose || '').trim(), freq: f.freq || '', reason: (f.reason || '').trim(), photo: !!photos[id], updated: Date.now() });
    d.medList = old.id ? d.medList.map(x => x.id === id ? m : x) : d.medList.concat([m]); d.noMeds = false;
    persist(ctx, d); S.med = Object.assign(blank(), { yes: true });
    if (!quiet) { toast('✓ ' + t('md_saved')); N.rerender(); }
    return true;
  }
  function medAutoAdd(ctx) { if ((S.med.name || '').trim()) addMed(ctx, true); }
  A['med-yn'] = el => { const d = src(el.dataset.ctx); d.noMeds = el.dataset.v === 'no'; if (d.noMeds && (d.medList || []).length && !confirm(t('md_no_confirm'))) { d.noMeds = false; return; } if (d.noMeds) { d.medList = []; S.med = blank(); } else S.med.yes = true; persist(el.dataset.ctx, d); N.rerender(); };
  A['med-pick'] = el => { const m = MD.byId[el.dataset.id]; if (!m) return; S.med.medId = m.id; S.med.name = L() === 'am' ? m.am : m.en; const i = $('#medName'); if (i) i.value = S.med.name; const d = $('#medDose'); if (d) d.focus(); };
  A['med-add'] = el => addMed(el.dataset.ctx);
  A['med-cancel'] = () => { S.med = Object.assign(blank(), { yes: true }); N.rerender(); };
  A['med-edit'] = el => { const d = src(el.dataset.ctx), m = (d.medList || []).find(x => x.id === el.dataset.id); if (!m) return; S.med = Object.assign(blank(), { edit: m.id, medId: m.medId, name: medName(m), dose: m.dose || '', freq: m.freq || '', reason: m.reason || '', yes: true }); N.rerender(); setTimeout(() => { const f = $('#medForm'); if (f) f.scrollIntoView({ block: 'center' }); }, 50); };
  A['med-del'] = el => { if (!confirm(t('md_del_q'))) return; const d = src(el.dataset.ctx); d.medList = (d.medList || []).filter(x => x.id !== el.dataset.id); const ph = DB.get('medPhotos', {}) || {}; delete ph[el.dataset.id]; DB.set('medPhotos', ph); persist(el.dataset.ctx, d); if (S.med.edit === el.dataset.id) S.med = blank(); N.rerender(); };
  document.addEventListener('input', ev => {
    const el = ev.target, map = { medName: 'name', medDose: 'dose', medReason: 'reason' };
    if (map[el.id]) { S.med[map[el.id]] = el.value; if (el.id === 'medName') S.med.medId = null; }
    if (el.id === 'medSearch') { const b = $('#medSug'); if (b) b.innerHTML = sug(el.value); }
  });
  document.addEventListener('change', async ev => {
    const el = ev.target;
    if (el.id === 'medFreq') S.med.freq = el.value;
    if (el.id === 'medPhoto' && el.files[0]) { try { S.med.photo = await N.compressImage(el.files[0], 640, 0.7); const p = $('#medPhPrev'); if (p) p.innerHTML = `<img class="med-ph" src="${S.med.photo}" alt="">`; } catch (e) { toast('Photo error'); } }
  });

  /* ---------- general medicine information (used by My medicines and NOLA AI) ---------- */
  function infoLines(m, pr) {
    const ref = refOf(m), out = [];
    if (!ref) { out.push(t('md_unknown', { n: m.name || m })); return out; }
    const c = MD.CLS[ref.cls] || {};
    if (c.use) out.push(t('md_used_for', { u: t(c.use) }));
    (c.notes || []).forEach(k => out.push('🍽️ ' + t(k)));
    const al = allergyHit(ref, pr); if (al) out.push('⚠️ ' + t('md_allergy_warn', { a: al }));
    return out;
  }
  function allergyHit(ref, pr) {
    const ma = (pr.medAllergies || []), oth = (pr.medAllergyOther || '').toLowerCase();
    if (ma.includes('penicillin') && ['amoxicillin'].includes(ref.id)) return t('ma_penicillin');
    if (ma.includes('aspirin') && ref.id === 'aspirin') return t('ma_aspirin');
    if (ma.includes('nsaid') && (ref.cls === 'nsaid' || ref.id === 'aspirin')) return t('ma_nsaid');
    if (oth && oth.split(/[,;]+/).map(s => s.trim()).filter(s => s.length > 3).some(s => ref.en.toLowerCase().includes(s) || s.includes(ref.id))) return pr.medAllergyOther;
    return null;
  }
  ROUTES.meds = function () {
    const pr = N.profile(), list = pr.medList || [];
    const ma = (pr.medAllergies || []).map(a => t('ma_' + a)).concat(pr.medAllergyOther ? [pr.medAllergyOther] : []);
    return hdr('💊 ' + t('md_title')) + `<p class="small muted">${t('md_intro')}</p>` + medEditor('pr') +
      (list.length ? `<h2>${t('md_info_t')}</h2><div id="medInfo">${list.map(m => `<div class="card tight" data-medinfo="${m.id}"><b>${esc(medName(m))}</b><ul class="clean small">${infoLines(m, pr).map(l => `<li>${esc(l)}</li>`).join('')}</ul></div>`).join('')}
        <p class="tiny muted">${t('mn_ask')} ${t('md_sources')}</p></div>` : '') +
      `<div class="card"><h3>⚠️ ${t('f_med_allergies')}</h3><p class="small">${ma.length ? ma.map(esc).join(', ') : t('md_no_allergy')}</p><button class="btn sm ghost" data-action="edit-profile">✎ ${t('edit')}</button></div>
      <a class="btn ghost block" href="#/reminders">⏰ ${t('md_rem_link')}</a>`;
  };
  /* NOLA AI (rule-based) medication answers — informational only */
  function medLines(q, pr) {
    const s = ' ' + MD.norm(q) + ' ', mine = (pr.medList || []);
    let hits = mine.filter(m => { const r = refOf(m); const keys = [MD.norm(m.name)].concat(r ? [MD.norm(r.en), MD.norm(r.am), r.id.replace(/_/g, ' '), MD.norm(r.en).split(' ')[0]] : []); return keys.some(k => k && k.length >= 4 && s.includes(' ' + k + ' ')); });
    const other = MD.find(q); if (other && !hits.some(m => refOf(m) === other)) hits.push({ name: other.en, medId: other.id, notMine: true });
    const out = [];
    if (!hits.length && /\bmy (medicines?|medications?|pills?|tablets?)\b|መድሃኒቶቼ|መድሃኒቴ/i.test(q)) hits = mine;
    if (!hits.length && !mine.length) out.push(t('md_ai_none'));
    hits.slice(0, 3).forEach(m => { out.push('**' + medName(m) + '**' + (m.notMine ? ' — ' + t('md_ai_notmine') : '')); infoLines(m, pr).forEach(l => out.push('• ' + l)); });
    if (/\b(when|what time|morning|night|evening|before|after|with food|empty stomach|timing|miss(ed)?|forgot)\b|ሰዓት|መቼ|ጠዋት|ማታ|ከምግብ/i.test(q)) out.push('🕒 ' + t('mn_timing'));
    if (hits.length) out.push(t('mn_ask'));
    return out;
  }

  /* ---------- personalised health plan ---------- */
  const rdOn = (ty, day) => N.readings().some(r => r.type === ty && dayKey(r.ts) === day);
  const mealsOn = day => N.meals().filter(m => dayKey(m.ts) === day);
  const foodsOn = day => mealsOn(day).flatMap(m => m.items).map(i => i.foodId && F.byId[i.foodId]).filter(Boolean);
  function planGoals(pr) {
    const cl = classes(pr), age = E.age(pr), dm = E.isDiabetic(pr) || cl.some(c => DM_CLS.includes(c));
    const bp = E.has(pr, 'htn') || cl.some(c => BP_CLS.includes(c)), heart = E.has(pr, 'heart'), kidney = E.has(pr, 'kidney');
    const goals = pr.goals || [], wt = goals.some(g => ['lose', 'gain', 'maintain'].includes(g)) || E.has(pr, 'obesity');
    const out = [];
    const add = (k, i, ti, why, src, freq, auto, act) => out.push({ k, i, ti, why, src, freq, auto, act });
    const btn = ty => `<button class="btn sm soft" data-action="add-reading" data-type="${ty}">+ ${t('td_add')}</button>`;
    if (bp || heart) add('bp', '❤️', 'td_bp', bp ? (E.has(pr, 'htn') ? 'pg_bp_htn' : 'pg_bp_meds') : 'pg_bp_heart', 'AHA', 'daily', d => rdOn('bp', d), btn('bp'));
    if (dm) add('glucose', '🩸', 'td_glucose', E.has(pr, 'dm_unknown') ? 'pg_glu_unknown' : 'pg_glu', 'ADA', 'daily', d => rdOn('glucose', d), btn('glucose'));
    if (wt) add('weight', '⚖️', 'pg_weight', 'pg_weight_why', 'WHO', 'weekly', d => N.readings().some(r => r.type === 'weight' && r.ts > new Date(d).getTime() - 6 * DAY && dayKey(r.ts) <= d), btn('weight'));
    add('veg', '🥬', 'pg_balanced', 'pg_balanced_why', 'WHO', 'daily', d => foodsOn(d).some(f => f.cat === 'veg' || f.tags.includes('vegetable')));
    if (dm || goals.includes('lose') || E.has(pr, 'obesity')) add('portion', '🍽️', 'pg_portion', dm ? 'pg_portion_dm' : 'pg_portion_why', 'ADA', 'daily', null);
    if (kidney || heart) add('water', '💧', 'pg_fluids', 'pg_fluids_why', 'KDIGO / AHA', 'daily', null);
    else add('water', '💧', 'td_water', 'pg_water_why', 'WHO', 'daily', null);
    if (heart || age >= 65) add('walk', '🚶', 'pg_walk_gentle', heart ? 'pg_walk_heart' : 'pg_walk_older', 'WHO 2020', 'daily', null);
    else add('walk', '🚶', dm ? 'td_walk' : 'pg_walk', dm ? 'pg_walk_dm' : 'pg_walk_why', 'WHO 2020', 'daily', d => (DB.get('activities', []) || []).some(a => dayKey(a.ts) === d));
    if ((pr.medList || []).length) add('meds', '💊', 'pg_meds', 'pg_meds_why', '', 'daily', null, `<a class="btn sm soft" href="#/reminders">⏰</a>`);
    if (E.has(pr, 'anemia')) add('iron', '🫘', 'pg_iron', 'pg_iron_why', 'WHO', 'daily', d => foodsOn(d).some(f => f.tags.includes('legume') || ['gomen', 'tikil_gomen', 'ayib_gomen', 'gomen_besiga'].includes(f.id)));
    if (E.has(pr, 'chol') || goals.includes('chol')) add('fat', '🫒', 'pg_fat', 'pg_fat_why', 'AHA', 'daily', null);
    if (kidney) add('kidney', '🫘', 'pg_kidney', 'pg_kidney_why', 'KDIGO 2024', 'info', null);
    if (E.has(pr, 'liver')) add('liver', '🟤', 'pg_liver', 'pg_liver_why', 'AASLD / EASL', 'info', null);
    return out;
  }
  const ticks = day => ((DB.get('daily', {}) || {})[day] || {});
  function goalItems(pr, day) {
    return planGoals(pr).filter(g => g.freq === 'daily' || (g.freq === 'weekly' && !(g.auto && g.auto(day))))
      .map(g => ({ k: g.k, i: g.i, txt: t(g.ti), sub: ['water', 'walk', 'portion', 'meds', 'iron', 'weight'].includes(g.k) ? t(g.why) : '', auto: g.auto ? g.auto(day) : false, act: g.act || '' }));
  }
  function dayDone(pr, day) { const gs = planGoals(pr).filter(g => g.freq === 'daily'), tk = ticks(day); const n = gs.filter(g => (g.auto && g.auto(day)) || tk[g.k]).length; return { n, t: gs.length }; }
  function avg(a) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : null; }
  function trends(pr) {
    const rs = N.readings(), now = Date.now(), out = [];
    const win = (ty, a, b) => rs.filter(r => r.type === ty && r.ts > now - a * DAY && r.ts <= now - b * DAY);
    const dir = (cur, prev, tol) => prev == null || cur == null ? 'same' : cur > prev + tol ? 'up' : cur < prev - tol ? 'down' : 'same';
    const b1 = win('bp', 7, 0), b0 = win('bp', 30, 7);
    if (b1.length || b0.length) { const s1 = avg(b1.map(r => r.sys)), d1 = avg(b1.map(r => r.dia)), s0 = avg(b0.map(r => r.sys)), d0 = avg(b0.map(r => r.dia)); const c = s1 != null ? s1 : s0, dd = d1 != null ? d1 : d0;
      out.push({ k: 'bp', i: '❤️', label: t('log_bp'), val: R(c) + '/' + R(dd), dir: b1.length && b0.length ? dir(s1, s0, 4) : 'na', n: b1.length + b0.length }); }
    const g1 = win('glucose', 7, 0), g0 = win('glucose', 30, 7);
    if (g1.length || g0.length) { const a1 = avg(g1.map(r => r.mg)), a0 = avg(g0.map(r => r.mg)); out.push({ k: 'glucose', i: '🩸', label: t('log_glucose'), val: N.fmtG(R(a1 != null ? a1 : a0)), dir: g1.length && g0.length ? dir(a1, a0, 10) : 'na', n: g1.length + g0.length }); }
    const w = rs.filter(r => r.type === 'weight').sort((a, b) => a.ts - b.ts);
    if (w.length) { const last = w[w.length - 1], first = w.find(r => r.ts > now - 30 * DAY) || w[0]; out.push({ k: 'weight', i: '⚖️', label: t('log_weight'), val: last.kg + ' kg', dir: w.length > 1 && first !== last ? dir(last.kg, first.kg, 0.4) : 'na', n: w.length }); }
    const wk = N.meals().filter(m => m.ts > now - 7 * DAY).length; out.push({ k: 'meals', i: '🍽️', label: t('g_meals'), val: String(wk), dir: 'na', n: wk });
    return out;
  }
  ROUTES.plan = function () {
    const pr = N.profile(), first = /first=1/.test(location.hash) || (pr.created && Date.now() - pr.created < DAY);
    const gs = planGoals(pr), day = today(), tk = ticks(day), daily = gs.filter(g => g.freq !== 'info');
    const isDone = g => (g.auto && g.auto(day)) || !!tk[g.k];
    const done = daily.filter(isDone), rem = daily.filter(g => !isDone(g));
    const week = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = dayKey(d); const before = pr.created && k < dayKey(pr.created); week.push(Object.assign({ k, lab: t('dow_' + d.getDay()) }, before ? { n: 0, t: 0 } : dayDone(pr, k))); }
    const wk = week.reduce((s, x) => s + x.n, 0), wt = week.reduce((s, x) => s + x.t, 0);
    const tr = trends(pr), arrow = { up: '↗', down: '↘', same: '→', na: '' };
    const row = g => `<div class="pg-goal ${isDone(g) ? 'done' : ''}" data-goal="${g.k}"><span class="ci">${g.i}</span><div class="grow"><b>${t(g.ti)}</b><div class="tiny muted">${t(g.why)}${g.src ? ` <span class="src">(${esc(g.src)})</span>` : ''}</div></div>${g.freq === 'info' ? `<span class="pill info">${t('pg_info')}</span>` : isDone(g) ? `<span class="pill good">✓</span>` : g.freq === 'weekly' ? `<span class="pill info">${t('pg_weekly')}</span>` : ''}</div>`;
    return `<div class="greet3 pg-hello"><h1 id="planHello">${t('pg_hello', { name: esc((pr.name || '').split(' ')[0]) })}</h1><p class="muted">${t(first ? 'pg_start' : 'pg_sub')}</p></div>
      <div class="card pg-sum" id="planToday"><div class="row">${CH.ring(done.length, daily.length || 1, 78, done.length + '/' + daily.length, '', '#15803d')}<div class="grow"><b>${t('pg_today')}</b><div class="small muted">${t('pg_done_n', { n: done.length })} · ${t('pg_left_n', { n: rem.length })}</div><a class="btn sm" href="#/today" style="margin-top:8px">📋 ${t('pg_open_list')}</a></div></div></div>
      <div class="pg-cols"><div><h2>🎯 ${t('pg_goals')}</h2><div class="card tight" id="planGoals">${gs.map(row).join('')}</div><p class="tiny muted">${t('pg_note')}</p></div>
      <div><h2>✅ ${t('pg_completed')}</h2><div class="card tight" id="planDone">${done.length ? done.map(g => `<div class="small">✓ ${t(g.ti)}</div>`).join('') : `<p class="small muted">${t('pg_none_done')}</p>`}</div>
      <h2>⏳ ${t('pg_remaining')}</h2><div class="card tight" id="planLeft">${rem.length ? rem.map(g => `<div class="row between small" style="padding:4px 0"><span>${g.i} ${t(g.ti)}</span>${g.act || ''}</div>`).join('') : `<p class="small muted">${t('td_all')}</p>`}</div>
      <h2>📅 ${t('pg_week')}</h2><div class="card" id="planWeek"><div class="pg-week">${week.map(x => `<div class="pg-day" data-day="${x.k}"><div class="pg-bar"><div style="height:${x.t ? R(x.n / x.t * 100) : 0}%"></div></div><span class="tiny">${x.lab}</span></div>`).join('')}</div><p class="small muted" style="margin:8px 0 0">${t('pg_week_sum', { n: wk, t: wt })}</p></div>
      <h2>📈 ${t('pg_trends')}</h2><div class="card tight" id="planTrends">${tr.map(x => `<div class="stat" data-trend="${x.k}"><span>${x.i} ${esc(x.label)}</span><b>${esc(x.val)} ${arrow[x.dir]}</b></div>`).join('')}<p class="tiny muted" style="margin:6px 0 0">${t('pg_trend_note')}</p></div></div></div>
      <a class="btn block" href="#/home" id="planHome" style="margin-top:14px">🏠 ${t('pg_go_home')}</a>`;
  };

  window.NolaV31 = { migrate, syncMeds, parseLegacy, medEditor, medAutoAdd, medLines, infoLines, planGoals, goalItems, dayDone, trends, classes };
})();
