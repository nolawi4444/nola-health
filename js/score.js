/* NOLA FOOD SCORE (0–100): a transparent, personalised EDUCATIONAL indicator of how well one meal fits
   the user's own targets. NOT a medical measurement. Formula (all comparisons are against the user's
   per-meal share of their daily targets from NolaEngine.targets):
     start 100
     − carbs     weight W·min(1, max(0, ratio−1))   ratio = (net carbs if diabetes, else carbs) / meal carb guide
     − sodium    "                              "   ratio = sodium / meal sodium share
     − sat fat, added sugar, calories: same shape
     − portion   −5 if any item is 2 servings or more
     − alcohol −10, allergy → capped at 15
     + fiber     up to +8 (ratio fiber / meal fiber share)
     + potassium +4 when blood pressure matters and K ≥ 900 mg
   Weights W are personalised: a factor that matters for the user's conditions weighs 2–3× more.
   Finally the score is kept inside the band of the colour verdict (green 70–100, yellow 40–69, red 0–39)
   so the number and the colour never disagree; any such adjustment is shown in the breakdown. */
(function () {
  const BANDS = { good: [70, 100], adjust: [40, 69], alt: [0, 39] };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  function weights(pr, T) {
    const E = window.NolaEngine, has = c => E.has(pr, c), dm = E.isDiabetic(pr);
    const naWatch = has('htn') || has('heart') || (pr.restrictions || []).includes('lowsalt');
    const sfWatch = has('chol') || has('heart');
    const wWatch = has('obesity') || T.loss;
    return {
      carbs: dm ? 30 : wWatch ? 14 : 8,
      sodium: naWatch ? 26 : 10,
      satfat: sfWatch ? 22 : 9,
      sugar: dm ? 22 : 14,
      calories: wWatch ? 18 : 8,
      fiber: dm || sfWatch ? 8 : 5,
      potassium: naWatch && !has('kidney') ? 4 : 0,
      dm, naWatch, sfWatch, wWatch,
    };
  }
  /* a = NolaEngine.analyze() result; items = meal items; pr = profile; mealType */
  function compute(a, items, pr, mealType) {
    const T = a.targets, tot = a.totals, sh = a.share, W = weights(pr, T);
    const factors = [];
    const pen = (key, val, guide, w, unit) => {
      if (!guide || !w) return;
      const ratio = val / guide, p = Math.round(w * clamp(ratio - 1, 0, 1));
      factors.push({ key, pts: -p, val: Math.round(val), guide: Math.round(guide), unit, max: w });
    };
    const netC = W.dm ? tot.c - (tot.fb > 5 ? tot.fb / 2 : 0) : tot.c;
    pen(W.dm ? 'netcarbs' : 'carbs', netC, a.carbGuide, W.carbs, 'g');
    pen('sodium', tot.na, T.na * sh, W.sodium, 'mg');
    pen('satfat', tot.sf, T.sf * sh, W.satfat, 'g');
    pen('sugar', tot.as, Math.max(3, T.as * sh), W.sugar, 'g');
    pen('calories', tot.kcal, T.kcal * sh, W.calories, 'kcal');
    const big = items.some(it => (+it.mult || 1) >= 2);
    factors.push({ key: 'portion', pts: big ? -5 : 0, max: 5 });
    const fbShare = T.fb * sh, fbPts = Math.round(W.fiber * clamp(tot.fb / fbShare, 0, 1));
    factors.push({ key: 'fiber', pts: fbPts, val: Math.round(tot.fb), guide: Math.round(fbShare), unit: 'g', max: W.fiber, bonus: true });
    if (W.potassium) factors.push({ key: 'potassium', pts: tot.k >= 900 ? W.potassium : 0, val: Math.round(tot.k), unit: 'mg', max: W.potassium, bonus: true });
    const F = window.NolaFoods;
    if (items.some(it => it.foodId && F.byId[it.foodId] && F.byId[it.foodId].tags.includes('alcohol'))) factors.push({ key: 'alcohol', pts: -10, max: 10 });
    let raw = 100 + factors.reduce((s, f) => s + f.pts, 0);
    const allergy = (a.allergy || []).length > 0;
    if (allergy) { factors.push({ key: 'allergy', pts: Math.min(0, 15 - raw), max: 100 }); raw = Math.min(raw, 15); }
    raw = clamp(Math.round(raw), 0, 100);
    const band = BANDS[a.verdict] || [0, 100];
    const score = clamp(raw, band[0], band[1]);
    return { score, raw, adjusted: score !== raw, band, verdict: a.verdict, color: { good: 'green', adjust: 'yellow', alt: 'red' }[a.verdict], factors, weights: W };
  }
  window.NolaScore = { compute, weights, BANDS };
})();
