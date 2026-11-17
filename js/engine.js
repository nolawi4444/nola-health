/* NOLA HEALTH engine: targets, meal nutrition, personalised analysis, red flags. Pure functions. */
(function () {
  const NUTS = ['kcal', 'p', 'c', 's', 'as', 'f', 'sf', 'fb', 'na', 'k'];
  const DM = ['t1d', 't2d', 'dm_unknown', 'pre', 'gdm'];
  const has = (pr, c) => !!(pr && pr.conditions && pr.conditions.includes(c));
  const hasAny = (pr, arr) => arr.some(c => has(pr, c));
  const isDiabetic = pr => hasAny(pr, DM);
  const r = (x, d = 0) => { const m = Math.pow(10, d); return Math.round((x || 0) * m) / m; };

  function age(pr) {
    if (pr.dob) { const d = new Date(pr.dob); if (!isNaN(d)) { const n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--; if (a > 0 && a < 120) return a; } }
    return +pr.age || 40;
  }
  function bmi(pr) { const h = (+pr.height || 0) / 100; return h > 0 && pr.weight ? r(pr.weight / (h * h), 1) : null; }
  function bmiCat(b) { return b == null ? null : b < 18.5 ? 'under' : b < 25 ? 'normal' : b < 30 ? 'over' : 'obese'; }

  function targets(pr) {
    const w = +pr.weight || 70, h = +pr.height || 165, a = age(pr);
    const sexAdj = pr.gender === 'male' ? 5 : pr.gender === 'female' ? -161 : -78;
    const bmr = 10 * w + 6.25 * h - 5 * a + sexAdj;
    const af = { sed: 1.2, light: 1.375, mod: 1.55, active: 1.725 }[pr.activity || 'light'] || 1.375;
    let kcal = bmr * af;
    const goals = pr.goals || [];
    const b = bmi(pr);
    const loss = goals.includes('lose') || (has(pr, 'obesity') && !goals.includes('maintain') && !goals.includes('gain')); // v3.1: never inferred from BMI alone
    const minK = pr.gender === 'male' ? 1500 : pr.gender === 'female' ? 1200 : 1350;
    if (loss) kcal = Math.max(minK, kcal - 500);
    else if (goals.includes('gain')) kcal += 300;
    kcal = Math.round(kcal / 50) * 50;
    const dm = isDiabetic(pr);
    const carbPct = dm ? 40 : has(pr, 'obesity') || loss ? 45 : 50;
    const lowNa = hasAny(pr, ['htn', 'heart']) || (pr.restrictions || []).includes('lowsalt');
    const sfPct = hasAny(pr, ['chol', 'heart']) ? 6 : 10;
    const asCap = Math.min(dm ? 25 : pr.gender === 'male' ? 36 : pr.gender === 'female' ? 25 : 30, Math.round(kcal * 0.1 / 4));
    return {
      kcal, carbPct, c: Math.round(kcal * carbPct / 100 / 4), na: lowNa ? 1500 : 2000, naSrc: lowNa ? 'AHA' : 'WHO',
      sfPct, sfSrc: sfPct === 6 ? 'AHA' : 'WHO', sf: Math.round(kcal * sfPct / 100 / 9), fb: Math.max(25, Math.round(kcal / 1000 * 14)),
      as: asCap, p: Math.round(w * (loss ? 1.0 : 0.8)), k: has(pr, 'kidney') ? null : 3500, loss, dm,
    };
  }

  /* ---- meal math ---- */
  const OIL_F = { low: -0.5, normal: 0, high: 0.6 }, SALT_F = { low: 0.6, normal: 1, high: 1.5 }, SAT_FRAC = { veg: 0.15, kibbeh: 0.62 };
  function itemNutrition(it) {
    const food = it.foodId && window.NolaFoods.byId[it.foodId];
    const base = food ? food.n : (it.custom || {});
    const m = +it.mult || 1;
    const out = {}; NUTS.forEach(k => out[k] = (+base[k] || 0) * m);
    const oilBase = (food ? food.oil : (it.custom && it.custom.oilG) || 0) * m;
    if (oilBase > 0) {
      const lvl = OIL_F[it.oil || 'normal'];
      const newOil = oilBase * (1 + lvl);
      const defType = food ? food.oilType : 'veg';
      const ty = it.oilType || defType;
      out.f += newOil - oilBase; out.kcal += (newOil - oilBase) * 9;
      out.sf += newOil * SAT_FRAC[ty] - oilBase * SAT_FRAC[defType];
      out.sf = Math.max(0, out.sf);
    }
    if ((food ? food.salt : true) && it.salt) out.na *= SALT_F[it.salt] || 1;
    if (food && it.method) {
      const g = window.NolaFoods.methodGroup(food), mm = g && window.NolaFoods.METHODS[g].find(x => x[0] === it.method);
      if (mm && mm[1].extra) Object.keys(mm[1].extra).forEach(k => { out[k] += mm[1].extra[k] * m; });
    }
    return out;
  }
  function mealTotals(items) {
    const t = {}; NUTS.forEach(k => t[k] = 0);
    items.forEach(it => { const n = itemNutrition(it); NUTS.forEach(k => t[k] += n[k]); });
    return t;
  }

  /* ---- personalised analysis ---- */
  function analyze(items, pr, mealType) {
    const T = targets(pr), tot = mealTotals(items), dm = isDiabetic(pr);
    const share = mealType === 'snack' ? 0.15 : 0.33;
    const level = (val, daily) => { const g = daily * share; return val > g * 1.9 ? 2 : val > g * 1.25 ? 1 : 0; };
    const pct = (v, d) => Math.round(v / d * 100);
    const why = [], tips = new Set(), alts = new Set();
    let sev = 0; const bump = s => { sev = Math.max(sev, s); };
    const foods = items.map(it => ({ it, f: it.foodId ? window.NolaFoods.byId[it.foodId] : null, n: itemNutrition(it) }));
    const name = x => x.f ? x.f.name[window.I18N.lang] || x.f.name.en : (x.it.name || '?');
    const contrib = (key, frac) => foods.filter(x => tot[key] > 0 && x.n[key] / tot[key] >= frac);

    // Carbs & glucose
    const carbGuide = Math.round(T.c * (mealType === 'snack' ? 0.15 : 0.3));
    if (dm) {
      const effC = tot.c - (tot.fb > 5 ? tot.fb / 2 : 0); // ADA carb counting: subtract half the fiber when >5 g
      const cl = effC > carbGuide * 1.8 ? 2 : effC > carbGuide * 1.3 ? 1 : 0;
      why.push({ lvl: cl, text: t(['a_carb_ok', 'a_carb_mod', 'a_carb_high'][cl], { c: r(tot.c), t: carbGuide }) });
      bump(cl);
      if (has(pr, 't1d') || /insulin|ኢንሱሊን/i.test(pr.meds || '')) why.push({ lvl: -1, text: t('a_carb_insulin') });
      if (tot.fb >= 8) why.push({ lvl: -1, good: true, text: t('a_fiber_good', { fb: r(tot.fb), net: r(effC) }) });
      const fast = foods.filter(x => x.f && x.f.gi === 'high' && x.n.c >= 15);
      if (fast.length && cl > 0) why.push({ lvl: 1, text: t('a_gi_high', { items: fast.map(name).join(', ') }) });
      if (cl > 0) {
        const inj = foods.find(x => x.f && x.f.id.startsWith('injera') && x.it.mult >= 0.5);
        if (inj) {
          const perOne = inj.f.n.c, excess = effC - carbGuide * 1.1;
          let reduce = Math.ceil(excess / perOne / 0.25) * 0.25;
          const n = Math.max(0.5, inj.it.mult - Math.max(0.25, reduce));
          if (n < inj.it.mult) 
          tips.add(t('tip_injera', { n: frac(n), m: frac(inj.it.mult) }));
          if (inj.f.id === 'injera_white') { tips.add(t('tip_white_injera')); alts.add('alt_white'); }
        }
        tips.add(t('tip_order')); tips.add(t('tip_walk'));
        if (tot.fb < 6) tips.add(t('tip_veg'));
      }
    } else if (tot.c > carbGuide * 2.2 && (has(pr, 'obesity') || T.loss)) {
      why.push({ lvl: 1, text: t('a_carb_mod', { c: r(tot.c), t: carbGuide }) }); bump(1);
    }
    // Added sugar
    const asLvl = tot.as >= (dm ? 15 : 25) ? (dm ? 2 : 1) : tot.as >= (dm ? 6 : 15) ? 1 : 0;
    if (asLvl) { why.push({ lvl: asLvl, text: t('a_sugar', { as: r(tot.as) }) }); bump(asLvl); }
    if (foods.some(x => x.f && ['soda', 'juice_mix', 'buna_sugar', 'shai_sugar'].includes(x.f.id))) { tips.add(t('tip_drink')); if (asLvl) alts.add('alt_soda'); }
    if (foods.some(x => x.f && x.f.id === 'juice_orange') && dm) { alts.add('alt_juice'); tips.add(t('tip_drink')); }
    if (dm && foods.some(x => x.f && ['chechebsa', 'genfo'].includes(x.f.id))) tips.add(t('tip_honey'));

    // Sodium
    const naWatch = hasAny(pr, ['htn', 'heart']) || (pr.restrictions || []).includes('lowsalt');
    let nl = level(tot.na, T.na);
    if (!naWatch) nl = tot.na > T.na * 0.6 ? 1 : 0;
    if (naWatch || nl) {
      why.push({ lvl: nl, text: t(['a_na_ok', 'a_na_mod', 'a_na_high'][nl], { na: r(tot.na), t: T.na, pct: pct(tot.na, T.na) }) });
      bump(nl);
      if (nl && foods.some(x => !x.f || x.f.salt)) tips.add(t('tip_salt'));
      if (naWatch && tot.k >= 900 && !has(pr, 'kidney')) why.push({ lvl: -1, good: true, text: t('a_k_good', { k: r(tot.k) }) });
    }
    // Saturated fat
    const sfWatch = hasAny(pr, ['chol', 'heart']);
    let sl = level(tot.sf, T.sf);
    if (!sfWatch) sl = tot.sf > T.sf * 0.75 ? 1 : 0;
    if (sfWatch || sl) {
      why.push({ lvl: sl, text: t(['a_sf_ok', 'a_sf_mod', 'a_sf_high'][sl], { sf: r(tot.sf, 1), t: T.sf, pct: pct(tot.sf, T.sf) }) });
      bump(sl);
      if (sl) {
        if (foods.some(x => (x.it.oilType || (x.f && x.f.oilType)) === 'kibbeh' && x.f && x.f.oil)) tips.add(t('tip_kibbeh'));
        contrib('sf', 0.3).forEach(x => {
          if (!x.f) return; const id = x.f.id;
          if (['kitfo', 'gored'].includes(id)) alts.add('alt_kitfo');
          else if (['key_wot', 'doro', 'dulet', 'tibs'].includes(id)) alts.add('alt_meat');
          else if (id === 'chechebsa') alts.add('alt_chechebsa');
          else if (['genfo', 'kinche'].includes(id)) alts.add('alt_genfo');
          else if (['burger', 'pizza'].includes(id)) alts.add('alt_burger');
        });
      }
    }
    // Calories / weight
    const wWatch = has(pr, 'obesity') || T.loss;
    let kl = level(tot.kcal, T.kcal);
    if (!wWatch) kl = tot.kcal > T.kcal * 0.6 ? 1 : 0;
    if (wWatch || kl) {
      why.push({ lvl: kl, text: t(['a_kcal_ok', 'a_kcal_mod', 'a_kcal_high'][kl], { kcal: r(tot.kcal), t: T.kcal, pct: pct(tot.kcal, T.kcal) }) });
      bump(kl);
      if (kl) {
        tips.add(t('tip_split'));
        if (foods.some(x => x.f && x.f.oil >= 8)) tips.add(t('tip_oil'));
        contrib('kcal', 0.3).forEach(x => { if (!x.f) return; const id = x.f.id;
          if (id === 'fries') alts.add('alt_fries'); if (['burger', 'pizza'].includes(id)) alts.add('alt_burger'); if (id === 'chechebsa') alts.add('alt_chechebsa'); if (id === 'genfo') alts.add('alt_genfo'); if (id === 'rice') alts.add('alt_rice'); });
      }
    }
    if (dm && sev > 0) contrib('c', 0.35).forEach(x => { if (!x.f) return; const id = x.f.id;
      if (id === 'rice') alts.add('alt_rice'); if (['bread_white', 'dabo', 'kita'].includes(id)) alts.add('alt_bread'); if (id === 'fries') alts.add('alt_fries'); if (id === 'chechebsa') alts.add('alt_chechebsa'); });

    // Protein (main meals)
    if (mealType !== 'snack' && tot.p < 12 && tot.kcal > 250) { why.push({ lvl: -1, text: t('a_protein_low') }); tips.add(t('tip_protein')); }
    // Alcohol
    if (foods.some(x => x.f && x.f.tags.includes('alcohol'))) { why.push({ lvl: 1, text: t('a_alcohol') }); bump(1); alts.add('alt_alcohol'); }
    // Allergies
    const allergies = pr.allergies || [];
    const hit = new Set();
    foods.forEach(x => { if (x.f) x.f.allergens.forEach(a => { if (allergies.includes(a)) hit.add(a); }); if (x.f && allergies.includes('legume') && x.f.tags.includes('legume')) hit.add('legume'); });
    if (hit.size) { why.unshift({ lvl: 2, text: t('a_allergy', { a: [...hit].map(a => t('a_' + a)).join(', ') }) }); bump(2); }
    // Fasting / raw / kidney notes (informational)
    const rs = pr.restrictions || [];
    if ((rs.includes('fasting') || rs.includes('vegan')) && foods.some(x => x.f && !x.f.tags.includes('fasting') && !x.f.tags.includes('vegan'))) why.push({ lvl: -1, text: t('a_fasting') });
    if (foods.some(x => x.f && x.f.tags.includes('raw') && x.it.method !== 'yebesele')) why.push({ lvl: -1, text: t('a_raw') });
    if (has(pr, 'kidney')) why.push({ lvl: -1, text: t('a_kidney') });
    // v3.1: cautious condition notes + well-established medicine–food notes (informational only)
    const ids = new Set(foods.filter(x => x.f).map(x => x.f.id)), tg = tag => foods.some(x => x.f && x.f.tags.includes(tag));
    const alcohol = tg('alcohol'), teaCoffee = ['buna', 'buna_sugar', 'shai', 'shai_sugar', 'macchiato'].some(i => ids.has(i));
    if (has(pr, 'liver')) { why.push({ lvl: alcohol ? 2 : -1, text: t(alcohol ? 'a_liver_alcohol' : 'a_liver') }); if (alcohol) bump(2); }
    if (has(pr, 'anemia')) {
      const iron = foods.filter(x => x.f && (x.f.tags.includes('legume') || x.f.tags.includes('meat') || ['gomen', 'tikil_gomen', 'ayib_gomen', 'gomen_besiga', 'injera_teff', 'fosolia'].includes(x.f.id))).map(name);
      const vitC = ['timatim', 'orange', 'juice_orange', 'guava', 'mango', 'papaya', 'selata', 'atkilt'].some(i => ids.has(i));
      if (iron.length) why.push({ lvl: -1, good: true, text: t(vitC ? 'a_anemia_iron_c' : 'a_anemia_iron', { items: [...new Set(iron)].slice(0, 3).join(', ') }) });
      else why.push({ lvl: -1, text: t('a_anemia') });
      if (teaCoffee) why.push({ lvl: -1, text: t('a_anemia_tea') });
    }
    const MD = window.NolaMeds, ml = (pr.medList || []).map(m => MD && (m.medId ? MD.byId[m.medId] : MD.find(m.name))).filter(Boolean), mc = c => ml.some(m => c.includes(m.cls));
    const dairy = foods.some(x => x.f && ((x.f.allergens || []).includes('dairy') || ['milk', 'ayib', 'ergo', 'ayib_gomen'].includes(x.f.id)));
    const vitK = ['gomen', 'tikil_gomen', 'ayib_gomen', 'gomen_besiga', 'selata'].some(i => ids.has(i));
    const mnote = k => why.push({ lvl: -1, med: true, text: '💊 ' + t(k) + ' ' + t('mn_ask') });
    if (alcohol && mc(['biguanide', 'sulfonylurea', 'insulin'])) mnote('mn_alcohol_dm');
    if (alcohol && mc(['nitroimidazole'])) mnote('mn_no_alcohol');
    if (alcohol && mc(['warfarin', 'analgesic', 'tb'])) mnote('mn_alcohol_gen');
    if (vitK && mc(['warfarin'])) mnote('mn_vitk');
    if (teaCoffee && mc(['iron'])) mnote('mn_iron_tea');
    if (dairy && mc(['quinolone', 'tetracycline'])) mnote('mn_dairy_abx');

    if (sev === 0 && !tips.size && dm) tips.add(t('tip_walk'));
    const verdict = ['good', 'adjust', 'alt'][sev];
    const ethiopian = foods.some(x => x.f && !['rice', 'rice_brown', 'pasta', 'pasta_sauce', 'bread_white', 'bread_whole', 'fries', 'burger', 'pizza', 'soda', 'water', 'chicken', 'milk', 'banana', 'apple', 'orange', 'mango', 'papaya', 'avocado', 'juice_orange'].includes(x.f.id));
    return { verdict, totals: tot, targets: T, carbGuide, share, allergy: [...hit], why, tips: [...tips], alts: [...alts].map(k => t(k)), ethiopian };
  }

  function frac(x) {
    const w = Math.floor(x), f = x - w;
    const fs = Math.abs(f - 0.25) < 0.01 ? '¼' : Math.abs(f - 0.5) < 0.01 ? '½' : Math.abs(f - 0.75) < 0.01 ? '¾' : f > 0.01 ? String(r(f, 2)).slice(1) : '';
    return (w ? w : (fs ? '' : '0')) + fs;
  }

  /* ---- red flags ---- */
  function toMgdl(v, unit) { return unit === 'mmol' ? v * 18 : v; }
  function fmtGlucose(mg, unit) { return unit === 'mmol' ? r(mg / 18, 1) + ' mmol/L' : Math.round(mg) + ' mg/dL'; }
  function checkGlucose(mg, unit) {
    const v = fmtGlucose(mg, unit);
    if (mg < 70) return { level: 'emergency', keys: ['rf_glucose_low'], v };
    if (mg > 300) return { level: 'emergency', keys: ['rf_glucose_high'], v };
    if (mg >= 250) return { level: 'warn', keys: ['warn_glucose'], v };
    return null;
  }
  function checkBP(sys, dia) {
    const v = sys + '/' + dia;
    if (sys >= 180 || dia >= 120) return { level: 'emergency', keys: ['rf_bp_crisis'], v };
    if (sys >= 160 || dia >= 100) return { level: 'warn', keys: ['warn_bp'], v };
    return null;
  }
  const TEXT_FLAGS = [
    ['rf_chest', /chest\s*(pain|pressure|tight)|heart attack|pain in my chest|የደረት\s*ህመም|ደረቴን|ደረቴ\s*(ያመኛል|ይጫነኛል)/i],
    ['rf_stroke', /stroke|face\s*(is\s*)?droop|slurred|can'?t\s*(speak|talk|move my arm)|numb(ness)?\s*(on\s*)?one side|weak(ness)? on one side|ስትሮክ|ፊቴ\s*ተጣመመ|መናገር\s*አልቻልኩም|አንድ\s*ጎኔ/i],
    ['rf_breath', /can'?t\s*breathe|cannot\s*breathe|difficulty\s*breathing|short(ness)?\s*of\s*breath|struggling to breathe|መተንፈስ\s*አልቻልኩም|ትንፋሽ\s*አጠረኝ/i],
    ['rf_faint', /faint(ed|ing)?|passed\s*out|unconscious|seizure|convuls|very confused|ራሴን\s*ሳትኩ|ራሱን\s*ሳተ|ራሷን\s*ሳተች|ተዝለፈለፍኩ|የሚጥል/i],
    ['rf_blood', /vomit(ing|ed)?\s*blood|black\s*(tarry\s*)?stool|blood in (my )?stool|ደም\s*አስታወ/i],
    ['rf_dka', /fruity\s*breath|ketone|(vomit|throwing up).{0,40}(sugar|glucose)|(sugar|glucose).{0,40}(vomit|throwing up)/i],
  ];
  function checkText(text, unit) {
    const out = [];
    TEXT_FLAGS.forEach(([k, re]) => { if (re.test(text)) out.push(k); });
    const bp = text.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
    let extra = null;
    if (bp) { const c = checkBP(+bp[1], +bp[2]); if (c && c.level === 'emergency') extra = c; }
    const g = text.match(/(sugar|glucose|bg|ስኳር)[^\d]{0,25}(\d{1,3}(?:\.\d)?)/i);
    if (g) {
      let v = parseFloat(g[2]); const mm = /mmol/i.test(text) || (v < 35 && g[2].includes('.')) || (unit === 'mmol' && v < 35);
      const mg = mm ? v * 18 : v;
      if (mg > 20) { const c = checkGlucose(mg, mm ? 'mmol' : 'mg'); if (c && c.level === 'emergency') extra = c; }
    }
    if (!out.length && !extra) return null;
    return { level: 'emergency', keys: [...(extra ? extra.keys : []), ...out], v: extra ? extra.v : '' };
  }

  window.NolaEngine = { NUTS, targets, bmi, bmiCat, age, itemNutrition, mealTotals, analyze, frac, checkGlucose, checkBP, checkText, toMgdl, fmtGlucose, isDiabetic, has, r };
})();
