/* NOLA HEALTH v4 — "Your Personal Health Companion".
   Three sections only: Home (My Health · What Should I Eat? · Reminders · Scan Food), Nolaa AI Doctor, About.
   Data stays on this device (IndexedDB), optionally encrypted with a PIN (AES-GCM, PBKDF2). Nothing here
   diagnoses or prescribes; emergency number in Ethiopia: 907. */
(function () {
  'use strict';
  const DB = window.NolaDB, E = window.NolaEngine, F = window.NolaFoods, MD = window.NolaMeds, DI = window.NolaDishes, AI = window.NolaAI, CO = window.NolaCoach, CH = window.NolaCharts;
  const VERSION = '4.0.0', DAY = 864e5;
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const pad = n => String(n).padStart(2, '0');
  const dayKey = ts => { const d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  const hm = d => pad(d.getHours()) + ':' + pad(d.getMinutes());
  const today = () => dayKey(Date.now());
  const L = () => I18N.lang;
  const fdate = ts => new Date(ts).toLocaleDateString(L() === 'am' ? 'am-ET' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + hm(new Date(ts));
  const S = { ed: null, rd: { type: 'bp', ctx: 'fasting' }, rdEdit: null, hist: 'all', scan: { photo: null, items: [], meal: null, result: null, saved: false }, slot: null, busy: false, showAi: false, rem: { kind: 'medicine', repeat: 'daily', days: [] }, med: { name: '', dose: '', freq: '', medId: null, edit: null } };

  /* ---------- data ---------- */
  const profile = () => DB.get('profile', null);
  const settings = () => DB.get('settings', {}) || {};
  const saveSettings = p => DB.set('settings', Object.assign({}, settings(), p));
  const readings = () => DB.get('readings', []) || [];
  const meals = () => DB.get('meals', []) || [];
  const rems = () => DB.get('reminders', []) || [];
  const unit = () => settings().unit || 'mg';
  const fmtG = mg => E.fmtGlucose(mg, unit());
  const CONDS = ['t1d', 't2d', 'dm_unknown', 'pre', 'gdm', 'htn', 'chol', 'heart', 'kidney', 'liver', 'anemia', 'obesity', 'digestive', 'other', 'unsure', 'none'];
  const COND_I = { t1d: '💉', t2d: '🩸', dm_unknown: '🩸', pre: '📈', gdm: '🤰', htn: '❤️', chol: '🧈', heart: '🫀', kidney: '🫘', liver: '🟤', anemia: '🩸', obesity: '⚖️', digestive: '🌀', other: '📝', unsure: '❔', none: '✅' };
  const ALLERGY = ['gluten', 'dairy', 'egg', 'peanut', 'fish', 'legume'], MED_ALLERGY = ['penicillin', 'sulfa', 'nsaid', 'aspirin'];
  const RESTR = ['fasting', 'halal', 'vegetarian', 'vegan', 'glutenfree', 'noalcohol', 'lowsalt'];
  const FREQ = ['once', 'twice', 'three', 'night', 'asneeded', 'weekly', 'other'];
  const condName = c => t('c_' + c);

  /* ---------- medicines: general information (never advice to change) ---------- */
  const refOf = m => (m.medId && MD.byId[m.medId]) || MD.find(m.name || '');
  const medName = m => { const r = m.medId && MD.byId[m.medId]; return r ? (L() === 'am' ? r.am + ' (' + r.en + ')' : r.en) : m.name; };
  function allergyHit(ref, pr) {
    const ma = pr.medAllergies || [], oth = (pr.medAllergyOther || '').toLowerCase();
    if (ma.includes('penicillin') && ref.id === 'amoxicillin') return t('ma_penicillin');
    if (ma.includes('aspirin') && ref.id === 'aspirin') return t('ma_aspirin');
    if (ma.includes('nsaid') && (ref.cls === 'nsaid' || ref.id === 'aspirin')) return t('ma_nsaid');
    if (oth && oth.split(/[,;]+/).map(s => s.trim()).filter(s => s.length > 3).some(s => ref.en.toLowerCase().includes(s))) return pr.medAllergyOther;
    return null;
  }
  function infoLines(m, pr) {
    const ref = refOf(m), out = [];
    if (!ref) { out.push(t('md_unknown', { n: m.name || '' })); return out; }
    const c = MD.CLS[ref.cls] || {};
    if (c.use) out.push(t('md_used_for', { u: t(c.use) }));
    (c.notes || []).forEach(k => out.push('🍽️ ' + t(k)));
    const al = allergyHit(ref, pr || {}); if (al) out.push('⚠️ ' + t('md_allergy_warn', { a: al }));
    return out;
  }
  function medLines(q, pr) {
    const s = ' ' + MD.norm(q) + ' ', mine = pr.medList || [];
    let hits = mine.filter(m => { const r = refOf(m); const keys = [MD.norm(m.name || '')].concat(r ? [MD.norm(r.en), MD.norm(r.am), r.id.replace(/_/g, ' '), MD.norm(r.en).split(' ')[0]] : []); return keys.some(k => k && k.length >= 4 && s.includes(' ' + k + ' ')); });
    const other = MD.find(q); if (other && !hits.some(m => refOf(m) === other)) hits.push({ name: other.en, medId: other.id, notMine: true });
    const out = [];
    if (!hits.length && /\bmy (medicines?|medications?|pills?|tablets?)\b|መድሃኒቶቼ|መድሃኒቴ/i.test(q)) hits = mine;
    if (!hits.length && !mine.length) out.push(t('md_ai_none'));
    hits.slice(0, 3).forEach(m => { out.push('**' + medName(m) + '**' + (m.notMine ? ' — ' + t('md_ai_notmine') : '')); infoLines(m, pr).forEach(l => out.push('• ' + l)); });
    if (/\b(when|what time|morning|night|evening|before|after|with food|empty stomach|timing|miss(ed)?|forgot)\b|ሰዓት|መቼ|ጠዋት|ማታ|ከምግብ/i.test(q)) out.push('🕒 ' + t('mn_timing'));
    if (hits.length) out.push(t('mn_ask'));
    return out;
  }
  window.NolaMedInfo = { medLines, infoLines };
  function parseLegacyMeds(str) {
    return String(str || '').split(/[,;\n]+/).map(x => x.trim()).filter(Boolean).map(part => {
      const ref = MD.find(part), dm = part.match(/(\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|g|iu|units?|ml)\b.*)$/i);
      return { id: uid(), medId: ref ? ref.id : null, name: ref ? ref.en : (part.replace(dm ? dm[1] : '', '').trim() || part), dose: dm ? dm[1].trim() : '', freq: '', reason: '' };
    });
  }
  const medsString = d => d.noMeds ? '' : (d.medList || []).map(m => [m.name, m.dose, m.freq ? I18N.LANGS.en['mf_' + m.freq] : ''].filter(Boolean).join(' ')).join(', ');

  /* ---------- migration from v1–v3.1 (keeps profile, readings, meals, PIN, settings, reminders) ---------- */
  function migrate() {
    const pr = profile();
    if (pr && !pr.v4) {
      if (!Array.isArray(pr.medList)) { pr.medsLegacy = pr.meds || ''; pr.medList = parseLegacyMeds(pr.meds); }
      pr.condDetails = pr.condDetails || {}; pr.medAllergies = pr.medAllergies || []; pr.conditions = pr.conditions || [];
      if (pr.medList.length) pr.meds = medsString(pr);
      pr.v4 = 1; DB.set('profile', pr);
    }
    const rs = rems();
    if (rs.some(r => !r.v4)) {
      DB.set('reminders', rs.map(r => r.v4 ? r : Object.assign({}, r, { kind: r.kind === 'medicine' ? 'medicine' : ['checkup', 'appointment'].includes(r.kind) ? 'checkup' : 'goal', oldKind: r.kind, v4: 1 })));
    }
  }

  /* ---------- UI helpers ---------- */
  function md(s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>').split('\n').map(l => l.trim()).filter(Boolean).map(l => /^[•\-] /.test(l) ? `<li>${l.replace(/^[•\-] /, '')}</li>` : `<p>${l}</p>`).join('').replace(/(<li>.*?<\/li>)+/g, m => `<ul>${m}</ul>`);
  }
  let toastT = 0;
  function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600); }
  function showAlert(flag) {
    const em = flag.level === 'emergency';
    const box = $('#alert');
    box.innerHTML = `<div class="alert-card ${em ? 'em' : 'warn'}" role="alertdialog" aria-labelledby="alT"><h2 id="alT">${em ? '🚨 ' + t('rf_title') : '⚠️ ' + t('warn_title')}</h2>
      ${flag.keys.map(k => `<p>${esc(t(k, { v: flag.v }))}</p>`).join('')}
      ${em ? `<a class="btn red block" href="tel:907" id="call907">📞 ${t('rf_call')}</a><p class="small">${t('rf_numbers')}</p>` : ''}
      <button class="btn ghost block" data-action="alert-close" id="alertOk">${t('x_ok')}</button></div>`;
    box.hidden = false;
  }
  function loader(on, txt) { $('#loader').hidden = !on; $('#loaderText').textContent = txt || ''; }
  const back = (href, title) => `<div class="pagehead"><a class="backbtn" href="${href}" aria-label="${t('x_back')}">‹</a><h1>${title}</h1></div>`;
  const chip = (k, v, label, on, extra = '') => `<button type="button" class="chip ${on ? 'on' : ''}" data-action="chip" data-k="${k}" data-v="${v}" aria-pressed="${!!on}" ${extra}>${label}</button>`;
  function compressImage(file, maxDim, q) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => { const img = new Image(); img.onload = () => { const sc = Math.min(1, maxDim / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', q)); }; img.onerror = rej; img.src = fr.result; };
      fr.onerror = rej; fr.readAsDataURL(file);
    });
  }

  /* ---------- ROUTES ---------- */
  const ROUTES = {};
  const SECTION = { home: 'home', health: 'home', profile: 'home', eat: 'home', reminders: 'home', scan: 'home', doctor: 'doctor', about: 'about' };

  /* Home: four large cards only */
  ROUTES.home = function () {
    const pr = profile(), next = nextReminder();
    const cards = [
      ['health', '❤️', 'x_c_health', 'x_c_health_d', 'cHealth'],
      ['eat', '🥗', 'x_c_eat', 'x_c_eat_d', 'cEat'],
      ['reminders', '⏰', 'x_c_rem', 'x_c_rem_d', 'cRem'],
      ['scan', '📷', 'x_c_scan', 'x_c_scan_d', 'cScan'],
    ];
    return `<section class="welcome"><h1 id="hello">${pr ? t('x_hello', { name: esc((pr.name || '').split(' ')[0]) }) : t('x_welcome')}</h1><p>${t('x_tagline')}</p></section>
      ${pr ? '' : `<a class="setup" href="#/profile" id="setupBtn"><span>👋</span><div><b>${t('x_setup')}</b><small>${t('x_setup_d')}</small></div><span class="arr">›</span></a>`}
      <div class="cards4" id="homeCards">${cards.map(([r, i, k, d, id]) => `<a class="fcard" href="#/${r}" id="${id}"><span class="fi" aria-hidden="true">${i}</span><span class="ft"><b>${t(k)}</b><small>${t(d)}</small>${r === 'reminders' && next ? `<em class="fnext">⏰ ${esc(next.time)} · ${esc(next.title)}</em>` : ''}</span><span class="arr" aria-hidden="true">›</span></a>`).join('')}</div>
      <p class="disc">🩺 ${t('x_disc')} <a href="tel:907">907</a></p>`;
  };

  /* My Health */
  ROUTES.health = function () {
    const pr = profile();
    if (!pr) return back('#/home', '❤️ ' + t('x_c_health')) + `<div class="card center"><p>${t('x_no_profile')}</p><a class="btn" href="#/profile" id="startProfile">${t('x_setup')}</a></div>`;
    const age = E.age(pr), bmi = E.bmi(pr), meds = pr.medList || [];
    const conds = (pr.conditions || []).filter(c => c !== 'none');
    const ma = (pr.medAllergies || []).map(a => t('ma_' + a)).concat(pr.medAllergyOther ? [pr.medAllergyOther] : []);
    const fa = (pr.allergies || []).map(a => t('a_' + a)).concat(pr.allergyOther ? [pr.allergyOther] : []);
    const last = ty => readings().filter(r => r.type === ty).reverse().sort((a, b) => b.ts - a.ts)[0];
    const val = r => !r ? '—' : r.type === 'bp' ? r.sys + '/' + r.dia : r.type === 'glucose' ? fmtG(r.mg) : r.kg + ' kg';
    return back('#/home', '❤️ ' + t('x_c_health')) + `
      <div class="card" id="secPersonal"><div class="row between"><h2>👤 ${t('x_personal')}</h2><a class="btn sm ghost" href="#/profile" id="editProfile">✎ ${t('x_edit')}</a></div>
        <div class="kv"><span>${t('x_name')}</span><b>${esc(pr.name)}</b><span>${t('x_age')}</span><b>${age || '—'}</b><span>${t('x_sex')}</span><b>${pr.gender ? t('g_' + pr.gender) : '—'}</b><span>${t('x_height')}</span><b>${pr.height ? pr.height + ' cm' : '—'}</b><span>${t('x_weight')}</span><b>${pr.weight ? pr.weight + ' kg' : '—'}</b><span>BMI</span><b>${bmi ? bmi + ' · ' + t('bmi_' + E.bmiCat(bmi)) : '—'}</b></div>
        <p class="tiny muted">${t('x_bmi_note')}</p></div>
      <div class="card" id="secConditions"><h2>🩺 ${t('x_conditions')}</h2>${conds.length ? `<div class="tags">${conds.map(c => `<span class="tag">${COND_I[c] || ''} ${esc(condName(c))}${pr.condDetails && pr.condDetails[c] ? ' — ' + esc(pr.condDetails[c]) : ''}</span>`).join('')}</div>` : `<p class="muted">${t('x_no_conditions')}</p>`}
        ${fa.length ? `<p class="small"><b>${t('f_allergies')}:</b> ${fa.map(esc).join(', ')}</p>` : ''}</div>
      <div class="card" id="secMeds"><h2>💊 ${t('x_meds')}</h2>${meds.length ? meds.map(m => `<details class="medrow" data-med="${m.id}"><summary><b>${esc(medName(m))}</b> <span class="muted small">${[m.dose, m.freq ? t('mf_' + m.freq) : '', m.reason].filter(Boolean).map(esc).join(' · ')}</span></summary><ul class="small">${infoLines(m, pr).map(l => `<li>${esc(l)}</li>`).join('')}</ul></details>`).join('') + `<p class="tiny muted">${t('mn_ask')}</p>` : `<p class="muted">${pr.noMeds ? t('md_no') : t('x_no_meds')}</p>`}
        <p class="small"><b>${t('f_med_allergies')}:</b> ${ma.length ? ma.map(esc).join(', ') : t('x_none')}</p><p class="tiny muted">🩺 ${t('md_never')}</p></div>
      <div class="stats3" id="latest">${['bp', 'glucose', 'weight'].map(ty => { const r = last(ty); return `<div class="stat" data-latest="${ty}"><span>${{ bp: '❤️', glucose: '🩸', weight: '⚖️' }[ty]} ${t('x_t_' + ty)}</span><b>${esc(val(r))}</b><small>${r ? fdate(r.ts) : t('x_none_yet')}</small></div>`; }).join('')}</div>
      ${readingForm()}
      ${chartCard()}
      ${historyCard()}
      ${securityCard()}`;
  };
  function toLocalInput(ts) { const d = new Date(ts); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + hm(d); }
  function readingForm() {
    const f = S.rd, ed = S.rdEdit && readings().find(r => r.id === S.rdEdit);
    const ty = ed ? ed.type : f.type;
    const when = ed ? toLocalInput(ed.ts) : (f.when || toLocalInput(Date.now()));
    return `<div class="card" id="rdForm"><h2>${ed ? '✎ ' + t('x_edit_reading') : '＋ ' + t('x_add_reading')}</h2>
      <div class="seg" id="rdType">${['bp', 'glucose', 'weight'].map(x => `<button type="button" class="${ty === x ? 'on' : ''}" data-action="rd-type" data-v="${x}" ${ed ? 'disabled' : ''}>${t('x_t_' + x)}</button>`).join('')}</div>
      ${ty === 'bp' ? `<div class="grid3"><div><label class="f" for="rdSys">${t('x_sys')}</label><input class="in" id="rdSys" type="number" inputmode="numeric" value="${ed ? ed.sys : ''}" placeholder="120"></div><div><label class="f" for="rdDia">${t('x_dia')}</label><input class="in" id="rdDia" type="number" inputmode="numeric" value="${ed ? ed.dia : ''}" placeholder="80"></div><div><label class="f" for="rdPulse">${t('x_pulse')}</label><input class="in" id="rdPulse" type="number" inputmode="numeric" value="${ed && ed.pulse ? ed.pulse : ''}" placeholder="${t('x_optional')}"></div></div>`
        : ty === 'glucose' ? `<div class="grid2"><div><label class="f" for="rdG">${t('x_t_glucose')} (${unit() === 'mmol' ? 'mmol/L' : 'mg/dL'})</label><input class="in" id="rdG" type="number" step="0.1" inputmode="decimal" value="${ed ? (unit() === 'mmol' ? E.r(ed.mg / 18, 1) : ed.mg) : ''}" placeholder="${unit() === 'mmol' ? '5.5' : '100'}"></div>
          <div><label class="f" for="rdCtx">${t('x_when_measured')}</label><select class="in" id="rdCtx">${['fasting', 'before', 'after', 'random'].map(c => `<option value="${c}" ${(ed ? ed.ctx : f.ctx) === c ? 'selected' : ''}>${t('ctx_' + c)}</option>`).join('')}</select></div></div>`
        : `<label class="f" for="rdW">${t('x_weight')} (kg)</label><input class="in" id="rdW" type="number" step="0.1" inputmode="decimal" value="${ed ? ed.kg : ''}" placeholder="70">`}
      <label class="f" for="rdWhen">${t('x_date_time')}</label><input class="in" id="rdWhen" type="datetime-local" value="${when}">
      <label class="f" for="rdNote">${t('x_note')}</label><input class="in" id="rdNote" maxlength="120" value="${esc(ed ? ed.note || '' : '')}" placeholder="${t('x_optional')}">
      <div class="row gap"><button class="btn grow" data-action="rd-save" id="rdSave">${t('x_save')}</button>${ed ? `<button class="btn ghost" data-action="rd-cancel" id="rdCancel">${t('x_cancel')}</button>` : ''}</div></div>`;
  }
  function chartCard() {
    const ty = S.rd.type, rs = readings().filter(r => r.type === ty && r.ts > Date.now() - 90 * DAY);
    if (rs.length < 2) return '';
    const series = ty === 'bp' ? [{ pts: rs.map(r => ({ x: r.ts, y: r.sys })), color: '#15803d' }, { pts: rs.map(r => ({ x: r.ts, y: r.dia })), color: '#65a30d' }]
      : [{ pts: rs.map(r => ({ x: r.ts, y: ty === 'glucose' ? (unit() === 'mmol' ? r.mg / 18 : r.mg) : r.kg })), color: '#15803d' }];
    return `<div class="card" id="rdChart"><h2>📈 ${t('x_t_' + ty)} · ${t('x_90d')}</h2>${CH.line(series, { h: 160 })}<p class="tiny muted">${t('x_chart_note')}</p></div>`;
  }
  function historyCard() {
    const f = S.hist;
    const rs = readings().map(r => ({ kind: r.type, ts: r.ts, r })), ms = meals().map(m => ({ kind: 'meal', ts: m.ts, m }));
    const all = rs.concat(ms).filter(x => f === 'all' || x.kind === f).sort((a, b) => b.ts - a.ts).slice(0, 60);
    const row = x => {
      if (x.kind === 'meal') { const m = x.m; const names = (m.items || []).map(i => { const fd = i.foodId && F.byId[i.foodId]; return fd ? (fd.name[L()] || fd.name.en) : (i.name || '?'); }).join(', ');
        return `<li class="hrow" data-hid="${m.id}"><span class="hi">🍽️</span><div class="grow"><b>${esc(names)}</b><small>${fdate(m.ts)}${m.totals ? ' · ~' + Math.round(m.totals.kcal) + ' kcal' : ''}${m.verdict ? ' · ' + t('x_v_' + m.verdict) : ''}</small></div><button class="iconbtn" data-action="meal-del" data-id="${m.id}" aria-label="${t('x_delete')}">✕</button></li>`; }
      const r = x.r, v = r.type === 'bp' ? `${r.sys}/${r.dia} mmHg${r.pulse ? ' · ♥ ' + r.pulse : ''}` : r.type === 'glucose' ? `${fmtG(r.mg)} · ${t('ctx_' + (r.ctx || 'random'))}` : `${r.kg} kg`;
      return `<li class="hrow" data-hid="${r.id}"><span class="hi">${{ bp: '❤️', glucose: '🩸', weight: '⚖️' }[r.type]}</span><div class="grow"><b>${esc(v)}</b><small>${fdate(r.ts)}${r.note ? ' · ' + esc(r.note) : ''}</small></div><button class="iconbtn" data-action="rd-edit" data-id="${r.id}" aria-label="${t('x_edit')}">✎</button><button class="iconbtn" data-action="rd-del" data-id="${r.id}" aria-label="${t('x_delete')}">✕</button></li>`;
    };
    return `<div class="card" id="history"><h2>🗂️ ${t('x_history')}</h2><div class="chips">${['all', 'bp', 'glucose', 'weight', 'meal'].map(k => `<button type="button" class="chip sm ${f === k ? 'on' : ''}" data-action="hist" data-v="${k}">${t('x_h_' + k)}</button>`).join('')}</div>
      ${all.length ? `<ul class="hlist">${all.map(row).join('')}</ul>` : `<p class="muted">${t('x_history_empty')}</p>`}</div>`;
  }
  function securityCard() {
    const enc = DB.encrypted;
    return `<div class="card" id="secSecurity"><h2>🔒 ${t('x_security')}</h2><p class="small">${enc ? '✅ ' + t('x_pin_on') : t('x_pin_off')}</p>
      ${enc ? `<div class="row gap wrap"><button class="btn sm" data-action="lock-now" id="lockNow">🔒 ${t('x_lock_now')}</button><button class="btn sm ghost" data-action="pin-off" id="pinOff">${t('x_pin_remove')}</button></div>`
        : `<div class="grid2"><div><label class="f" for="pin1">${t('x_pin_new')}</label><input class="in" id="pin1" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password"></div><div><label class="f" for="pin2">${t('x_pin_again')}</label><input class="in" id="pin2" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password"></div></div><button class="btn sm" data-action="pin-set" id="pinSet">${t('x_pin_set')}</button>`}
      <p class="tiny muted">${t('x_privacy')}</p><button class="btn sm danger" data-action="wipe" id="wipe">🗑️ ${t('x_wipe')}</button></div>`;
  }

  /* My Health › edit profile (personal info, conditions, medicines, allergies, diet) */
  function edInit() { const pr = profile(); S.ed = pr ? JSON.parse(JSON.stringify(pr)) : { name: '', conditions: [], condDetails: {}, allergies: [], medAllergies: [], restrictions: [], medList: [], gender: '', activity: 'light', goals: [], prefs: ['ethiopian'] }; S.ed.condDetails = S.ed.condDetails || {}; S.ed.medList = S.ed.medList || []; S.med = { name: '', dose: '', freq: '', medId: null, edit: null }; }
  function medSug(q) { return MD.search(q || '', 6).map(m => `<button type="button" class="chip sm" data-action="med-pick" data-id="${m.id}">${esc(L() === 'am' ? m.am : m.en)}</button>`).join(''); }
  ROUTES.profile = function () {
    if (!S.ed) edInit();
    const d = S.ed, isNew = !profile(), sel = d.conditions || [];
    const inp = (k, lab, type = 'text', extra = '') => `<label class="f" for="p_${k}">${t(lab)}</label><input class="in" id="p_${k}" data-f="${k}" type="${type}" value="${esc(d[k] == null ? '' : d[k])}" ${extra}>`;
    const med = S.med;
    return back(isNew ? '#/home' : '#/health', isNew ? t('x_setup') : t('x_edit_profile')) + `
      <div class="card"><h2>👤 ${t('x_personal')}</h2>${inp('name', 'x_name', 'text', 'maxlength="60" autocomplete="name"')}
        <div class="grid2"><div>${inp('age', 'x_age', 'number', 'inputmode="numeric" min="1" max="120"')}</div><div>${inp('dob', 'x_dob', 'date')}</div></div>
        <div class="grid2"><div>${inp('weight', 'x_weight_kg', 'number', 'inputmode="decimal" step="0.1"')}</div><div>${inp('height', 'x_height_cm', 'number', 'inputmode="decimal"')}</div></div>
        <label class="f">${t('x_sex')} (${t('x_optional')})</label><div class="chips">${['female', 'male'].map(g => chip('gender', g, t('g_' + g), d.gender === g)).join('')}</div>
        <label class="f">${t('x_glucose_unit')}</label><div class="chips">${chip('unit', 'mg', 'mg/dL', (d.unit || unit()) === 'mg')}${chip('unit', 'mmol', 'mmol/L', (d.unit || unit()) === 'mmol')}</div></div>
      <div class="card"><h2>🩺 ${t('x_conditions')}</h2><p class="small muted">${t('ob_cond_never')}</p>
        <div class="conds" id="condCards">${CONDS.map(c => `<button type="button" class="cond ${sel.includes(c) ? 'on' : ''}" data-action="chip" data-k="conditions" data-v="${c}" aria-pressed="${sel.includes(c)}"><span class="ci">${COND_I[c]}</span><span>${esc(condName(c))}</span></button>`).join('')}</div>
        ${sel.includes('other') ? `<label class="f" for="p_condOther">${t('ob_cond_other_ph')}</label><input class="in" id="p_condOther" data-cdet="other" value="${esc(d.condDetails.other || '')}" maxlength="80">` : ''}
        ${sel.includes('unsure') ? `<p class="note">${t('ob_unsure_note')}</p>` : ''}</div>
      <div class="card" id="medEditor"><h2>💊 ${t('x_meds')}</h2><p class="small muted">${t('md_q')}</p>
        <div class="chips">${chip('noMeds', '0', t('md_yes'), !d.noMeds && (d.medList.length > 0 || S.med.yes), 'id="medYes"')}${chip('noMeds', '1', t('md_no'), !!d.noMeds, 'id="noMeds"')}</div>
        ${d.noMeds ? '' : `<ul class="mlist" id="medList">${d.medList.map(m => `<li data-med="${m.id}"><div class="grow"><b>${esc(medName(m))}</b><small>${[m.dose, m.freq ? t('mf_' + m.freq) : ''].filter(Boolean).map(esc).join(' · ')}</small></div><button type="button" class="iconbtn" data-action="med-edit" data-id="${m.id}" aria-label="${t('x_edit')}">✎</button><button type="button" class="iconbtn" data-action="med-del" data-id="${m.id}" aria-label="${t('x_delete')}">✕</button></li>`).join('')}</ul>
        <div class="medform"><label class="f" for="medName">${med.edit ? '✎ ' : '＋ '}${t('md_name')}</label><input class="in" id="medName" value="${esc(med.name)}" maxlength="80" placeholder="${esc(t('md_search_ph'))}" autocomplete="off"><div class="chips sug" id="medSug">${medSug(med.name)}</div>
          <div class="grid2"><div><label class="f" for="medDose">${t('md_dose')}</label><input class="in" id="medDose" value="${esc(med.dose)}" maxlength="40" placeholder="${esc(t('md_dose_ph'))}"></div><div><label class="f" for="medFreq">${t('md_freq')}</label><select class="in" id="medFreq"><option value="">—</option>${FREQ.map(x => `<option value="${x}" ${med.freq === x ? 'selected' : ''}>${t('mf_' + x)}</option>`).join('')}</select></div></div>
          <button type="button" class="btn sm" data-action="med-add" id="medAdd">${med.edit ? t('x_save') : '＋ ' + t('md_save')}</button></div>`}
        <p class="tiny muted">🩺 ${t('md_never')}</p></div>
      <div class="card"><h2>⚠️ ${t('x_allergies')}</h2><label class="f">${t('f_allergies')}</label><div class="chips">${ALLERGY.map(a => chip('allergies', a, t('a_' + a), (d.allergies || []).includes(a))).join('')}</div>
        ${inp('allergyOther', 'f_allergy_other', 'text', 'maxlength="80"')}
        <label class="f">${t('f_med_allergies')}</label><div class="chips">${MED_ALLERGY.map(a => chip('medAllergies', a, t('ma_' + a), (d.medAllergies || []).includes(a))).join('')}</div>
        ${inp('medAllergyOther', 'f_med_allergy_other', 'text', 'maxlength="80"')}</div>
      <div class="card"><h2>🍽️ ${t('x_diet')}</h2><div class="chips">${RESTR.map(r => chip('restrictions', r, t('r_' + r), (d.restrictions || []).includes(r))).join('')}</div>${inp('fav', 'x_fav', 'text', 'maxlength="100"')}</div>
      ${isNew ? `<label class="consent"><input type="checkbox" id="pConsent"> <span>${t('x_consent')}</span></label>` : ''}
      <button class="btn block big" data-action="profile-save" id="profileSave">${t('x_save')}</button>`;
  };

  /* What Should I Eat? */
  function fastingToday(pr) { const d = new Date().getDay(); return (pr.restrictions || []).includes('fasting') && (d === 3 || d === 5); }
  function autoSlot() { const h = new Date().getHours(); return h < 10 ? 'breakfast' : h < 15 ? 'lunch' : h < 17 ? 'snack' : 'dinner'; }
  function rankDishes(slot, pr) {
    const fd = fastingToday(pr), recent = new Set(meals().filter(m => m.ts > Date.now() - 2 * DAY).flatMap(m => (m.items || []).map(i => i.foodId)));
    return DI.DISHES.filter(d => d.slots.includes(DI.SLOT[slot]) && DI.allowed(d, pr, fd)).map(d => {
      const items = DI.dishItems(d, pr), a = E.analyze(items, pr, slot), T = a.targets, x = a.totals;
      const sev = { good: 0, adjust: 1, alt: 2 }[a.verdict];
      const rank = sev * 100 + (x.na / T.na) * 30 + (x.sf / T.sf) * 15 + (E.isDiabetic(pr) ? (x.c / (T.c * 0.33)) * 25 : 0) - Math.min(x.fb, 12) * 2 + (d.items.some(i => recent.has(i[0])) ? 12 : 0);
      return { d, items, a, rank };
    }).sort((p, q) => p.rank - q.rank).slice(0, 4);
  }
  ROUTES.eat = function () {
    const pr = profile();
    if (!pr) return back('#/home', '🥗 ' + t('x_c_eat')) + `<div class="card center"><p>${t('x_eat_need')}</p><a class="btn" href="#/profile">${t('x_setup')}</a></div>`;
    const slot = S.slot || autoSlot(), list = rankDishes(slot, pr), conds = (pr.conditions || []).filter(c => !['none', 'unsure'].includes(c));
    const vcol = { good: 'green', adjust: 'yellow', alt: 'red' };
    return back('#/home', '🥗 ' + t('x_c_eat')) + `
      <p class="muted" id="eatBasis">${conds.length ? t('x_eat_based', { c: conds.map(condName).join(', ') }) : t('x_eat_general')}</p>
      <div class="seg" id="slotSeg">${['breakfast', 'lunch', 'dinner', 'snack'].map(s => `<button type="button" class="${slot === s ? 'on' : ''}" data-action="slot" data-v="${s}">${t('meal_' + s)}</button>`).join('')}</div>
      ${fastingToday(pr) ? `<p class="note">🌿 ${t('x_fasting_today')}</p>` : ''}
      <div id="dishList">${list.length ? list.map(({ d, a }, i) => {
        const good = a.why.filter(w => w.good).slice(0, 2), care = a.why.filter(w => !w.good && w.lvl > 0).slice(0, 2), info = a.why.filter(w => w.lvl === -1 && !w.good && (w.med || /KDIGO|AASLD|anemia|ደም ማነስ/i.test(w.text))).slice(0, 2);
        return `<div class="card dish" data-dish="${d.id}"><div class="row between top"><h3>${i === 0 ? '⭐ ' : ''}${esc(d.name[L()] || d.name.en)}</h3><span class="pill ${vcol[a.verdict]}">${t('x_v_' + a.verdict)}</span></div>
          <p class="tiny muted">${t('x_est')}: ~${Math.round(a.totals.kcal)} kcal · ${t('n_c')} ${Math.round(a.totals.c)} g · ${t('n_fb')} ${Math.round(a.totals.fb)} g · ${t('n_na')} ${Math.round(a.totals.na)} mg</p>
          <ul class="why">${good.map(w => `<li class="good">✓ ${esc(w.text)}</li>`).join('')}${care.map(w => `<li class="care">• ${esc(w.text)}</li>`).join('')}${info.map(w => `<li class="info">ℹ️ ${esc(w.text)}</li>`).join('')}</ul>
          ${a.tips.length ? `<p class="small"><b>${t('x_tip')}:</b> ${esc(a.tips[0])}</p>` : ''}</div>`; }).join('') : `<div class="card"><p>${t('x_eat_none')}</p></div>`}</div>
      <div class="card plate"><h2>🍽️ ${t('x_plate')}</h2><p>${t('x_plate_d')}</p><p class="tiny muted">${t('x_plate_src')}</p></div>
      <p class="disc">${t('x_eat_disc')}</p>`;
  };

  /* Reminders */
  const remOnDay = (r, d = new Date()) => r.on !== false && (r.date ? r.date === dayKey(d) : (!r.days || !r.days.length || r.days.includes(d.getDay())));
  const remTitle = r => (r.title || (r.oldKind && r.oldKind !== r.kind ? t('x_old_' + r.oldKind) : t('x_rk_' + r.kind))) + (r.forWho ? ' (' + r.forWho + ')' : '');
  const RI = { medicine: '💊', checkup: '🩺', goal: '🎯' };
  function nextReminder() { const now = hm(new Date()); const r = rems().filter(x => remOnDay(x) && x.doneDay !== today() && (x.time || '') >= now).sort((a, b) => a.time.localeCompare(b.time))[0]; return r ? { time: r.time, title: remTitle(r) } : null; }
  function notifState() { return !('Notification' in window) ? 'unsupported' : Notification.permission; }
  function suggestedGoals(pr) {
    const out = [['water', '💧'], ['veg', '🥬']];
    if (pr) { if (E.has(pr, 'htn') || E.has(pr, 'heart')) out.push(['bp', '❤️']); if (E.isDiabetic(pr)) out.push(['sugar', '🩸']); if ((pr.medList || []).length) out.push(['meds', '💊']); out.push([E.has(pr, 'heart') || E.age(pr) >= 65 ? 'walk_gentle' : 'walk', '🚶']); }
    else out.push(['walk', '🚶']);
    const have = new Set(rems().filter(r => r.kind === 'goal').map(r => r.sug));
    return out.filter(([k]) => !have.has(k));
  }
  function remRow(r) {
    const done = r.doneDay === today();
    return `<div class="rrow ${done ? 'done' : ''}" data-rem="${r.id}"><span class="ri">${RI[r.kind] || '⏰'}</span><div class="grow"><b>${esc(remTitle(r))}</b><small>${esc(r.time || '')}</small></div>${done ? `<span class="pill green">✓ ${t('x_done')}</span>` : `<button class="btn sm soft" data-action="rem-done" data-id="${r.id}">${t('x_mark_done')}</button>`}</div>`;
  }
  ROUTES.reminders = function () {
    const pr = profile(), ns = notifState(), all = rems(), f = S.rem, td = all.filter(r => remOnDay(r) && r.kind !== 'goal').sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    const goals = all.filter(r => r.kind === 'goal' && remOnDay(r)), sugg = suggestedGoals(pr);
    const meds = pr ? pr.medList || [] : [];
    return back('#/home', '⏰ ' + t('x_c_rem')) + `
      <div class="card" id="notifCard"><div class="row between"><div><b>🔔 ${t('x_notif')}</b><div class="small muted" id="notifState">${t('x_n_' + ns)}</div></div>
        ${ns === 'default' ? `<button class="btn sm" data-action="notif-allow" id="notifAllow">${t('x_allow')}</button>` : ns === 'granted' ? `<button class="btn sm ghost" data-action="notif-test" id="notifTest">${t('x_test')}</button>` : ''}</div><p class="tiny muted">${t('x_notif_honest')}</p></div>
      <h2>📅 ${t('x_today')}</h2><div class="card tight" id="remToday">${td.length ? td.map(remRow).join('') : `<p class="muted">${t('x_rem_none_today')}</p>`}</div>
      <h2>🎯 ${t('x_goals')}</h2><div class="card tight" id="goals">${goals.length ? goals.map(r => `<label class="goal ${r.doneDay === today() ? 'done' : ''}" data-rem="${r.id}"><input type="checkbox" data-change="goal-check" data-id="${r.id}" ${r.doneDay === today() ? 'checked' : ''}><span>${esc(remTitle(r))}${r.time ? ` <small class="muted">${esc(r.time)}</small>` : ''}</span></label>`).join('') + `<p class="small muted" id="goalCount">${t('x_goals_done', { n: goals.filter(r => r.doneDay === today()).length, t: goals.length })}</p>` : `<p class="muted">${t('x_goals_none')}</p>`}
        ${sugg.length ? `<p class="small"><b>${t('x_goal_sug')}</b></p><div class="chips" id="goalSug">${sugg.map(([k, i]) => `<button type="button" class="chip" data-action="goal-add" data-v="${k}">${i} ${t('x_g_' + k)}</button>`).join('')}</div>` : ''}</div>
      <div class="card" id="remForm"><h2>＋ ${t('x_rem_add')}</h2>
        <div class="seg" id="remKind">${['medicine', 'checkup', 'goal'].map(k => `<button type="button" class="${f.kind === k ? 'on' : ''}" data-action="rem-kind" data-v="${k}">${RI[k]} ${t('x_rk_' + k)}</button>`).join('')}</div>
        ${f.kind === 'medicine' && meds.length ? `<div class="chips" id="remMeds" style="margin-top:10px">${meds.map(m => `<button type="button" class="chip sm" data-action="rem-med" data-v="${esc(medName(m) + (m.dose ? ' ' + m.dose : ''))}">💊 ${esc(medName(m))}</button>`).join('')}</div>` : ''}
        <label class="f" for="remTitle">${t('x_rem_what')}</label><input class="in" id="remTitle" maxlength="80" value="${esc(f.title || '')}" placeholder="${esc(t('x_rk_ph_' + f.kind))}">
        <div class="grid2"><div><label class="f" for="remTime">${t('x_time')}</label><input class="in" id="remTime" type="time" value="${esc(f.time || '08:00')}"></div>
          <div><label class="f" for="remRepeat">${t('x_repeat')}</label><select class="in" id="remRepeat">${['daily', 'days', 'once'].map(x => `<option value="${x}" ${f.repeat === x ? 'selected' : ''}>${t('x_r_' + x)}</option>`).join('')}</select></div></div>
        ${f.repeat === 'days' ? `<div class="chips" id="remDays" style="margin-top:8px">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button type="button" class="chip sm ${f.days.includes(d) ? 'on' : ''}" data-action="rem-day" data-v="${d}">${t('x_dow_' + d)}</button>`).join('')}</div>` : ''}
        ${f.repeat === 'once' ? `<label class="f" for="remDate">${t('x_date')}</label><input class="in" id="remDate" type="date" value="${esc(f.date || today())}">` : ''}
        ${f.kind === 'medicine' ? `<p class="tiny muted">💊 ${t('x_rem_med_note')}</p>` : ''}
        <button class="btn block" data-action="rem-save" id="remSave">${t('x_save')}</button></div>
      <h2>🗂️ ${t('x_rem_all')}</h2><div class="card tight" id="remAll">${all.length ? all.map(r => `<div class="rrow" data-rem="${r.id}"><span class="ri">${RI[r.kind] || '⏰'}</span><div class="grow"><b>${esc(remTitle(r))}</b><small>${esc(r.time || '')} · ${r.date ? esc(r.date) : r.days && r.days.length ? r.days.map(d => t('x_dow_' + d)).join(' ') : t('x_r_daily')}</small></div>
        <label class="switch"><input type="checkbox" data-change="rem-on" data-id="${r.id}" ${r.on !== false ? 'checked' : ''} aria-label="${t('x_on')}"><span></span></label><button class="iconbtn" data-action="rem-del" data-id="${r.id}" aria-label="${t('x_delete')}">✕</button></div>`).join('') : `<p class="muted">${t('x_rem_empty')}</p>`}</div>`;
  };
  async function notify(title, body) {
    if (notifState() !== 'granted') return false;
    try { const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); if (reg && reg.showNotification) { await reg.showNotification(title, { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'nola-' + Date.now() }); return true; } } catch (e) {}
    try { new Notification(title, { body, icon: 'icons/icon-192.png' }); return true; } catch (e) { return false; }
  }
  function checkReminders() {
    if (DB.locked) return;
    const now = new Date(), nowHm = hm(now), list = rems(); let changed = false;
    list.forEach(r => {
      if (!remOnDay(r, now) || !r.time || r.firedDay === today() || r.doneDay === today() || r.time > nowHm) return;
      const [h, m] = r.time.split(':').map(Number), due = new Date(now); due.setHours(h, m, 0, 0);
      if (now - due > 2 * 3600e3) return;
      r.firedDay = today(); changed = true;
      notify('NOLA HEALTH · ' + remTitle(r), t('x_rem_due', { time: r.time }));
      const box = $('#remAlert'); box.innerHTML = `<div class="remalert" role="alert"><span class="ri">${RI[r.kind] || '⏰'}</span><div class="grow"><b>${esc(remTitle(r))}</b><small>${t('x_rem_due', { time: r.time })}</small></div><button class="btn sm" data-action="rem-done" data-id="${r.id}" id="remAlertDone">${t('x_mark_done')}</button><button class="iconbtn" data-action="remalert-close" aria-label="${t('x_close')}">✕</button></div>`; box.hidden = false;
    });
    if (changed) DB.set('reminders', list);
  }

  /* Scan Food */
  const POPULAR = ['injera_teff', 'shiro', 'misir', 'gomen', 'tibs', 'doro_wot', 'ful', 'kitfo', 'firfir', 'rice', 'pasta', 'selata'];
  const foodChips = list => list.map(f => `<button type="button" class="chip" data-action="food-add" data-id="${f.id}">＋ ${esc(f.name[L()] || f.name.en)}</button>`).join('') || `<span class="muted small">${t('x_no_match')}</span>`;
  ROUTES.scan = function () {
    const sc = S.scan, ai = AI.enabled();
    if (sc.result) return scanResult();
    const meal = sc.meal || autoSlot(), q = S.q || '';
    const res = q ? F.search(q).slice(0, 8) : POPULAR.map(id => F.byId[id]).filter(Boolean);
    return back('#/home', '📷 ' + t('x_c_scan')) + `
      <div class="card" id="photoCard">${sc.photo ? `<img class="preview" id="scanPreview" src="${sc.photo}" alt="${t('x_photo')}">` : `<div class="ph-empty"><span>📷</span><p>${t('x_scan_intro')}</p></div>`}
        <div class="row gap wrap"><label class="btn grow"><input type="file" accept="image/*" capture="environment" id="camIn" hidden>📸 ${t('x_take')}</label><label class="btn ghost grow"><input type="file" accept="image/*" id="upIn" hidden>🖼️ ${t('x_upload')}</label></div>
        ${sc.photo ? (ai ? `<button class="btn block soft" data-action="scan-ai" id="scanAi">✨ ${t('x_scan_ai')}</button>` : `<p class="note" id="noAiNote">${t('x_scan_noai')}</p>`) : ''}</div>
      <div class="card" id="pickCard"><h2>🍲 ${t('x_foods_in_meal')}</h2>
        ${sc.items.length ? `<ul class="items" id="items">${sc.items.map((it, i) => { const fd = it.foodId && F.byId[it.foodId]; return `<li data-item="${i}"><div class="grow"><b>${esc(fd ? fd.name[L()] || fd.name.en : it.name)}</b>${it.conf != null ? ` <span class="pill grey">${t('x_ai_est')} ${Math.round(it.conf * 100)}%</span>` : ''}<small>${fd ? esc(fd.base[L()] || fd.base.en) : t('x_ai_custom')}</small>
          <div class="seg sm">${[0.5, 1, 1.5, 2].map(m => `<button type="button" class="${+it.mult === m ? 'on' : ''}" data-action="item-mult" data-i="${i}" data-v="${m}">${m === 0.5 ? '½' : m === 1.5 ? '1½' : m}×</button>`).join('')}</div></div><button class="iconbtn" data-action="item-del" data-i="${i}" aria-label="${t('x_delete')}">✕</button></li>`; }).join('')}</ul>` : `<p class="muted">${t('x_no_items')}</p>`}
        <label class="f" for="foodSearch">🔎 ${t('x_food_search')}</label><input class="in" id="foodSearch" value="${esc(q)}" placeholder="${t('x_food_search_ph')}" autocomplete="off">
        <div class="chips" id="foodRes">${foodChips(res)}</div>
        <label class="f">${t('x_meal')}</label><div class="seg" id="mealSeg">${['breakfast', 'lunch', 'dinner', 'snack'].map(s => `<button type="button" class="${meal === s ? 'on' : ''}" data-action="scan-meal" data-v="${s}">${t('meal_' + s)}</button>`).join('')}</div>
        <button class="btn block big" data-action="scan-go" id="scanGo" ${sc.items.length ? '' : 'disabled'}>${t('x_get_advice')}</button>
        ${profile() ? '' : `<p class="tiny muted">${t('x_scan_noprofile')}</p>`}</div>`;
  };
  function scanResult() {
    const { a } = S.scan.result, x = a.totals, col = { good: 'green', adjust: 'yellow', alt: 'red' }[a.verdict];
    const rows = [['kcal', 'kcal'], ['c', 'g'], ['p', 'g'], ['f', 'g'], ['sf', 'g'], ['fb', 'g'], ['as', 'g'], ['na', 'mg']];
    return back('#/home', '📷 ' + t('x_c_scan')) + `
      <div class="verdict ${col}" id="verdict"><b>${{ green: '🟢', yellow: '🟡', red: '🔴' }[col]} ${t('verdict_' + a.verdict)}</b><p>${t('verdict_' + a.verdict + '_d')}</p></div>
      ${a.allergy.length ? `<div class="note red">⚠️ ${esc(t('a_allergy', { items: a.allergy.join(', ') }))}</div>` : ''}
      <div class="card" id="nutri"><h2>📊 ${t('x_nutrition')} <small class="muted">(${t('x_estimate')})</small></h2><table class="nt">${rows.map(([k, u]) => `<tr><td>${t('n_' + k)}</td><td><b>${k === 'sf' ? E.r(x[k], 1) : Math.round(x[k])} ${u}</b></td></tr>`).join('')}</table><p class="tiny muted">${t('x_nutri_src')}</p></div>
      <div class="card" id="advice"><h2>💬 ${t('x_advice')}</h2><ul class="why">${a.why.map(w => `<li class="${w.good ? 'good' : w.lvl > 0 ? 'care' : 'info'}">${w.good ? '✓' : w.lvl > 0 ? '•' : 'ℹ️'} ${esc(w.text)}</li>`).join('')}</ul>
        ${a.tips.length ? `<h3>${t('x_tips')}</h3><ul>${a.tips.map(x2 => `<li>${esc(x2)}</li>`).join('')}</ul>` : ''}${a.alts.length ? `<h3>${t('x_alts')}</h3><ul>${a.alts.map(x2 => `<li>${esc(x2)}</li>`).join('')}</ul>` : ''}</div>
      <p class="disc">${t('x_not_dx')}</p>
      <div class="row gap"><button class="btn grow" data-action="scan-save" id="scanSave" ${S.scan.saved ? 'disabled' : ''}>${S.scan.saved ? '✓ ' + t('x_saved') : '💾 ' + t('x_save_history')}</button><button class="btn ghost grow" data-action="scan-new" id="scanNew">📷 ${t('x_new_scan')}</button></div>`;
  }

  /* Nolaa AI Doctor */
  const chatList = () => DB.get('doctorChat', []) || [];
  ROUTES.doctor = function () {
    const ai = AI.enabled(), c = AI.cfg(), list = chatList();
    return `<div class="pagehead"><h1>🩺 ${t('x_nav_doctor')}</h1><button class="iconbtn" data-action="ai-gear" id="aiGear" aria-label="${t('x_ai_settings')}" aria-expanded="${S.showAi}">⚙️</button>${list.length ? `<button class="iconbtn" data-action="chat-clear" id="chatClear" aria-label="${t('x_clear')}">🗑️</button>` : ''}</div>
      <p class="small ${ai ? 'ok-t' : 'muted'}" id="aiStatus">${ai ? '✨ ' + t('x_ai_on') : 'ℹ️ ' + t('x_ai_off')}</p>
      ${S.showAi ? `<div class="card" id="aiPanel"><h2>⚙️ ${t('x_ai_settings')}</h2><p class="small">${t('x_ai_need')}</p>
        <label class="f" for="aiBase">${t('x_ai_base')}</label><input class="in" id="aiBase" value="${esc(c.base)}" placeholder="https://api.openai.com/v1" autocomplete="off">
        <label class="f" for="aiKey">${t('x_ai_key')}</label><input class="in" id="aiKey" type="password" value="${esc(c.key)}" placeholder="sk-…" autocomplete="off">
        <label class="f" for="aiModel">${t('x_ai_model')}</label><input class="in" id="aiModel" value="${esc(c.model)}" placeholder="gpt-4o-mini" autocomplete="off">
        <div class="row gap wrap"><button class="btn sm" data-action="ai-save" id="saveAi">${t('x_save')}</button><button class="btn sm ghost" data-action="ai-test" id="testAi">${t('x_test')}</button><button class="btn sm ghost" data-action="ai-remove" id="removeAi">${t('x_ai_remove')}</button></div>
        <p class="tiny muted" id="aiTestOut">${t('x_ai_privacy')}</p></div>` : ''}
      <p class="disc">${t('x_doc_disc')} <a href="tel:907">907</a></p>
      <div id="chat" class="chat" aria-live="polite">${list.length ? list.map(m => `<div class="msg ${m.role}">${m.img ? `<img src="${m.img}" alt="">` : ''}${m.role === 'bot' ? md(m.text) : `<p>${esc(m.text)}</p>`}${m.src && m.src.length ? `<small class="src">${t('x_sources')}: ${m.src.map(esc).join(' · ')}</small>` : ''}</div>`).join('') : `<div class="msg bot intro">${md(t('x_doc_hello'))}</div>`}${S.busy ? `<div class="msg bot typing">…</div>` : ''}</div>
      ${list.length ? '' : `<div class="chips" id="chatSug">${['x_q1', 'x_q2', 'x_q3', 'x_q4'].map(k => `<button type="button" class="chip" data-action="ask" data-q="${esc(t(k))}">${t(k)}</button>`).join('')}</div>`}
      <form class="chatbar" id="chatForm" autocomplete="off"><label class="iconbtn lab" title="${t('x_lab_photo')}"><input type="file" accept="image/*" id="labFile" hidden aria-label="${t('x_lab_photo')}">📄</label><textarea class="in" id="chatIn" rows="1" placeholder="${t('x_chat_ph')}" maxlength="2000" aria-label="${t('x_chat_ph')}"></textarea><button class="btn" id="chatSend" type="submit" aria-label="${t('x_send')}">➤</button></form>`;
  };
  const SCOPE = /health|sick|\bill\b|pain|ache|hurt|fever|cough|cold|flu|dizz|tired|fatigue|weak|sleep|stress|anxi|depress|mood|headache|migraine|nause|vomit|diarr|constipat|stomach|bloat|heartburn|ulcer|rash|skin|itch|swell|breath|asthma|chest|heart|blood|pressure|\bbp\b|sugar|glucose|diabet|insulin|cholesterol|\bldl\b|\bhdl\b|triglycer|kidney|liver|anemi|iron|vitamin|pregnan|period|menstru|weight|\bbmi\b|obes|diet|\beat|food|meal|drink|water|fruit|vegetable|injera|shiro|teff|misir|coffee|buna|\btea\b|alcohol|beer|\btej\b|salt|\bfat\b|\boil\b|protein|carb|fiber|calori|nutri|fasting|tsom|breakfast|lunch|dinner|snack|medic|medicine|\bdrug|pill|tablet|\bdose|pharmac|doctor|clinic|hospital|nurse|\btest|\blab\b|result|report|hba1c|\ba1c\b|creatinine|egfr|hemoglobin|haemoglobin|symptom|infection|allerg|exercise|\bwalk|activity|smok|ጤና|ህመም|ያመኛል|ራስ|ትኩሳት|ሳል|ድካም|እንቅልፍ|ግፊት|ስኳር|ደም|ልብ|ኩላሊት|ጉበት|ክብደት|ምግብ|መብላት|ልብላ|እንጀራ|ሽሮ|ውሃ|ቡና|ሻይ|አልኮል|ጨው|ዘይት|ቅቤ|ጾም|መድሃኒት|መድኃኒት|ኪኒን|ሐኪም|ሆስፒታል|ምርመራ|ውጤት|ላብራቶሪ|እርግዝና|ቁርስ|ምሳ|እራት|አለርጂ|እንቅስቃሴ/i;
  const OFFTOPIC = /football|soccer|\bmatch\b|movie|film|song|lyrics|music|politic|election|president|bitcoin|crypto|stock market|weather|\bjoke|programming|\bcode\b|javascript|python|homework|capital of|who won|celebrity|ኳስ|ፊልም|ዘፈን|ፖለቲካ|ምርጫ/i;
  function inScope(q) { return SCOPE.test(q) || CO.detect(q) !== 'default' || !!MD.find(q); }
  const LAB = [
    ['hba1c', /(hba1c|\ba1c\b|glycated)[^\d]{0,15}(\d{1,2}(?:\.\d)?)/i], ['fbs', /(fasting (blood )?(sugar|glucose)|\bfbs\b|\bfbg\b)[^\d]{0,15}(\d{2,3}(?:\.\d)?)/i],
    ['ldl', /\bldl\b[^\d]{0,15}(\d{2,3})/i], ['hdl', /\bhdl\b[^\d]{0,15}(\d{2,3})/i], ['tc', /total cholesterol[^\d]{0,15}(\d{2,3})/i], ['tg', /(triglycerides?|\btg\b)[^\d]{0,15}(\d{2,4})/i],
    ['egfr', /\begfr\b[^\d]{0,15}(\d{1,3})/i], ['hb', /(hemoglobin|haemoglobin|\bhgb\b|\bhb\b)(?!a1c)[^\d]{0,15}(\d{1,2}(?:\.\d)?)/i],
  ];
  function labLines(q, pr) {
    const out = [], fem = pr && pr.gender === 'female';
    LAB.forEach(([k, re]) => { const m = q.match(re); if (!m) return; const v = parseFloat(m[m.length - 1]);
      const band = k === 'hba1c' ? (v < 5.7 ? 'hba1c_n' : v < 6.5 ? 'hba1c_p' : 'hba1c_d') : k === 'fbs' ? (v < 100 ? 'fbs_n' : v < 126 ? 'fbs_p' : 'fbs_d')
        : k === 'ldl' ? (v < 100 ? 'ldl_n' : v < 160 ? 'ldl_b' : 'ldl_h') : k === 'hdl' ? (v < (fem ? 50 : 40) ? 'hdl_l' : 'hdl_n') : k === 'tc' ? (v < 200 ? 'tc_n' : v < 240 ? 'tc_b' : 'tc_h')
        : k === 'tg' ? (v < 150 ? 'tg_n' : v < 200 ? 'tg_b' : 'tg_h') : k === 'egfr' ? (v >= 90 ? 'egfr_n' : v >= 60 ? 'egfr_m' : 'egfr_l') : (v < (fem ? 12 : 13) ? 'hb_l' : 'hb_n');
      out.push('• ' + t('x_lab_' + band, { v })); });
    if (out.length) { out.unshift('**' + t('x_lab_title') + '**'); out.push(t('x_lab_end')); }
    return out;
  }
  function myReadingLines(q) {
    const out = [], last = ty => readings().filter(r => r.type === ty).reverse().sort((a, b) => b.ts - a.ts)[0];
    if (/blood pressure|\bbp\b|ግፊት/i.test(q)) { const r = last('bp'); if (r) { const b = r.sys >= 180 || r.dia >= 120 ? 'crisis' : r.sys >= 140 || r.dia >= 90 ? 's2' : r.sys >= 130 || r.dia >= 80 ? 's1' : r.sys >= 120 ? 'el' : 'n'; out.push('**' + t('x_my_bp', { v: r.sys + '/' + r.dia, d: fdate(r.ts) }) + '** ' + t('x_bp_' + b)); } }
    if (/sugar|glucose|ስኳር/i.test(q)) { const r = last('glucose'); if (r) { const f = r.ctx === 'fasting', b = f ? (r.mg < 70 ? 'low' : r.mg < 100 ? 'n' : r.mg < 126 ? 'p' : 'h') : (r.mg < 70 ? 'low' : r.mg < 140 ? 'n' : r.mg < 200 ? 'p' : 'h'); out.push('**' + t('x_my_g', { v: fmtG(r.mg), c: t('ctx_' + (r.ctx || 'random')), d: fdate(r.ts) }) + '** ' + t('x_g' + (f ? 'f' : 'r') + '_' + b)); } }
    if (out.length) out.push(t('x_my_end'));
    return out;
  }
  function doctorSystem(pr) {
    const T = E.targets(pr), base = AI.coachSystem(pr, T, L());
    const rs = readings().slice().sort((a, b) => b.ts - a.ts).slice(0, 6).map(r => (r.type === 'bp' ? `BP ${r.sys}/${r.dia}` : r.type === 'glucose' ? `glucose ${r.mg} mg/dL (${r.ctx || 'random'})` : `weight ${r.kg} kg`) + ' on ' + dayKey(r.ts)).join('; ') || 'none';
    return base + `
ROLE: You are "Nolaa AI Doctor" inside NOLA HEALTH — a health information assistant, NOT a real doctor. SCOPE: answer ONLY questions about health, symptoms, food, nutrition, medicines and laboratory reports. For anything else, politely decline in one short sentence and say what you can help with.
Never diagnose a disease, never prescribe or recommend starting/stopping/changing a medicine or dose, never guarantee recovery, never invent lab values, never tell the user to ignore their doctor. For symptoms: explain possible general causes in plain words, give safe self-care, and say clearly when to see a doctor and when to seek urgent care (call 907).
For lab reports: explain each value in simple words versus the reference range printed on the report (or standard ranges: ADA, AHA/NCEP, KDIGO, WHO), without diagnosing; suggest discussing results with their doctor.
RECENT READINGS: ${rs}.`;
  }
  const DEFAULT_PR = { name: '', conditions: [], age: 40, weight: 70, height: 170, medList: [], goals: [], restrictions: [], allergies: [] };
  async function ask(q, img) {
    q = String(q || '').trim(); if ((!q && !img) || S.busy) return;
    const pr = profile() || DEFAULT_PR, list = chatList();
    list.push({ role: 'user', text: q || t('x_lab_photo'), img: img || null, ts: Date.now() });
    DB.set('doctorChat', list.slice(-60)); S.busy = true; if (location.hash.startsWith('#/doctor')) { rerender(); scrollChat(); }
    let reply = '', src = [];
    const flag = q ? E.checkText(q, unit()) : null;
    try {
      if (flag) { reply = ['🚨 **' + t('rf_title') + '**'].concat(flag.keys.map(k => t(k, { v: flag.v }))).concat([t('rf_numbers')]).join('\n'); showAlert(flag); }
      else if (img) {
        if (!AI.enabled()) reply = t('x_lab_need_ai');
        else reply = await AI.chat([{ role: 'system', content: doctorSystem(pr) }, { role: 'user', content: [{ type: 'text', text: 'Please explain this laboratory report in simple words for me. Read only what is clearly visible; if a value is unreadable, say so. Do not diagnose. ' + q + ' Reply in ' + (L() === 'am' ? 'Amharic' : 'English') + '.' }, { type: 'image_url', image_url: { url: img } }] }], { max_tokens: 900, timeout: 60000 });
      } else if (!inScope(q) && (!AI.enabled() || OFFTOPIC.test(q))) reply = t('x_offtopic');
      else if (AI.enabled()) {
        const hist = list.slice(-9, -1).filter(m => !m.img).map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }));
        reply = await AI.chat([{ role: 'system', content: doctorSystem(pr) }].concat(hist, [{ role: 'user', content: q }]));
      } else {
        const lab = labLines(q, pr), mine = myReadingLines(q);
        if (mine.length && !lab.length) { const a = CO.answer(q, pr, L()); reply = mine.join('\n') + '\n' + a.text + '\n' + t('x_offline_note'); src = ['AHA/ACC 2017', 'ADA 2025'].concat(a.sources || []); }
        else if (lab.length) { reply = lab.join('\n'); src = ['ADA 2025', 'AHA/ACC 2018', 'KDIGO 2024', 'WHO']; }
        else { const a = CO.answer(q, pr, L()); reply = a.text + '\n' + t('x_offline_note'); src = a.sources || []; }
      }
    } catch (e) {
      const lab = q ? labLines(q, pr) : [], a = lab.length ? { text: lab.join('\n'), sources: [] } : q ? CO.answer(q, pr, L()) : { text: t('x_lab_need_ai'), sources: [] };
      reply = '⚠️ ' + t('x_ai_failed', { e: String(e.message || e).slice(0, 80) }) + '\n' + a.text; src = a.sources || [];
    }
    const l2 = chatList(); l2.push({ role: 'bot', text: reply, src, ts: Date.now() }); DB.set('doctorChat', l2.slice(-60));
    S.busy = false; if (location.hash.startsWith('#/doctor')) { rerender(); scrollChat(); }
  }
  function scrollChat() { setTimeout(() => { const c = $('#chat'); if (c && c.lastElementChild) c.lastElementChild.scrollIntoView({ block: 'end' }); }, 30); }

  /* About */
  ROUTES.about = function () {
    return `<div class="pagehead"><h1>ℹ️ ${t('x_nav_about')}</h1></div>
      <div class="card about-hero"><img src="icons/icon.svg" alt="" width="64" height="64"><div><h2>NOLA HEALTH</h2><p>${t('x_tagline')}</p></div></div>
      <div class="card" id="aboutText"><h2>${t('x_about_what_t')}</h2><p>${t('x_about_what')}</p><h2>${t('x_about_mission_t')}</h2><p>${t('x_about_mission')}</p>
        <h2>${t('x_about_safe_t')}</h2><ul><li>${t('x_about_safe1')}</li><li>${t('x_about_safe2')}</li><li>${t('x_about_safe3')}</li></ul>
        <h2>${t('x_about_priv_t')}</h2><p>${t('x_about_priv')}</p><p class="tiny muted">${t('x_about_src')} · v${VERSION}</p></div>`;
  };

  /* Lock screen (secure login) */
  function lockScreen() {
    return `<div class="lock"><img src="icons/icon.svg" alt="" width="72" height="72"><h1>NOLA HEALTH</h1><p class="muted">${t('x_tagline')}</p>
      <div class="card"><label class="f" for="lockPin">🔒 ${t('x_enter_pin')}</label><input class="in big center" id="lockPin" type="password" inputmode="numeric" maxlength="8" autocomplete="current-password">
      <button class="btn block big" data-action="unlock" id="unlockBtn">${t('x_unlock')}</button><p class="small red-t" id="lockErr" hidden>${t('x_pin_wrong')}</p>
      <button class="link" data-action="lock-forgot" id="lockForgot">${t('x_forgot')}</button></div></div>`;
  }

  /* ---------- router ---------- */
  const TITLES = { home: 'x_nav_home', health: 'x_c_health', profile: 'x_c_health', eat: 'x_c_eat', reminders: 'x_c_rem', scan: 'x_c_scan', doctor: 'x_nav_doctor', about: 'x_nav_about' };
  function route() {
    const raw = (location.hash || '#/home').slice(2), name = raw.split('?')[0] || 'home';
    const view = $('#view'), nav = $('#mainnav');
    if (DB.locked) { document.body.classList.add('locked'); nav.hidden = true; view.innerHTML = lockScreen(); setTimeout(() => { const i = $('#lockPin'); if (i) i.focus(); }, 50); return; }
    document.body.classList.remove('locked'); nav.hidden = false;
    if (!ROUTES[name]) { location.replace('#/home'); return; }
    if (name === 'profile' && S.lastRoute !== 'profile') edInit();
    if (name !== 'scan' && S.lastRoute === 'scan' && S.scan.result) S.scan = { photo: null, items: [], meal: null, result: null, saved: false };
    view.innerHTML = ROUTES[name]();
    document.body.dataset.route = name;
    $$('#mainnav a').forEach(a => { const on = a.dataset.nav === SECTION[name]; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    if (S.lastRoute !== name) { window.scrollTo(0, 0); view.focus({ preventScroll: true }); }
    S.lastRoute = name;
    document.title = 'NOLA HEALTH · ' + t(TITLES[name]);
  }
  function rerender() { const y = window.scrollY; route(); window.scrollTo(0, y); }
  function applyLang() { $$('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); }); $('#langBtn').textContent = L() === 'am' ? 'English' : 'አማርኛ'; $('#langBtn').setAttribute('aria-label', t('x_lang_label')); document.documentElement.lang = L(); }
  function setLang(l) { I18N.set(l); DB.ui({ lang: l }); applyLang(); rerender(); }

  /* ---------- actions ---------- */
  function keepRem() { const f = S.rem; [['title', 'remTitle'], ['time', 'remTime'], ['repeat', 'remRepeat'], ['date', 'remDate']].forEach(([k, id]) => { const e = $('#' + id); if (e) f[k] = e.value; }); }
  function addMed(quiet) {
    const f = S.med, name = (f.name || '').trim(); if (!name) { if (!quiet) toast(t('md_need_name')); return false; }
    const d = S.ed, picked = f.medId && MD.byId[f.medId], same = picked && [picked.en, picked.am].some(x => x.toLowerCase() === name.toLowerCase());
    const ref = same ? picked : MD.find(name), id = f.edit || uid();
    const m = { id, medId: ref ? ref.id : null, name: same ? ref.en : name, dose: (f.dose || '').trim(), freq: f.freq || '', reason: '' };
    d.medList = f.edit ? d.medList.map(x => x.id === id ? Object.assign({}, x, m) : x) : d.medList.concat([m]); d.noMeds = false;
    S.med = { name: '', dose: '', freq: '', medId: null, edit: null, yes: true };
    if (!quiet) { toast('✓ ' + t('md_saved')); rerender(); }
    return true;
  }
  function saveReading() {
    const ed = S.rdEdit && readings().find(r => r.id === S.rdEdit), type = ed ? ed.type : S.rd.type;
    const ts = new Date($('#rdWhen').value).getTime();
    if (!(ts > 0) || ts > Date.now() + 5 * 60e3) return toast(t('x_bad_date'));
    let r, flag = null;
    if (type === 'bp') { const s = +$('#rdSys').value, d = +$('#rdDia').value, p = +$('#rdPulse').value; if (!(s >= 60 && s <= 260 && d >= 30 && d <= 180)) return toast(t('x_bad_value')); r = { sys: s, dia: d, pulse: p || null }; flag = E.checkBP(s, d); }
    if (type === 'glucose') { const v = parseFloat($('#rdG').value), mg = Math.round(E.toMgdl(v, unit())); if (!(mg >= 15 && mg <= 700)) return toast(t('x_bad_value')); r = { mg, ctx: $('#rdCtx').value }; flag = E.checkGlucose(mg, unit()); S.rd.ctx = r.ctx; }
    if (type === 'weight') { const w = parseFloat($('#rdW').value); if (!(w >= 20 && w <= 300)) return toast(t('x_bad_value')); r = { kg: w }; }
    r.note = ($('#rdNote').value || '').trim(); r.ts = ts;
    let list = readings();
    if (ed) list = list.map(x => x.id === ed.id ? Object.assign({}, x, r) : x); else list = list.concat([Object.assign({ id: uid(), type }, r)]);
    DB.set('readings', list);
    if (type === 'weight') { const latest = list.filter(x => x.type === 'weight').sort((a, b) => b.ts - a.ts)[0]; const pr = profile(); if (pr && latest) { pr.weight = latest.kg; DB.set('profile', pr); } }
    S.rdEdit = null; S.rd.when = null; toast('✓ ' + t('x_reading_saved')); rerender();
    if (flag) setTimeout(() => showAlert(flag), 200);
  }
  const A = {
    'toggle-lang'() { setLang(L() === 'am' ? 'en' : 'am'); },
    'alert-close'() { $('#alert').hidden = true; },
    'remalert-close'() { $('#remAlert').hidden = true; },
    chip(el) {
      const { k, v } = el.dataset, d = S.ed; if (!d) return;
      if (k === 'gender') d.gender = d.gender === v ? '' : v;
      else if (k === 'unit') d.unit = v;
      else if (k === 'noMeds') { if (v === '1') { if (d.medList.length && !confirm(t('md_no_confirm'))) return; d.noMeds = true; d.medList = []; } else { d.noMeds = false; S.med.yes = true; } }
      else { let arr = d[k] || []; arr = arr.includes(v) ? arr.filter(x => x !== v) : arr.concat([v]); if (k === 'conditions') arr = v === 'none' ? (arr.includes('none') ? ['none'] : []) : arr.filter(x => x !== 'none'); d[k] = arr; }
      rerender();
    },
    'med-pick'(el) { const m = MD.byId[el.dataset.id]; if (!m) return; S.med.medId = m.id; S.med.name = L() === 'am' ? m.am : m.en; const i = $('#medName'); if (i) i.value = S.med.name; const dd = $('#medDose'); if (dd) dd.focus(); },
    'med-add'() { addMed(false); },
    'med-edit'(el) { const m = S.ed.medList.find(x => x.id === el.dataset.id); if (!m) return; S.med = { edit: m.id, medId: m.medId, name: medName(m), dose: m.dose || '', freq: m.freq || '', yes: true }; rerender(); setTimeout(() => { const i = $('#medName'); if (i) i.focus(); }, 30); },
    'med-del'(el) { S.ed.medList = S.ed.medList.filter(x => x.id !== el.dataset.id); rerender(); },
    'profile-save'() {
      addMed(true);
      const d = S.ed; ['weight', 'height', 'age'].forEach(k => { if (d[k] !== '' && d[k] != null) d[k] = +d[k]; });
      if (d.dob) d.age = E.age(d);
      if (!String(d.name || '').trim()) return toast(t('x_need_name'));
      if (!(d.age > 0) || !(d.weight > 0) || !(d.height > 0)) return toast(t('x_need_body'));
      if (!profile() && !($('#pConsent') || {}).checked) return toast(t('x_need_consent'));
      d.conditions = d.conditions || [];
      Object.keys(d.condDetails || {}).forEach(c => { if (!d.conditions.includes(c) || !String(d.condDetails[c]).trim()) delete d.condDetails[c]; });
      d.meds = medsString(d); d.v4 = 1; d.updated = Date.now(); if (!d.created) d.created = Date.now();
      if (d.unit) saveSettings({ unit: d.unit });
      DB.set('profile', d); S.ed = null; S.lastRoute = null; toast('✓ ' + t('x_saved')); location.hash = '#/health';
    },
    'rd-type'(el) { S.rd.type = el.dataset.v; rerender(); },
    'rd-save'() { saveReading(); },
    'rd-edit'(el) { const r = readings().find(x => x.id === el.dataset.id); if (!r) return; S.rdEdit = r.id; S.rd.type = r.type; rerender(); setTimeout(() => $('#rdForm').scrollIntoView({ block: 'start' }), 30); },
    'rd-cancel'() { S.rdEdit = null; rerender(); },
    'rd-del'(el) { if (!confirm(t('x_del_q'))) return; DB.set('readings', readings().filter(r => r.id !== el.dataset.id)); if (S.rdEdit === el.dataset.id) S.rdEdit = null; toast(t('x_deleted')); rerender(); },
    'meal-del'(el) { if (!confirm(t('x_del_q'))) return; DB.set('meals', meals().filter(m => m.id !== el.dataset.id)); toast(t('x_deleted')); rerender(); },
    hist(el) { S.hist = el.dataset.v; rerender(); },
    async 'pin-set'() { const a = $('#pin1').value, b = $('#pin2').value; if (!/^\d{4,8}$/.test(a)) return toast(t('x_pin_rule')); if (a !== b) return toast(t('x_pin_mismatch')); loader(true, t('x_securing')); await DB.enableLock(a); loader(false); toast('🔒 ' + t('x_pin_done')); rerender(); },
    async 'pin-off'() { const p = prompt(t('x_enter_pin')); if (p == null) return; if (!(await DB.verify(p))) return toast(t('x_pin_wrong')); await DB.disableLock(); toast(t('x_pin_removed')); rerender(); },
    async 'lock-now'() { await DB.flush(); location.reload(); },
    async wipe() { if (!confirm(t('x_wipe_q'))) return; await DB.clear(); localStorage.removeItem('nola_lock'); location.hash = '#/home'; location.reload(); },
    async unlock() { const p = $('#lockPin').value; loader(true, t('x_unlocking')); const ok = await DB.unlock(p); loader(false); if (!ok) { $('#lockErr').hidden = false; $('#lockPin').value = ''; return; } migrate(); route(); checkReminders(); },
    async 'lock-forgot'() { if (!confirm(t('x_forgot_q'))) return; await DB.clear(); localStorage.removeItem('nola_lock'); location.reload(); },
    slot(el) { S.slot = el.dataset.v; rerender(); },
    async 'notif-allow'() { try { await Notification.requestPermission(); } catch (e) {} rerender(); },
    async 'notif-test'() { const ok = await notify('NOLA HEALTH', t('x_test_body')); toast(ok ? '🔔 ' + t('x_test_sent') : t('x_n_denied')); },
    'rem-kind'(el) { keepRem(); S.rem.kind = el.dataset.v; S.rem.title = ''; rerender(); },
    'rem-med'(el) { keepRem(); S.rem.title = el.dataset.v; rerender(); },
    'rem-day'(el) { keepRem(); const d = +el.dataset.v; S.rem.days = S.rem.days.includes(d) ? S.rem.days.filter(x => x !== d) : S.rem.days.concat([d]); rerender(); },
    'rem-save'() {
      keepRem(); const f = S.rem, title = (f.title || '').trim() || t('x_rk_' + f.kind);
      if (!/^\d\d:\d\d$/.test(f.time || '')) return toast(t('x_need_time'));
      if (f.repeat === 'days' && !f.days.length) return toast(t('x_need_days'));
      const r = { id: uid(), kind: f.kind, title, time: f.time, days: f.repeat === 'days' ? f.days.slice() : [], date: f.repeat === 'once' ? (f.date || today()) : null, on: true, created: Date.now(), v4: 1 };
      DB.set('reminders', rems().concat([r])); S.rem = { kind: f.kind, repeat: 'daily', days: [] }; toast('✓ ' + t('x_rem_saved')); rerender();
    },
    'rem-done'(el) { const list = rems(), r = list.find(x => x.id === el.dataset.id); if (!r) return; r.doneDay = today(); DB.set('reminders', list); $('#remAlert').hidden = true; toast('✓ ' + t('x_well_done')); rerender(); },
    'rem-del'(el) { if (!confirm(t('x_del_q'))) return; DB.set('reminders', rems().filter(r => r.id !== el.dataset.id)); rerender(); },
    'goal-add'(el) { const k = el.dataset.v; DB.set('reminders', rems().concat([{ id: uid(), kind: 'goal', sug: k, title: t('x_g_' + k), time: { water: '10:00', veg: '12:30', bp: '08:00', sugar: '07:30', meds: '08:00', walk: '17:30', walk_gentle: '17:30' }[k] || '09:00', days: [], date: null, on: true, created: Date.now(), v4: 1 }])); toast('✓ ' + t('x_goal_added')); rerender(); },
    'food-add'(el) { S.scan.items.push({ foodId: el.dataset.id, mult: 1, oil: 'normal', salt: 'normal', conf: null }); S.q = ''; rerender(); },
    'item-mult'(el) { S.scan.items[+el.dataset.i].mult = +el.dataset.v; rerender(); },
    'item-del'(el) { S.scan.items.splice(+el.dataset.i, 1); rerender(); },
    'scan-meal'(el) { S.scan.meal = el.dataset.v; rerender(); },
    async 'scan-ai'() {
      loader(true, t('x_scanning'));
      try { const items = await AI.recognize(S.scan.photo); loader(false); if (!items.length) toast(t('x_ai_nofood')); else { S.scan.items = S.scan.items.concat(items); toast('✨ ' + t('x_ai_found', { n: items.length })); } }
      catch (e) { loader(false); toast(t('x_ai_failed', { e: String(e.message || e).slice(0, 60) })); }
      rerender();
    },
    'scan-go'() { const sc = S.scan; if (!sc.items.length) return; sc.result = { a: E.analyze(sc.items, profile() || DEFAULT_PR, sc.meal || autoSlot()) }; sc.saved = false; rerender(); window.scrollTo(0, 0); },
    'scan-save'() { const sc = S.scan, a = sc.result.a; DB.set('meals', meals().concat([{ id: uid(), ts: Date.now(), meal: sc.meal || autoSlot(), items: sc.items, totals: a.totals, verdict: a.verdict }])); sc.saved = true; toast('✓ ' + t('x_saved_history')); rerender(); },
    'scan-new'() { S.scan = { photo: null, items: [], meal: null, result: null, saved: false }; rerender(); },
    'ai-gear'() { S.showAi = !S.showAi; rerender(); },
    'ai-save'(el, quiet) { saveSettings({ aiBase: $('#aiBase').value.trim(), aiKey: $('#aiKey').value.trim(), aiModel: $('#aiModel').value.trim() }); if (quiet !== true) { toast('✓ ' + t('x_saved')); rerender(); } },
    async 'ai-test'() { A['ai-save'](null, true); const out = $('#aiTestOut'); if (!AI.enabled()) return toast(t('x_ai_fill')); out.textContent = '…'; try { await AI.chat([{ role: 'user', content: 'Reply with just: OK' }], { max_tokens: 5, timeout: 20000 }); out.textContent = '✓ ' + t('x_ai_ok'); } catch (e) { out.textContent = '✕ ' + t('x_ai_failed', { e: String(e.message || e).slice(0, 80) }); } },
    'ai-remove'() { saveSettings({ aiKey: '' }); toast(t('x_ai_removed')); rerender(); },
    'chat-clear'() { if (!confirm(t('x_clear_q'))) return; DB.set('doctorChat', []); rerender(); },
    ask(el) { ask(el.dataset.q); },
  };

  document.addEventListener('click', ev => {
    const el = ev.target.closest('[data-action]'); if (!el || el.disabled) return;
    const fn = A[el.dataset.action]; if (!fn) return;
    ev.preventDefault(); fn(el, ev);
  });
  document.addEventListener('input', ev => {
    const el = ev.target;
    if (el.dataset.f && S.ed) S.ed[el.dataset.f] = el.value;
    if (el.dataset.cdet && S.ed) S.ed.condDetails[el.dataset.cdet] = el.value;
    if (el.id === 'medName') { S.med.name = el.value; S.med.medId = null; const b = $('#medSug'); if (b) b.innerHTML = medSug(el.value); }
    if (el.id === 'medDose') S.med.dose = el.value;
    if (el.id === 'foodSearch') { S.q = el.value; const b = $('#foodRes'); if (b) b.innerHTML = foodChips(el.value ? F.search(el.value).slice(0, 8) : POPULAR.map(id => F.byId[id]).filter(Boolean)); }
    if (el.id === 'rdWhen' && !S.rdEdit) S.rd.when = el.value;
    if (el.id === 'chatIn') { el.style.height = 'auto'; el.style.height = Math.min(140, el.scrollHeight) + 'px'; }
  });
  document.addEventListener('change', async ev => {
    const el = ev.target;
    if (el.id === 'medFreq') S.med.freq = el.value;
    if (el.id === 'remRepeat') { keepRem(); rerender(); }
    if (el.dataset.change === 'rem-on') { const list = rems(), r = list.find(x => x.id === el.dataset.id); if (r) { r.on = el.checked; DB.set('reminders', list); } }
    if (el.dataset.change === 'goal-check') { const list = rems(), r = list.find(x => x.id === el.dataset.id); if (r) { r.doneDay = el.checked ? today() : null; DB.set('reminders', list); if (el.checked) toast('✓ ' + t('x_well_done')); rerender(); } }
    if ((el.id === 'camIn' || el.id === 'upIn') && el.files[0]) { loader(true, t('x_preparing')); try { S.scan.photo = await compressImage(el.files[0], 1024, 0.8); } catch (e) { toast(t('x_photo_err')); } loader(false); rerender(); }
    if (el.id === 'labFile' && el.files[0]) { try { const img = await compressImage(el.files[0], 1400, 0.85); const i = $('#chatIn'); const q = i ? i.value : ''; if (i) i.value = ''; ask(q, img); } catch (e) { toast(t('x_photo_err')); } }
  });
  document.addEventListener('submit', ev => { if (ev.target.id === 'chatForm') { ev.preventDefault(); const i = $('#chatIn'); const q = i.value; i.value = ''; ask(q); } });
  document.addEventListener('keydown', ev => {
    if (ev.target.id === 'chatIn' && ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); $('#chatForm').requestSubmit(); }
    if (ev.target.id === 'lockPin' && ev.key === 'Enter') A.unlock();
    if (ev.key === 'Escape') $('#alert').hidden = true;
  });
  window.addEventListener('hashchange', route);

  /* ---------- boot ---------- */
  async function boot() {
    const ui = DB.ui(); I18N.set(ui.lang === 'am' ? 'am' : 'en');
    await DB.init();
    if (!DB.locked) migrate();
    applyLang(); route();
    setInterval(checkReminders, 20000); setTimeout(checkReminders, 1500);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) checkReminders(); });
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      const had = !!navigator.serviceWorker.controller; let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (had && !reloaded) { reloaded = true; location.reload(); } });
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }
  window.NolaApp = { VERSION, S, ROUTES, A, route, rerender, profile, readings, meals, rems, settings, setLang, migrate, checkReminders, ask, inScope, labLines, myReadingLines, rankDishes, medLines, dayKey };
  boot();
})();
