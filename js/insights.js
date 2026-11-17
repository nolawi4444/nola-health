/* NOLA HEALTH insights: Smart Food Memory, food & glucose patterns, Health Journey summaries & badges.
   Everything is descriptive (patterns in the user's own logs). No predictions, no causal claims. */
(function () {
  const DB = () => window.NolaDB, E = () => window.NolaEngine, F = () => window.NolaFoods;
  const DAY = 864e5;
  const SUGARY = ['soda', 'juice_mix', 'buna_sugar', 'shai_sugar', 'tej', 'besso', 'atmit', 'juice_orange'];
  const mem = () => DB().get('memory', {});
  const memOn = cat => !((mem().off || {})[cat]);
  const within = (arr, from, to) => arr.filter(x => x.ts >= from && x.ts < to);
  const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;

  function dailyAverages(meals, from, to) {
    const ms = within(meals, from, to), byDay = {};
    ms.forEach(m => { const k = new Date(m.ts).toDateString(); (byDay[k] = byDay[k] || []).push(m); });
    const days = Object.values(byDay);
    if (!days.length) return null;
    const tot = k => avg(days.map(d => d.reduce((s, m) => s + (m.totals[k] || 0), 0)));
    const veg = avg(days.map(d => d.flatMap(m => m.items).filter(it => { const f = F().byId[it.foodId]; return f && (f.cat === 'veg' || f.tags.includes('vegetable')); }).length));
    return { n: days.length, kcal: tot('kcal'), na: tot('na'), c: tot('c'), as: tot('as'), fb: tot('fb'), sf: tot('sf'), veg };
  }
  function foodMemory(now = Date.now()) {
    const pr = DB().get('profile'), T = E().targets(pr), meals = DB().get('meals', []);
    const w7 = within(meals, now - 7 * DAY, now + DAY), w30 = within(meals, now - 30 * DAY, now + DAY);
    const items7 = w7.flatMap(m => m.items), items30 = w30.flatMap(m => m.items);
    const count = {}; items30.forEach(it => { const k = it.foodId || ('ai:' + (it.name || '?')); count[k] = (count[k] || 0) + 1; });
    const frequent = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => ({ id: k, n }));
    const highNa = w7.filter(m => m.totals.na > T.na * 0.4);
    const sugary = items7.filter(it => SUGARY.includes(it.foodId));
    const has = pred => items7.some(it => { const f = F().byId[it.foodId]; return f && pred(f); });
    const groups = {
      veg: has(f => f.cat === 'veg' || f.tags.includes('vegetable')), legume: has(f => f.tags.includes('legume')), whole: has(f => f.tags.includes('wholegrain') || f.id === 'injera_teff'),
      fruit: has(f => f.cat === 'fruit'), dairy: has(f => f.cat === 'dairy' || ['ayib', 'ergo', 'milk'].includes(f.id)), protein: has(f => f.tags.includes('meat') || f.tags.includes('fish') || f.id === 'egg' || f.id === 'enkulal_firfir'),
    };
    const unique = new Set(items7.map(it => it.foodId || it.name)).size;
    const gCount = Object.values(groups).filter(Boolean).length;
    const variety = items7.length ? Math.round(gCount / 6 * 60 + Math.min(unique, 15) / 15 * 40) : 0;
    const lunches = w7.filter(m => m.meal === 'lunch').map(m => m.items.map(i => i.foodId || i.name).sort().join('+'));
    const sig = {}; lunches.forEach(s => sig[s] = (sig[s] || 0) + 1);
    const topLunch = Object.entries(sig).sort((a, b) => b[1] - a[1])[0];
    const similarLunches = topLunch && topLunch[1] >= 3 && lunches.length >= 3;
    const thisW = dailyAverages(meals, now - 7 * DAY, now + DAY), lastW = dailyAverages(meals, now - 14 * DAY, now - 7 * DAY);
    const verdicts = { good: 0, adjust: 0, alt: 0 }; w7.forEach(m => verdicts[m.verdict] = (verdicts[m.verdict] || 0) + 1);
    const sugg = [];
    if (similarLunches) sugg.push('ins_s_lunch');
    if (highNa.length >= 3) sugg.push('ins_s_sodium');
    if (sugary.length >= 4) sugg.push('ins_s_sugary');
    if (!groups.veg) sugg.push('ins_s_veg');
    if (!groups.legume) sugg.push('ins_s_legume');
    if (!groups.fruit) sugg.push('ins_s_fruit');
    if (thisW && thisW.fb < T.fb * 0.6) sugg.push('ins_s_fiber');
    if (variety >= 70) sugg.push('ins_s_variety_good');
    if (verdicts.good >= 3) sugg.push('ins_s_good');
    return { enough: meals.length >= 3, T, meals7: w7.length, meals30: w30.length, frequent, highNa: highNa.length, sugary: sugary.length, groups, unique, variety, similarLunches, thisW, lastW, verdicts, sugg };
  }
  /* ---- glucose & meals ---- */
  function glucoseInsights() {
    const logs = DB().get('glogs', []).filter(l => l.pre != null && l.post != null).sort((a, b) => a.ts - b.ts);
    const rise = l => l.post - l.pre;
    const byFood = {};
    logs.forEach(l => (l.foods || []).forEach(id => { (byFood[id] = byFood[id] || []).push(rise(l)); }));
    const foods = Object.entries(byFood).filter(([, v]) => v.length >= 2).map(([id, v]) => ({ id, n: v.length, avg: Math.round(avg(v)) })).sort((a, b) => b.avg - a.avg);
    const act = logs.filter(l => l.activity && l.activity !== 'none'), noAct = logs.filter(l => !l.activity || l.activity === 'none');
    const activity = act.length >= 2 && noAct.length >= 2 ? { with: Math.round(avg(act.map(rise))), without: Math.round(avg(noAct.map(rise))), n1: act.length, n2: noAct.length } : null;
    const byTime = {}; logs.forEach(l => (byTime[l.meal] = byTime[l.meal] || []).push(rise(l)));
    const times = Object.entries(byTime).filter(([, v]) => v.length >= 2).map(([m, v]) => ({ meal: m, n: v.length, avg: Math.round(avg(v)) }));
    const highPost = logs.filter(l => l.post >= 180).length;
    const preOut = logs.filter(l => l.pre < 80 || l.pre > 130).length;
    return { logs, n: logs.length, foods, activity, times, highPost, preOut, avgRise: logs.length ? Math.round(avg(logs.map(rise))) : null };
  }
  /* ---- journey ---- */
  function periodSummary(days, now = Date.now()) {
    const from = now - days * DAY, pr = DB().get('profile'), T = E().targets(pr);
    const meals = within(DB().get('meals', []), from, now + DAY), rs = within(DB().get('readings', []), from, now + DAY);
    const acts = within(DB().get('activities', []), from, now + DAY), glogs = within(DB().get('glogs', []), from, now + DAY);
    const bp = rs.filter(r => r.type === 'bp'), gl = rs.filter(r => r.type === 'glucose'), wt = rs.filter(r => r.type === 'weight').sort((a, b) => a.ts - b.ts);
    const dayset = new Set([...meals, ...rs].map(x => new Date(x.ts).toDateString()));
    const da = dailyAverages(meals, from, now + DAY);
    const lessons = Object.values(DB().get('academy', {}).done || {}).filter(x => x.ts >= from).length;
    const actMin = acts.reduce((s, a) => s + (+a.min || 0), 0) + glogs.filter(l => l.activity && l.activity !== 'none').reduce((s, l) => s + ({ walk10: 10, walk30: 30, other: 20 }[l.activity] || 0), 0);
    return { days, activeDays: dayset.size, meals: meals.length, good: meals.filter(m => m.verdict === 'good').length, naAvg: da ? Math.round(da.na) : null, naT: T.na,
      bpN: bp.length, bpAvg: bp.length ? `${Math.round(avg(bp.map(r => r.sys)))}/${Math.round(avg(bp.map(r => r.dia)))}` : null,
      glN: gl.length, glAvg: gl.length ? avg(gl.map(r => r.mg)) : null, wtChange: wt.length >= 2 ? Math.round((wt[wt.length - 1].kg - wt[0].kg) * 10) / 10 : null, actMin, lessons };
  }
  function trend(type, field) {
    const rs = DB().get('readings', []).filter(r => r.type === type).sort((a, b) => a.ts - b.ts);
    if (rs.length < 2) return null;
    const first = rs.slice(0, Math.min(3, rs.length)), last = rs.slice(-Math.min(3, rs.length));
    return { first: avg(first.map(r => r[field])), last: avg(last.map(r => r[field])), n: rs.length, since: rs[0].ts };
  }
  const BADGES = [
    ['first_meal', '🍽️', () => DB().get('meals', []).length >= 1], ['meals_10', '📒', () => DB().get('meals', []).length >= 10],
    ['good_5', '🥗', () => DB().get('meals', []).filter(m => m.verdict === 'good').length >= 5], ['first_reading', '📈', () => DB().get('readings', []).length >= 1],
    ['bp_7', '❤️', () => DB().get('readings', []).filter(r => r.type === 'bp').length >= 7], ['glog_1', '🩸', () => DB().get('glogs', []).some(l => l.pre != null && l.post != null)],
    ['lesson_1', '🎓', () => Object.keys(DB().get('academy', {}).done || {}).length >= 1], ['lesson_all', '🏅', () => Object.keys(DB().get('academy', {}).done || {}).length >= 10],
    ['plan_1', '🛒', () => !!DB().get('plan')], ['active_150', '🚶', () => periodSummary(7).actMin >= 150],
    ['streak_3', '🔥', () => { const s = new Set(DB().get('meals', []).map(m => new Date(m.ts).toDateString())); let n = 0; for (let i = 0; i < 3; i++) if (s.has(new Date(Date.now() - i * DAY).toDateString())) n++; return n === 3; }],
    ['checkup', '🩺', () => DB().get('checkups', []).length >= 1],
  ];
  function badges() {
    const seen = Object.assign({}, DB().get('badges', {})); let changed = false;
    const out = BADGES.map(([id, icon, fn]) => { let ok = false; try { ok = fn(); } catch (e) {} if (ok && !seen[id]) { seen[id] = Date.now(); changed = true; } return { id, icon, earned: !!seen[id], ts: seen[id] || null }; });
    if (changed) DB().set('badges', seen);
    return out;
  }
  window.NolaInsights = { foodMemory, glucoseInsights, periodSummary, trend, badges, memOn, SUGARY, dailyAverages };
})();
