/* NOLA HEALTH — local food database.
   Values are per BASE portion (mult = 1) and are estimates compiled from:
   - Ethiopian Food Composition Table (EHNRI/EPHI, Parts III–IV, 1997–2013) approximations
   - USDA FoodData Central (FDC) for standard ingredients
   - FAO/INFOODS Western Africa & East Africa tables for traditional preparations
   Home recipes vary a lot (oil, niter kibbeh, salt, portion). The user can always correct.
   Keys: kcal, p protein g, c carbs g, s sugar g, as added sugar g, f fat g, sf sat fat g,
         fb fiber g, na sodium mg, k potassium mg.
   oil: g of added fat (oil / niter kibbeh) in base portion; oilType: veg | kibbeh
   salt: true if sodium mostly from added salt / berbere (adjustable) */
(function () {
  const P = {
    injera: [[0.25, 'injera'], [0.5, 'injera'], [1, 'injera'], [1.5, 'injera'], [2, 'injera'], [3, 'injera']],
    cup: [[0.5, 'cup'], [1, 'cup'], [1.5, 'cup'], [2, 'cup']],
    plate: [[0.5, 'plate'], [1, 'plate'], [1.5, 'plate'], [2, 'plate']],
    piece: [[1, 'piece'], [2, 'piece'], [3, 'piece'], [4, 'piece']],
    slice: [[1, 'slice'], [2, 'slice'], [3, 'slice']],
    glass: [[0.5, 'glass'], [1, 'glass'], [2, 'glass']],
    cupSmall: [[1, 'smallcup'], [2, 'smallcup'], [3, 'smallcup']],
    serving: [[0.5, 'serving'], [1, 'serving'], [1.5, 'serving'], [2, 'serving']],
  };
  const FCT = 'Ethiopian Food Composition Table (EPHI) approx.';
  const USDA = 'USDA FoodData Central';
  const RECIPE = 'Recipe calculation from USDA/EPHI ingredients';

  function F(id, en, am, cat, n, o) {
    return Object.assign({ id, name: { en, am }, cat, n, portions: P.serving, base: { en: '1 serving', am: '1 ምግብ' },
      gi: 'medium', tags: [], allergens: [], oil: 0, oilType: 'veg', salt: false, src: RECIPE, note: null }, o);
  }

  const FOODS = [
    // ---- Injera & breads (staples)
    F('injera_teff', 'Injera (100% teff)', 'እንጀራ (ጤፍ)', 'staple',
      { kcal: 240, p: 8.5, c: 48, s: 1, as: 0, f: 1.6, sf: 0.3, fb: 5, na: 25, k: 220 },
      { portions: P.injera, base: { en: '1 injera ≈150 g (medium, ~35 cm)', am: '1 እንጀራ ≈150 ግ' }, gi: 'medium', tags: ['fasting', 'vegan', 'glutenfree', 'wholegrain'],
        src: FCT + '; teff grain USDA FDC #169747', note: { en: 'Whole-grain teff: good iron and fiber. Fermentation may lower the glycemic effect slightly, but portion size matters most.', am: 'ሙሉ እህል ጤፍ፡ ብረትና ፋይበር አለው። ዋናው ነገር የመጠኑ መጠን ነው።' } }),
    F('injera_mixed', 'Injera (teff + barley/sorghum)', 'እንጀራ (ድብልቅ)', 'staple',
      { kcal: 250, p: 7.5, c: 51, s: 1, as: 0, f: 1.5, sf: 0.3, fb: 4, na: 30, k: 190 },
      { portions: P.injera, base: { en: '1 injera ≈150 g', am: '1 እንጀራ ≈150 ግ' }, gi: 'medium', tags: ['fasting', 'vegan', 'wholegrain'], allergens: ['gluten'], src: FCT }),
    F('injera_white', 'Injera (white / wheat or rice flour)', 'ነጭ እንጀራ (ስንዴ/ሩዝ)', 'staple',
      { kcal: 265, p: 7, c: 56, s: 1, as: 0, f: 1.2, sf: 0.2, fb: 2, na: 35, k: 110 },
      { portions: P.injera, base: { en: '1 injera ≈150 g', am: '1 እንጀራ ≈150 ግ' }, gi: 'high', tags: ['fasting', 'vegan'], allergens: ['gluten'], src: FCT + '; wheat flour USDA' }),
    F('kita', 'Kita (flatbread)', 'ቂጣ', 'staple',
      { kcal: 250, p: 8, c: 50, s: 1, as: 0, f: 2, sf: 0.3, fb: 3, na: 300, k: 120 },
      { portions: P.piece, base: { en: '1 piece ≈100 g', am: '1 ቁራጭ ≈100 ግ' }, gi: 'high', tags: ['fasting', 'vegan'], allergens: ['gluten'], salt: true, src: FCT }),
    F('dabo', 'Dabo (Ethiopian bread)', 'ዳቦ', 'staple',
      { kcal: 160, p: 5, c: 30, s: 3, as: 2, f: 2, sf: 0.5, fb: 1.5, na: 250, k: 70 },
      { portions: P.slice, base: { en: '1 slice / small roll ≈60 g', am: '1 ቁራጭ ≈60 ግ' }, gi: 'high', tags: ['fasting', 'vegan'], allergens: ['gluten'], salt: true, src: FCT + '; USDA bread' }),
    F('kocho', 'Kocho (enset bread)', 'ቆጮ', 'staple',
      { kcal: 210, p: 1, c: 50, s: 1, as: 0, f: 0.4, sf: 0.1, fb: 3, na: 10, k: 60 },
      { portions: P.piece, base: { en: '1 piece ≈100 g', am: '1 ቁራጭ ≈100 ግ' }, gi: 'medium', tags: ['fasting', 'vegan', 'glutenfree'], src: FCT, note: { en: 'Mostly starch, very low protein — pair with ayib, kitfo or legumes.', am: 'በአብዛኛው ስታርች ነው — ከአይብ ወይም ጥራጥሬ ጋር ይመገቡ።' } }),

    // ---- Legume stews (fasting)
    F('shiro', 'Shiro wot', 'ሽሮ ወጥ', 'stew',
      { kcal: 300, p: 12, c: 30, s: 4, as: 0, f: 15, sf: 2, fb: 8, na: 650, k: 450 },
      { portions: P.cup, base: { en: '1 cup ≈240 g', am: '1 ኩባያ ≈240 ግ' }, gi: 'low', tags: ['fasting', 'vegan', 'legume'], oil: 12, salt: true,
        src: RECIPE + ' (chickpea flour, onion, oil, berbere)', note: { en: 'Chickpea-based: protein and fiber slow glucose rise. Oil and salt are the main things to watch.', am: 'ከሽንብራ የተሰራ፡ ፕሮቲንና ፋይበር አለው። ዘይትና ጨው ይቀንሱ።' } }),
    F('misir', 'Misir wot (red lentils)', 'ምስር ወጥ', 'stew',
      { kcal: 280, p: 15, c: 36, s: 4, as: 0, f: 9, sf: 1.2, fb: 12, na: 600, k: 600 },
      { portions: P.cup, base: { en: '1 cup ≈240 g', am: '1 ኩባያ ≈240 ግ' }, gi: 'low', tags: ['fasting', 'vegan', 'legume'], oil: 8, salt: true, src: RECIPE + ' (lentils USDA #172421, berbere, oil)' }),
    F('kik', 'Kik alicha (yellow split peas)', 'ክክ አልጫ', 'stew',
      { kcal: 250, p: 14, c: 35, s: 4, as: 0, f: 7, sf: 1, fb: 11, na: 500, k: 550 },
      { portions: P.cup, base: { en: '1 cup ≈240 g', am: '1 ኩባያ ≈240 ግ' }, gi: 'low', tags: ['fasting', 'vegan', 'legume'], oil: 6, salt: true, src: RECIPE + ' (split peas USDA, turmeric, oil)' }),
    F('ful', 'Ful (fava beans)', 'ፉል', 'stew',
      { kcal: 350, p: 17, c: 40, s: 5, as: 0, f: 13, sf: 2, fb: 13, na: 650, k: 700 },
      { portions: P.plate, base: { en: '1 bowl ≈250 g (no bread)', am: '1 ሳህን ≈250 ግ (ያለ ዳቦ)' }, gi: 'low', tags: ['fasting', 'vegan', 'legume'], oil: 10, salt: true, src: RECIPE + ' (fava USDA #175201, oil, tomato, onion)' }),
    F('azifa', 'Azifa (lentil salad)', 'አዚፋ', 'stew',
      { kcal: 230, p: 14, c: 34, s: 3, as: 0, f: 5, sf: 0.6, fb: 12, na: 300, k: 600 },
      { portions: P.cup, base: { en: '1 cup ≈200 g', am: '1 ኩባያ ≈200 ግ' }, gi: 'low', tags: ['fasting', 'vegan', 'legume'], oil: 4, salt: true, src: RECIPE }),
    F('beyaynetu', 'Beyaynetu (fasting combo, toppings only)', 'በያይነቱ (ያለ እንጀራ)', 'stew',
      { kcal: 480, p: 20, c: 55, s: 8, as: 0, f: 20, sf: 3, fb: 20, na: 1100, k: 1100 },
      { portions: P.plate, base: { en: '1 plate of toppings ≈400 g (add injera separately)', am: '1 ሳህን ማባያ ≈400 ግ (እንጀራ ለብቻ ይጨምሩ)' }, gi: 'low', tags: ['fasting', 'vegan', 'legume', 'vegetable'], oil: 16, salt: true,
        src: RECIPE + ' (shiro, misir, kik, gomen, atkilt, salad)', note: { en: 'A balanced, fiber-rich plate. Most of the carbs come from the injera underneath.', am: 'በፋይበር የበለፀገ ምግብ ነው። አብዛኛው ካርቦሃይድሬት ከእንጀራው ይመጣል።' } }),

    // ---- Vegetables
    F('gomen', 'Gomen (collard greens)', 'ጎመን', 'veg',
      { kcal: 120, p: 4, c: 10, s: 1, as: 0, f: 8, sf: 1, fb: 5, na: 350, k: 350 },
      { portions: P.cup, base: { en: '1 cup ≈170 g', am: '1 ኩባያ ≈170 ግ' }, gi: 'low', tags: ['fasting', 'vegan', 'vegetable'], oil: 7, salt: true, src: RECIPE + ' (collards USDA #169989)' }),
    F('atkilt', 'Atkilt wot (cabbage, potato, carrot)', 'አትክልት ወጥ', 'veg',
      { kcal: 180, p: 3, c: 22, s: 6, as: 0, f: 9, sf: 1.2, fb: 5, na: 450, k: 500 },
      { portions: P.cup, base: { en: '1 cup ≈200 g', am: '1 ኩባያ ≈200 ግ' }, gi: 'medium', tags: ['fasting', 'vegan', 'vegetable'], oil: 8, salt: true, src: RECIPE }),
    F('tikil_gomen', 'Tikil gomen (cabbage)', 'ጥቅል ጎመን', 'veg',
      { kcal: 150, p: 3, c: 15, s: 6, as: 0, f: 9, sf: 1.2, fb: 5, na: 420, k: 400 },
      { portions: P.cup, base: { en: '1 cup ≈200 g', am: '1 ኩባያ ≈200 ግ' }, gi: 'low', tags: ['fasting', 'vegan', 'vegetable'], oil: 8, salt: true, src: RECIPE }),
    F('timatim', 'Timatim salad (tomato)', 'የቲማቲም ሰላጣ', 'veg',
      { kcal: 70, p: 1.5, c: 7, s: 4, as: 0, f: 4.5, sf: 0.6, fb: 2, na: 250, k: 350 },
      { portions: P.cup, base: { en: '1 cup ≈180 g', am: '1 ኩባያ ≈180 ግ' }, gi: 'low', tags: ['fasting', 'vegan', 'vegetable'], oil: 4, salt: true, src: USDA + ' (tomato, onion, oil)' }),
    F('potato', 'Potato (boiled)', 'ድንች (የተቀቀለ)', 'veg',
      { kcal: 145, p: 3, c: 33, s: 1.5, as: 0, f: 0.2, sf: 0, fb: 2.4, na: 8, k: 620 },
      { portions: P.piece, base: { en: '1 medium ≈170 g', am: '1 መካከለኛ ≈170 ግ' }, gi: 'high', tags: ['fasting', 'vegan', 'glutenfree'], src: USDA + ' #170438' }),

    // ---- Meat, egg, dairy dishes
    F('doro', 'Doro wot (chicken + egg)', 'ዶሮ ወጥ', 'meat',
      { kcal: 450, p: 32, c: 14, s: 6, as: 0, f: 30, sf: 11, fb: 3, na: 900, k: 600 },
      { portions: P.serving, base: { en: '1 serving: 1 leg + 1 egg + sauce ≈300 g', am: '1 ምግብ፡ 1 ብልት + 1 እንቁላል + ወጥ ≈300 ግ' }, gi: 'low', tags: ['meat'], allergens: ['egg', 'dairy'], oil: 20, oilType: 'kibbeh', salt: true,
        src: RECIPE + ' (chicken, egg, onion, niter kibbeh, berbere)', note: { en: 'Good protein. Niter kibbeh (spiced butter) adds saturated fat — ask for less, or skim the top layer.', am: 'ጥሩ ፕሮቲን አለው። ንጥር ቅቤ የሳቹሬትድ ስብ ይጨምራል — ቅቤ እንዲቀንስ ይጠይቁ።' } }),
    F('key_wot', 'Key wot (beef stew)', 'ቀይ ወጥ', 'meat',
      { kcal: 420, p: 30, c: 10, s: 4, as: 0, f: 28, sf: 10, fb: 2, na: 850, k: 550 },
      { portions: P.cup, base: { en: '1 cup ≈240 g', am: '1 ኩባያ ≈240 ግ' }, gi: 'low', tags: ['meat'], allergens: ['dairy'], oil: 18, oilType: 'kibbeh', salt: true, src: RECIPE }),
    F('tibs', 'Tibs (sautéed beef/lamb)', 'ጥብስ', 'meat',
      { kcal: 380, p: 36, c: 6, s: 3, as: 0, f: 24, sf: 8, fb: 1, na: 600, k: 550 },
      { portions: P.plate, base: { en: '1 plate ≈200 g', am: '1 ሳህን ≈200 ግ' }, gi: 'low', tags: ['meat'], oil: 12, salt: true, src: RECIPE + ' (beef USDA, onion, oil/butter)' }),
    F('kitfo', 'Kitfo (minced beef, niter kibbeh)', 'ክትፎ', 'meat',
      { kcal: 420, p: 28, c: 1, s: 0, as: 0, f: 34, sf: 15, fb: 0, na: 350, k: 400 },
      { portions: P.serving, base: { en: '1 serving ≈150 g', am: '1 ምግብ ≈150 ግ' }, gi: 'low', tags: ['meat', 'raw'], allergens: ['dairy'], oil: 15, oilType: 'kibbeh', salt: true,
        src: RECIPE, note: { en: 'High in saturated fat from butter. Raw/leb-leb meat carries food-safety risk (tapeworm, bacteria) — "yebesele" (cooked) is safer, especially in pregnancy or low immunity.', am: 'ከቅቤ ብዙ ሳቹሬትድ ስብ አለው። ጥሬ ስጋ የጤና አደጋ አለው — የበሰለ ክትፎ የተሻለ ነው።' } }),
    F('gored', 'Gored gored (cubed raw beef)', 'ጎረድ ጎረድ', 'meat',
      { kcal: 330, p: 30, c: 1, s: 0, as: 0, f: 23, sf: 10, fb: 0, na: 300, k: 450 },
      { portions: P.serving, base: { en: '1 serving ≈150 g', am: '1 ምግብ ≈150 ግ' }, gi: 'low', tags: ['meat', 'raw'], allergens: ['dairy'], oil: 8, oilType: 'kibbeh', salt: true, src: RECIPE }),
    F('dulet', 'Dulet (tripe, liver, beef)', 'ዱለት', 'meat',
      { kcal: 280, p: 26, c: 4, s: 1, as: 0, f: 18, sf: 8, fb: 1, na: 500, k: 350 },
      { portions: P.serving, base: { en: '1 serving ≈150 g', am: '1 ምግብ ≈150 ግ' }, gi: 'low', tags: ['meat'], allergens: ['dairy'], oil: 10, oilType: 'kibbeh', salt: true,
        src: RECIPE, note: { en: 'Organ meats are high in dietary cholesterol; fine occasionally.', am: 'የውስጥ አካል ስጋ ኮሌስትሮል ይበዛዋል፤ አልፎ አልፎ ይመገቡ።' } }),
    F('asa', 'Asa tibs (fried fish)', 'አሳ ጥብስ', 'meat',
      { kcal: 300, p: 35, c: 5, s: 1, as: 0, f: 15, sf: 3, fb: 0.5, na: 400, k: 500 },
      { portions: P.serving, base: { en: '1 fish fillet ≈150 g', am: '1 የአሳ ቁራጭ ≈150 ግ' }, gi: 'low', tags: ['fish', 'fasting_fish'], allergens: ['fish'], oil: 10, salt: true, src: USDA + ' (tilapia #175176) + frying oil' }),
    F('chicken', 'Chicken breast (grilled)', 'የዶሮ ፍርምባ (የተጠበሰ)', 'meat',
      { kcal: 165, p: 31, c: 0, s: 0, as: 0, f: 3.6, sf: 1, fb: 0, na: 74, k: 256 },
      { portions: P.serving, base: { en: '100 g', am: '100 ግ' }, gi: 'low', tags: ['meat'], src: USDA + ' #171477' }),
    F('egg', 'Egg (boiled)', 'እንቁላል (የተቀቀለ)', 'meat',
      { kcal: 78, p: 6.3, c: 0.6, s: 0.6, as: 0, f: 5.3, sf: 1.6, fb: 0, na: 62, k: 63 },
      { portions: P.piece, base: { en: '1 large egg ≈50 g', am: '1 እንቁላል ≈50 ግ' }, gi: 'low', tags: ['vegetarian'], allergens: ['egg'], src: USDA + ' #173424' }),
    F('enkulal_firfir', 'Enkulal firfir (scrambled eggs)', 'እንቁላል ፍርፍር', 'meat',
      { kcal: 230, p: 13, c: 5, s: 3, as: 0, f: 18, sf: 4, fb: 1, na: 350, k: 250 },
      { portions: P.serving, base: { en: '2 eggs with onion, tomato, pepper', am: '2 እንቁላል ከሽንኩርት፣ ቲማቲም ጋር' }, gi: 'low', tags: ['vegetarian'], allergens: ['egg'], oil: 8, salt: true, src: RECIPE }),
    F('ayib', 'Ayib (fresh cottage cheese)', 'አይብ', 'dairy',
      { kcal: 110, p: 12, c: 4, s: 3, as: 0, f: 5, sf: 3, fb: 0, na: 40, k: 100 },
      { portions: P.serving, base: { en: '½ cup ≈110 g', am: '½ ኩባያ ≈110 ግ' }, gi: 'low', tags: ['vegetarian'], allergens: ['dairy'], src: FCT, note: { en: 'Low-fat, unsalted, high-protein — a great partner for kitfo, gomen or kocho.', am: 'ዝቅተኛ ስብ፣ ጨው የሌለው፣ ብዙ ፕሮቲን ያለው።' } }),
    F('ergo', 'Ergo (traditional yogurt)', 'እርጎ', 'dairy',
      { kcal: 150, p: 8.5, c: 11, s: 11, as: 0, f: 8, sf: 5, fb: 0, na: 113, k: 380 },
      { portions: P.cup, base: { en: '1 cup ≈245 g', am: '1 ኩባያ ≈245 ግ' }, gi: 'low', tags: ['vegetarian'], allergens: ['dairy'], src: USDA + ' whole-milk yogurt #171284' }),
    F('milk', 'Milk (whole)', 'ወተት', 'drink',
      { kcal: 150, p: 8, c: 12, s: 12, as: 0, f: 8, sf: 4.6, fb: 0, na: 105, k: 322 },
      { portions: P.glass, base: { en: '1 glass ≈250 ml', am: '1 ብርጭቆ ≈250 ሚሊ' }, gi: 'low', tags: ['vegetarian'], allergens: ['dairy'], src: USDA + ' #171265' }),

    // ---- Breakfast dishes
    F('firfir', 'Firfir (injera in sauce)', 'ፍርፍር', 'breakfast',
      { kcal: 380, p: 9, c: 55, s: 4, as: 0, f: 14, sf: 5, fb: 6, na: 700, k: 350 },
      { portions: P.plate, base: { en: '1 plate ≈250 g', am: '1 ሳህን ≈250 ግ' }, gi: 'medium', tags: [], allergens: ['dairy'], oil: 12, oilType: 'kibbeh', salt: true, src: RECIPE }),
    F('chechebsa', 'Chechebsa / kita firfir', 'ጨጨብሳ', 'breakfast',
      { kcal: 520, p: 10, c: 62, s: 6, as: 4, f: 26, sf: 13, fb: 4, na: 450, k: 200 },
      { portions: P.plate, base: { en: '1 plate ≈200 g (with butter, berbere)', am: '1 ሳህን ≈200 ግ (ከቅቤና በርበሬ ጋር)' }, gi: 'high', tags: [], allergens: ['gluten', 'dairy'], oil: 22, oilType: 'kibbeh', salt: true,
        src: RECIPE, note: { en: 'Often served with honey — that adds sugar fast. Ask for less butter and skip the honey, add ayib or eggs.', am: 'ብዙ ጊዜ ከማር ጋር ይቀርባል — ማሩን ይተዉ፣ ቅቤ ይቀንሱ።' } }),
    F('genfo', 'Genfo (barley porridge)', 'ገንፎ', 'breakfast',
      { kcal: 550, p: 12, c: 75, s: 2, as: 0, f: 22, sf: 13, fb: 10, na: 300, k: 350 },
      { portions: P.plate, base: { en: '1 bowl ≈300 g (with butter, berbere)', am: '1 ሳህን ≈300 ግ' }, gi: 'medium', tags: ['wholegrain'], allergens: ['gluten', 'dairy'], oil: 20, oilType: 'kibbeh', salt: true, src: RECIPE + ' (barley flour, niter kibbeh)' }),
    F('kinche', 'Kinche (cracked wheat/barley)', 'ቅንጬ', 'breakfast',
      { kcal: 330, p: 9, c: 50, s: 1, as: 0, f: 11, sf: 6, fb: 7, na: 250, k: 250 },
      { portions: P.plate, base: { en: '1 bowl ≈250 g', am: '1 ሳህን ≈250 ግ' }, gi: 'medium', tags: ['wholegrain'], allergens: ['gluten', 'dairy'], oil: 10, oilType: 'kibbeh', salt: true, src: RECIPE }),

    // ---- Snacks
    F('kolo', 'Kolo (roasted barley/chickpeas)', 'ቆሎ', 'snack',
      { kcal: 190, p: 6, c: 36, s: 1, as: 0, f: 3, sf: 0.4, fb: 6, na: 100, k: 180 },
      { portions: P.serving, base: { en: '½ cup ≈50 g', am: '½ ኩባያ ≈50 ግ' }, gi: 'medium', tags: ['fasting', 'vegan', 'wholegrain'], allergens: ['gluten'], src: FCT }),
    F('sambusa', 'Sambusa (lentil, fried)', 'ሳምቡሳ', 'snack',
      { kcal: 170, p: 5, c: 17, s: 1, as: 0, f: 9, sf: 1.5, fb: 3, na: 220, k: 120 },
      { portions: P.piece, base: { en: '1 piece ≈60 g', am: '1 ቁራጭ ≈60 ግ' }, gi: 'medium', tags: ['fasting', 'vegan'], allergens: ['gluten'], oil: 8, salt: true, src: RECIPE }),
    F('fendisha', 'Fendisha (popcorn)', 'ፈንዲሻ', 'snack',
      { kcal: 110, p: 2, c: 13, s: 0, as: 0, f: 6, sf: 1, fb: 2.5, na: 200, k: 50 },
      { portions: P.serving, base: { en: '2 cups popped ≈20 g', am: '2 ኩባያ ≈20 ግ' }, gi: 'medium', tags: ['fasting', 'vegan', 'wholegrain', 'glutenfree'], oil: 4, salt: true, src: USDA + ' #167959' }),
    F('peanuts', 'Peanuts (roasted)', 'ኦቾሎኒ', 'snack',
      { kcal: 170, p: 7, c: 6, s: 1.2, as: 0, f: 14, sf: 2, fb: 2.4, na: 90, k: 200 },
      { portions: P.serving, base: { en: '¼ cup ≈30 g', am: '¼ ኩባያ ≈30 ግ' }, gi: 'low', tags: ['fasting', 'vegan'], allergens: ['peanut'], salt: true, src: USDA + ' #172430' }),

    // ---- Drinks
    F('buna', 'Buna (black coffee, no sugar)', 'ቡና (ያለ ስኳር)', 'drink',
      { kcal: 2, p: 0.1, c: 0, s: 0, as: 0, f: 0, sf: 0, fb: 0, na: 2, k: 50 },
      { portions: P.cupSmall, base: { en: '1 sini cup ≈60 ml', am: '1 ስኒ ≈60 ሚሊ' }, gi: 'low', tags: ['fasting', 'vegan'], src: USDA + ' brewed coffee #171890' }),
    F('buna_sugar', 'Buna with 2 tsp sugar', 'ቡና በስኳር (2 ማንኪያ)', 'drink',
      { kcal: 34, p: 0.1, c: 8, s: 8, as: 8, f: 0, sf: 0, fb: 0, na: 2, k: 50 },
      { portions: P.cupSmall, base: { en: '1 sini cup ≈60 ml', am: '1 ስኒ ≈60 ሚሊ' }, gi: 'high', tags: ['fasting', 'vegan'], src: USDA }),
    F('shai', 'Shai (tea, no sugar)', 'ሻይ (ያለ ስኳር)', 'drink',
      { kcal: 2, p: 0, c: 0.5, s: 0, as: 0, f: 0, sf: 0, fb: 0, na: 5, k: 40 },
      { portions: P.glass, base: { en: '1 glass ≈200 ml', am: '1 ብርጭቆ ≈200 ሚሊ' }, gi: 'low', tags: ['fasting', 'vegan'], src: USDA + ' brewed tea' }),
    F('shai_sugar', 'Shai with 2 tsp sugar', 'ሻይ በስኳር (2 ማንኪያ)', 'drink',
      { kcal: 34, p: 0, c: 8.5, s: 8, as: 8, f: 0, sf: 0, fb: 0, na: 5, k: 40 },
      { portions: P.glass, base: { en: '1 glass ≈200 ml', am: '1 ብርጭቆ ≈200 ሚሊ' }, gi: 'high', tags: ['fasting', 'vegan'], src: USDA }),
    F('tej', 'Tej (honey wine)', 'ጠጅ', 'drink',
      { kcal: 200, p: 0.3, c: 20, s: 18, as: 18, f: 0, sf: 0, fb: 0, na: 10, k: 50 },
      { portions: P.glass, base: { en: '1 berele/glass ≈250 ml', am: '1 ብርሌ ≈250 ሚሊ' }, gi: 'high', tags: ['alcohol', 'fasting', 'vegan'],
        src: RECIPE + ' (honey + ~7–11% alcohol)', note: { en: 'Contains alcohol AND honey sugar. Alcohol can cause low blood sugar hours later if you use insulin or sulfonylureas, and raises blood pressure.', am: 'አልኮልና የማር ስኳር አለው። ኢንሱሊን ለሚወስዱ ከሰዓታት በኋላ ስኳር ሊያወርድ ይችላል፤ የደም ግፊትም ይጨምራል።' } }),
    F('tella', 'Tella (home-brewed beer)', 'ጠላ', 'drink',
      { kcal: 120, p: 1, c: 12, s: 2, as: 0, f: 0, sf: 0, fb: 0.5, na: 10, k: 80 },
      { portions: P.glass, base: { en: '1 glass ≈330 ml', am: '1 ብርጭቆ ≈330 ሚሊ' }, gi: 'medium', tags: ['alcohol', 'fasting', 'vegan'], allergens: ['gluten'],
        src: FCT + ' (~2–4% alcohol)', note: { en: 'Alcohol: limit, and never drink on an empty stomach if you take insulin.', am: 'አልኮል ነው፤ ይገድቡ። ኢንሱሊን ከወሰዱ በባዶ ሆድ አይጠጡ።' } }),
    F('soda', 'Soda (cola / Coca, Pepsi)', 'ለስላሳ (ኮካ/ፔፕሲ)', 'drink',
      { kcal: 139, p: 0, c: 35, s: 35, as: 35, f: 0, sf: 0, fb: 0, na: 15, k: 5 },
      { portions: P.glass, base: { en: '1 bottle/can ≈330 ml', am: '1 ጠርሙስ ≈330 ሚሊ' }, gi: 'high', tags: ['fasting', 'vegan'], src: USDA + ' #171870' }),
    F('juice_orange', 'Orange juice (100%)', 'የብርቱካን ጭማቂ', 'drink',
      { kcal: 112, p: 1.7, c: 26, s: 21, as: 0, f: 0.5, sf: 0.1, fb: 0.5, na: 2, k: 450 },
      { portions: P.glass, base: { en: '1 glass ≈250 ml', am: '1 ብርጭቆ ≈250 ሚሊ' }, gi: 'high', tags: ['fasting', 'vegan'], src: USDA + ' #169098' }),
    F('juice_mix', 'Juice house mix (spris/avocado-mango)', 'ስፕሪስ ጭማቂ', 'drink',
      { kcal: 260, p: 2, c: 48, s: 42, as: 12, f: 8, sf: 1.2, fb: 4, na: 15, k: 600 },
      { portions: P.glass, base: { en: '1 large glass ≈350 ml', am: '1 ትልቅ ብርጭቆ ≈350 ሚሊ' }, gi: 'high', tags: ['fasting', 'vegan'], src: RECIPE + ' (mango, avocado, papaya, added sugar/syrup)' }),
    F('water', 'Water', 'ውሃ', 'drink',
      { kcal: 0, p: 0, c: 0, s: 0, as: 0, f: 0, sf: 0, fb: 0, na: 5, k: 0 },
      { portions: P.glass, base: { en: '1 glass ≈250 ml', am: '1 ብርጭቆ ≈250 ሚሊ' }, gi: 'low', tags: ['fasting', 'vegan'], src: USDA }),

    // ---- Fruits
    F('banana', 'Banana', 'ሙዝ', 'fruit',
      { kcal: 105, p: 1.3, c: 27, s: 14, as: 0, f: 0.4, sf: 0.1, fb: 3.1, na: 1, k: 422 },
      { portions: P.piece, base: { en: '1 medium ≈118 g', am: '1 መካከለኛ ≈118 ግ' }, gi: 'medium', tags: ['fasting', 'vegan'], src: USDA + ' #173944' }),
    F('apple', 'Apple', 'ፖም', 'fruit',
      { kcal: 95, p: 0.5, c: 25, s: 19, as: 0, f: 0.3, sf: 0.1, fb: 4.4, na: 2, k: 195 },
      { portions: P.piece, base: { en: '1 medium ≈180 g', am: '1 መካከለኛ ≈180 ግ' }, gi: 'low', tags: ['fasting', 'vegan'], src: USDA + ' #171688' }),
    F('orange', 'Orange', 'ብርቱካን', 'fruit',
      { kcal: 62, p: 1.2, c: 15.4, s: 12, as: 0, f: 0.2, sf: 0, fb: 3.1, na: 0, k: 237 },
      { portions: P.piece, base: { en: '1 medium ≈130 g', am: '1 መካከለኛ ≈130 ግ' }, gi: 'low', tags: ['fasting', 'vegan'], src: USDA + ' #169097' }),
    F('mango', 'Mango', 'ማንጎ', 'fruit',
      { kcal: 99, p: 1.4, c: 25, s: 23, as: 0, f: 0.6, sf: 0.1, fb: 2.6, na: 2, k: 277 },
      { portions: P.cup, base: { en: '1 cup sliced ≈165 g', am: '1 ኩባያ ≈165 ግ' }, gi: 'medium', tags: ['fasting', 'vegan'], src: USDA + ' #169910' }),
    F('papaya', 'Papaya', 'ፓፓያ', 'fruit',
      { kcal: 62, p: 0.7, c: 16, s: 11, as: 0, f: 0.4, sf: 0.1, fb: 2.5, na: 12, k: 264 },
      { portions: P.cup, base: { en: '1 cup ≈145 g', am: '1 ኩባያ ≈145 ግ' }, gi: 'medium', tags: ['fasting', 'vegan'], src: USDA + ' #169926' }),
    F('avocado', 'Avocado', 'አቮካዶ', 'fruit',
      { kcal: 160, p: 2, c: 8.5, s: 0.7, as: 0, f: 15, sf: 2.1, fb: 6.7, na: 7, k: 485 },
      { portions: P.serving, base: { en: '½ fruit ≈100 g', am: '½ ፍሬ ≈100 ግ' }, gi: 'low', tags: ['fasting', 'vegan'], src: USDA + ' #171705' }),
    F('guava', 'Guava (zeytuna)', 'ዘይቱና', 'fruit',
      { kcal: 37, p: 1.4, c: 8, s: 5, as: 0, f: 0.5, sf: 0.1, fb: 3, na: 1, k: 229 },
      { portions: P.piece, base: { en: '1 fruit ≈55 g', am: '1 ፍሬ ≈55 ግ' }, gi: 'low', tags: ['fasting', 'vegan'], src: USDA + ' #173044' }),

    // ---- International / common
    F('rice', 'Rice (white, cooked)', 'ሩዝ (ነጭ)', 'staple',
      { kcal: 205, p: 4.3, c: 45, s: 0.1, as: 0, f: 0.4, sf: 0.1, fb: 0.6, na: 2, k: 55 },
      { portions: P.cup, base: { en: '1 cup ≈158 g', am: '1 ኩባያ ≈158 ግ' }, gi: 'high', tags: ['fasting', 'vegan', 'glutenfree'], src: USDA + ' #168878' }),
    F('rice_brown', 'Rice (brown, cooked)', 'ቡናማ ሩዝ', 'staple',
      { kcal: 216, p: 5, c: 45, s: 0.7, as: 0, f: 1.8, sf: 0.4, fb: 3.5, na: 10, k: 154 },
      { portions: P.cup, base: { en: '1 cup ≈195 g', am: '1 ኩባያ ≈195 ግ' }, gi: 'medium', tags: ['fasting', 'vegan', 'glutenfree', 'wholegrain'], src: USDA + ' #169704' }),
    F('pasta', 'Pasta (plain, cooked)', 'ፓስታ', 'staple',
      { kcal: 220, p: 8, c: 43, s: 0.8, as: 0, f: 1.3, sf: 0.2, fb: 2.5, na: 1, k: 63 },
      { portions: P.cup, base: { en: '1 cup ≈140 g', am: '1 ኩባያ ≈140 ግ' }, gi: 'medium', tags: ['fasting', 'vegan'], allergens: ['gluten'], src: USDA + ' #168928' }),
    F('pasta_sauce', 'Pasta with tomato/meat sauce', 'ፓስታ በስጎ', 'staple',
      { kcal: 450, p: 18, c: 62, s: 9, as: 2, f: 14, sf: 4.5, fb: 5, na: 750, k: 600 },
      { portions: P.plate, base: { en: '1 plate ≈350 g', am: '1 ሳህን ≈350 ግ' }, gi: 'medium', tags: ['meat'], allergens: ['gluten'], oil: 8, salt: true, src: RECIPE }),
    F('bread_white', 'White bread', 'ነጭ ዳቦ (ስላይስ)', 'staple',
      { kcal: 75, p: 2.6, c: 14, s: 1.5, as: 1.2, f: 1, sf: 0.2, fb: 0.8, na: 140, k: 33 },
      { portions: P.slice, base: { en: '1 slice ≈28 g', am: '1 ስላይስ ≈28 ግ' }, gi: 'high', tags: ['fasting', 'vegan'], allergens: ['gluten'], src: USDA + ' #172686' }),
    F('bread_whole', 'Whole-wheat bread', 'ሙሉ ስንዴ ዳቦ', 'staple',
      { kcal: 80, p: 4, c: 14, s: 1.4, as: 1, f: 1.1, sf: 0.2, fb: 2, na: 145, k: 80 },
      { portions: P.slice, base: { en: '1 slice ≈32 g', am: '1 ስላይስ ≈32 ግ' }, gi: 'medium', tags: ['fasting', 'vegan', 'wholegrain'], allergens: ['gluten'], src: USDA + ' #172688' }),
    F('fries', 'Chips / French fries', 'ቺፕስ', 'snack',
      { kcal: 365, p: 4, c: 48, s: 0.3, as: 0, f: 17, sf: 2.3, fb: 4.4, na: 246, k: 678 },
      { portions: P.serving, base: { en: '1 medium serving ≈117 g', am: '1 መካከለኛ ≈117 ግ' }, gi: 'high', tags: ['fasting', 'vegan'], oil: 14, salt: true, src: USDA + ' #170698' }),
    F('burger', 'Burger', 'በርገር', 'meat',
      { kcal: 540, p: 30, c: 40, s: 8, as: 6, f: 28, sf: 11, fb: 2, na: 1000, k: 450 },
      { portions: P.piece, base: { en: '1 burger ≈250 g', am: '1 በርገር ≈250 ግ' }, gi: 'high', tags: ['meat'], allergens: ['gluten', 'dairy'], src: USDA + ' fast food' }),
    F('pizza', 'Pizza', 'ፒዛ', 'staple',
      { kcal: 285, p: 12, c: 36, s: 3.8, as: 1, f: 10, sf: 4.5, fb: 2.5, na: 640, k: 184 },
      { portions: P.slice, base: { en: '1 slice ≈107 g', am: '1 ቁራጭ ≈107 ግ' }, gi: 'high', tags: ['vegetarian'], allergens: ['gluten', 'dairy'], src: USDA + ' #173282' }),    // ---- v2: more Ethiopian dishes (household & restaurant classics)
    F('shiro_tegabino', 'Shiro tegabino (thick, with butter)', 'ሽሮ ተጋቢኖ', 'stew',
      { kcal: 380, p: 14, c: 32, s: 4, as: 0, f: 22, sf: 9, fb: 9, na: 800, k: 480 },
      { portions: P.cup, base: { en: '1 clay-pot serving ≈240 g', am: '1 ተጋቢኖ ≈240 ግ' }, gi: 'low', tags: ['legume'], allergens: ['dairy'], oil: 18, oilType: 'kibbeh', salt: true,
        src: RECIPE + ' (restaurant style)', note: { en: 'Restaurant shiro is usually richer: more butter/oil and salt than home shiro. Ask for "be zeyt" (with oil) on fasting days.', am: 'የምግብ ቤት ሽሮ ከቤቱ የበለጠ ቅቤና ጨው አለው።' } }),
    F('bozena_shiro', 'Bozena shiro (shiro with meat)', 'ቦዘና ሽሮ', 'stew',
      { kcal: 380, p: 20, c: 28, s: 4, as: 0, f: 20, sf: 6, fb: 8, na: 850, k: 500 },
      { portions: P.cup, base: { en: '1 cup ≈240 g', am: '1 ኩባያ ≈240 ግ' }, gi: 'low', tags: ['legume', 'meat'], allergens: ['dairy'], oil: 14, oilType: 'kibbeh', salt: true, src: RECIPE }),
    F('misir_alicha', 'Misir alicha (mild lentils, turmeric)', 'ምስር አልጫ', 'stew',
      { kcal: 250, p: 15, c: 36, s: 3, as: 0, f: 6, sf: 0.8, fb: 12, na: 500, k: 600 },
      { portions: P.cup, base: { en: '1 cup ≈240 g', am: '1 ኩባያ ≈240 ግ' }, gi: 'low', tags: ['fasting', 'vegan', 'legume'], oil: 5, salt: true, src: RECIPE + ' (lentils USDA #172421)' }),
    F('shimbra_asa', 'Shimbra asa (chickpea "fish" stew)', 'ሽንብራ አሳ', 'stew',
      { kcal: 320, p: 14, c: 40, s: 4, as: 0, f: 12, sf: 1.5, fb: 10, na: 600, k: 500 },
      { portions: P.cup, base: { en: '1 cup ≈240 g', am: '1 ኩባያ ≈240 ግ' }, gi: 'low', tags: ['fasting', 'vegan', 'legume'], oil: 10, salt: true, src: RECIPE }),
    F('buticha', 'Buticha (chickpea flour dip)', 'ቡቲቻ', 'stew',
      { kcal: 200, p: 9, c: 22, s: 3, as: 0, f: 9, sf: 1.2, fb: 6, na: 350, k: 300 },
      { portions: P.serving, base: { en: '½ cup ≈120 g', am: '½ ኩባያ ≈120 ግ' }, gi: 'low', tags: ['fasting', 'vegan', 'legume'], oil: 7, salt: true, src: RECIPE }),
    F('shorba', 'Shorba (lentil/vegetable soup)', 'ሾርባ', 'stew',
      { kcal: 180, p: 9, c: 24, s: 4, as: 0, f: 5, sf: 1, fb: 6, na: 750, k: 400 },
      { portions: P.plate, base: { en: '1 bowl ≈300 ml', am: '1 ሳህን ≈300 ሚሊ' }, gi: 'low', tags: ['fasting', 'vegan', 'legume'], oil: 4, salt: true, src: RECIPE }),
    F('fosolia', 'Fosolia (green beans & carrots)', 'ፎሶሊያ', 'veg',
      { kcal: 140, p: 3, c: 16, s: 6, as: 0, f: 7, sf: 1, fb: 5, na: 350, k: 350 },
      { portions: P.cup, base: { en: '1 cup ≈200 g', am: '1 ኩባያ ≈200 ግ' }, gi: 'low', tags: ['fasting', 'vegan', 'vegetable'], oil: 6, salt: true, src: RECIPE + ' (green beans USDA #169961)' }),
    F('duba_wot', 'Duba wot (pumpkin stew)', 'የዱባ ወጥ', 'veg',
      { kcal: 150, p: 2, c: 22, s: 7, as: 0, f: 7, sf: 1, fb: 4, na: 400, k: 500 },
      { portions: P.cup, base: { en: '1 cup ≈220 g', am: '1 ኩባያ ≈220 ግ' }, gi: 'medium', tags: ['fasting', 'vegan', 'vegetable'], oil: 6, salt: true, src: RECIPE }),
    F('selata', 'Selata (green salad)', 'ሰላጣ', 'veg',
      { kcal: 60, p: 1, c: 5, s: 2, as: 0, f: 4, sf: 0.5, fb: 2, na: 150, k: 200 },
      { portions: P.cup, base: { en: '1 cup ≈100 g', am: '1 ኩባያ ≈100 ግ' }, gi: 'low', tags: ['fasting', 'vegan', 'vegetable'], oil: 4, salt: true, src: USDA + ' (lettuce, tomato, oil-lemon)' }),
    F('gomen_besiga', 'Gomen be siga (collards with beef)', 'ጎመን በስጋ', 'meat',
      { kcal: 280, p: 20, c: 10, s: 2, as: 0, f: 18, sf: 6, fb: 4, na: 600, k: 500 },
      { portions: P.cup, base: { en: '1 cup ≈200 g', am: '1 ኩባያ ≈200 ግ' }, gi: 'low', tags: ['meat', 'vegetable'], allergens: ['dairy'], oil: 10, oilType: 'kibbeh', salt: true, src: RECIPE }),
    F('ayib_gomen', 'Ayib be gomen (gomen kitfo)', 'አይብ በጎመን', 'veg',
      { kcal: 220, p: 13, c: 9, s: 3, as: 0, f: 15, sf: 7, fb: 4, na: 350, k: 400 },
      { portions: P.cup, base: { en: '1 cup ≈180 g', am: '1 ኩባያ ≈180 ግ' }, gi: 'low', tags: ['vegetarian', 'vegetable'], allergens: ['dairy'], oil: 8, oilType: 'kibbeh', salt: true, src: RECIPE }),
    F('minchet', 'Minchet abish (minced beef stew)', 'ምንቸት አብሽ', 'meat',
      { kcal: 400, p: 28, c: 9, s: 4, as: 0, f: 28, sf: 10, fb: 2, na: 800, k: 520 },
      { portions: P.cup, base: { en: '1 cup ≈240 g', am: '1 ኩባያ ≈240 ግ' }, gi: 'low', tags: ['meat'], allergens: ['dairy'], oil: 16, oilType: 'kibbeh', salt: true, src: RECIPE }),
    F('awaze_tibs', 'Awaze tibs (beef in chili paste)', 'አዋዜ ጥብስ', 'meat',
      { kcal: 400, p: 35, c: 8, s: 4, as: 0, f: 25, sf: 8.5, fb: 1.5, na: 850, k: 560 },
      { portions: P.plate, base: { en: '1 plate ≈200 g', am: '1 ሳህን ≈200 ግ' }, gi: 'low', tags: ['meat'], oil: 12, salt: true, src: RECIPE }),
    F('zilzil_tibs', 'Zilzil tibs (beef strips)', 'ዝልዝል ጥብስ', 'meat',
      { kcal: 420, p: 38, c: 5, s: 2, as: 0, f: 28, sf: 9, fb: 1, na: 650, k: 560 },
      { portions: P.plate, base: { en: '1 plate ≈200 g', am: '1 ሳህን ≈200 ግ' }, gi: 'low', tags: ['meat'], oil: 15, salt: true, src: RECIPE }),
    F('yebeg_tibs', 'Yebeg tibs (lamb tibs)', 'የበግ ጥብስ', 'meat',
      { kcal: 450, p: 32, c: 5, s: 2, as: 0, f: 34, sf: 14, fb: 1, na: 600, k: 480 },
      { portions: P.plate, base: { en: '1 plate ≈200 g', am: '1 ሳህን ≈200 ግ' }, gi: 'low', tags: ['meat'], oil: 12, salt: true, src: RECIPE + ' (lamb USDA #172519)' }),
    F('mahberawi', 'Mahberawi platter (kitfo, tibs, ayib, gomen)', 'ማህበራዊ', 'meat',
      { kcal: 850, p: 55, c: 12, s: 4, as: 0, f: 62, sf: 26, fb: 4, na: 1300, k: 900 },
      { portions: P.serving, base: { en: '1 platter share ≈400 g (no injera)', am: '1 ድርሻ ≈400 ግ (ያለ እንጀራ)' }, gi: 'low', tags: ['meat', 'raw'], allergens: ['dairy'], oil: 30, oilType: 'kibbeh', salt: true,
        src: RECIPE, note: { en: 'A celebration platter: very high in saturated fat. Sharing it and adding extra gomen and salad helps.', am: 'የበዓል ምግብ ነው፤ ሳቹሬትድ ስቡ በጣም ከፍተኛ ነው። ማጋራትና ጎመን/ሰላጣ መጨመር ይረዳል።' } }),
    F('quanta_firfir', 'Quanta firfir (dried beef)', 'ቋንጣ ፍርፍር', 'breakfast',
      { kcal: 480, p: 26, c: 52, s: 4, as: 0, f: 18, sf: 8, fb: 6, na: 900, k: 450 },
      { portions: P.plate, base: { en: '1 plate ≈250 g', am: '1 ሳህን ≈250 ግ' }, gi: 'medium', tags: ['meat'], allergens: ['dairy'], oil: 14, oilType: 'kibbeh', salt: true, src: RECIPE }),
    F('tsom_firfir', 'Yetsom firfir (fasting, oil-based)', 'የጾም ፍርፍር', 'breakfast',
      { kcal: 360, p: 9, c: 56, s: 4, as: 0, f: 11, sf: 1.5, fb: 7, na: 650, k: 330 },
      { portions: P.plate, base: { en: '1 plate ≈250 g', am: '1 ሳህን ≈250 ግ' }, gi: 'medium', tags: ['fasting', 'vegan'], oil: 10, salt: true, src: RECIPE }),
    F('kategna', 'Kategna (injera with butter & berbere)', 'ቃተኛ', 'breakfast',
      { kcal: 380, p: 9, c: 50, s: 1, as: 0, f: 16, sf: 10, fb: 5, na: 300, k: 230 },
      { portions: P.injera, base: { en: '1 injera ≈150 g + butter', am: '1 እንጀራ + ቅቤ' }, gi: 'medium', tags: [], allergens: ['dairy'], oil: 15, oilType: 'kibbeh', salt: true, src: RECIPE }),
    F('fatira', 'Fatira (with egg & honey)', 'ፈጢራ', 'breakfast',
      { kcal: 600, p: 16, c: 70, s: 18, as: 15, f: 28, sf: 9, fb: 2, na: 450, k: 200 },
      { portions: P.piece, base: { en: '1 piece ≈200 g', am: '1 ቁራጭ ≈200 ግ' }, gi: 'high', tags: ['vegetarian'], allergens: ['gluten', 'egg'], oil: 20, salt: true, src: RECIPE }),
    F('atmit', 'Atmit (porridge drink)', 'አጥሚት', 'breakfast',
      { kcal: 230, p: 6, c: 38, s: 14, as: 10, f: 6, sf: 3, fb: 3, na: 80, k: 250 },
      { portions: P.glass, base: { en: '1 cup ≈250 ml', am: '1 ኩባያ ≈250 ሚሊ' }, gi: 'high', tags: ['vegetarian'], allergens: ['gluten', 'dairy'], src: RECIPE + ' (oat/barley, milk, sugar)' }),
    F('dabo_kolo', 'Dabo kolo (crunchy bread bites)', 'ዳቦ ቆሎ', 'snack',
      { kcal: 190, p: 4, c: 26, s: 2, as: 1, f: 8, sf: 1.5, fb: 1, na: 150, k: 50 },
      { portions: P.serving, base: { en: '½ cup ≈40 g', am: '½ ኩባያ ≈40 ግ' }, gi: 'high', tags: ['fasting', 'vegan'], allergens: ['gluten'], oil: 6, salt: true, src: RECIPE }),
    F('shimbra_kolo', 'Roasted chickpeas (shimbra kolo)', 'የተቆላ ሽንብራ', 'snack',
      { kcal: 180, p: 10, c: 28, s: 4, as: 0, f: 3, sf: 0.3, fb: 8, na: 20, k: 380 },
      { portions: P.serving, base: { en: '½ cup ≈50 g', am: '½ ኩባያ ≈50 ግ' }, gi: 'low', tags: ['fasting', 'vegan', 'legume'], src: USDA + ' chickpeas #173757' }),
    F('ambasha', 'Ambasha (festive bread)', 'አምባሻ', 'staple',
      { kcal: 230, p: 6, c: 42, s: 5, as: 4, f: 4, sf: 1, fb: 1.5, na: 300, k: 80 },
      { portions: P.slice, base: { en: '1 slice ≈80 g', am: '1 ቁራጭ ≈80 ግ' }, gi: 'high', tags: ['fasting', 'vegan'], allergens: ['gluten'], salt: true, src: RECIPE }),
    F('besso', 'Besso (roasted barley drink)', 'በሶ', 'drink',
      { kcal: 150, p: 4, c: 30, s: 8, as: 8, f: 1, sf: 0.2, fb: 4, na: 10, k: 150 },
      { portions: P.glass, base: { en: '1 glass ≈250 ml (with sugar)', am: '1 ብርጭቆ ≈250 ሚሊ (በስኳር)' }, gi: 'medium', tags: ['fasting', 'vegan', 'wholegrain'], allergens: ['gluten'], src: FCT }),
    F('areki', 'Areki (strong spirit)', 'አረቄ', 'drink',
      { kcal: 100, p: 0, c: 0, s: 0, as: 0, f: 0, sf: 0, fb: 0, na: 0, k: 0 },
      { portions: P.cupSmall, base: { en: '1 shot ≈40 ml', am: '1 መለኪያ ≈40 ሚሊ' }, gi: 'low', tags: ['alcohol', 'fasting', 'vegan'], src: USDA + ' distilled spirit 40%', note: { en: 'Strong alcohol: can cause delayed low blood sugar with insulin/sulfonylureas and raises blood pressure.', am: 'ጠንካራ አልኮል ነው።' } }),
  ];

  const byId = {};
  FOODS.forEach(f => { byId[f.id] = f; });
  // Aliases help match AI output and free-text search (Latin + Ge'ez spellings)
  const ALIASES = {
    injera_teff: ['injera', 'enjera', 'teff', 'tef', 'እንጀራ', 'ጤፍ'], injera_white: ['white injera', 'wheat injera', 'rice injera'],
    shiro: ['shiro', 'shuro', 'chickpea stew', 'ሽሮ'], misir: ['misir', 'misr', 'red lentil', 'lentil stew', 'ምስር'], kik: ['kik', 'split pea', 'yellow pea', 'ክክ'],
    gomen: ['gomen', 'collard', 'kale', 'greens', 'ጎመን'], atkilt: ['atkilt', 'atakilt', 'mixed vegetable', 'አትክልት'], tikil_gomen: ['tikil', 'cabbage', 'ጥቅል'],
    doro: ['doro', 'chicken stew', 'ዶሮ'], key_wot: ['key wot', 'sega wot', 'beef stew', 'ቀይ'], tibs: ['tibs', 'tebs', 'sauteed meat', 'ጥብስ'],
    kitfo: ['kitfo', 'ketfo', 'steak tartare', 'ክትፎ'], gored: ['gored', 'raw beef', 'ጎረድ'], firfir: ['firfir', 'fitfit', 'ፍርፍር'], chechebsa: ['chechebsa', 'kita firfir', 'ጨጨብሳ'],
    genfo: ['genfo', 'porridge', 'ገንፎ'], ful: ['ful', 'foul', 'fava', 'ፉል'], dulet: ['dulet', 'tripe', 'ዱለት'], beyaynetu: ['beyaynetu', 'fasting platter', 'combo', 'በያይነቱ'],
    ayib: ['ayib', 'cottage cheese', 'አይብ'], kolo: ['kolo', 'roasted barley', 'ቆሎ'], dabo: ['dabo', 'ዳቦ'], kita: ['kita', 'flatbread', 'ቂጣ'], tej: ['tej', 'honey wine', 'mead', 'ጠጅ'],
    tella: ['tella', 'tela', 'beer', 'ጠላ'], buna: ['coffee', 'buna', 'ቡና'], shai: ['tea', 'shai', 'ሻይ'], rice: ['rice', 'ሩዝ'], pasta: ['pasta', 'spaghetti', 'macaroni', 'ፓስታ'],
    soda: ['soda', 'cola', 'coke', 'pepsi', 'soft drink', 'ለስላሳ'], juice_orange: ['orange juice', 'juice', 'ጭማቂ'], egg: ['egg', 'እንቁላል'], banana: ['banana', 'ሙዝ'],
    apple: ['apple', 'ፖም'], orange: ['orange', 'ብርቱካን'], mango: ['mango', 'ማንጎ'], papaya: ['papaya', 'ፓፓያ'], avocado: ['avocado', 'አቮካዶ'], guava: ['guava', 'ዘይቱና'],
    timatim: ['tomato salad', 'salad', 'timatim', 'ሰላጣ'], potato: ['potato', 'ድንች'], sambusa: ['sambusa', 'samosa', 'ሳምቡሳ'], asa: ['fish', 'tilapia', 'አሳ'],
    kocho: ['kocho', 'enset', 'ቆጮ'], bread_white: ['bread', 'toast'], fries: ['fries', 'chips'], burger: ['burger', 'hamburger'], pizza: ['pizza'], milk: ['milk', 'ወተት'], ergo: ['yogurt', 'ergo', 'እርጎ'],
    chicken: ['chicken breast', 'grilled chicken'], water: ['water', 'ውሃ'], azifa: ['azifa', 'lentil salad'], kinche: ['kinche', 'qinche', 'ቅንጬ'], peanuts: ['peanut', 'ኦቾሎኒ'], fendisha: ['popcorn', 'ፈንዲሻ'],
    enkulal_firfir: ['scrambled egg', 'enkulal'],
  };

  Object.assign(ALIASES, {
    shiro_tegabino: ['tegabino', 'ተጋቢኖ'], bozena_shiro: ['bozena', 'ቦዘና'], misir_alicha: ['misir alicha', 'lentil alicha'], shimbra_asa: ['shimbra asa', 'ሽንብራ አሳ'],
    buticha: ['buticha', 'ቡቲቻ'], shorba: ['soup', 'shorba', 'ሾርባ'], fosolia: ['fosolia', 'green beans', 'ፎሶሊያ'], duba_wot: ['pumpkin', 'duba', 'ዱባ'],
    selata: ['green salad', 'lettuce', 'selata'], gomen_besiga: ['gomen besiga', 'gomen be siga', 'ጎመን በስጋ'], ayib_gomen: ['gomen kitfo', 'ayib be gomen'],
    minchet: ['minchet', 'minced meat', 'ምንቸት'], awaze_tibs: ['awaze tibs', 'awaze beef', 'አዋዜ ጥብስ'], zilzil_tibs: ['zilzil', 'ዝልዝል'], yebeg_tibs: ['lamb tibs', 'yebeg', 'በግ'],
    mahberawi: ['mahberawi', 'combo platter', 'ማህበራዊ'], quanta_firfir: ['quanta', 'kwanta', 'dried meat', 'ቋንጣ'], tsom_firfir: ['fasting firfir', 'የጾም ፍርፍር'],
    kategna: ['kategna', 'ቃተኛ'], fatira: ['fatira', 'ፈጢራ'], atmit: ['atmit', 'ጥሚት'], dabo_kolo: ['dabo kolo', 'ዳቦ ቆሎ'], shimbra_kolo: ['roasted chickpea', 'shimbra'],
    ambasha: ['ambasha', 'አምባሻ'], besso: ['besso', 'በሶ'], areki: ['areki', 'arak', 'spirit', 'አረቄ'],
  });

  /* Ethiopian household measures. frac = how many base portions ONE measure is (approximate). */
  const GURSHA_G = 30; // one gursha (hand-fed bite: injera + wot) ≈ 30 g
  function measures(f) {
    const out = [];
    const g = f.base && f.base.en.match(/≈\s*(\d+)\s*(g|ml)/); const baseG = g ? +g[1] : null;
    if (f.id.startsWith('injera') || f.id === 'kategna') { out.push({ u: 'rpiece', frac: 0.25 }); out.push({ u: 'gursha', frac: 1 / 10 }); }
    else if (['stew', 'veg', 'meat', 'breakfast'].includes(f.cat) && baseG) out.push({ u: 'gursha', frac: Math.round(GURSHA_G / baseG * 1000) / 1000 });
    if (baseG && f.portions === P.cup) { out.push({ u: 'sini', frac: Math.round(60 / baseG * 100) / 100 }); out.push({ u: 'sinig', frac: 1 }); }
    if (f.cat === 'drink' && f.portions === P.glass && baseG) out.push({ u: 'sini', frac: Math.round(60 / baseG * 100) / 100 });
    return out;
  }
  /* Cooking-method confirmation: each method adjusts oil level / fat type / extras. */
  const METHODS = {
    wot: [['home', {}], ['restaurant', { oil: 'high', salt: 'high' }], ['kibbeh', { oilType: 'kibbeh' }], ['lessoil', { oil: 'low' }]],
    tibs: [['derek', { oil: 'low' }], ['regular', {}], ['butter', { oilType: 'kibbeh', oil: 'high' }], ['restaurant', { oil: 'high', salt: 'high' }]],
    raw: [['tire', {}], ['lebleb', {}], ['yebesele', {}]],
    fried: [['deep', { oil: 'high' }], ['pan', {}], ['baked', { oil: 'low' }]],
    breakfast: [['home', {}], ['restaurant', { oil: 'high', salt: 'high' }], ['honey', { extra: { kcal: 64, c: 17, s: 17, as: 17 } }], ['lessoil', { oil: 'low' }]],
  };
  function methodGroup(f) {
    if (!f) return null;
    if (f.tags.includes('raw')) return 'raw';
    if (/tibs|asa/.test(f.id)) return 'tibs';
    if (['sambusa', 'fries', 'dabo_kolo'].includes(f.id)) return 'fried';
    if (f.cat === 'breakfast' && f.oil > 0) return 'breakfast';
    if (['stew', 'veg', 'meat'].includes(f.cat) && f.oil > 0) return 'wot';
    return null;
  }

  function search(q, lang) {
    q = (q || '').trim().toLowerCase();
    if (!q) return FOODS;
    return FOODS.filter(f => f.name.en.toLowerCase().includes(q) || f.name.am.includes(q) || (ALIASES[f.id] || []).some(a => a.toLowerCase().includes(q) || q.includes(a.toLowerCase())));
  }
  function match(name) {
    const q = (name || '').toLowerCase();
    if (!q) return null;
    if (byId[q]) return byId[q];
    let best = null, bestLen = 0;
    for (const f of FOODS) {
      const cands = [f.name.en.toLowerCase(), f.name.am, ...(ALIASES[f.id] || []).map(a => a.toLowerCase())];
      for (const a of cands) { if (a && q.includes(a) && a.length > bestLen) { best = f; bestLen = a.length; } }
    }
    return best;
  }
  window.NolaFoods = { FOODS, byId, search, match, measures, METHODS, methodGroup, CATS: ['staple', 'stew', 'veg', 'meat', 'breakfast', 'dairy', 'snack', 'fruit', 'drink'] };
})();
