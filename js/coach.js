/* Offline rule-based nutrition coach (English + Amharic). Personalised by profile & targets. */
(function () {
  const E = () => window.NolaEngine;
  function ctx(pr) {
    const has = c => E().has(pr, c), T = E().targets(pr);
    const guide = Math.round(T.c * 0.3);
    const inj = Math.max(0.5, Math.round((guide * 0.65 / 48) / 0.25) * 0.25);
    return { has, T, dm: E().isDiabetic(pr), htn: has('htn') || has('heart'), chol: has('chol') || has('heart'), wt: has('obesity') || T.loss, guide, inj: E().frac(inj), fasting: (pr.restrictions || []).includes('fasting') };
  }
  const TOPICS = [
    ['meds', /medic|medicine|metformin|insulin|dose|pill|tablet|stop taking|amlodipine|statin|መድሃኒት|መድኃኒት|ኪኒን|ኢንሱሊን/i],
    ['breakfast', /breakfast|morning|ቁርስ|ጠዋት/i],
    ['injera', /injera|enjera|teff|tef|እንጀራ|ጤፍ/i],
    ['rice', /rice|pasta|macaroni|spaghetti|ሩዝ|ፓስታ|መኮሮኒ/i],
    ['coffee', /coffee|buna|caffeine|tea\b|shai|ቡና|ሻይ/i],
    ['fruit', /fruit|banana|mango|papaya|apple|orange|avocado|ፍራፍሬ|ፍሬ|ሙዝ|ማንጎ|ፓፓያ|ፖም|ብርቱካን|አቮካዶ/i],
    ['soda', /soda|coke|cola|pepsi|soft drink|juice|drink|ለስላሳ|ኮካ|ጭማቂ|መጠጥ|ልጠጣ/i],
    ['fasting', /fast(ing)?\b|tsom|lent|ramadan|hudade|ጾም|ፆም|ሁዳዴ|ረመዳን|ጦም/i],
    ['alcohol', /alcohol|beer|wine|tej|tella|araki|ጠጅ|ጠላ|ቢራ|አልኮል|አረቄ/i],
    ['snack', /snack|between meals|kolo|hungry|መክሰስ|ቆሎ|ርቦኛል/i],
    ['salt', /salt|sodium|berbere|mitmita|ጨው|በርበሬ|ሚጥሚጣ/i],
    ['sweet', /sweet|dessert|honey|cake|candy|biscuit|ማር|ጣፋጭ|ኬክ|ብስኩት/i],
    ['chol', /cholesterol|ldl|butter|kibbeh|niter|fat\b|oil|ኮሌስትሮል|ቅቤ|ዘይት/i],
    ['meat', /meat|kitfo|tibs|doro|beef|chicken|ስጋ|ክትፎ|ጥብስ|ዶሮ/i],
    ['exercise', /exercise|walk|gym|sport|workout|activity|እንቅስቃሴ|ስፖርት|መራመድ|ልምምድ/i],
    ['weight', /weight|lose|slim|obes|ክብደት|ውፍረት|መቀነስ/i],
    ['bp', /blood pressure|hypertension|\bbp\b|ግፊት/i],
    ['dinner', /dinner|lunch|eat today|what (should|can) i eat|meal plan|ምሳ|እራት|ምን ልብላ/i],
  ];
  function detect(q) { for (const [k, re] of TOPICS) if (re.test(q)) return k; return 'default'; }

  function answer(q, pr, lang) {
    const c = ctx(pr), am = lang === 'am', L = (en, a) => (am ? a : en);
    const lines = []; let src = [];
    const add = (en, a) => lines.push(L(en, a));
    switch (detect(q)) {
      case 'meds':
        add('I can’t advise starting, stopping or changing any medication or dose — please ask your doctor or pharmacist.', 'መድሃኒት ስለመጀመር፣ ስለማቆም ወይም መጠን ስለመቀየር ምክር መስጠት አልችልም — እባክዎ ሐኪምዎን ወይም ፋርማሲስትዎን ይጠይቁ።');
        add('What I *can* do: help you eat consistently so your medicine works predictably — similar carb amounts at similar times each day.', 'ማድረግ የምችለው፡ መድሃኒትዎ በትክክል እንዲሰራ በየቀኑ ተመሳሳይ ሰዓት ተመሳሳይ መጠን ካርቦሃይድሬት እንዲመገቡ ማገዝ።');
        if (c.dm) add('If you take insulin or sulfonylureas (e.g. glibenclamide), don’t skip meals and carry fast sugar for lows.', 'ኢንሱሊን ወይም ግሊበንክላማይድ የሚወስዱ ከሆነ ምግብ አይዝለሉ፤ ለስኳር መውረድ ፈጣን ስኳር ይያዙ።');
        src = ['ADA Standards of Care 2025']; break;
      case 'breakfast':
        add('**Good breakfast ideas for you:**', '**ለእርስዎ ጥሩ የቁርስ ሀሳቦች፡**');
        add('• Ful with less oil + 1 egg + tomato/onion, with ½ kita or ½ teff injera', '• ፉል በትንሽ ዘይት + 1 እንቁላል + ቲማቲም/ሽንኩርት፣ ከግማሽ ቂጣ ወይም ግማሽ የጤፍ እንጀራ ጋር');
        add('• Enkulal firfir (scrambled eggs with onion & tomato) + ½ teff injera', '• እንቁላል ፍርፍር (ከሽንኩርትና ቲማቲም ጋር) + ግማሽ የጤፍ እንጀራ');
        add('• Ayib with gomen and a small piece of kocho or whole-wheat bread', '• አይብ ከጎመንና ትንሽ ቆጮ ወይም ሙሉ ስንዴ ዳቦ ጋር');
        add('• Small genfo or kinche with *less* butter, no honey', '• ትንሽ ገንፎ ወይም ቅንጬ በ*ትንሽ* ቅቤ፣ ያለ ማር');
        if (c.dm) add(`For diabetes: aim for about ${c.guide} g carbs at breakfast and include protein (egg, ayib, ful). Chechebsa with honey and sweet tea raise glucose fast.`, `ለስኳር ህመም፡ በቁርስ ~${c.guide} ግ ካርቦሃይድሬት ያቅዱ፣ ፕሮቲንም (እንቁላል፣ አይብ፣ ፉል) ይጨምሩ። ጨጨብሳ በማርና ጣፋጭ ሻይ ስኳርን በፍጥነት ያሳድጋሉ።`);
        if (c.htn) add('For blood pressure: go light on salt in ful and firfir.', 'ለደም ግፊት፡ በፉልና በፍርፍር ውስጥ ጨው ይቀንሱ።');
        src = ['ADA Diabetes Plate', 'WHO healthy diet']; break;
      case 'injera':
        add(`**Injera is not "bad"** — teff injera is a whole grain with fiber and iron. The amount is what matters.`, '**እንጀራ "መጥፎ" አይደለም** — የጤፍ እንጀራ ፋይበርና ብረት ያለው ሙሉ እህል ነው። ዋናው መጠኑ ነው።');
        add('• 1 medium injera (~150 g) ≈ 48–56 g carbs, ~240–265 kcal', '• 1 መካከለኛ እንጀራ (~150 ግ) ≈ 48–56 ግ ካርቦሃይድሬት፣ ~240–265 ካሎሪ');
        if (c.dm) add(`• For you, about **${c.inj} injera per meal** fits your carb guide (~${c.guide} g/meal), leaving room for shiro/misir.`, `• ለእርስዎ በአንድ ምግብ **${c.inj} እንጀራ** ገደማ ከካርቦሃይድሬት መመሪያዎ (~${c.guide} ግ) ጋር ይስማማል።`);
        else if (c.wt) add('• For weight loss, try ¾–1 injera per meal and fill up on gomen, salad and legume wots.', '• ክብደት ለመቀነስ በአንድ ምግብ ¾–1 እንጀራ ይሞክሩ፤ በጎመን፣ ሰላጣና የጥራጥሬ ወጦች ይጥገቡ።');
        add('• Choose 100% teff over white (wheat/rice) injera when possible.', '• ሲቻል ከነጭ እንጀራ ይልቅ 100% የጤፍ እንጀራ ይምረጡ።');
        add('• Plate idea: half vegetables (gomen, atkilt, salad), a quarter legumes or lean meat, a quarter injera.', '• የሳህን ሀሳብ፡ ግማሽ አትክልት (ጎመን፣ አትክልት፣ ሰላጣ)፣ ሩብ ጥራጥሬ ወይም ቀጭን ስጋ፣ ሩብ እንጀራ።');
        src = ['ADA Diabetes Plate', 'Ethiopian Food Composition Table']; break;
      case 'rice':
        add('**Yes, you can eat rice** — portion and pairing matter.', '**አዎ፣ ሩዝ መብላት ይችላሉ** — መጠንና ከምን ጋር እንደሚበሉ ነው ዋናው።');
        add('• 1 cup cooked white rice ≈ 45 g carbs, 205 kcal, very little fiber.', '• 1 ኩባያ የበሰለ ነጭ ሩዝ ≈ 45 ግ ካርቦሃይድሬት፣ 205 ካሎሪ፣ በጣም ትንሽ ፋይበር።');
        if (c.dm) add(`• Keep it to about ½–1 cup per meal (your guide ≈ ${c.guide} g carbs), with vegetables and a protein like misir, chicken or fish. Brown rice raises glucose more slowly.`, `• በአንድ ምግብ ½–1 ኩባያ ገደማ ይሁን (መመሪያዎ ≈ ${c.guide} ግ)፣ ከአትክልትና ከፕሮቲን (ምስር፣ ዶሮ፣ አሳ) ጋር። ቡናማ ሩዝ ስኳርን በዝግታ ያሳድጋል።`);
        else add('• Half your plate vegetables, a quarter rice, a quarter protein.', '• ግማሽ ሳህን አትክልት፣ ሩብ ሩዝ፣ ሩብ ፕሮቲን።');
        add('• Same idea for pasta: ~1 cup cooked, with tomato-vegetable sauce rather than lots of oil.', '• ፓስታም እንዲሁ፡ ~1 ኩባያ የበሰለ፣ ከብዙ ዘይት ይልቅ በቲማቲምና አትክልት ስጎ።');
        src = ['ADA Diabetes Plate', 'USDA FoodData Central']; break;
      case 'coffee':
        add('**Buna is generally fine** for most people — the sugar is the main issue.', '**ቡና ለአብዛኛው ሰው በአጠቃላይ ችግር የለውም** — ዋናው ችግር ስኳሩ ነው።');
        add('• Black buna or plain shai has almost no calories. Each teaspoon of sugar adds ~4 g sugar; 3 cups with 2 tsp each = 24 g — about a whole day’s added-sugar limit.', '• ያለ ስኳር ቡና ወይም ሻይ ካሎሪ የለውም ማለት ይቻላል። እያንዳንዱ ማንኪያ ስኳር ~4 ግ ይጨምራል፤ 3 ስኒ በ2 ማንኪያ = 24 ግ — የአንድ ቀን ገደብ ያህል።');
        add('• Try less sugar each week, or add tena adam, ginger, cinnamon or cardamom for flavour.', '• በየሳምንቱ ስኳር ይቀንሱ፣ ወይም ለጣዕም ጤና አዳም፣ ዝንጅብል፣ ቀረፋ ወይም ኮረሪማ ይጨምሩ።');
        if (c.htn) add('• Caffeine can raise blood pressure briefly; up to ~3 small cups a day is usually OK — avoid it right before measuring BP.', '• ካፌይን የደም ግፊትን ለአጭር ጊዜ ሊያሳድግ ይችላል፤ በቀን ~3 ስኒ በአብዛኛው ችግር የለውም — ግፊት ከመለካትዎ በፊት አይጠጡ።');
        add('• Shai with meals can reduce iron absorption from injera — drink it between meals.', '• ከምግብ ጋር የሚጠጣ ሻይ ከእንጀራ የሚገኘውን ብረት መምጠጥ ይቀንሳል — በምግብ መካከል ይጠጡ።');
        src = ['WHO sugars guideline 2015', 'AHA']; break;
      case 'fruit':
        add('**Whole fruit is healthy** — fiber, vitamins and potassium.', '**ሙሉ ፍራፍሬ ጤናማ ነው** — ፋይበር፣ ቫይታሚንና ፖታሲየም አለው።');
        add('• Great choices: guava (zeytuna), orange, apple, papaya, avocado, berries.', '• ጥሩ ምርጫዎች፡ ዘይቱና፣ ብርቱካን፣ ፖም፣ ፓፓያ፣ አቮካዶ።');
        if (c.dm) add('• One serving = 1 medium orange/apple, 1 small banana, or 1 cup papaya/mango (~15–25 g carbs). Spread fruit through the day, and eat it with nuts or ayib.', '• አንድ መጠን = 1 መካከለኛ ብርቱካን/ፖም፣ 1 ትንሽ ሙዝ፣ ወይም 1 ኩባያ ፓፓያ/ማንጎ (~15–25 ግ)። በቀኑ ያከፋፍሉ፣ ከለውዝ ወይም አይብ ጋር ይመገቡ።');
        add('• Prefer whole fruit over juice — juice-house drinks often have added sugar.', '• ከጭማቂ ይልቅ ሙሉ ፍራፍሬ ይምረጡ — የጭማቂ ቤት መጠጦች ብዙ ጊዜ ስኳር ይጨመርባቸዋል።');
        if (c.has('kidney')) add('• With kidney disease, potassium may need limiting — ask your renal dietitian which fruits suit you.', '• የኩላሊት ህመም ካለ ፖታሲየም መገደብ ሊያስፈልግ ይችላል — የአመጋገብ ባለሙያዎን ይጠይቁ።');
        src = ['ADA', 'WHO 400 g fruit & veg/day']; break;
      case 'soda':
        add('**Better drinks than soda:**', '**ከለስላሳ የተሻሉ መጠጦች፡**');
        add('• Water (add lemon, mint or cucumber)', '• ውሃ (ሎሚ፣ ናና ወይም ኪያር ይጨምሩ)');
        add('• Plain shai with ginger or tena adam; black buna', '• ያለ ስኳር ሻይ ከዝንጅብል ወይም ጤና አዳም ጋር፤ ያለ ስኳር ቡና');
        add('• Sparkling water (Ambo) with lemon — note it contains some sodium', '• አምቦ ውሃ ከሎሚ ጋር — ትንሽ ሶዲየም አለው');
        add('One 330 ml soda ≈ 35 g sugar — more than the WHO daily limit for added sugar.', 'አንድ 330 ሚሊ ለስላሳ ≈ 35 ግ ስኳር — ከWHO የዕለት ገደብ በላይ ነው።');
        if (c.dm) add('Exception: if your glucose is LOW (<70 mg/dL), a small amount of regular soda or juice is the right treatment.', 'ልዩ ሁኔታ፡ ስኳርዎ ዝቅ ካለ (<70 mg/dL)፣ ትንሽ ለስላሳ ወይም ጭማቂ ትክክለኛ ህክምና ነው።');
        src = ['WHO sugars guideline', 'ADA']; break;
      case 'fasting':
        add('**Fasting (Tsom) food is naturally heart-friendly** — legumes, vegetables, teff.', '**የጾም ምግብ በተፈጥሮ ለልብ ተስማሚ ነው** — ጥራጥሬ፣ አትክልት፣ ጤፍ።');
        add('• Watch oil: fasting wots can be cooked with a lot of oil. Ask for less, and skim the top.', '• ዘይቱን ይጠንቀቁ፡ የጾም ወጦች በብዙ ዘይት ሊሰሩ ይችላሉ። እንዲቀንስ ይጠይቁ።');
        add('• Protein: combine shiro, misir, kik, ful, and peas to replace meat and dairy.', '• ፕሮቲን፡ ስጋንና ወተትን ለመተካት ሽሮ፣ ምስር፣ ክክ፣ ፉልና አተር ያቀላቅሉ።');
        add('• Breaking the fast late: start with water and a modest plate, not a very large one.', '• ጾም ሲፈቱ፡ በውሃና በመጠነኛ ሳህን ይጀምሩ እንጂ በጣም ትልቅ አይሁን።');
        if (c.dm) add('• If you use insulin or sulfonylureas, long fasting hours can cause dangerous lows. Talk to your doctor BEFORE the fasting season about a plan — never adjust doses yourself. Check glucose more often.', '• ኢንሱሊን ወይም ሰልፎኒልዩሪያ የሚወስዱ ከሆነ ረጅም የጾም ሰዓታት አደገኛ የስኳር መውረድ ሊያስከትሉ ይችላሉ። ከጾሙ በፊት ሐኪምዎን ያማክሩ — መጠኑን በራስዎ አይቀይሩ። ስኳርዎን ደጋግመው ይለኩ።');
        add('• Stop fasting and check glucose if you feel shaky, sweaty, confused or faint.', '• መንቀጥቀጥ፣ ላብ፣ ግራ መጋባት ወይም መዝለፍለፍ ከተሰማዎ ጾሙን አቋርጠው ስኳር ይለኩ።');
        src = ['ADA/IDF guidance on fasting with diabetes', 'AHA']; break;
      case 'alcohol':
        add('**Alcohol (tej, tella, beer, araki) is best limited or avoided.**', '**አልኮል (ጠጅ፣ ጠላ፣ ቢራ፣ አረቄ) ቢገደብ ወይም ቢቀር ይመረጣል።**');
        add('• Tej contains honey sugar plus alcohol; araki is very strong.', '• ጠጅ የማር ስኳርና አልኮል አለው፤ አረቄ በጣም ጠንካራ ነው።');
        if (c.dm) add('• With insulin or sulfonylureas alcohol can cause low glucose many hours later, even overnight. Never drink on an empty stomach.', '• ከኢንሱሊን ወይም ሰልፎኒልዩሪያ ጋር አልኮል ከብዙ ሰዓታት በኋላ፣ ሌሊትም ቢሆን ስኳር ሊያወርድ ይችላል። በባዶ ሆድ አይጠጡ።');
        if (c.htn) add('• Alcohol raises blood pressure; cutting down lowers it.', '• አልኮል የደም ግፊትን ይጨምራል፤ መቀነስ ያወርደዋል።');
        src = ['WHO: no safe level of alcohol', 'ADA', 'AHA']; break;
      case 'snack':
        add('**Smart snacks:**', '**ብልህ መክሰሶች፡**');
        add('• A small handful of kolo (¼–½ cup) or roasted chickpeas (shimbra)', '• ትንሽ ቆሎ (¼–½ ኩባያ) ወይም የተጠበሰ ሽንብራ');
        add('• Peanuts/nuts (a small handful), a boiled egg, ayib', '• ኦቾሎኒ/ለውዝ (ትንሽ እፍኝ)፣ የተቀቀለ እንቁላል፣ አይብ');
        add('• A piece of fruit: orange, guava, apple', '• ፍራፍሬ፡ ብርቱካን፣ ዘይቱና፣ ፖም');
        add('• Limit sambusa and biscuits — fried/sugary.', '• ሳምቡሳና ብስኩት ይገድቡ — የተጠበሰ/ጣፋጭ ናቸው።');
        src = ['ADA', 'WHO']; break;
      case 'salt':
        add(`**Your sodium target: ${c.T.na} mg/day** (${c.T.naSrc}) ≈ ${c.T.na === 1500 ? '⅔' : '1'} teaspoon of salt in total, including what’s already in food.`, `**የሶዲየም ግብዎ፡ በቀን ${c.T.na} ሚ.ግ** (${c.T.naSrc}) ≈ ${c.T.na === 1500 ? '⅔' : '1'} የሻይ ማንኪያ ጨው፣ በምግብ ውስጥ ያለውን ጨምሮ።`);
        add('• Many berbere and mitmita blends are salted — buy or make unsalted ones.', '• ብዙ በርበሬና ሚጥሚጣ ጨው አላቸው — ጨው የሌለውን ይግዙ ወይም ያዘጋጁ።');
        add('• Use garlic, ginger, onion, lemon, rosemary (siga metebesha), and koseret for flavour.', '• ለጣዕም ነጭ ሽንኩርት፣ ዝንጅብል፣ ሽንኩርት፣ ሎሚ፣ የስጋ መጥበሻና ኮሰረት ይጠቀሙ።');
        add('• Eat potassium-rich foods (gomen, beans, potato, banana, avocado) — they help balance sodium.', '• በፖታሲየም የበለፀጉ ምግቦች (ጎመን፣ ባቄላ፣ ድንች፣ ሙዝ፣ አቮካዶ) ይመገቡ።');
        src = ['WHO salt <5 g/day', 'AHA 1500 mg ideal', 'DASH (NHLBI)']; break;
      case 'sweet':
        add(`**Added sugar: keep under ~${c.T.as} g/day** for you (WHO/AHA).`, `**የተጨመረ ስኳር፡ ለእርስዎ በቀን ከ~${c.T.as} ግ በታች** (WHO/AHA)።`);
        add('• Honey is still sugar — use small amounts.', '• ማርም ስኳር ነው — በትንሹ ይጠቀሙ።');
        add('• If you have a sweet, have it right after a meal (not alone), and keep the portion small.', '• ጣፋጭ ከበሉ ከምግብ በኋላ ወዲያውኑ ይብሉ (ለብቻው አይደለም)፣ መጠኑም ትንሽ ይሁን።');
        src = ['WHO sugars guideline', 'AHA']; break;
      case 'chol':
        add(`**For cholesterol:** keep saturated fat under ~${c.T.sf} g/day.`, `**ለኮሌስትሮል፡** ሳቹሬትድ ስብ በቀን ከ~${c.T.sf} ግ በታች ያድርጉ።`);
        add('• Niter kibbeh (spiced butter) is the biggest source in Ethiopian food — use less, or cook with sunflower/olive oil.', '• በኢትዮጵያ ምግብ ዋናው ምንጭ ንጥር ቅቤ ነው — ይቀንሱ ወይም በሱፍ/የወይራ ዘይት ያብስሉ።');
        add('• Legume wots (shiro, misir, kik), teff and oats have soluble fiber that helps lower LDL.', '• የጥራጥሬ ወጦች (ሽሮ፣ ምስር፣ ክክ)፣ ጤፍና አጃ LDLን የሚቀንስ ፋይበር አላቸው።');
        add('• Choose fish, chicken or lean tibs over fatty meat, kitfo with lots of butter, and dulet often.', '• ከስብ ስጋ፣ ብዙ ቅቤ ካለው ክትፎና ከዱለት ይልቅ አሳ፣ ዶሮ ወይም ቀጭን ጥብስ ይምረጡ።');
        src = ['AHA <6% sat fat for high LDL', 'WHO']; break;
      case 'meat':
        add('**Meat can fit** — choose lean cuts and less butter.', '**ስጋ ሊስማማ ይችላል** — ቀጭን ስጋና ትንሽ ቅቤ ይምረጡ።');
        add('• Tibs with vegetables and little oil, doro wot with the fat layer skimmed, grilled fish or chicken.', '• ጥብስ ከአትክልት ጋር በትንሽ ዘይት፣ ዘይቱ የተነሳ ዶሮ ወጥ፣ የተጠበሰ አሳ ወይም ዶሮ።');
        add('• Kitfo: ask for "yebesele" (cooked) with less kibbeh — raw meat has food-safety risks.', '• ክትፎ፡ የበሰለና ትንሽ ቅቤ ያለው ይጠይቁ — ጥሬ ስጋ የጤና አደጋ አለው።');
        add('• A palm-size portion (~100 g) per meal is enough.', '• በአንድ ምግብ የመዳፍ ያህል (~100 ግ) በቂ ነው።');
        src = ['AHA', 'WHO']; break;
      case 'exercise':
        add('**Aim for 150 minutes/week of moderate activity** (e.g. 30 min brisk walking, 5 days) plus 2 days of strength work.', '**በሳምንት 150 ደቂቃ መካከለኛ እንቅስቃሴ ያቅዱ** (ለምሳሌ 5 ቀን 30 ደቂቃ ፈጣን እርምጃ) እና 2 ቀን የጥንካሬ ልምምድ።');
        add('• A 10–15 minute walk after meals lowers post-meal glucose.', '• ከምግብ በኋላ 10–15 ደቂቃ መራመድ የስኳር መጨመርን ይቀንሳል።');
        if (c.dm) add('• If you use insulin/sulfonylureas, check glucose before longer exercise and carry fast sugar.', '• ኢንሱሊን ከወሰዱ ከረጅም እንቅስቃሴ በፊት ስኳር ይለኩ፣ ፈጣን ስኳር ይያዙ።');
        add('• Stop and seek help if you feel chest pain, severe breathlessness or dizziness.', '• የደረት ህመም፣ ከባድ የትንፋሽ ማጠር ወይም መፍዘዝ ከተሰማዎ ያቁሙና እርዳታ ይፈልጉ።');
        src = ['WHO physical activity guidelines 2020', 'ADA']; break;
      case 'weight':
        add(`**Your daily calorie guide: ~${c.T.kcal} kcal.** Losing 5–7% of body weight improves glucose, BP and cholesterol.`, `**የዕለት ካሎሪ መመሪያዎ፡ ~${c.T.kcal} ካሎሪ።** ከክብደት 5–7% መቀነስ ስኳርን፣ ግፊትንና ኮሌስትሮልን ያሻሽላል።`);
        add('• Fill half the plate with vegetables; keep injera to ¾–1 per meal.', '• ግማሽ ሳህኑን በአትክልት ይሙሉ፤ እንጀራ በአንድ ምግብ ¾–1 ይሁን።');
        add('• Biggest easy wins: fewer sugary drinks, less oil/butter in wot, smaller second helpings.', '• ቀላል ትልቅ ለውጦች፡ ጣፋጭ መጠጥ መቀነስ፣ በወጥ ውስጥ ዘይት/ቅቤ መቀነስ፣ ሁለተኛ ማንሳትን መቀነስ።');
        add('• Aim for 0.5–1 kg per week — slow is sustainable.', '• በሳምንት 0.5–1 ኪ.ግ ያቅዱ — ቀስ ብሎ ዘላቂ ነው።');
        src = ['ADA / Diabetes Prevention Program', 'WHO']; break;
      case 'bp':
        add('**Food that helps blood pressure (DASH style):**', '**የደም ግፊትን የሚረዳ ምግብ (DASH)፡**');
        add(`• Sodium under ${c.T.na} mg/day — less salt and salted berbere`, `• ሶዲየም በቀን ከ${c.T.na} ሚ.ግ በታች — ትንሽ ጨውና ጨዋማ በርበሬ`);
        add('• More vegetables, legumes, fruit, and low-fat dairy (ayib)', '• ተጨማሪ አትክልት፣ ጥራጥሬ፣ ፍራፍሬና ዝቅተኛ ስብ ያለው ወተት (አይብ)');
        add('• Limit alcohol; stay active; keep a healthy weight', '• አልኮል ይገድቡ፤ ንቁ ይሁኑ፤ ጤናማ ክብደት ይጠብቁ');
        add('• Readings ≥180/120 are an emergency — call 907.', '• ≥180/120 ድንገተኛ ነው — 907 ይደውሉ።');
        src = ['AHA', 'NHLBI DASH', 'WHO']; break;
      case 'dinner':
        add('**A balanced Ethiopian plate for you:**', '**ለእርስዎ የተመጣጠነ የኢትዮጵያ ሳህን፡**');
        add(`• ${c.dm ? c.inj : '1'} teff injera`, `• ${c.dm ? c.inj : '1'} የጤፍ እንጀራ`);
        add('• Half the plate: gomen, atkilt, tikil gomen or timatim salad', '• ግማሽ ሳህን፡ ጎመን፣ አትክልት፣ ጥቅል ጎመን ወይም የቲማቲም ሰላጣ');
        add('• A quarter: misir, shiro or kik — or lean tibs / fish / doro (skimmed)', '• ሩብ፡ ምስር፣ ሽሮ ወይም ክክ — ወይም ቀጭን ጥብስ/አሳ/ዶሮ');
        add('• Water or plain shai to drink', '• ለመጠጥ ውሃ ወይም ያለ ስኳር ሻይ');
        src = ['ADA Diabetes Plate']; break;
      default:
        add('Here’s a simple, evidence-based starting point:', 'ቀላልና በማስረጃ የተደገፈ መነሻ ይኸው፡');
        add('• Plate method: ½ vegetables, ¼ legumes or lean protein, ¼ injera/rice/bread.', '• የሳህን ዘዴ፡ ½ አትክልት፣ ¼ ጥራጥሬ ወይም ፕሮቲን፣ ¼ እንጀራ/ሩዝ/ዳቦ።');
        add('• Drink water; limit sugary drinks, salt and butter.', '• ውሃ ይጠጡ፤ ጣፋጭ መጠጥ፣ ጨውና ቅቤ ይገድቡ።');
        add('You can also ask me about: breakfast, injera, rice, coffee, fruits, drinks, fasting, snacks, salt, cholesterol, exercise or weight. Or scan a meal for a personal analysis.', 'ስለ ቁርስ፣ እንጀራ፣ ሩዝ፣ ቡና፣ ፍራፍሬ፣ መጠጥ፣ ጾም፣ መክሰስ፣ ጨው፣ ኮሌስትሮል፣ እንቅስቃሴ ወይም ክብደት ይጠይቁኝ። ወይም ለግል ትንተና ምግብ ስካን ያድርጉ።');
        src = ['ADA', 'WHO', 'AHA'];
    }
    return { text: lines.join('\n'), sources: src };
  }
  window.NolaCoach = { answer, detect };
})();
