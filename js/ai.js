/* Optional AI via any OpenAI-compatible /chat/completions endpoint. Key stays on device. */
(function () {
  function cfg() { const s = window.NolaDB.get('settings', {}); return { base: (s.aiBase || '').replace(/\/+$/, ''), key: s.aiKey || '', model: s.aiModel || '', lowData: !!s.lowData }; }
  function enabled() { const c = cfg(); return !!(c.base && c.key && c.model); }
  async function chat(messages, opts = {}) {
    const c = cfg();
    if (!enabled()) throw new Error('AI not configured');
    const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), opts.timeout || 45000);
    try {
      const res = await fetch(c.base + '/chat/completions', {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + c.key },
        body: JSON.stringify({ model: c.model, messages, temperature: opts.temperature ?? 0.3, max_tokens: opts.max_tokens || (c.lowData ? 500 : 900) }),
      });
      if (!res.ok) { let m = res.status + ''; try { const j = await res.json(); m += ' ' + ((j.error && j.error.message) || '').slice(0, 120); } catch (e) {} throw new Error(m); }
      const j = await res.json();
      const txt = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      if (!txt) throw new Error('empty response');
      return Array.isArray(txt) ? txt.map(p => p.text || '').join('') : txt;
    } catch (e) { if (e.name === 'AbortError') throw new Error('timeout'); throw e; } finally { clearTimeout(to); }
  }
  function parseJSON(txt) {
    const s = txt.replace(/```(?:json)?/gi, '').trim();
    const a = s.indexOf('{'), b = s.lastIndexOf('}');
    return JSON.parse(a >= 0 ? s.slice(a, b + 1) : s);
  }
  async function recognize(dataUrl) {
    const list = window.NolaFoods.FOODS.map(f => `${f.id}: ${f.name.en} [base: ${f.base.en}]`).join('\n');
    const sys = 'You are a food-recognition assistant specialised in Ethiopian and East African food as well as international dishes. Identify each distinct food or drink in the photo. Be honest about uncertainty. Reply with JSON only, no prose.';
    const prompt = `Identify the foods in this meal photo. Prefer matching to these local database ids (portion_multiplier is relative to the base portion shown):\n${list}\n\nReturn exactly: {"foods":[{"name":"","db_id":"id or null","portion_multiplier":1,"portion_desc":"","confidence":0.0,"cooking_method":"","ingredients":[""],"oil_level":"low|normal|high","nutrition":{"kcal":0,"p":0,"c":0,"s":0,"as":0,"f":0,"sf":0,"fb":0,"na":0,"k":0}}]}\nnutrition = your estimate for the portion shown (grams/mg). Injera underneath stews counts as its own item. confidence 0-1. If no food is visible return {"foods":[]}.`;
    const txt = await chat([{ role: 'system', content: sys }, { role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: dataUrl, detail: cfg().lowData ? 'low' : 'auto' } }] }], { max_tokens: 1200, timeout: 60000, temperature: 0.1 });
    const j = parseJSON(txt);
    return (j.foods || []).map(x => {
      const f = (x.db_id && window.NolaFoods.byId[x.db_id]) || window.NolaFoods.match(x.name);
      const mult = Math.max(0.25, Math.min(4, Math.round((+x.portion_multiplier || 1) * 4) / 4));
      const it = { conf: Math.max(0, Math.min(1, +x.confidence || 0.5)), oil: ['low', 'normal', 'high'].includes(x.oil_level) ? x.oil_level : 'normal', salt: 'normal', ingredients: Array.isArray(x.ingredients) ? x.ingredients.filter(Boolean).join(', ') : String(x.ingredients || ''), cooking: x.cooking_method || '', aiName: x.name, portionDesc: x.portion_desc || '' };
      if (f) return Object.assign(it, { foodId: f.id, mult });
      const n = x.nutrition || {}; const c = {}; window.NolaEngine.NUTS.forEach(k => c[k] = Math.max(0, +n[k] || 0)); c.oilG = c.f * 0.5;
      return Object.assign(it, { foodId: null, name: x.name || 'Food', mult: 1, custom: c });
    });
  }
  function coachSystem(pr, T, lang) {
    const cd = pr.condDetails || {}, conds = (pr.conditions || []).map(c => c + (cd[c] ? ' (' + String(cd[c]).slice(0, 80) + ')' : '')).join(', ') || 'none';
    const meds = pr.noMeds ? 'none' : (pr.medList || []).length ? pr.medList.map(m => [m.name, m.dose, m.freq, m.reason ? 'for ' + m.reason : ''].filter(Boolean).join(' ')).join('; ') : (pr.meds || 'not given');
    const medAll = (pr.medAllergies || []).concat(pr.medAllergyOther ? [pr.medAllergyOther] : []).join(', ') || 'none reported';
    return `You are NOLA HEALTH's nutrition coach: a warm, practical, evidence-based dietitian assistant for people in Ethiopia and East Africa, expert in Ethiopian foods (injera, shiro, misir, kik, gomen, tibs, kitfo, doro wot, firfir, genfo, fasting/Tsom food) and international foods.
SAFETY RULES (never break):
1. Never tell the user to start, stop, skip or change any medication or dose (including insulin). Say medication decisions belong to their doctor.
2. You do not diagnose. Give education, not medical decisions.
3. If the user mentions emergency signs (chest pain, stroke signs, severe breathlessness, fainting, confusion, glucose <70 mg/dL with symptoms or <54, glucose >300 mg/dL with vomiting, BP >=180/120, vomiting blood), tell them first to call 907 (Ethiopia ambulance) or go to the nearest hospital.
4. Base advice on ADA Standards of Care, WHO and AHA guidance; mention the source briefly in brackets. If evidence is uncertain, say so.
5. Nutrition numbers are estimates; say so when giving them.
6. Never call traditional foods unhealthy by default; focus on portions, preparation (oil, niter kibbeh, salt) and balance.
7. Medication questions: you may explain in general terms what a medicine on the user's list is commonly used for and well-established food interactions (e.g. grapefruit with some statins/calcium-channel blockers, consistent vitamin K intake with warfarin, alcohol with metformin). For timing, missed doses or dose questions, tell them to ask their pharmacist or doctor. Always end with "talk to your doctor or pharmacist". Never identify a medicine from a photo.
8. Suggest seeing a doctor or dietitian when advice needs individual medical judgement (kidney disease, pregnancy, insulin plans, repeated abnormal readings).
USER PROFILE: name ${pr.name || ''}; age ${window.NolaEngine.age(pr)}; sex ${pr.gender || 'unspecified'}; weight ${pr.weight} kg; height ${pr.height} cm; conditions: ${conds}; allergies: ${(pr.allergies || []).join(', ') || 'none'} ${pr.allergyOther || ''}; diet: ${(pr.restrictions || []).join(', ') || 'none'}; likes: ${pr.fav || ''}; medications (context only, never advise changes): ${meds}; medication allergies: ${medAll}; foods avoided: ${pr.avoid || 'none'}; activity: ${pr.activity}; goals: ${(pr.goals || []).join(', ')}.
DAILY TARGETS: ${T.kcal} kcal, carbs ~${T.c} g (~${Math.round(T.c * 0.3)} g per meal), sodium <${T.na} mg, saturated fat <${T.sf} g, fiber >=${T.fb} g, added sugar <${T.as} g.
STYLE: SHORT — under 90 words, 3–5 short bullet points, plain everyday words a 75-year-old understands (no medical jargon; explain any number simply), local food examples and portions (e.g. "½ injera"). Reply in ${lang === 'am' ? 'Amharic (አማርኛ), using Ge\'ez script' : 'English'}.`;
  }
  window.NolaAI = { enabled, chat, recognize, coachSystem, cfg };
})();
