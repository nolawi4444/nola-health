/* NOLA HEALTH — app shell, router, screens */
(function () {
  'use strict';
  const VERSION = '2.0.0';
  const F = window.NolaFoods, E = window.NolaEngine, CH = window.NolaCharts, AI = window.NolaAI, DB = window.NolaDB;
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const L = () => I18N.lang;
  const fname = f => f ? (f.name[L()] || f.name.en) : '';
  const tr = o => o ? (o[L()] || o.en) : '';
  const R = Math.round;
  const dayKey = d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  const S = { draft: null, result: null, diaryDate: dayKey(Date.now()), ob: null, rdTab: 'bp', pickerCat: 'all', pickerMode: null, coachBusy: false };

  const TIPS = [
    { en: 'Fill half your plate with vegetables like gomen, atkilt or salad, a quarter with legumes or lean protein, and a quarter with injera.', am: 'ግማሽ ሳህንዎን በአትክልት (ጎመን፣ አትክልት፣ ሰላጣ)፣ ሩቡን በጥራጥሬ ወይም ፕሮቲን፣ ሩቡን በእንጀራ ይሙሉ።', src: 'ADA Diabetes Plate Method' },
    { en: 'Keep salt under 5 g a day (about 1 teaspoon), and less if you have high blood pressure. Many berbere blends are already salted.', am: 'ጨው በቀን ከ5 ግ (1 የሻይ ማንኪያ ገደማ) በታች ያድርጉ፤ የደም ግፊት ካለ ያነሰ። ብዙ በርበሬዎች ጨው አላቸው።', src: 'WHO; AHA' },
    { en: 'Free sugars should be under 10% of your calories, ideally under 5%. One soda already has about 35 g.', am: 'የተጨመረ ስኳር ከካሎሪዎ ከ10% በታች፣ ቢቻል ከ5% በታች ይሁን። አንድ ለስላሳ ~35 ግ አለው።', src: 'WHO Sugars Guideline 2015' },
    { en: 'Legume wots like shiro, misir and kik are rich in fiber and protein. They raise blood glucose slowly and help lower LDL.', am: 'ሽሮ፣ ምስርና ክክ በፋይበርና ፕሮቲን የበለፀጉ ናቸው፤ ስኳርን በዝግታ ያሳድጋሉ፣ LDLንም ይቀንሳሉ።', src: 'ADA Nutrition Consensus 2019' },
    { en: 'Swap some niter kibbeh for vegetable oil. Keeping saturated fat under 6% of calories helps lower LDL cholesterol.', am: 'ንጥር ቅቤን በከፊል በአትክልት ዘይት ይተኩ፤ ሳቹሬትድ ስብ ከ6% በታች መሆኑ LDLን ይቀንሳል።', src: 'AHA' },
    { en: 'Aim for 150 minutes of brisk walking a week. A 10–15 minute walk after meals lowers the glucose rise.', am: 'በሳምንት 150 ደቂቃ ፈጣን እርምጃ ያቅዱ። ከምግብ በኋላ 10–15 ደቂቃ መራመድ የስኳር መጨመርን ይቀንሳል።', src: 'WHO 2020; ADA' },
    { en: 'Losing 5–7% of your body weight can greatly lower the risk of type 2 diabetes and improve blood pressure.', am: 'ከክብደትዎ 5–7% መቀነስ የስኳር ህመም አይነት 2 ስጋትን በእጅጉ ይቀንሳል፣ ግፊትንም ያሻሽላል።', src: 'Diabetes Prevention Program; ADA' },
    { en: 'Potassium-rich foods like gomen, beans, potatoes, bananas and avocado help balance sodium (the DASH diet).', am: 'በፖታሲየም የበለፀጉ ምግቦች (ጎመን፣ ባቄላ፣ ድንች፣ ሙዝ፣ አቮካዶ) ሶዲየምን ያመጣጥናሉ (DASH)።', src: 'AHA; NHLBI DASH' },
  ];
  const DOCTOR = [
    { en: 'Blood glucose under 70 mg/dL (3.9 mmol/L) often, or ever under 54 mg/dL (3.0 mmol/L)', am: 'የደም ስኳር ደጋግሞ ከ70 mg/dL (3.9 mmol/L) በታች፣ ወይም አንድ ጊዜም ከ54 በታች' },
    { en: 'Glucose often over 250 mg/dL (13.9 mmol/L), or over 300 with vomiting or confusion. That is an emergency.', am: 'ስኳር ደጋግሞ ከ250 mg/dL በላይ፣ ወይም ከ300 በላይ ከማስታወክ/ግራ መጋባት ጋር። ይህ ድንገተኛ ነው።' },
    { en: 'Blood pressure 180/120 or higher is an emergency. 140/90 or higher on repeated checks means see your doctor.', am: 'የደም ግፊት 180/120 እና በላይ ድንገተኛ ነው፤ ደጋግሞ 140/90 እና በላይ ከሆነ ሐኪም ያማክሩ' },
    { en: 'Chest pain, stroke signs, severe breathlessness or fainting: call 907', am: 'የደረት ህመም፣ የስትሮክ ምልክቶች፣ ከባድ የትንፋሽ ማጠር ወይም ራስን መሳት — 907 ይደውሉ' },
    { en: 'Weight loss you did not plan, constant thirst or urination, or foot wounds that won’t heal', am: 'ያልታሰበ የክብደት መቀነስ፣ ተደጋጋሚ ጥማት ወይም ሽንት፣ የማይድን የእግር ቁስል' },
    { en: 'Pregnancy, kidney disease, or before big diet changes or fasting if you use insulin or sulfonylureas', am: 'እርግዝና፣ የኩላሊት ህመም፣ ወይም ኢንሱሊን እየወሰዱ ትልቅ የአመጋገብ ለውጥ ወይም ጾም ከመጀመርዎ በፊት' },
  ];
  const SOURCES = [
    ['American Diabetes Association: Standards of Care in Diabetes (2025)', 'https://diabetesjournals.org/care/issue/48/Supplement_1'],
    ['WHO: Healthy diet fact sheet; Sugars & Sodium guidelines', 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet'],
    ['American Heart Association: Diet & lifestyle recommendations; BP categories', 'https://www.heart.org/en/healthy-living/healthy-eating'],
    ['USDA FoodData Central', 'https://fdc.nal.usda.gov/'],
    ['Ethiopian Public Health Institute: Food Composition Table for Use in Ethiopia', 'https://ephi.gov.et/'],
    ['NHLBI: DASH eating plan', 'https://www.nhlbi.nih.gov/education/dash-eating-plan'],
  ];
  const CONDS = ['t1d', 't2d', 'pre', 'gdm', 'htn', 'chol', 'obesity', 'heart', 'kidney', 'none'];

  /* ---------- infra ---------- */
  function toast(msg) { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2200); }
  function profile() { return DB.get('profile', null); }
  function settings() { return Object.assign({ lang: 'en', lowData: false, unit: 'mg', aiBase: 'https://api.openai.com/v1', aiKey: '', aiModel: 'gpt-4o-mini' }, DB.get('settings', {})); }
  function saveSettings(p) { DB.set('settings', Object.assign(settings(), p)); }
  function meals() { return DB.get('meals', []); }
  function readings() { return DB.get('readings', []); }
  function openSheet(html) { const w = $('#sheet'); w.innerHTML = `<div class="sheet" role="dialog">${html}</div>`; w.hidden = false; }
  function closeSheet() { const w = $('#sheet'); w.hidden = true; w.innerHTML = ''; S.pickerMode = null; }
  function md(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<i>$1</i>'); }
  function fmtG(mg) { return E.fmtGlucose(mg, settings().unit); }
  function portionLabel(f, m) { const p = (f && f.portions.find(x => Math.abs(x[0] - m) < 0.01)) || (f && f.portions[0]); const u = p ? p[1] : 'serving'; return E.frac(m) + ' ' + t('u_' + u); }
  function defaultMeal() { const h = new Date().getHours() + new Date().getMinutes() / 60; return h < 10.5 ? 'breakfast' : h < 15 ? 'lunch' : h < 17.5 ? 'snack' : 'dinner'; }
  function condLabel(pr) { const c = (pr.conditions || []).filter(x => x !== 'none'); return c.length ? c.map(x => t('c_' + x)).join(', ') : t('conds_none'); }

  function showAlert(flag) {
    if (!flag) return;
    const w = $('#alert'), em = flag.level === 'emergency';
    w.innerHTML = `<div class="emergency ${em ? '' : 'warn'}" role="alertdialog" aria-modal="true"><div class="eh">${em ? '🚨' : '⚠️'} <span>${t(em ? 'rf_title' : 'warn_title')}</span></div><div class="eb">
      ${flag.keys.map(k => `<p>${esc(t(k, { v: flag.v }))}</p>`).join('')}
      ${em ? `<p class="small"><b>${esc(t('rf_numbers'))}</b></p><a class="btn block callbtn" href="tel:907">📞 ${t('rf_call')}</a>` : ''}
      <button class="btn block ghost" style="margin-top:10px" data-action="close-alert">${t('rf_ok')}</button></div></div>`;
    w.hidden = false;
  }

  /* ---------- router ---------- */
  const ROUTES = { onboarding: rOnboarding, home: rHome, scan: rScan, result: rResult, diary: rDiary, coach: rCoach, me: rMe, readings: rReadings, learn: rLearn, settings: rSettings };
  const NO_FAB = ['coach', 'onboarding', 'lock', 'report'];
  function route() {
    let name = (location.hash.replace(/^#\/?/, '').split('?')[0]) || 'home';
    const nav = $('#bottomnav'), fab = $('#fab');
    document.querySelectorAll('[data-t]').forEach(el => el.textContent = t(el.dataset.t));
    $('#langBtn').textContent = t('lang_toggle');
    if (DB.locked) { nav.hidden = true; fab.hidden = true; S.route = 'lock'; $('#view').innerHTML = window.NolaFeatures.lockScreen(); setTimeout(() => { const i = $('#lockPin'); if (i) i.focus(); }, 50); return; }
    if (!profile() && name !== 'onboarding') { location.replace('#/onboarding'); name = 'onboarding'; }
    if (!ROUTES[name]) name = 'home';
    if (name === 'result' && !S.result) name = 'scan';
    nav.hidden = name === 'onboarding'; fab.hidden = NO_FAB.includes(name);
    const sec = { home: 'home', diary: 'diary', scan: 'scan', result: 'scan', coach: 'coach' }[name] || 'me';
    nav.querySelectorAll('a').forEach(a => a.classList.toggle('on', a.dataset.nav === sec));
    $('#brandName').textContent = 'NOLA HEALTH';
    S.route = name;
    $('#toast').classList.remove('show');
    const v = $('#view'); v.innerHTML = ROUTES[name]();
    if (S._scrollTop !== false) { window.scrollTo(0, 0); v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter'); }
    S._scrollTop = true;
    afterRender(name);
  }
  function rerender() { S._scrollTop = false; const y = window.scrollY; route(); window.scrollTo(0, y); }
  function afterRender(name) {
    if (name === 'coach') { const v = $('#chatEnd'); if (v) v.scrollIntoView({ block: 'end' }); }
  }

  /* ---------- ONBOARDING ---------- */
  const OB_STEPS = 6;
  function obInit(edit) {
    const pr = profile();
    S.ob = { step: edit ? 1 : 0, edit: !!edit, d: edit && pr ? JSON.parse(JSON.stringify(pr)) : { conditions: [], allergies: [], restrictions: [], prefs: ['ethiopian'], goals: [], activity: 'light', gender: '', unit: settings().unit, consent: false } };
    if (edit) S.ob.d.consent = true;
  }
  const inp = (k, label, type = 'text', extra = '') => `<label class="f" for="ob_${k}">${t(label)}</label><input class="in" id="ob_${k}" type="${type}" data-bind="${k}" value="${esc(S.ob.d[k] ?? '')}" ${extra}>`;
  const chips = (k, opts, multi = true, prefix = '') => `<div class="chips">${opts.map(o => { const on = multi ? (S.ob.d[k] || []).includes(o) : S.ob.d[k] === o; return `<button type="button" class="chip ${on ? 'on' : ''}" data-action="ob-chip" data-k="${k}" data-v="${o}" data-multi="${multi ? 1 : ''}" aria-pressed="${on}">${t(prefix + o)}</button>`; }).join('')}</div>`;
  function rOnboarding() {
    if (!S.ob) obInit(false);
    const { step, d } = S.ob;
    if (step === 0) return `<div class="hero"><div class="plate"></div><div style="font-size:42px">🥗</div><h1>${t('ob_welcome_title')}</h1><p>${t('ob_welcome_body')}</p></div>
      <div class="trust"><div><i>🔬</i>${t('ob_trust1')}</div><div><i>📶</i>${t('ob_trust2')}</div><div><i>🔒</i>${t('ob_trust3')}</div></div>
      <button class="btn block" data-action="ob-next" id="obStart">${t('ob_start')} →</button>
      <p class="tiny muted center" style="margin-top:14px">${t('disclaimer')}</p>`;
    let body = '';
    const titles = ['', 'ob_s_basic', 'ob_s_body', 'ob_s_cond', 'ob_s_numbers', 'ob_s_food', 'ob_s_goals'];
    if (step === 1) body = inp('name', 'f_name', 'text', 'autocomplete="name"') + `<div class="grid2"><div>${inp('dob', 'f_dob', 'date')}</div><div>${inp('age', 'f_age', 'number', 'min="1" max="119" inputmode="numeric"')}</div></div>
      <label class="f">${t('f_gender')} <span class="muted small">(${t('optional')})</span></label>${chips('gender', ['female', 'male', 'na'], false, 'g_')}`;
    if (step === 2) {
      const pr = d; const b = E.bmi(pr);
      body = `<div class="grid2"><div>${inp('weight', 'f_weight', 'number', 'min="20" max="300" step="0.1" inputmode="decimal"')}</div><div>${inp('height', 'f_height', 'number', 'min="100" max="230" inputmode="numeric"')}</div></div>
      <div id="bmiLive" class="small muted" style="margin-top:6px">${b ? `${t('bmi')}: <b>${b}</b> — ${t('bmi_' + E.bmiCat(b))}` : ''}</div>
      ${inp('targetWeight', 'f_target_weight', 'number', 'step="0.1" inputmode="decimal"')}
      <label class="f">${t('f_activity')}</label><div class="opt-list">${['sed', 'light', 'mod', 'active'].map(a => `<div class="opt ${d.activity === a ? 'on' : ''}" data-action="ob-chip" data-k="activity" data-v="${a}">${{ sed: '🪑', light: '🚶', mod: '🏃', active: '⛹️' }[a]} ${t('act_' + a)}</div>`).join('')}</div>`;
    }
    if (step === 3) body = `<p class="muted">${t('f_conditions')}</p>${chips('conditions', CONDS, true, 'c_')}
      <p class="tiny muted" style="margin-top:14px">${t('ob_numbers_hint')}</p>`;
    if (step === 4) {
      const dm = E.isDiabetic(d);
      body = `<p class="muted small">${t('ob_numbers_hint')}</p>
      <label class="f">${t('f_bp')}</label><div class="grid2"><div>${inp('bpSys', 'f_bp_sys', 'number', 'inputmode="numeric" placeholder="120"')}</div><div>${inp('bpDia', 'f_bp_dia', 'number', 'inputmode="numeric" placeholder="80"')}</div></div>
      ${E.has(d, 'htn') ? inp('bpSince', 'f_bp_since', 'number', 'inputmode="numeric" placeholder="2020"') : ''}
      <label class="f">${t('f_glucose_unit')}</label><div class="seg">${['mg', 'mmol'].map(u => `<button type="button" class="${d.unit === u ? 'on' : ''}" data-action="ob-chip" data-k="unit" data-v="${u}">${u === 'mg' ? 'mg/dL' : 'mmol/L'}</button>`).join('')}</div>
      <div class="grid2"><div>${inp('glucose', 'f_glucose', 'number', `step="0.1" inputmode="decimal" placeholder="${d.unit === 'mmol' ? '5.5' : '100'}"`)}</div><div>${inp('hba1c', 'f_hba1c', 'number', 'step="0.1" inputmode="decimal" placeholder="6.5"')}</div></div>
      ${dm ? '' : ''}
      <div class="grid2"><div>${inp('cholTotal', 'f_chol_total', 'number', 'inputmode="numeric"')}</div><div>${inp('ldl', 'f_ldl', 'number', 'inputmode="numeric"')}</div><div>${inp('hdl', 'f_hdl', 'number', 'inputmode="numeric"')}</div><div>${inp('trig', 'f_trig', 'number', 'inputmode="numeric"')}</div></div>`;
    }
    if (step === 5) body = `<label class="f">${t('f_allergies')}</label>${chips('allergies', ['gluten', 'dairy', 'egg', 'peanut', 'fish', 'legume'], true, 'a_')}${inp('allergyOther', 'f_allergy_other')}
      <label class="f">${t('f_restrictions')}</label>${chips('restrictions', ['fasting', 'halal', 'vegetarian', 'vegan', 'glutenfree', 'noalcohol', 'lowsalt'], true, 'r_')}
      <label class="f">${t('f_prefs')}</label>${chips('prefs', ['ethiopian', 'international', 'spicy'], true, 'p_')}${inp('fav', 'f_fav')}
      <label class="f" for="ob_meds">${t('f_meds')}</label><textarea class="in" id="ob_meds" data-bind="meds">${esc(d.meds || '')}</textarea><p class="tiny muted">${t('f_meds_hint')}</p>`;
    if (step === 6) body = `<p class="muted">${t('f_goals')}</p>${chips('goals', ['glucose', 'bp', 'chol', 'lose', 'maintain', 'gain', 'eat', 'energy'], true, 'goal_')}
      ${S.ob.edit ? '' : `<label class="check"><input type="checkbox" id="obConsent" data-bind="consent" ${d.consent ? 'checked' : ''}><span class="small">${t('ob_consent')}</span></label>`}`;
    return `<div class="small muted" style="margin-top:8px">${t('ob_step', { n: step, t: OB_STEPS })}</div><div class="progress"><div style="width:${step / OB_STEPS * 100}%"></div></div>
      <h1>${t(titles[step])}</h1><form id="obForm" onsubmit="return false">${body}</form>
      <div class="ob-nav">${step > 1 || S.ob.edit ? `<button class="btn ghost" data-action="ob-back">${t('back')}</button>` : `<button class="btn ghost" data-action="ob-back">${t('back')}</button>`}
      <button class="btn grow" data-action="ob-next" id="obNext">${step === OB_STEPS ? (S.ob.edit ? t('save') : t('ob_finish')) : t('next') + ' →'}</button></div>`;
  }
  function obValidate() {
    const { step, d } = S.ob;
    if (step === 1) { if (!(d.name || '').trim()) return t('ob_need_name'); if (!d.dob && !(+d.age > 0)) return t('ob_need_body'); }
    if (step === 2) { if (!(+d.weight >= 20 && +d.weight <= 300) || !(+d.height >= 90 && +d.height <= 240)) return t('ob_need_body'); }
    if (step === 6 && !S.ob.edit && !d.consent) return t('ob_need_consent');
    return null;
  }
  function obFinish() {
    const d = S.ob.d; const old = profile();
    ['weight', 'height', 'age', 'targetWeight', 'bpSys', 'bpDia', 'glucose', 'hba1c', 'cholTotal', 'ldl', 'hdl', 'trig', 'bpSince'].forEach(k => { if (d[k] !== '' && d[k] != null) d[k] = +d[k]; });
    if (d.dob) d.age = E.age(d);
    d.conditions = (d.conditions || []).filter(c => c !== 'none' || d.conditions.length === 1);
    d.updated = Date.now(); if (!d.created) d.created = Date.now();
    DB.set('profile', d);
    saveSettings({ unit: d.unit || 'mg' });
    const rs = readings().slice(); const now = Date.now();
    let flag = null;
    if (!old || +old.weight !== +d.weight) rs.push({ id: uid(), type: 'weight', ts: now, kg: +d.weight });
    if (d.bpSys && d.bpDia && (!old || old.bpSys !== d.bpSys || old.bpDia !== d.bpDia)) { rs.push({ id: uid(), type: 'bp', ts: now, sys: d.bpSys, dia: d.bpDia }); flag = E.checkBP(d.bpSys, d.bpDia); }
    if (d.glucose && (!old || old.glucose !== d.glucose)) { const mg = E.toMgdl(d.glucose, d.unit); rs.push({ id: uid(), type: 'glucose', ts: now, mg, ctx: 'fasting' }); flag = flag || E.checkGlucose(mg, d.unit); }
    DB.set('readings', rs);
    const edit = S.ob.edit; S.ob = null;
    location.hash = edit ? '#/me' : '#/home';
    if (edit) setTimeout(() => toast(t('profile_saved')), 80);
    if (flag) setTimeout(() => showAlert(flag), 300);
  }

  /* ---------- HOME ---------- */
  function todaysTotals(day) { const ms = meals().filter(m => dayKey(m.ts) === day); return { ms, tot: E.mealTotals(ms.flatMap(m => m.items)) }; }
  function latest(type) { return readings().filter(r => r.type === type).sort((a, b) => b.ts - a.ts)[0]; }
  function readingBanners() {
    const out = []; const recent = r => r && Date.now() - r.ts < 3 * 864e5;
    const bp = latest('bp'), g = latest('glucose');
    [recent(bp) && E.checkBP(bp.sys, bp.dia), recent(g) && E.checkGlucose(g.mg, settings().unit)].forEach(f => {
      if (f) out.push(`<div class="banner ${f.level === 'emergency' ? 'red' : 'amber'}" data-action="show-flag" data-flag='${esc(JSON.stringify(f))}'>${f.level === 'emergency' ? '🚨' : '⚠️'} <b>${t(f.level === 'emergency' ? 'rf_title' : 'warn_title')}</b><br>${esc(t(f.keys[0], { v: f.v })).slice(0, 140)}…</div>`);
    });
    return out.join('');
  }
  function rHome() {
    const pr = profile(), T = E.targets(pr), today = dayKey(Date.now()), { ms, tot } = todaysTotals(today);
    const b = E.bmi(pr), tip = TIPS[Math.floor(Date.now() / 864e5) % TIPS.length];
    const mini = (k, label, unit, max, lim = true) => `<div class="mini">${CH.ring(tot[k], max, 62, CH.fmt(tot[k]), '', lim && tot[k] > max ? CH.C.orange : k === 'fb' ? CH.C.teal2 : CH.C.teal)}<b>${label}</b>${R(max)} ${unit}</div>`;
    const remain = T.kcal - tot.kcal;
    const lr = ['bp', 'glucose', 'weight'].map(ty => { const r = latest(ty); return `<div class="stat"><span>${t('log_' + ty)}</span><b>${r ? (ty === 'bp' ? r.sys + '/' + r.dia + ' mmHg' : ty === 'glucose' ? fmtG(r.mg) : r.kg + ' kg') : '—'}</b></div>`; }).join('');
    return `<div class="greet"><div><div class="muted small">${new Date().toLocaleDateString(L() === 'am' ? 'am-ET' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div><h1>${t('hello', { name: esc((pr.name || '').split(' ')[0]) })}</h1></div></div>
      ${readingBanners()}
      <div class="card"><h3 style="margin:0">${t('dash_today')}</h3><div class="tiny muted">✓ ${t('dash_targets_basis')}</div>
        <div class="kcal-card" style="margin-top:10px">${CH.ring(tot.kcal, T.kcal, 124, CH.fmt(tot.kcal), '/ ' + T.kcal + ' kcal')}
          <div><div class="muted small">${t('n_kcal')}</div><div style="font-size:22px;font-weight:800">${remain >= 0 ? R(remain) : R(-remain)} <span class="small muted">kcal ${remain >= 0 ? t('left') : t('over')}</span></div>
          <div class="small muted" style="margin-top:6px">${t('n_p')}: <b>${R(tot.p)}</b> / ${T.p} g · ${t('n_as')}: <b>${R(tot.as)}</b> / ${T.as} g</div></div></div>
        <div class="minis">${mini('c', t('n_c'), 'g', T.c)}${mini('na', t('n_na').split(' ')[0], 'mg', T.na)}${mini('sf', t('n_sf'), 'g', T.sf)}${mini('fb', t('n_fb'), 'g', T.fb, false)}</div>
        <details style="margin-top:12px"><summary class="small">${t('dash_why')}</summary><p class="small muted">${esc(t('why_body', { loss: T.loss ? t('why_loss') : '', carbPct: T.carbPct, dm: T.dm ? t('why_dm') : '', na: T.na, naSrc: T.naSrc, sfPct: T.sfPct, sfSrc: T.sfSrc, as: T.as }))}</p></details>
      </div>
      <a class="cta" href="#/scan" id="ctaScan"><span class="ic"><svg viewBox="0 0 24 24"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><circle cx="12" cy="12" r="3.5"/></svg></span><span><b style="font-size:16px">${t('dash_scan_cta')}</b><br><span class="small" style="opacity:.9">${t('dash_scan_sub')}</span></span></a>
      <h2>${t('dash_quick')}</h2><div class="quick"><button data-action="add-reading" data-type="bp"><span class="e">❤️</span>${t('log_bp')}</button><button data-action="add-reading" data-type="glucose"><span class="e">🩸</span>${t('log_glucose')}</button><button data-action="add-reading" data-type="weight"><span class="e">⚖️</span>${t('log_weight')}</button></div>
      <div class="grid2" style="margin-top:4px"><div class="card tight"><div class="muted small">${t('bmi')}</div><div style="font-size:24px;font-weight:800">${b ?? '—'}</div><div class="small">${b ? t('bmi_' + E.bmiCat(b)) : ''}</div></div>
        <div class="card tight" data-action="go" data-to="readings" style="cursor:pointer"><div class="muted small">${t('dash_latest')}</div>${lr}</div></div>
      <h2>${t('dash_meals_today')}</h2>${ms.length ? ms.map(mealRow).join('') : `<div class="card muted small">${t('dash_no_meals')}</div>`}
      <h2>${t('dash_explore')}</h2><div class="explore">${[['glucose', '🩸', 'hub_glucose'], ['restaurant', '🍽️', 'hub_restaurant'], ['planner', '💰', 'hub_planner'], ['academy', '🎓', 'hub_academy'], ['journey', '🌱', 'hub_journey'], ['insights', '🧠', 'hub_memory_food']].map(([r, i, k]) => `<a href="#/${r}"><span>${i}</span>${t(k)}</a>`).join('')}</div>
      <div class="card tip"><div class="row"><span style="font-size:22px">💡</span><h3 style="margin:0">${t('dash_tip')}</h3></div><p style="margin:8px 0 4px">${esc(tr(tip))}</p><div class="tiny muted">${t('source')}: ${tip.src}</div></div>`;
  }
  function mealRow(m) {
    const names = m.items.map(it => it.foodId ? fname(F.byId[it.foodId]) : it.name).join(', ');
    const img = m.photo && !settings().lowData ? `<img src="${m.photo}" alt="">` : `<div class="ph">${{ breakfast: '🌅', lunch: '🍛', dinner: '🌙', snack: '🍎' }[m.meal] || '🍽️'}</div>`;
    return `<div class="card tight meal" data-action="open-meal" data-id="${m.id}" style="cursor:pointer">${img}<div class="grow"><div class="row between"><b>${t('meal_' + m.meal)}</b><span class="pill ${m.verdict}">${t('verdict_' + m.verdict)}</span></div>
      <div class="small muted" style="margin:2px 0">${esc(names)}</div><div class="tiny muted">${R(m.totals.kcal)} kcal · ${R(m.totals.c)} g ${t('n_c')} · ${R(m.totals.na)} mg Na · ${new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div></div>`;
  }

  /* ---------- READINGS ---------- */
  function readingSheet(type) {
    const unit = settings().unit;
    let f = '';
    if (type === 'bp') f = `<div class="grid3"><div><label class="f">${t('rd_sys')}</label><input class="in" id="rdSys" type="number" inputmode="numeric" placeholder="120"></div><div><label class="f">${t('rd_dia')}</label><input class="in" id="rdDia" type="number" inputmode="numeric" placeholder="80"></div><div><label class="f">${t('rd_pulse')}</label><input class="in" id="rdPulse" type="number" inputmode="numeric" placeholder="72"></div></div>`;
    if (type === 'glucose') f = `<label class="f">${t('rd_value')} (${unit === 'mmol' ? 'mmol/L' : 'mg/dL'})</label><input class="in" id="rdG" type="number" step="0.1" inputmode="decimal" placeholder="${unit === 'mmol' ? '5.5' : '100'}">
      <label class="f">${t('rd_when')}</label><div class="chips" id="rdCtx">${['fasting', 'before', 'after', 'random'].map((c, i) => `<button type="button" class="chip ${i === 0 ? 'on' : ''}" data-action="rd-ctx" data-v="${c}">${t('ctx_' + c)}</button>`).join('')}</div>`;
    if (type === 'weight') f = `<label class="f">${t('f_weight')}</label><input class="in" id="rdW" type="number" step="0.1" inputmode="decimal" value="${profile().weight || ''}">`;
    openSheet(`<div class="row between"><h2 style="margin:0">${t('rd_add')}: ${t('log_' + type)}</h2><button class="iconbtn" data-action="close-sheet" aria-label="close">✕</button></div>${f}
      <button class="btn block" style="margin-top:16px" data-action="save-reading" data-type="${type}" id="rdSave">${t('save')}</button>`);
  }
  function saveReading(type) {
    const rs = readings().slice(), now = Date.now(); let flag = null, r = null;
    if (type === 'bp') { const s = +$('#rdSys').value, d = +$('#rdDia').value, p = +$('#rdPulse').value; if (!(s >= 60 && s <= 260 && d >= 30 && d <= 180)) return toast(t('rd_invalid')); r = { type, sys: s, dia: d, pulse: p || null }; flag = E.checkBP(s, d); }
    if (type === 'glucose') { const v = parseFloat($('#rdG').value); const mg = E.toMgdl(v, settings().unit); if (!(mg >= 15 && mg <= 700)) return toast(t('rd_invalid')); const ctx = ($('#rdCtx .chip.on') || {}).dataset?.v || 'random'; r = { type, mg, ctx }; flag = E.checkGlucose(mg, settings().unit); }
    if (type === 'weight') { const w = parseFloat($('#rdW').value); if (!(w >= 20 && w <= 300)) return toast(t('rd_invalid')); r = { type, kg: w }; const pr = profile(); pr.weight = w; DB.set('profile', pr);
      const prev = readings().filter(x => x.type === 'weight' && now - x.ts < 14 * 864e5 && now - x.ts > 864e5).sort((a, b) => a.ts - b.ts)[0]; if (prev && Math.abs(prev.kg - w) / prev.kg > 0.04) flag = { level: 'warn', keys: ['warn_weight'], v: '' }; }
    rs.push(Object.assign({ id: uid(), ts: now }, r)); DB.set('readings', rs);
    closeSheet(); toast(t('rd_saved')); rerender();
    if (flag) setTimeout(() => showAlert(flag), 250);
  }
  function rReadings() {
    const ty = S.rdTab, unit = settings().unit;
    const rs = readings().filter(r => r.type === ty).sort((a, b) => b.ts - a.ts);
    const pts = rs.slice(0, 30);
    let chart = '';
    if (ty === 'bp') chart = CH.line([{ pts: pts.map(r => ({ x: r.ts, y: r.sys })), color: '#166534' }, { pts: pts.map(r => ({ x: r.ts, y: r.dia })), color: '#4ade80' }], { band: [80, 130] });
    if (ty === 'glucose') chart = CH.line([{ pts: pts.map(r => ({ x: r.ts, y: unit === 'mmol' ? r.mg / 18 : r.mg })), color: '#0369a1' }], { band: unit === 'mmol' ? [3.9, 10] : [70, 180] });
    if (ty === 'weight') chart = CH.line([{ pts: pts.map(r => ({ x: r.ts, y: r.kg })), color: '#7c3aed' }]);
    const val = r => ty === 'bp' ? `${r.sys}/${r.dia} mmHg${r.pulse ? ' · ♥ ' + r.pulse : ''}` : ty === 'glucose' ? `${fmtG(r.mg)} · ${t('ctx_' + (r.ctx || 'random'))}` : `${r.kg} kg`;
    const badge = r => { const f = ty === 'bp' ? E.checkBP(r.sys, r.dia) : ty === 'glucose' ? E.checkGlucose(r.mg, unit) : null; return f ? `<span class="pill ${f.level === 'emergency' ? 'alt' : 'adjust'}">${f.level === 'emergency' ? '!' : '↑'}</span>` : ''; };
    return `<h1>${t('rd_title')}</h1><div class="tabs">${['bp', 'glucose', 'weight'].map(x => `<button class="chip ${x === ty ? 'on' : ''}" data-action="rd-tab" data-v="${x}">${t('log_' + x)}</button>`).join('')}</div>
      <div class="card">${chart || `<p class="muted center">${t('rd_none')}</p>`}${ty === 'bp' ? '<div class="tiny muted">— systolic &nbsp; — diastolic &nbsp; ▭ target band (AHA)</div>' : ty === 'glucose' ? '<div class="tiny muted">▭ ADA target range 70–180 mg/dL</div>' : ''}</div>
      <button class="btn block" data-action="add-reading" data-type="${ty}">+ ${t('rd_add')}</button>
      <h2>${t('rd_history')}</h2><div class="card tight">${rs.length ? rs.map(r => `<div class="stat"><span>${val(r)} ${badge(r)}<br><span class="tiny muted">${new Date(r.ts).toLocaleString()}</span></span><button class="link" data-action="del-reading" data-id="${r.id}" aria-label="${t('del')}">🗑</button></div>`).join('') : `<p class="muted small">${t('rd_none')}</p>`}</div>`;
  }

  /* ---------- SCAN ---------- */
  function newDraft() { return { id: uid(), photo: null, items: [], meal: defaultMeal(), status: 'idle', err: null }; }
  function rScan() {
    if (!S.draft) S.draft = newDraft();
    const d = S.draft, ai = AI.enabled();
    const items = d.items.map((it, i) => itemCard(it, i)).join('');
    const quick = [['injera_teff', 'shiro'], ['beyaynetu', 'injera_teff'], ['firfir'], ['tibs', 'injera_teff'], ['ful', 'dabo'], ['misir', 'gomen', 'injera_teff']];
    return `<div class="row between"><h1>${t('scan_title')}</h1>${d.items.length || d.photo ? `<button class="link small" data-action="scan-reset">↺</button>` : ''}</div>
      <div class="seg" style="margin-bottom:12px">${['breakfast', 'lunch', 'dinner', 'snack'].map(m => `<button class="${d.meal === m ? 'on' : ''}" data-action="set-meal" data-v="${m}">${t('meal_' + m)}</button>`).join('')}</div>
      <div class="photo-box">${d.photo ? `<img src="${d.photo}" alt="meal photo" style="${d.items.length ? 'max-height:150px' : ''}">` : `<div style="font-size:44px">📷</div><div class="muted small">${ai ? t('scan_ai_on') : ''}</div>`}
        ${d.status === 'loading' ? `<div class="spinner"></div><div class="small">${t('scan_analyzing')}</div>` : ''}
        <div class="scan-btns"><label class="btn"><input type="file" accept="image/*" capture="environment" id="camIn" hidden>📸 ${t('scan_take')}</label><label class="btn ghost"><input type="file" accept="image/*" id="upIn" hidden>🖼️ ${t('scan_upload')}</label></div>
      </div>
      ${ai ? `<p class="tiny muted">✨ ${t('scan_ai_on')} · ${esc(AI.cfg().model)}</p>` : `<div class="note">📴 ${t('scan_ai_off')}</div>`}
      ${d.err ? `<div class="banner amber">${esc(d.err)}</div>` : ''}
      <div class="row between" style="margin-top:14px"><h2 style="margin:0">${t('scan_detected')}</h2><button class="btn sm soft" data-action="open-picker" id="addFoodBtn">+ ${t('scan_add_food')}</button></div>
      ${d.items.length ? `<p class="small muted">${t('scan_correct_hint')}</p>${items}` : `<div class="card center muted small">${t('scan_empty')}<div class="chips" style="justify-content:center;margin-top:10px">${quick.map(q => `<button class="chip sm" data-action="quick-add" data-ids="${q.join(',')}">${q.map(id => fname(F.byId[id])).join(' + ')}</button>`).join('')}</div></div>`}
      <div class="note">ℹ️ ${t('estimates_note')}</div>
      <button class="btn block" data-action="analyze" id="analyzeBtn" ${d.items.length ? '' : 'disabled'}>${t('scan_analyze')} →</button>`;
  }
  function confBadge(it) {
    if (it.confirmed) return `<span class="conf h">✓ ${t('conf_confirmed')}</span>`;
    if (it.conf == null) return `<span class="conf u">${t('conf_user')}</span>`;
    const c = it.conf >= 0.75 ? 'h' : it.conf >= 0.5 ? 'm' : 'l';
    return `<span class="conf ${c}" title="${t('confidence')}">${t('confidence')}: ${t({ h: 'conf_high', m: 'conf_med', l: 'conf_low' }[c])} ${R(it.conf * 100)}%</span>`;
  }
  function itemCard(it, i) {
    const f = it.foodId ? F.byId[it.foodId] : null, n = E.itemNutrition(it);
    const seg = (key, vals, labels) => `<div class="seg">${vals.map((v, j) => `<button class="${(it[key] || vals[1]) === v ? 'on' : ''}" data-action="item-set" data-i="${i}" data-k="${key}" data-v="${v}">${labels[j]}</button>`).join('')}</div>`;
    const lv = [t('level_low'), t('level_normal'), t('level_high')];
    const portions = f ? f.portions.map(p => p[0]) : [0.5, 1, 1.5, 2];
    return `<div class="item" data-item="${i}"><div class="hd"><div><div class="nm">${esc(f ? fname(f) : it.name)}</div>
        <div class="meta">${f ? esc(tr(f.base)) : t('scan_ai_item')}${it.aiName && f && !f.name.en.toLowerCase().includes(it.aiName.toLowerCase()) ? ` · AI: “${esc(it.aiName)}”` : ''}</div></div>
        <div class="row" style="gap:6px">${confBadge(it)}<button class="iconbtn" data-action="item-del" data-i="${i}" aria-label="${t('del')}">✕</button></div></div>
      <div class="ctl"><div class="lbl">${t('scan_portion')}</div><div class="chips">${portions.map(m => `<button class="chip sm ${Math.abs(it.mult - m) < 0.01 ? 'on' : ''}" data-action="item-set" data-i="${i}" data-k="mult" data-v="${m}">${f ? portionLabel(f, m) : E.frac(m) + '×'}</button>`).join('')}</div></div>
      ${(f ? f.oil > 0 : true) ? `<div class="ctl grid2"><div><div class="lbl">${t('scan_oil')}</div>${seg('oil', ['low', 'normal', 'high'], lv)}</div>${f && f.oil > 0 ? `<div><div class="lbl">${t('oil_type')}</div><div class="seg">${['veg', 'kibbeh'].map(v => `<button class="${(it.oilType || f.oilType) === v ? 'on' : ''}" data-action="item-set" data-i="${i}" data-k="oilType" data-v="${v}">${v === 'veg' ? '🌻 ' + t('oil_veg_s') : '🧈 ' + t('oil_kibbeh_s')}</button>`).join('')}</div></div>` : '<div></div>'}</div>` : ''}
      ${(f ? f.salt : true) ? `<div class="ctl"><div class="lbl">${t('scan_salt')}</div>${seg('salt', ['low', 'normal', 'high'], lv)}</div>` : ''}
      ${f ? measureCtl(f, it, i) : ''}${f && F.methodGroup(f) ? `<div class="ctl"><div class="lbl">${t('scan_method')}</div><div class="chips">${F.METHODS[F.methodGroup(f)].map(([m]) => `<button class="chip sm ${it.method === m ? 'on' : ''}" data-action="item-method" data-i="${i}" data-v="${m}">${t('m_' + F.methodGroup(f) + '_' + m)}</button>`).join('')}</div></div>` : ''}
      <div class="ctl"><div class="lbl">${t('scan_ingredients')}</div><input class="in" style="min-height:38px;padding:8px 10px" data-action-input="item-ing" data-i="${i}" value="${esc(it.ingredients || '')}" placeholder="${f && f.id === 'shiro' ? 'chickpea flour, onion, oil, berbere' : '…'}">${it.cooking ? `<div class="tiny muted" style="margin-top:4px">${t('scan_cooking')}: ${esc(it.cooking)}</div>` : ''}</div>
      <div class="row between" style="margin-top:10px"><span class="small"><b>${R(n.kcal)}</b> kcal · <b>${R(n.c)}</b> g ${t('n_c')} · <b>${R(n.na)}</b> mg Na</span><button class="link small" data-action="open-picker" data-replace="${i}">⇄ ${t('scan_replace')}</button></div>
      ${f && f.note ? `<div class="tiny muted" style="margin-top:6px">💬 ${esc(tr(f.note))}</div>` : ''}
      <label class="check sm" style="margin-top:8px"><input type="checkbox" data-action-change="item-confirm" data-i="${i}" ${it.confirmed ? 'checked' : ''}><span class="small">${t('scan_confirm_item')}</span></label>
      <div class="tiny muted" style="margin-top:4px">${t('source')}: ${esc(f ? f.src : 'AI vision estimate')}</div></div>`;
  }
  function measureCtl(f, it, i) {
    const ms = F.measures(f); if (!ms.length) return '';
    const cur = ms.find(x => x.u === it.mu);
    return `<div class="ctl"><div class="lbl">${t('scan_eth_measure')}</div><div class="row wrap" style="gap:6px">${ms.map(x => `<button class="chip sm ${it.mu === x.u ? 'on' : ''}" data-action="item-measure" data-i="${i}" data-v="${x.u}">${t('u_' + x.u)}</button>`).join('')}
      ${cur ? `<span class="stepper"><button class="iconbtn sm" data-action="item-mstep" data-i="${i}" data-v="-1" aria-label="−">−</button><b>${it.mn} ${t('u_' + cur.u)}</b><button class="iconbtn sm" data-action="item-mstep" data-i="${i}" data-v="1" aria-label="+">+</button></span><span class="tiny muted">= ${E.frac(it.mult)} × ${esc(tr(f.base))}</span>` : ''}</div></div>`;
  }
  function pickerList(q) {
    let list = F.search(q);
    if (S.pickerCat !== 'all' && !q) list = list.filter(f => f.cat === S.pickerCat);
    return list.map(f => `<div class="food-row" data-action="pick-food" data-id="${f.id}"><div><div><b>${esc(fname(f))}</b> <span class="tiny muted">${esc(L() === 'am' ? f.name.en : f.name.am)}</span></div><div class="tiny muted">${esc(tr(f.base))}</div></div><div class="tiny muted" style="text-align:right;white-space:nowrap">${R(f.n.kcal)} kcal<br>${R(f.n.c)} g carb</div></div>`).join('') || `<p class="muted small center">—</p>`;
  }
  function openPicker(replaceIdx) {
    S.pickerMode = replaceIdx != null && replaceIdx !== '' ? +replaceIdx : 'add';
    openSheet(`<div class="row between"><h2 style="margin:0">${t(S.pickerMode === 'add' ? 'scan_add_food' : 'scan_replace')}</h2><button class="btn sm" data-action="close-sheet" id="pickerDone">${t('done')}</button></div>
      <input class="in" id="pickSearch" placeholder="${t('scan_search_ph')}" autocomplete="off" style="margin:10px 0">
      <div class="chips" id="pickCats" style="margin-bottom:6px">${['all', ...F.CATS].map(c => `<button class="chip sm ${S.pickerCat === c ? 'on' : ''}" data-action="pick-cat" data-v="${c}">${t('cat_' + c)}</button>`).join('')}</div>
      <div id="pickList">${pickerList('')}</div>`);
  }
  function addItem(foodId) { S.draft.items.push({ foodId, mult: 1, oil: 'normal', salt: 'normal', conf: null, ingredients: '' }); }
  function compressImage(file, maxDim, q) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => { const img = new Image(); img.onload = () => { const sc = Math.min(1, maxDim / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = R(img.width * sc); c.height = R(img.height * sc); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', q)); }; img.onerror = () => rej(new Error('image')); img.src = fr.result; };
      fr.onerror = () => rej(fr.error); fr.readAsDataURL(file);
    });
  }
  async function onPhoto(file) {
    if (!file) return;
    const low = settings().lowData, d = S.draft || (S.draft = newDraft());
    try {
      const big = await compressImage(file, low ? 512 : 1024, low ? 0.6 : 0.8);
      d.photo = await compressImage(file, 360, 0.6); d.err = null;
      if (AI.enabled()) {
        d.status = 'loading'; rerender();
        try { const items = await AI.recognize(big); d.items = d.items.concat(items); d.status = 'done'; if (!items.length) d.err = t('scan_ai_error', { e: 'no food found' }); }
        catch (e) { d.status = 'error'; d.err = t('scan_ai_error', { e: e.message }); }
        rerender(); if (d.status === 'error' || !d.items.length) openPicker();
      } else { rerender(); openPicker(); }
    } catch (e) { toast('Photo error: ' + e.message); }
  }
  function runAnalysis(items, meal, photo, savedId) {
    const a = E.analyze(items, profile(), meal);
    S.result = { a, items: JSON.parse(JSON.stringify(items)), meal, photo, savedId: savedId || null, ts: Date.now() };
    location.hash = '#/result';
  }

  /* ---------- RESULT ---------- */
  function rResult() {
    const { a, meal, savedId, items } = S.result, T = a.targets, tt = a.totals, sh = a.share;
    const icon = { good: '✅', adjust: '⚖️', alt: '🔄' }[a.verdict];
    const nc = (k, unit) => `<div class="nc"><div class="v">${CH.fmt(tt[k])}<span class="small muted"> ${unit}</span></div><div class="k">${t('n_' + k)}</div></div>`;
    const kc = { c: tt.c * 4, p: tt.p * 4, f: tt.f * 9 }, ks = kc.c + kc.p + kc.f || 1;
    const why = a.why.map(w => `<li class="${w.good ? 'good' : w.lvl === 2 ? 'l2' : w.lvl === 1 ? 'l1' : ''}">${esc(w.text)}</li>`).join('');
    return `<div class="row between"><h1>${t('res_title')}</h1><span class="pill info">${t('meal_' + meal)}</span></div>
      <div class="verdict ${a.verdict}" id="verdict"><div class="row"><span class="vi">${icon}</span><div><div class="vt">${t('verdict_' + a.verdict)}</div><div class="small">${t('verdict_' + a.verdict + '_d')}</div></div></div>
        <div class="tiny" style="margin-top:8px;opacity:.95">${esc(items.map(it => (it.foodId ? fname(F.byId[it.foodId]) : it.name) + ' (' + (it.mu && it.mn ? it.mn + ' ' + t('u_' + it.mu) : it.foodId ? portionLabel(F.byId[it.foodId], it.mult) : E.frac(it.mult) + '×') + ')').join(' · '))}</div></div>
      ${a.ethiopian ? `<div class="banner" style="background:#ecfdf5;color:#065f46;border:1px solid #a7f3d0">🇪🇹 ${t('res_traditional')}</div>` : ''}
      <div class="card"><h3>${t('res_why')} — ${t('res_for_you')}</h3><ul class="clean why">${why}</ul></div>
      ${a.tips.length ? `<div class="card"><h3>💡 ${t('res_tips')}</h3><ul class="clean">${a.tips.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      ${a.alts.length ? `<div class="card"><h3>🔁 ${t('res_alts')}</h3><ul class="clean">${a.alts.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      <h2>${t('res_breakdown')}</h2>
      <div class="card"><div class="donut-wrap">${CH.donut([{ v: kc.c, c: '#166534' }, { v: kc.p, c: '#f59e0b' }, { v: kc.f, c: '#7c3aed' }], 110)}
        <div class="legend"><div class="muted small">${t('res_macro')}</div><div><i style="background:#166534"></i>${t('n_c')} ${R(kc.c / ks * 100)}%</div><div><i style="background:#f59e0b"></i>${t('n_p')} ${R(kc.p / ks * 100)}%</div><div><i style="background:#7c3aed"></i>${t('n_f')} ${R(kc.f / ks * 100)}%</div><div style="font-weight:800;font-size:16px">${R(tt.kcal)} kcal</div></div></div></div>
      <div class="ncards">${nc('kcal', 'kcal')}${nc('p', 'g')}${nc('c', 'g')}${nc('s', 'g')}${nc('as', 'g')}${nc('f', 'g')}${nc('sf', 'g')}${nc('fb', 'g')}${nc('na', 'mg')}${nc('k', 'mg')}</div>
      <div class="card"><h3>${t('res_vs_meal')}</h3>
        ${CH.bar(t('n_c'), tt.c, a.carbGuide, 'g', true)}${CH.bar(t('n_na'), tt.na, T.na * sh, 'mg', true)}${CH.bar(t('n_sf'), tt.sf, T.sf * sh, 'g', true)}${CH.bar(t('n_kcal'), tt.kcal, T.kcal * sh, 'kcal', true)}${CH.bar(t('n_fb'), tt.fb, T.fb * sh, 'g', false)}</div>
      <div class="note">ℹ️ ${t('estimates_note')}</div><p class="tiny muted">${t('res_disclaimer')}</p>
      <div class="row" style="gap:10px;margin-top:8px">${savedId ? `<a class="btn ghost grow" href="#/diary">${t('nav_diary')}</a>` : `<button class="btn ghost" data-action="edit-meal">✎ ${t('edit')}</button><button class="btn grow" data-action="save-meal" id="saveMealBtn">${t('res_save')}</button>`}</div>`;
  }

  /* ---------- DIARY ---------- */
  function rDiary() {
    const pr = profile(), T = E.targets(pr), day = S.diaryDate, { ms, tot } = todaysTotals(day);
    const d = new Date(day + 'T12:00:00'); const isToday = day === dayKey(Date.now());
    return `<h1>${t('diary_title')}</h1>
      <div class="daynav"><button class="iconbtn" data-action="day" data-v="-1" aria-label="${t('diary_prev')}">‹</button><b>${isToday ? t('today') : d.toLocaleDateString(L() === 'am' ? 'am-ET' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</b><button class="iconbtn" data-action="day" data-v="1" ${isToday ? 'disabled' : ''} aria-label="${t('diary_next')}">›</button></div>
      <div class="card"><h3>${t('diary_totals')}</h3>
        ${CH.bar(t('n_kcal'), tot.kcal, T.kcal, 'kcal', true)}${CH.bar(t('n_c'), tot.c, T.c, 'g', true)}${CH.bar(t('n_as'), tot.as, T.as, 'g', true)}${CH.bar(t('n_na'), tot.na, T.na, 'mg', true)}${CH.bar(t('n_sf'), tot.sf, T.sf, 'g', true)}${CH.bar(t('n_fb'), tot.fb, T.fb, 'g', false)}${CH.bar(t('n_p'), tot.p, T.p, 'g', false)}${T.k ? CH.bar(t('n_k'), tot.k, T.k, 'mg', false) : ''}</div>
      ${ms.length ? ms.sort((a, b) => a.ts - b.ts).map(m => mealRow(m).replace('</div></div></div>', `</div><button class="link tiny" data-action="del-meal" data-id="${m.id}">🗑 ${t('del')}</button></div></div>`)).join('') : `<div class="card muted center small">${t('diary_empty')}<br><br><a class="btn sm" href="#/scan">+ ${t('dash_scan_cta')}</a></div>`}`;
  }

  /* ---------- NOLA AI (coach) ---------- */
  function chatList() { return window.NolaInsights.memOn('chat') ? DB.get('chat', []) : (S.chatMem || (S.chatMem = [])); }
  function saveChat(c) { c = c.slice(-60); if (window.NolaInsights.memOn('chat')) DB.set('chat', c); else S.chatMem = c; }
  function chatCard(m) {
    const c = m.card; if (!c) return '';
    if (c.status !== 'pending') return `<div class="ccard done">${c.status === 'saved' ? '✓ ' + t('nai_saved') : '— ' + t('nai_dismissed')}</div>`;
    let body = '';
    if (c.type === 'bp') body = md(t('nai_card_bp', { v: c.sys + '/' + c.dia + (c.pulse ? ' · ♥ ' + c.pulse : '') }));
    if (c.type === 'glucose') body = md(t('nai_card_g', { v: fmtG(c.mg) })) + `<div class="chips" style="margin-top:6px">${['fasting', 'before', 'after', 'random'].map(x => `<button class="chip sm ${c.ctx === x ? 'on' : ''}" data-action="card-ctx" data-id="${m.id}" data-v="${x}">${t('ctx_' + x)}</button>`).join('')}</div>`;
    if (c.type === 'weight') body = md(t('nai_card_w', { v: c.kg }));
    if (c.type === 'memory') body = md(t(c.kind === 'like' ? 'nai_card_like' : 'nai_card_dislike', { v: c.value }));
    return `<div class="ccard"><div class="small">${body}</div><div class="row" style="gap:8px;margin-top:8px"><button class="btn sm" data-action="card-save" data-id="${m.id}">✓ ${t('nai_confirm')}</button><button class="btn sm ghost" data-action="card-no" data-id="${m.id}">${t('nai_not_now')}</button></div></div>`;
  }
  function botMsg(m) {
    const why = m.why && m.why.length ? `<details class="why-box"><summary>💡 ${t('nai_why')}</summary><ul>${m.why.map(w => `<li>${esc(w)}</li>`).join('')}</ul></details>` : '';
    const links = (m.links || []).map(([to, lab]) => `<a class="btn sm soft" href="#/${to}">${esc(lab)} →</a>`).join(' ');
    return `<div class="msg bot" data-mid="${m.id || ''}"><div class="mt">${md(m.text)}</div>${chatCard(m)}${why}${links ? `<div class="row wrap" style="gap:6px;margin-top:8px">${links}</div>` : ''}${m.sources && m.sources.length ? `<span class="src">📚 ${esc(m.sources.join(' · '))}</span>` : ''}
      ${m.id && !m.card ? `<div class="msg-tools">${window.NolaVoice.ttsSupported ? `<button class="fbb" data-action="speak" data-id="${m.id}" aria-label="${t('voice_read')}">🔊</button>` : ''}${window.NolaFeatures.fbBtns('chat', m.id)}</div>` : ''}</div>`;
  }
  function rCoach() {
    const pr = profile(), chat = chatList(), ai = AI.enabled(), V = window.NolaVoice, s = settings();
    const qs = ['q_today', 'q_dinner', 'q_log_bp', 'q_report', 'q_breakfast', 'q_injera', 'q_fasting', 'q_soda'];
    return `<div class="row between"><h1>✨ ${t('coach_title')}</h1><span class="pill ${ai ? 'good' : 'info'}">${ai ? '✨ ' + t('coach_ai') : '📴 ' + t('coach_offline')}</span></div>
      <p class="tiny muted" style="margin-top:0">${t('coach_disclaimer')} ${chat.length ? `<button class="link tiny" data-action="clear-chat">↺ ${t('nai_clear')}</button>` : ''} ${window.NolaInsights.memOn('chat') ? '' : '· ' + t('nai_chat_not_saved')}</p>
      <div class="chat" id="chat"><div class="msg bot"><div class="mt">${md(t('coach_hello', { name: (pr.name || '').split(' ')[0], conds: condLabel(pr) }))}</div><div class="tiny muted" style="margin-top:6px">${t('nai_hello_extra')}</div></div>
        ${chat.map(m => m.role === 'user' ? `<div class="msg me">${esc(m.text)}</div>` : botMsg(m)).join('')}
        ${S.coachBusy ? `<div class="msg bot muted" id="thinking"><span class="dots"><i></i><i></i><i></i></span> ${t('coach_thinking')}</div>` : ''}<div id="chatEnd"></div></div>
      <div class="chatbar"><div class="sugg">${qs.map(q => `<button class="chip sm" data-action="ask" data-q="${esc(t(q))}">${t(q)}</button>`).join('')}</div>
        <form id="chatForm"><button type="button" class="iconbtn mic ${S.listening ? 'on' : ''}" data-action="mic" id="micBtn" aria-label="${t('voice_speak')}">🎤</button><input class="in" id="chatIn" placeholder="${t(S.listening ? 'voice_listening' : 'coach_ph')}" autocomplete="off" maxlength="600"><button class="btn" id="chatSend" ${S.coachBusy ? 'disabled' : ''}>${t('coach_send')}</button></form>
        <div class="row between tiny muted" style="margin-top:4px"><label class="row" style="gap:6px"><input type="checkbox" data-action-change="voice-replies" ${s.voiceReplies ? 'checked' : ''}> 🔊 ${t('voice_replies')}</label><span>${V.sttSupported ? (L() === 'am' ? 'am-ET' : 'en-US') : t('voice_no_stt')}</span></div></div>`;
  }
  function pushBot(chat, o) { const m = Object.assign({ id: uid(), role: 'bot', ts: Date.now() }, o); chat.push(m); return m; }
  async function ask(q) {
    q = (q || '').trim(); if (!q || S.coachBusy) return;
    const pr = profile(), chat = chatList().slice(), B = window.NolaBrain, unit = settings().unit;
    chat.push({ role: 'user', text: q, ts: Date.now() });
    const flag = E.checkText(q, unit), p = B.parse(q, unit);
    let speakMsg = null;
    if (flag) {
      speakMsg = pushBot(chat, { text: '🚨 ' + t('rf_title') + '\n' + flag.keys.map(k => t(k, { v: flag.v })).join('\n') + '\n' + t('rf_numbers'), sources: ['ADA', 'AHA'] });
      setTimeout(() => showAlert(flag), 200);
    }
    if (p && ['bp', 'glucose', 'weight'].includes(p.kind)) {
      pushBot(chat, { text: t('nai_heard_' + p.kind), card: Object.assign({ type: p.kind, status: 'pending' }, p) });
    } else if (p && (p.kind === 'like' || p.kind === 'dislike')) {
      pushBot(chat, { text: t('nai_heard_pref'), card: { type: 'memory', kind: p.kind, value: p.value, status: 'pending' } });
    } else if (p && p.kind === 'cmd' && !flag) {
      const c = p.cmd;
      if (c === 'scan') { pushBot(chat, { text: t('nai_open_scan') }); saveChat(chat); location.hash = '#/scan'; return; }
      if (c === 'record_bp' || c === 'record_glucose') { speakMsg = pushBot(chat, { text: t('nai_open_form') }); saveChat(chat); rerender(); readingSheet(c === 'record_bp' ? 'bp' : 'glucose'); return; }
      const r = c === 'today' ? B.today(pr) : c === 'dinner' ? B.dinner(pr) : c === 'report' ? B.report(pr, unit) : c === 'restaurant' ? { text: t('nai_restaurant'), why: B.personalWhy(pr), links: [['restaurant', t('hub_restaurant')]] } : { text: t('nai_budget'), why: [t('pl_why_cheap')], links: [['planner', t('hub_planner')]] };
      speakMsg = pushBot(chat, Object.assign({ topic: c }, r));
    } else if (!flag) {
      if (AI.enabled()) {
        saveChat(chat); S.coachBusy = true; rerender();
        try {
          const T = E.targets(pr), hist = chat.filter(m => m.text).slice(settings().lowData ? -4 : -10).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
          let txt = (await AI.chat([{ role: 'system', content: AI.coachSystem(pr, T, L()) + '\n' + B.context(pr, unit) }, ...hist])).trim();
          let why = []; const mm = txt.match(/\n\s*\**(Why|ለምን)\**\s*[:：]\s*([\s\S]+)$/i); if (mm) { why = [mm[2].trim()]; txt = txt.slice(0, mm.index).trim(); }
          speakMsg = pushBot(chat, { text: txt, why, sources: ['AI · ' + AI.cfg().model], topic: window.NolaCoach.detect(q) });
        } catch (e) {
          const a = B.answer(q, pr);
          speakMsg = pushBot(chat, { text: t('coach_err', { e: e.message }) + '\n\n' + a.text, sources: a.sources, why: a.why, topic: a.topic });
        }
        S.coachBusy = false;
      } else {
        const a = B.answer(q, pr);
        speakMsg = pushBot(chat, { text: a.text, sources: a.sources, why: a.why, topic: a.topic });
      }
    }
    saveChat(chat);
    if (S.route === 'coach') rerender();
    if (speakMsg && settings().voiceReplies) speak(speakMsg.text);
  }
  function speak(text) { if (!window.NolaVoice.speak(text, L())) toast(t('voice_no_tts')); }
  function cardAction(id, save) {
    const chat = chatList().slice(), m = chat.find(x => x.id === id); if (!m || !m.card || m.card.status !== 'pending') return;
    const c = m.card, B = window.NolaBrain, unit = settings().unit; c.status = save ? 'saved' : 'dismissed';
    let flag = null, g = null;
    if (save) {
      const rs = readings().slice(), now = Date.now();
      if (c.type === 'bp') { rs.push({ id: uid(), type: 'bp', ts: now, sys: c.sys, dia: c.dia, pulse: c.pulse || null, src: 'chat' }); DB.set('readings', rs); g = B.bpGuidance(c.sys, c.dia); flag = E.checkBP(c.sys, c.dia); }
      if (c.type === 'glucose') { rs.push({ id: uid(), type: 'glucose', ts: now, mg: c.mg, ctx: c.ctx || 'random', src: 'chat' }); DB.set('readings', rs); g = B.glucoseGuidance(c.mg, c.ctx || 'random', unit); flag = E.checkGlucose(c.mg, unit); }
      if (c.type === 'weight') { rs.push({ id: uid(), type: 'weight', ts: now, kg: c.kg, src: 'chat' }); DB.set('readings', rs); const pr = profile(); pr.weight = c.kg; DB.set('profile', pr); g = { text: t('nai_w_saved', { v: c.kg }), why: [t('nai_why_w')], sources: ['WHO'] }; }
      if (c.type === 'memory') { B.remember(c.kind, c.value); g = { text: t('nai_pref_saved', { v: c.value }), why: [t('nai_why_pref')] }; }
      if (g) pushBot(chat, Object.assign({ topic: c.type }, g));
    }
    saveChat(chat); rerender();
    if (flag) setTimeout(() => showAlert(flag), 250);
    if (g && settings().voiceReplies) speak(g.text);
  }

  /* ---------- ME / SETTINGS / LEARN ---------- */
  function rMe() {
    const pr = profile(), b = E.bmi(pr), T = E.targets(pr);
    const conds = (pr.conditions || []).filter(c => c !== 'none');
    return `<div class="card"><div class="row"><div class="avatar">${esc((pr.name || '?').trim()[0] || '?').toUpperCase()}</div><div><h2 style="margin:0">${esc(pr.name)}</h2><div class="small muted">${E.age(pr)} · ${pr.weight} kg · ${pr.height} cm · ${t('bmi')} ${b ?? '—'}</div></div></div>
      <div class="chips" style="margin-top:12px">${conds.length ? conds.map(c => `<span class="pill info">${t('c_' + c)}</span>`).join('') : `<span class="pill info">${t('conds_none')}</span>`}</div>
      <div class="small muted" style="margin-top:10px">${T.kcal} kcal · ${t('n_c')} ${T.c} g · ${t('n_na')} ${T.na} mg · ${t('n_sf')} ${T.sf} g · ${t('n_fb')} ${T.fb} g</div></div>
      ${window.NolaFeatures.hubGrid()}
      <h2>${t('hub_account')}</h2><div class="card tight">
        <button class="list-btn" data-action="edit-profile" id="editProfile"><span>👤 ${t('me_edit')}</span><span>›</span></button>
        <button class="list-btn" data-action="go" data-to="readings"><span>📈 ${t('me_readings')}</span><span>›</span></button>
        <button class="list-btn" data-action="go" data-to="learn"><span>🛡️ ${t('me_learn')}</span><span>›</span></button>
        <button class="list-btn" data-action="go" data-to="settings" id="openSettings"><span>⚙️ ${t('me_settings')}</span><span>›</span></button></div>
      <div class="card tight"><div class="row between"><span>🌐 ${t('set_language')}</span><div class="seg" style="width:180px"><button class="${L() === 'en' ? 'on' : ''}" data-action="set-lang" data-v="en">English</button><button class="${L() === 'am' ? 'on' : ''}" data-action="set-lang" data-v="am">አማርኛ</button></div></div></div>
      <p class="tiny muted">${t('disclaimer')}</p>`;
  }
  function rSettings() {
    const s = settings();
    return `<h1>${t('me_settings')}</h1>
      <div class="card"><div class="row between"><b>${t('set_language')}</b><div class="seg" style="width:180px"><button class="${L() === 'en' ? 'on' : ''}" data-action="set-lang" data-v="en">English</button><button class="${L() === 'am' ? 'on' : ''}" data-action="set-lang" data-v="am">አማርኛ</button></div></div>
        <div class="row between" style="margin-top:14px"><div><b>${t('set_lowdata')}</b><div class="tiny muted">${t('set_lowdata_d')}</div></div><label class="row"><input type="checkbox" id="lowData" data-action-change="lowdata" ${s.lowData ? 'checked' : ''} style="width:22px;height:22px;accent-color:#166534"></label></div>
        <div class="row between" style="margin-top:14px"><b>${t('set_textsize')}</b><div class="seg" style="width:200px" id="tsSeg">${['s', 'm', 'l', 'xl'].map(x => `<button class="${(DB.ui().textSize || 'm') === x ? 'on' : ''}" data-action="set-textsize" data-v="${x}" aria-label="${t('set_textsize')} ${x}">${{ s: 'A-', m: 'A', l: 'A+', xl: 'A++' }[x]}</button>`).join('')}</div></div>
        <div class="row between" style="margin-top:14px"><div><b>${t('voice_replies')}</b><div class="tiny muted">${window.NolaVoice.ttsSupported ? (window.NolaVoice.hasVoice(L()) ? t('voice_ok') : t('voice_no_tts')) : t('voice_no_tts')}</div></div><label class="row"><input type="checkbox" data-action-change="voice-replies" ${s.voiceReplies ? 'checked' : ''} style="width:22px;height:22px;accent-color:#166534"></label></div>
        <div class="row between" style="margin-top:14px"><b>${t('set_unit')}</b><div class="seg" style="width:180px"><button class="${s.unit === 'mg' ? 'on' : ''}" data-action="set-unit" data-v="mg">mg/dL</button><button class="${s.unit === 'mmol' ? 'on' : ''}" data-action="set-unit" data-v="mmol">mmol/L</button></div></div></div>
      <div class="card"><h3>✨ ${t('set_ai')}</h3><p class="tiny muted">${t('set_ai_d')}</p>
        <label class="f">${t('set_base')}</label><input class="in" id="aiBase" value="${esc(s.aiBase)}" placeholder="https://api.openai.com/v1">
        <label class="f">${t('set_key')}</label><input class="in" id="aiKey" type="password" value="${esc(s.aiKey)}" placeholder="sk-…" autocomplete="off">
        <label class="f">${t('set_model')}</label><input class="in" id="aiModel" value="${esc(s.aiModel)}" placeholder="gpt-4o-mini">
        <div class="row" style="margin-top:12px"><button class="btn grow" data-action="save-ai" id="saveAi">${t('save')}</button><button class="btn ghost" data-action="test-ai">${t('set_test')}</button></div><div id="aiStatus" class="small" style="margin-top:8px"></div></div>
      <div class="card tight"><button class="list-btn" data-action="export"><span>⬇️ ${t('set_export')} <span class="tiny muted">(${t('set_unencrypted')})</span></span><span>›</span></button>
        <button class="list-btn" data-action="go" data-to="privacy"><span>🔒 ${t('hub_privacy')}</span><span>›</span></button>
        <label class="list-btn" style="cursor:pointer"><span>⬆️ ${t('set_import')}</span><input type="file" id="importIn" accept="application/json" hidden><span>›</span></label>
        <button class="list-btn" data-action="reset" style="color:var(--red)"><span>🗑 ${t('set_reset')}</span><span>›</span></button></div>
      <div class="card"><h3>${t('about')}</h3><p class="small muted">NOLA HEALTH v${VERSION} · ${DB.usingIDB ? 'IndexedDB' : 'localStorage'} · ${'serviceWorker' in navigator && navigator.serviceWorker.controller ? t('offline_ready') : location.protocol === 'file:' ? 'file:// mode' : ''}</p><p class="tiny muted">${t('disclaimer')}</p></div>`;
  }
  function rLearn() {
    return `<h1>${t('learn_title')}</h1>
      <div class="card" style="border-left:4px solid var(--red)"><h3>🩺 ${t('learn_doctor')}</h3><ul class="clean">${DOCTOR.map(d => `<li>${esc(tr(d))}</li>`).join('')}</ul><a class="btn block callbtn" href="tel:907" style="margin-top:8px">📞 ${t('rf_call')}</a><p class="tiny muted">${t('rf_numbers')}</p></div>
      <h2>${t('learn_tips')}</h2>${TIPS.map(x => `<div class="card tight"><div>${esc(tr(x))}</div><div class="tiny muted" style="margin-top:4px">📚 ${x.src}</div></div>`).join('')}
      <div class="card"><h3>${t('learn_estimates')}</h3><p class="small">${t('learn_estimates_body')}</p></div>
      <div class="card"><h3>${t('learn_sources')}</h3><ul class="clean src-list">${SOURCES.map(s => `<li><a href="${s[1]}" target="_blank" rel="noopener">${s[0]}</a></li>`).join('')}</ul></div>`;
  }

  /* ---------- actions ---------- */
  const A = {
    'toggle-lang'() { setLang(L() === 'en' ? 'am' : 'en'); },
    'set-lang'(el) { setLang(el.dataset.v); },
    'close-alert'() { $('#alert').hidden = true; },
    'show-flag'(el) { showAlert(JSON.parse(el.dataset.flag)); },
    'close-sheet'() { closeSheet(); if (S.route === 'scan') rerender(); },
    go(el) { location.hash = '#/' + el.dataset.to; },
    'ob-next'() {
      if (!S.ob) obInit(false);
      const err = obValidate(); if (err) return toast(err);
      if (S.ob.step === OB_STEPS) return obFinish();
      S.ob.step++; route();
    },
    'ob-back'() { if (S.ob.edit && S.ob.step === 1) { S.ob = null; location.hash = '#/me'; return; } S.ob.step = Math.max(0, S.ob.step - 1); route(); },
    'ob-chip'(el) {
      const { k, v, multi } = el.dataset, d = S.ob.d;
      if (multi) { let arr = d[k] || []; arr = arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]; if (k === 'conditions') arr = v === 'none' ? (arr.includes('none') ? ['none'] : []) : arr.filter(x => x !== 'none'); d[k] = arr; }
      else d[k] = d[k] === v && k === 'gender' ? '' : v;
      rerender();
    },
    'add-reading'(el) { readingSheet(el.dataset.type); },
    'save-reading'(el) { saveReading(el.dataset.type); },
    'rd-ctx'(el) { el.parentNode.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === el)); },
    'rd-tab'(el) { S.rdTab = el.dataset.v; rerender(); },
    'del-reading'(el) { if (!confirm(t('del') + '?')) return; DB.set('readings', readings().filter(r => r.id !== el.dataset.id)); rerender(); },
    'set-meal'(el) { S.draft.meal = el.dataset.v; rerender(); },
    'scan-reset'() { S.draft = newDraft(); rerender(); },
    'open-picker'(el) { openPicker(el.dataset.replace); },
    'pick-cat'(el) { S.pickerCat = el.dataset.v; $('#pickCats').querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === el)); $('#pickSearch').value = ''; $('#pickList').innerHTML = pickerList(''); },
    'pick-food'(el) {
      const id = el.dataset.id;
      if (S.pickerMode === 'add' || S.pickerMode == null) { addItem(id); toast('+ ' + fname(F.byId[id])); el.style.background = '#e8f5ec'; }
      else { const it = S.draft.items[S.pickerMode]; Object.assign(it, { foodId: id, mult: 1, custom: null, name: null, oilType: undefined }); closeSheet(); rerender(); }
    },
    'quick-add'(el) { el.dataset.ids.split(',').forEach(addItem); rerender(); },
    'item-set'(el) { const it = S.draft.items[+el.dataset.i]; it[el.dataset.k] = el.dataset.k === 'mult' ? +el.dataset.v : el.dataset.v; if (el.dataset.k === 'mult') it.mu = null; rerender(); },
    'item-del'(el) { S.draft.items.splice(+el.dataset.i, 1); rerender(); },
    analyze() { const d = S.draft; if (!d.items.length) return; runAnalysis(d.items, d.meal, d.photo); },
    'edit-meal'() { location.hash = '#/scan'; },
    'save-meal'() {
      const r = S.result; if (r.savedId) return;
      const m = { id: uid(), ts: Date.now(), meal: r.meal, items: r.items, totals: r.a.totals, verdict: r.a.verdict, photo: settings().lowData ? null : r.photo };
      DB.set('meals', meals().concat([m])); r.savedId = m.id; S.draft = null; S.diaryDate = dayKey(m.ts);
      rerender(); toast(t('res_saved'));
    },
    'open-meal'(el, ev) { if (ev.target.closest('[data-action="del-meal"]')) return; const m = meals().find(x => x.id === el.dataset.id); if (m) runAnalysis(m.items, m.meal, m.photo, m.id); },
    'del-meal'(el) { if (!confirm(t('del') + '?')) return; DB.set('meals', meals().filter(m => m.id !== el.dataset.id)); toast(t('diary_deleted')); rerender(); },
    day(el) { const d = new Date(S.diaryDate + 'T12:00:00'); d.setDate(d.getDate() + +el.dataset.v); if (d > new Date()) return; S.diaryDate = dayKey(d); rerender(); },
    ask(el) { ask(el.dataset.q); },
    'clear-chat'() { saveChat([]); rerender(); },
    'card-save'(el) { cardAction(el.dataset.id, true); },
    'card-no'(el) { cardAction(el.dataset.id, false); },
    'card-ctx'(el) { const chat = chatList().slice(), m = chat.find(x => x.id === el.dataset.id); if (m && m.card) { m.card.ctx = el.dataset.v; saveChat(chat); rerender(); } },
    speak(el) { const m = chatList().find(x => x.id === el.dataset.id); if (m) speak(m.text); },
    mic() {
      const V = window.NolaVoice;
      if (!V.sttSupported) return toast(t('voice_no_stt'));
      if (S.listening) { V.stop(); return; }
      V.stopSpeaking(); S.listening = true; const b = $('#micBtn'); if (b) b.classList.add('on'); const inp = $('#chatIn'); if (inp) inp.placeholder = t('voice_listening');
      V.listen({ lang: L(), onResult: (txt) => { const i = $('#chatIn'); if (i) i.value = txt; },
        onEnd: (fin) => { S.listening = false; const b2 = $('#micBtn'); if (b2) b2.classList.remove('on'); const i = $('#chatIn'); const q = (fin || (i && i.value) || '').trim(); if (i) { i.value = ''; i.placeholder = t('coach_ph'); } if (q) ask(q); },
        onError: (e) => { S.listening = false; const b2 = $('#micBtn'); if (b2) b2.classList.remove('on'); toast(e === 'not-allowed' ? t('voice_denied') : e === 'language-not-supported' ? t('voice_lang_unsupported') : t('voice_error', { e })); } });
    },
    'set-textsize'(el) { DB.ui({ textSize: el.dataset.v }); applyTextSize(); rerender(); },
    'item-method'(el) {
      const it = S.draft.items[+el.dataset.i], f = F.byId[it.foodId], g = F.methodGroup(f), mm = g && F.METHODS[g].find(x => x[0] === el.dataset.v);
      if (!mm) return; it.method = it.method === mm[0] ? undefined : mm[0];
      Object.assign(it, { oil: 'normal', salt: 'normal', oilType: undefined }, it.method ? (({ extra, ...o }) => o)(mm[1]) : {}); rerender();
    },
    'item-measure'(el) { const it = S.draft.items[+el.dataset.i], ms = F.measures(F.byId[it.foodId]).find(x => x.u === el.dataset.v); if (!ms) return; if (it.mu === ms.u) { it.mu = null; rerender(); return; } it.mu = ms.u; it.mn = Math.max(1, Math.round(it.mult / ms.frac)); it.mult = Math.round(it.mn * ms.frac * 1000) / 1000; rerender(); },
    'item-mstep'(el) { const it = S.draft.items[+el.dataset.i], ms = F.measures(F.byId[it.foodId]).find(x => x.u === it.mu); if (!ms) return; it.mn = Math.max(1, (it.mn || 1) + +el.dataset.v); it.mult = Math.round(it.mn * ms.frac * 1000) / 1000; rerender(); },
    'edit-profile'() { obInit(true); location.hash = '#/onboarding'; },
    'set-unit'(el) { saveSettings({ unit: el.dataset.v }); const pr = profile(); pr.unit = el.dataset.v; DB.set('profile', pr); rerender(); },
    'save-ai'() { saveSettings({ aiBase: $('#aiBase').value.trim(), aiKey: $('#aiKey').value.trim(), aiModel: $('#aiModel').value.trim() }); toast(t('set_saved')); },
    async 'test-ai'() {
      A['save-ai'](); const st = $('#aiStatus'); st.textContent = '…';
      try { const r = await AI.chat([{ role: 'user', content: 'Reply with just: OK' }], { max_tokens: 5, timeout: 20000 }); st.textContent = t('set_test_ok') + ' (' + r.slice(0, 20) + ')'; st.style.color = 'var(--good)'; }
      catch (e) { st.textContent = t('set_test_fail', { e: e.message }); st.style.color = 'var(--red)'; }
    },
    export() {
      const data = DB.dump(); if (data.settings) data.settings.aiKey = '';
      const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }); const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'nola-health-' + dayKey(Date.now()) + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    },
    async reset() { if (!confirm(t('set_reset_q'))) return; await DB.clear(); S.draft = S.result = S.ob = null; location.hash = '#/onboarding'; route(); },
  };
  function setLang(l) { I18N.set(l); DB.ui({ lang: l }); if (!DB.locked) saveSettings({ lang: l }); document.documentElement.lang = l; rerender(); }
  function applyTextSize() { const ts = DB.ui().textSize || 'm'; document.documentElement.dataset.ts = ts; }

  document.addEventListener('click', ev => {
    const el = ev.target.closest('[data-action]'); if (!el) return;
    if (el.id === 'sheet' || el.id === 'alert') return;
    const fn = A[el.dataset.action]; if (!fn) return;
    if (el.tagName === 'BUTTON' || el.tagName === 'A') ev.preventDefault();
    fn(el, ev);
  });
  $('#sheet').addEventListener('click', ev => { if (ev.target.id === 'sheet') A['close-sheet'](); });
  document.addEventListener('input', ev => {
    const el = ev.target;
    if (el.dataset.bind && S.ob) {
      S.ob.d[el.dataset.bind] = el.type === 'checkbox' ? el.checked : el.value;
      if (['weight', 'height'].includes(el.dataset.bind)) { const b = E.bmi(S.ob.d); const bl = $('#bmiLive'); if (bl) bl.innerHTML = b ? `${t('bmi')}: <b>${b}</b> — ${t('bmi_' + E.bmiCat(b))}` : ''; }
      if (el.dataset.bind === 'dob' && el.value) { const a = E.age({ dob: el.value }); S.ob.d.age = a; const ai = $('#ob_age'); if (ai) ai.value = a; }
    }
    if (el.dataset.actionInput === 'item-ing') S.draft.items[+el.dataset.i].ingredients = el.value;
    if (el.id === 'pickSearch') $('#pickList').innerHTML = pickerList(el.value);
  });
  document.addEventListener('change', ev => {
    const el = ev.target;
    if (el.id === 'camIn' || el.id === 'upIn') onPhoto(el.files[0]);
    if (el.dataset.actionChange === 'voice-replies') { saveSettings({ voiceReplies: el.checked }); toast(t('set_saved')); if (!el.checked) window.NolaVoice.stopSpeaking(); }
    if (el.dataset.actionChange === 'item-confirm') { S.draft.items[+el.dataset.i].confirmed = el.checked; rerender(); }
    if (el.dataset.actionChange === 'lowdata') { saveSettings({ lowData: el.checked }); document.body.classList.toggle('lowdata', el.checked); toast(t('set_saved')); }
    if (el.id === 'importIn' && el.files[0]) { const fr = new FileReader(); fr.onload = () => { try { const d = JSON.parse(fr.result); ['profile', 'meals', 'readings', 'chat', 'glogs', 'memory', 'feedback', 'plan', 'shopping', 'prices', 'academy', 'activities', 'checkups', 'badges', 'shares', 'supporting', 'restaurant'].forEach(k => { if (d[k]) DB.set(k, d[k]); }); if (d.settings) saveSettings(Object.assign({}, d.settings, { aiKey: settings().aiKey })); toast(t('set_imported')); location.hash = '#/home'; route(); } catch (e) { toast('Invalid file'); } }; fr.readAsText(el.files[0]); }
  });
  document.addEventListener('submit', ev => { if (ev.target.id === 'chatForm') { ev.preventDefault(); const i = $('#chatIn'); const q = i.value; i.value = ''; ask(q); } });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape') { if (!$('#alert').hidden) $('#alert').hidden = true; else if (!$('#sheet').hidden) A['close-sheet'](); } });
  window.addEventListener('hashchange', route);
  function net() { $('#netBadge').hidden = navigator.onLine; }
  window.addEventListener('online', net); window.addEventListener('offline', net);

  function applySettings() { const st = settings(); I18N.set(DB.ui().lang || st.lang); document.documentElement.lang = I18N.lang; document.body.classList.toggle('lowdata', !!st.lowData); }
  function afterUnlock() { applySettings(); if (!location.hash || location.hash === '#/lock') location.hash = '#/home'; route(); }
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { hiddenAt = Date.now(); window.NolaVoice && window.NolaVoice.stopSpeaking(); return; }
    if (DB.encrypted && !DB.locked && settings().autoLock && hiddenAt && Date.now() - hiddenAt > 5 * 6e4) DB.flush().then(() => location.reload());
  });
  async function boot() {
    applyTextSize(); I18N.set(DB.ui().lang || 'en');
    await DB.init();
    if (!DB.locked) applySettings();
    net(); route();
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      const had = !!navigator.serviceWorker.controller; let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => { if (had && !reloaded && !S.coachBusy && !(S.draft && S.draft.items.length)) { reloaded = true; DB.flush().then(() => location.reload()); } });
      navigator.serviceWorker.register('sw.js').then(r => r.update && r.update()).catch(() => {});
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else setTimeout(boot, 0);
  window.NolaApp = { S, ROUTES, A, VERSION, route, rerender, ask, toast, openSheet, closeSheet, showAlert, md, esc, uid, dayKey, profile, settings, saveSettings, meals, readings,
    defaultMeal, condLabel, newDraft, openPicker, compressImage, runAnalysis, readingSheet, chatList, afterUnlock, applyTextSize, latest };
})();
