/* NOLA HEALTH meal ideas: Ethiopian-first dishes mapped to the food database (for personalised
   "What should I eat?" suggestions). Slots: b=breakfast l=lunch d=dinner s=snack. */
(function () {
  const D = (id, slots, en, am, items, ing) => ({ id, slots, name: { en, am }, items, ing: ing || {} });
  const DISHES = [
    D('b_ful', 'b', 'Ful with egg + ½ kita', 'ፉል በእንቁላል + ግማሽ ቂጣ', [['ful', 1, { oil: 'low' }], ['egg', 1], ['kita', 0.5]], { fava: .08, onion: .03, tomato: .05, veg_oil: .006, green_pepper: .01, eggs: 1, wheat_flour: .05, salt: .002 }),
    D('b_enkulal', 'b', 'Enkulal firfir + ½ teff injera', 'እንቁላል ፍርፍር + ግማሽ እንጀራ', [['enkulal_firfir', 1], ['injera_teff', 0.5]], { eggs: 2, onion: .04, tomato: .06, green_pepper: .02, veg_oil: .008, teff: .05 }),
    D('b_genfo', 'b', 'Small genfo (less butter) + ayib', 'ትንሽ ገንፎ (ትንሽ ቅቤ) + አይብ', [['genfo', 0.6, { oil: 'low' }], ['ayib', 0.5]], { barley_flour: .08, kibbeh: .006, berbere: .002, ayib: .055 }),
    D('b_kinche', 'b', 'Kinche with vegetables', 'ቅንጬ ከአትክልት ጋር', [['kinche', 1, { oil: 'low', oilType: 'veg' }], ['timatim', 0.5]], { barley_flour: .07, veg_oil: .005, onion: .03, tomato: .05, salt: .002 }),
    D('b_bread', 'b', 'Whole-wheat bread + ayib + banana', 'ሙሉ ስንዴ ዳቦ + አይብ + ሙዝ', [['bread_whole', 2], ['ayib', 0.5], ['banana', 1]], { wheat_flour: .07, ayib: .055, banana: .12 }),
    D('b_tsom_firfir', 'b', 'Fasting firfir + plain shai', 'የጾም ፍርፍር + ሻይ', [['tsom_firfir', 0.8, { oil: 'low' }], ['shai', 1]], { teff: .08, onion: .04, tomato: .04, berbere: .004, veg_oil: .008, tea: .002 }),
    D('b_chechebsa', 'b', 'Chechebsa (less butter, no honey) + egg', 'ጨጨብሳ (ትንሽ ቅቤ፣ ያለ ማር) + እንቁላል', [['chechebsa', 0.6, { oil: 'low' }], ['egg', 1]], { wheat_flour: .07, kibbeh: .008, berbere: .003, eggs: 1 }),
    D('b_firfir', 'bl', 'Injera firfir (less oil) + tomato salad', 'የእንጀራ ፍርፍር (ትንሽ ዘይት) + የቲማቲም ሰላጣ', [['firfir', 0.8, { oil: 'low' }], ['timatim', 0.5]], { teff: .08, onion: .04, tomato: .08, berbere: .004, kibbeh: .005 }),
    D('m_atkilt', 'ld', 'Atkilt wot + misir + injera', 'አትክልት ወጥ + ምስር + እንጀራ', [['atkilt', 1], ['misir', 0.5], ['injera_teff', 1]], { cabbage: .12, potato: .08, carrot: .05, lentils: .035, onion: .05, veg_oil: .014, berbere: .003, teff: .1 }),
    D('m_shiro', 'ld', 'Shiro + gomen + injera', 'ሽሮ + ጎመን + እንጀራ', [['shiro', 1], ['gomen', 1], ['injera_teff', 1]], { shiro: .05, onion: .05, garlic: .005, veg_oil: .018, collards: .15, teff: .1, salt: .003 }),
    D('m_misir', 'ld', 'Misir wot + tikil gomen + injera', 'ምስር ወጥ + ጥቅል ጎመን + እንጀራ', [['misir', 1], ['tikil_gomen', 1], ['injera_teff', 1]], { lentils: .07, onion: .06, berbere: .005, veg_oil: .016, cabbage: .15, carrot: .04, potato: .06, teff: .1, garlic: .005 }),
    D('m_kik', 'ld', 'Kik alicha + atkilt + injera', 'ክክ አልጫ + አትክልት + እንጀራ', [['kik', 1], ['atkilt', 1], ['injera_teff', 1]], { split_peas: .07, onion: .05, turmeric: .002, veg_oil: .014, cabbage: .1, potato: .08, carrot: .04, teff: .1 }),
    D('m_beyaynetu', 'ld', 'Home beyaynetu + injera', 'የቤት በያይነቱ + እንጀራ', [['beyaynetu', 0.75], ['injera_teff', 1]], { shiro: .02, lentils: .03, split_peas: .02, collards: .08, cabbage: .06, potato: .04, carrot: .03, tomato: .05, onion: .08, veg_oil: .02, berbere: .004, teff: .1 }),
    D('m_azifa', 'ld', 'Azifa + tomato salad + injera', 'አዚፋ + የቲማቲም ሰላጣ + እንጀራ', [['azifa', 1], ['timatim', 1], ['injera_teff', 1]], { lentils: .06, onion: .03, lemon: .02, veg_oil: .006, tomato: .12, teff: .1 }),
    D('m_fosolia', 'ld', 'Fosolia + misir alicha + injera', 'ፎሶሊያ + ምስር አልጫ + እንጀራ', [['fosolia', 1], ['misir_alicha', 0.75], ['injera_teff', 1]], { green_beans: .12, carrot: .06, onion: .04, lentils: .05, turmeric: .001, veg_oil: .014, teff: .1 }),
    D('m_duba', 'ld', 'Duba wot + shiro + injera', 'የዱባ ወጥ + ሽሮ + እንጀራ', [['duba_wot', 1], ['shiro', 0.5], ['injera_teff', 1]], { pumpkin: .15, onion: .05, shiro: .025, veg_oil: .015, berbere: .003, teff: .1 }),
    D('m_shimbra', 'ld', 'Shimbra asa + gomen + injera', 'ሽንብራ አሳ + ጎመን + እንጀራ', [['shimbra_asa', 1], ['gomen', 0.75], ['injera_teff', 1]], { chickpeas: .06, onion: .05, berbere: .005, veg_oil: .015, collards: .1, teff: .1 }),
    D('m_rice_misir', 'ld', 'Rice + misir + salad', 'ሩዝ + ምስር + ሰላጣ', [['rice', 1], ['misir', 0.75], ['selata', 1]], { rice: .08, lentils: .05, onion: .04, veg_oil: .012, lettuce: .06, tomato: .05, berbere: .004 }),
    D('m_pasta', 'ld', 'Pasta with vegetable tomato sauce', 'ፓስታ በአትክልትና ቲማቲም ስጎ', [['pasta', 1.25], ['atkilt', 0.5], ['timatim', 0.5]], { pasta: .09, tomato: .12, onion: .04, carrot: .04, potato: .04, veg_oil: .01 }),
    D('m_potato_egg', 'ld', 'Potato & gomen with egg + ½ injera', 'ድንችና ጎመን በእንቁላል + ግማሽ እንጀራ', [['potato', 1], ['gomen', 1], ['egg', 1], ['injera_teff', 0.5]], { potato: .17, collards: .15, eggs: 1, veg_oil: .008, onion: .03, teff: .05 }),
    D('m_shorba', 'ld', 'Lentil shorba + whole-wheat bread', 'የምስር ሾርባ + ሙሉ ስንዴ ዳቦ', [['shorba', 1], ['bread_whole', 2]], { lentils: .03, carrot: .05, potato: .05, onion: .03, veg_oil: .004, wheat_flour: .07 }),
    D('m_tibs', 'ld', 'Lean derek tibs + salad + injera', 'ደረቅ ጥብስ + ሰላጣ + እንጀራ', [['tibs', 0.6, { oil: 'low' }], ['selata', 1], ['injera_teff', 1]], { beef: .12, onion: .06, tomato: .06, green_pepper: .03, veg_oil: .008, lettuce: .06, teff: .1 }),
    D('m_gomen_siga', 'ld', 'Gomen be siga + injera', 'ጎመን በስጋ + እንጀራ', [['gomen_besiga', 1, { oil: 'low' }], ['injera_teff', 1]], { beef: .06, collards: .15, onion: .04, kibbeh: .006, teff: .1 }),
    D('m_asa', 'ld', 'Asa tibs (less oil) + tomato salad + injera', 'አሳ ጥብስ (ትንሽ ዘይት) + ሰላጣ + እንጀራ', [['asa', 1, { oil: 'low' }], ['timatim', 1], ['injera_teff', 1]], { fish: .15, veg_oil: .008, tomato: .1, onion: .03, lemon: .01, teff: .1 }),
    D('m_doro', 'ld', 'Doro wot (skimmed) + ayib + injera', 'ዶሮ ወጥ (ዘይቱ የተነሳ) + አይብ + እንጀራ', [['doro', 1, { oil: 'low' }], ['ayib', 0.3], ['injera_teff', 1]], { chicken: .15, eggs: 1, onion: .12, berbere: .01, kibbeh: .01, ayib: .03, teff: .1 }),
    D('s_banana', 's', 'Banana', 'ሙዝ', [['banana', 1]], { banana: .12 }), D('s_orange', 's', 'Orange', 'ብርቱካን', [['orange', 1]], { orange: .13 }),
    D('s_kolo', 's', 'Kolo (small handful)', 'ቆሎ (ትንሽ እፍኝ)', [['kolo', 1]], { kolo_grain: .05 }), D('s_shimbra', 's', 'Roasted chickpeas', 'የተቆላ ሽንብራ', [['shimbra_kolo', 1]], { chickpeas: .05 }),
    D('s_peanuts', 's', 'Peanuts (small handful)', 'ኦቾሎኒ (ትንሽ እፍኝ)', [['peanuts', 1]], { peanuts: .03 }), D('s_ergo', 's', 'Ergo (yogurt)', 'እርጎ', [['ergo', 1]], { yogurt: .245 }),
    D('s_avocado', 's', '½ avocado', 'ግማሽ አቮካዶ', [['avocado', 1]], { avocado: .1 }), D('s_papaya', 's', 'Papaya', 'ፓፓያ', [['papaya', 1]], { papaya: .15 }),
    D('s_egg', 's', 'Boiled egg', 'የተቀቀለ እንቁላል', [['egg', 1]], { eggs: 1 }),
  ];
  // ingredient id: [en, am, category, unit, approx. ETB per unit (Addis Ababa retail, late 2025/2026 estimate), step]
  const ING = {
    teff: ['Teff flour', 'የጤፍ ዱቄት', 'grains', 'kg', 190, 0.5], wheat_flour: ['Wheat flour', 'የስንዴ ዱቄት', 'grains', 'kg', 110, 0.5], barley_flour: ['Barley flour', 'የገብስ ዱቄት', 'grains', 'kg', 120, 0.5],
    rice: ['Rice', 'ሩዝ', 'grains', 'kg', 160, 0.5], pasta: ['Pasta / macaroni', 'ፓስታ / መኮሮኒ', 'grains', 'kg', 140, 0.5], kolo_grain: ['Roasted barley (kolo)', 'ቆሎ', 'grains', 'kg', 150, 0.25],
    shiro: ['Shiro powder', 'የሽሮ ዱቄት', 'protein', 'kg', 280, 0.25], lentils: ['Red lentils', 'ምስር ክክ', 'protein', 'kg', 190, 0.25], split_peas: ['Yellow split peas', 'የአተር ክክ', 'protein', 'kg', 150, 0.25],
    fava: ['Fava beans', 'ባቄላ', 'protein', 'kg', 140, 0.25], chickpeas: ['Chickpeas', 'ሽንብራ', 'protein', 'kg', 160, 0.25], peanuts: ['Peanuts', 'ኦቾሎኒ', 'protein', 'kg', 300, 0.25],
    eggs: ['Eggs', 'እንቁላል', 'protein', 'pc', 13, 1], beef: ['Beef', 'የበሬ ስጋ', 'protein', 'kg', 950, 0.25], chicken: ['Chicken', 'ዶሮ', 'protein', 'kg', 700, 0.5], fish: ['Fish (tilapia)', 'አሳ (ቆሮሶ)', 'protein', 'kg', 500, 0.25],
    ayib: ['Ayib (cottage cheese)', 'አይብ', 'dairy', 'kg', 350, 0.25], milk: ['Milk', 'ወተት', 'dairy', 'L', 90, 0.5], yogurt: ['Ergo / yogurt', 'እርጎ', 'dairy', 'L', 130, 0.5],
    onion: ['Red onion', 'ቀይ ሽንኩርት', 'vegetables', 'kg', 60, 0.5], tomato: ['Tomato', 'ቲማቲም', 'vegetables', 'kg', 70, 0.5], garlic: ['Garlic', 'ነጭ ሽንኩርት', 'vegetables', 'kg', 250, 0.1],
    ginger: ['Ginger', 'ዝንጅብል', 'vegetables', 'kg', 220, 0.1], potato: ['Potato', 'ድንች', 'vegetables', 'kg', 45, 0.5], carrot: ['Carrot', 'ካሮት', 'vegetables', 'kg', 60, 0.25],
    cabbage: ['Cabbage', 'ጥቅል ጎመን', 'vegetables', 'kg', 40, 0.5], collards: ['Collard greens (gomen)', 'ጎመን', 'vegetables', 'kg', 50, 0.25], green_pepper: ['Green pepper (karia)', 'ቃሪያ', 'vegetables', 'kg', 120, 0.1],
    pumpkin: ['Pumpkin', 'ዱባ', 'vegetables', 'kg', 50, 0.5], green_beans: ['Green beans', 'ፎሶሊያ', 'vegetables', 'kg', 90, 0.25], lettuce: ['Lettuce', 'ሰላጣ', 'vegetables', 'kg', 80, 0.25],
    banana: ['Banana', 'ሙዝ', 'fruits', 'kg', 80, 0.5], orange: ['Orange', 'ብርቱካን', 'fruits', 'kg', 120, 0.5], avocado: ['Avocado', 'አቮካዶ', 'fruits', 'kg', 100, 0.25],
    papaya: ['Papaya', 'ፓፓያ', 'fruits', 'kg', 70, 0.5], lemon: ['Lemon', 'ሎሚ', 'fruits', 'kg', 120, 0.1],
    veg_oil: ['Vegetable oil', 'የምግብ ዘይት', 'other', 'L', 280, 0.5], kibbeh: ['Niter kibbeh', 'ንጥር ቅቤ', 'other', 'kg', 1400, 0.1], berbere: ['Berbere', 'በርበሬ', 'other', 'kg', 650, 0.1],
    turmeric: ['Turmeric (ird)', 'እርድ', 'other', 'kg', 400, 0.05], salt: ['Salt (iodised)', 'ጨው (አዮዲን ያለው)', 'other', 'kg', 30, 0.5], coffee: ['Coffee beans', 'ቡና', 'other', 'kg', 750, 0.25], tea: ['Tea leaves', 'ሻይ ቅጠል', 'other', 'kg', 500, 0.05],
  };
  const SLOT = { breakfast: 'b', lunch: 'l', dinner: 'd', snack: 's' };
  const E = () => window.NolaEngine, F = () => window.NolaFoods;
  function dishItems(d, pr) {
    const dm = E().isDiabetic(pr), T = E().targets(pr);
    const injAdj = dm ? Math.max(0.5, Math.min(1, Math.round((T.c * 0.3 * 0.6 / 48) / 0.25) * 0.25)) : 1;
    return d.items.map(([id, m, o]) => Object.assign({ foodId: id, mult: id === 'injera_teff' && m === 1 ? injAdj : m, oil: 'normal', salt: 'normal', conf: null }, o || {}));
  }
  function allowed(d, pr, fastingDay) {
    const foods = d.items.map(x => F().byId[x[0]]), rs = pr.restrictions || [], al = pr.allergies || [];
    const vegan = foods.every(f => f.tags.includes('fasting') || f.tags.includes('vegan'));
    if ((fastingDay || rs.includes('vegan')) && !vegan) return false;
    if (rs.includes('vegetarian') && foods.some(f => f.tags.includes('meat') || f.tags.includes('fish'))) return false;
    if (rs.includes('glutenfree') && foods.some(f => f.allergens.includes('gluten'))) return false;
    if (rs.includes('noalcohol') && foods.some(f => f.tags.includes('alcohol'))) return false;
    if (foods.some(f => f.allergens.some(a => al.includes(a)) || (al.includes('legume') && f.tags.includes('legume')))) return false;
    return true;
  }
  window.NolaDishes = { DISHES, SLOT, ING, dishItems, allowed, byId: id => DISHES.find(d => d.id === id) };
})();
