/* NOLA HEALTH Education Academy — 10 short lessons with quizzes (English + Amharic). Sources: ADA, WHO, AHA. */
(function () {
  const L = (id, art, color, title, points, tip, src, quiz) => ({ id, art, color, title, points, tip, src, quiz });
  const Q = (q, opts, a, why) => ({ q, opts, a, why });
  const LESSONS = [
    L('diabetes', ['🩸', '🍽️', '🚶'], '#dcfce7', { en: 'Understanding diabetes', am: 'የስኳር ህመምን መረዳት' }, [
      { en: 'Diabetes means blood glucose stays too high: the body makes too little insulin (type 1) or does not use it well (type 2).', am: 'የስኳር ህመም ማለት የደም ስኳር ከፍ ብሎ መቆየት ነው፤ ሰውነት ኢንሱሊን በቂ አያመርትም (አይነት 1) ወይም በደንብ አይጠቀምበትም (አይነት 2)።' },
      { en: 'Food, activity, sleep, stress, illness and medicines all affect glucose.', am: 'ምግብ፣ እንቅስቃሴ፣ እንቅልፍ፣ ጭንቀት፣ ህመምና መድሃኒቶች ሁሉ የደም ስኳርን ይነካሉ።' },
      { en: 'Common ADA targets for many adults: 80–130 mg/dL before meals and under 180 mg/dL 1–2 hours after eating. Your own targets may differ.', am: 'ለብዙ አዋቂዎች የADA ግቦች፡ ከምግብ በፊት 80–130 mg/dL፣ ከምግብ 1–2 ሰዓት በኋላ ከ180 በታች። የእርስዎ ግብ ሊለያይ ይችላል።' },
      { en: 'Regular checks (HbA1c, eyes, feet, kidneys) protect long-term health.', am: 'መደበኛ ምርመራ (HbA1c፣ ዓይን፣ እግር፣ ኩላሊት) የረጅም ጊዜ ጤናን ይጠብቃል።' }],
      { en: 'Check your feet every day for cuts or sores.', am: 'እግርዎን በየቀኑ ለቁስል ይመልከቱ።' }, 'ADA Standards of Care 2025', [
      Q({ en: 'A common ADA before-meal glucose target for many adults is…', am: 'ለብዙ አዋቂዎች የተለመደው የADA ከምግብ በፊት የስኳር ግብ…' }, [{ en: '80–130 mg/dL', am: '80–130 mg/dL' }, { en: '150–200 mg/dL', am: '150–200 mg/dL' }, { en: '40–60 mg/dL', am: '40–60 mg/dL' }], 0, { en: 'ADA suggests 80–130 mg/dL before meals for many adults; your team may set different targets.', am: 'ADA ለብዙ አዋቂዎች 80–130 ይመክራል፤ ሐኪምዎ የተለየ ሊያደርግ ይችላል።' }),
      Q({ en: 'In type 2 diabetes the body usually…', am: 'በአይነት 2 የስኳር ህመም ሰውነት በአብዛኛው…' }, [{ en: 'does not use insulin well', am: 'ኢንሱሊንን በደንብ አይጠቀምም' }, { en: 'has too much iron', am: 'ብዙ ብረት አለው' }, { en: 'cannot digest teff', am: 'ጤፍ መፍጨት አይችልም' }], 0, { en: 'Insulin resistance is the main problem in type 2 diabetes.', am: 'ዋናው ችግር ኢንሱሊንን አለመጠቀም ነው።' }),
      Q({ en: 'What can raise blood glucose?', am: 'የደም ስኳርን ምን ሊያሳድግ ይችላል?' }, [{ en: 'Only sugar', am: 'ስኳር ብቻ' }, { en: 'Food, illness and stress', am: 'ምግብ፣ ህመምና ጭንቀት' }, { en: 'Only medicine', am: 'መድሃኒት ብቻ' }], 1, { en: 'Many things affect glucose, not only sugar.', am: 'ከስኳር ውጭ ብዙ ነገሮች ስኳርን ይነካሉ።' })]),
    L('bp', ['❤️', '🧂', '🥬'], '#fee2e2', { en: 'Understanding blood pressure', am: 'የደም ግፊትን መረዳት' }, [
      { en: 'Blood pressure is written top (systolic) over bottom (diastolic), e.g. 120/80 mmHg.', am: 'የደም ግፊት ላይኛው (ሲስቶሊክ) በታችኛው (ዲያስቶሊክ) ይጻፋል፤ ለምሳሌ 120/80።' },
      { en: 'AHA: normal under 120/80; elevated 120–129/<80; stage 1 130–139 or 80–89; stage 2 ≥140 or ≥90; 180/120 or higher is a crisis.', am: 'AHA፡ መደበኛ ከ120/80 በታች፤ ከፍ ያለ 120–129፤ ደረጃ 1 130–139 ወይም 80–89፤ ደረጃ 2 ≥140 ወይም ≥90፤ 180/120 እና በላይ አደገኛ ነው።' },
      { en: 'Measure correctly: rest 5 minutes, back supported, feet flat, arm at heart level, no coffee or smoking 30 minutes before.', am: 'በትክክል ይለኩ፡ 5 ደቂቃ ያርፉ፣ ጀርባዎን ይደግፉ፣ እግርዎን መሬት ያድርጉ፣ ክንድዎ በልብ ደረጃ ይሁን፣ 30 ደቂቃ በፊት ቡና ወይም ሲጋራ አይጠቀሙ።' },
      { en: 'Less salt, more vegetables and legumes, regular activity and less alcohol all help.', am: 'ትንሽ ጨው፣ ብዙ አትክልትና ጥራጥሬ፣ እንቅስቃሴና ትንሽ አልኮል ሁሉም ይረዳሉ።' }],
      { en: 'Buy unsalted berbere and add salt yourself — you control the amount.', am: 'ጨው የሌለው በርበሬ ይግዙ፤ ጨውን እራስዎ ይጨምሩ።' }, 'AHA; WHO', [
      Q({ en: 'In 120/80, the top number is called…', am: 'በ120/80 ውስጥ ላይኛው ቁጥር…' }, [{ en: 'Systolic', am: 'ሲስቶሊክ' }, { en: 'Diastolic', am: 'ዲያስቶሊክ' }, { en: 'Pulse', am: 'ምት' }], 0, { en: 'Systolic is the pressure when the heart beats.', am: 'ሲስቶሊክ ልብ ሲመታ ያለው ግፊት ነው።' }),
      Q({ en: 'Before measuring you should…', am: 'ከመለካትዎ በፊት…' }, [{ en: 'Drink coffee', am: 'ቡና ይጠጡ' }, { en: 'Rest 5 minutes seated', am: '5 ደቂቃ ተቀምጠው ያርፉ' }, { en: 'Walk fast', am: 'በፍጥነት ይራመዱ' }], 1, { en: 'Resting gives a true reading.', am: 'ማረፍ ትክክለኛ ውጤት ይሰጣል።' }),
      Q({ en: 'A reading of 185/125 means…', am: '185/125 ማለት…' }, [{ en: 'Normal', am: 'መደበኛ' }, { en: 'Measure next month', am: 'በሚቀጥለው ወር ይለኩ' }, { en: 'Crisis range — re-check and get help', am: 'አደገኛ ደረጃ — እንደገና ይለኩና እርዳታ ያግኙ' }], 2, { en: '≥180/120 is a hypertensive crisis (AHA). With symptoms, call 907.', am: '≥180/120 አደገኛ ነው። ምልክት ካለ 907 ይደውሉ።' })]),
    L('chol', ['🫀', '🧈', '🫘'], '#fef3c7', { en: 'Understanding cholesterol', am: 'ኮሌስትሮልን መረዳት' }, [
      { en: 'LDL ("bad") cholesterol builds up in arteries; HDL ("good") helps remove it.', am: 'LDL ("መጥፎ") በደም ቧንቧ ውስጥ ይከማቻል፤ HDL ("ጥሩ") እንዲወገድ ይረዳል።' },
      { en: 'Saturated fat (butter, niter kibbeh, fatty meat) raises LDL most. AHA suggests under 6% of calories when LDL is high.', am: 'ሳቹሬትድ ስብ (ቅቤ፣ ንጥር ቅቤ፣ ስብ ያለው ስጋ) LDLን በብዛት ያሳድጋል። LDL ከፍ ካለ AHA ከካሎሪ ከ6% በታች ይመክራል።' },
      { en: 'Soluble fiber (legumes, teff, barley, oats) and plant oils help lower LDL.', am: 'ፋይበር (ጥራጥሬ፣ ጤፍ፣ ገብስ) እና የእፅዋት ዘይቶች LDLን ለመቀነስ ይረዳሉ።' },
      { en: 'High cholesterol has no symptoms — only a blood test shows it.', am: 'ከፍተኛ ኮሌስትሮል ምልክት የለውም — የደም ምርመራ ብቻ ያሳያል።' }],
      { en: 'Skim the oil layer off the top of the wot before serving.', am: 'ከማቅረብዎ በፊት ከወጡ ላይ ያለውን ዘይት ያንሱ።' }, 'AHA', [
      Q({ en: 'What raises LDL the most?', am: 'LDLን በብዛት የሚያሳድገው ምንድን ነው?' }, [{ en: 'Saturated fat', am: 'ሳቹሬትድ ስብ' }, { en: 'Fiber', am: 'ፋይበር' }, { en: 'Water', am: 'ውሃ' }], 0, { en: 'Butter and fatty meat are the main sources.', am: 'ቅቤና ስብ ያለው ስጋ ዋና ምንጮች ናቸው።' }),
      Q({ en: 'Which helps lower LDL?', am: 'LDLን ለመቀነስ የሚረዳው የትኛው ነው?' }, [{ en: 'More butter', am: 'ተጨማሪ ቅቤ' }, { en: 'Legumes like misir', am: 'እንደ ምስር ያሉ ጥራጥሬዎች' }, { en: 'Fried snacks', am: 'የተጠበሱ መክሰሶች' }], 1, { en: 'Legumes contain soluble fiber.', am: 'ጥራጥሬዎች ፋይበር አላቸው።' }),
      Q({ en: 'How do you know your cholesterol level?', am: 'የኮሌስትሮል መጠንዎን እንዴት ያውቃሉ?' }, [{ en: 'How you feel', am: 'በሚሰማዎ ስሜት' }, { en: 'Your weight', am: 'በክብደትዎ' }, { en: 'A blood test', am: 'በደም ምርመራ' }], 2, { en: 'Only a lab test shows cholesterol.', am: 'የላብራቶሪ ምርመራ ብቻ ያሳያል።' })]),
    L('carbs', ['🍞', '🍚', '🫓'], '#e0f2fe', { en: 'Understanding carbohydrates', am: 'ካርቦሃይድሬትን መረዳት' }, [
      { en: 'Carbohydrates (starch and sugar) turn into glucose. Injera, rice, bread, kocho, fruit and sugar all contain carbs.', am: 'ካርቦሃይድሬት (ስታርችና ስኳር) ወደ ግሉኮስ ይቀየራል። እንጀራ፣ ሩዝ፣ ዳቦ፣ ቆጮ፣ ፍራፍሬና ስኳር ካርቦሃይድሬት አላቸው።' },
      { en: 'The amount matters most: 1 medium injera ≈ 48–56 g carbs; 1 cup of rice ≈ 45 g.', am: 'ዋናው መጠኑ ነው፡ 1 መካከለኛ እንጀራ ≈ 48–56 ግ፤ 1 ኩባያ ሩዝ ≈ 45 ግ።' },
      { en: 'Fiber and protein slow the rise — pair injera with legumes and vegetables.', am: 'ፋይበርና ፕሮቲን መጨመሩን ያዘገያሉ — እንጀራን ከጥራጥሬና አትክልት ጋር ይመገቡ።' },
      { en: 'Sugary drinks raise glucose fastest — swap for water or plain shai.', am: 'ጣፋጭ መጠጦች ስኳርን በፍጥነት ያሳድጋሉ — በውሃ ወይም ያለ ስኳር ሻይ ይቀይሩ።' }],
      { en: 'Eat vegetables and protein first, injera last.', am: 'መጀመሪያ አትክልትና ፕሮቲን፣ እንጀራ በመጨረሻ ይመገቡ።' }, 'ADA', [
      Q({ en: 'About how many carbs are in 1 medium injera?', am: 'በ1 መካከለኛ እንጀራ ውስጥ ስንት ግራም ካርቦሃይድሬት አለ?' }, [{ en: '~5 g', am: '~5 ግ' }, { en: '~50 g', am: '~50 ግ' }, { en: '~150 g', am: '~150 ግ' }], 1, { en: 'About 48–56 g, depending on size and flour.', am: 'እንደ መጠኑና ዱቄቱ 48–56 ግ ገደማ።' }),
      Q({ en: 'What slows a glucose rise?', am: 'የስኳር መጨመርን ምን ያዘገያል?' }, [{ en: 'Fiber and protein', am: 'ፋይበርና ፕሮቲን' }, { en: 'Soda', am: 'ለስላሳ' }, { en: 'Extra sugar', am: 'ተጨማሪ ስኳር' }], 0, { en: 'Legumes and vegetables help.', am: 'ጥራጥሬና አትክልት ይረዳሉ።' }),
      Q({ en: 'Which raises glucose fastest?', am: 'ስኳርን በፍጥነት የሚያሳድገው የትኛው ነው?' }, [{ en: 'Gomen', am: 'ጎመን' }, { en: 'Shiro', am: 'ሽሮ' }, { en: 'Sugary soda', am: 'ጣፋጭ ለስላሳ' }], 2, { en: 'Liquid sugar is absorbed very fast.', am: 'ፈሳሽ ስኳር በጣም በፍጥነት ይዋሃዳል።' })]),
    L('protein', ['🥚', '🫘', '🐟'], '#ede9fe', { en: 'Understanding protein', am: 'ፕሮቲንን መረዳት' }, [
      { en: 'Protein builds and repairs muscles and keeps you full longer.', am: 'ፕሮቲን ጡንቻን ይገነባል፣ ይጠግናል፣ ለረጅም ጊዜ ያጠግባል።' },
      { en: 'Affordable sources: shiro, misir, kik, ful, chickpeas, eggs and ayib — plus lean meat and fish.', am: 'ርካሽ ምንጮች፡ ሽሮ፣ ምስር፣ ክክ፣ ፉል፣ ሽንብራ፣ እንቁላልና አይብ — እንዲሁም ቀጭን ስጋና አሳ።' },
      { en: 'Legumes with grains (shiro with injera) complement each other’s protein.', am: 'ጥራጥሬ ከእህል ጋር (ሽሮ ከእንጀራ ጋር) አንዱ የሌላውን ፕሮቲን ያሟላል።' },
      { en: 'With kidney disease you may need a specific protein amount — ask your doctor or dietitian.', am: 'የኩላሊት ህመም ካለ የተወሰነ የፕሮቲን መጠን ሊያስፈልግ ይችላል — ሐኪምዎን ይጠይቁ።' }],
      { en: 'Add an egg or ayib to breakfast to stay full longer.', am: 'ለረጅም ጊዜ ለመጥገብ በቁርስ እንቁላል ወይም አይብ ይጨምሩ።' }, 'WHO; ADA', [
      Q({ en: 'Which is an affordable protein?', am: 'ርካሽ የፕሮቲን ምንጭ የትኛው ነው?' }, [{ en: 'Soda', am: 'ለስላሳ' }, { en: 'Misir (lentils)', am: 'ምስር' }, { en: 'Sugar', am: 'ስኳር' }], 1, { en: 'Lentils are cheap and protein-rich.', am: 'ምስር ርካሽና ፕሮቲን የበዛበት ነው።' }),
      Q({ en: 'Shiro eaten with injera…', am: 'ሽሮ ከእንጀራ ጋር ሲበላ…' }, [{ en: 'complement each other’s protein', am: 'አንዱ የሌላውን ፕሮቲን ያሟላል' }, { en: 'contain no protein', am: 'ፕሮቲን የላቸውም' }, { en: 'are only fat', am: 'ስብ ብቻ ናቸው' }], 0, { en: 'Grains + legumes = good protein quality.', am: 'እህል + ጥራጥሬ = ጥሩ ፕሮቲን።' }),
      Q({ en: 'If you have kidney disease…', am: 'የኩላሊት ህመም ካለብዎ…' }, [{ en: 'eat as much meat as possible', am: 'የተቻለውን ያህል ስጋ ይብሉ' }, { en: 'avoid all protein', am: 'ፕሮቲንን በሙሉ ይተዉ' }, { en: 'ask your doctor about the right amount', am: 'ትክክለኛውን መጠን ሐኪምዎን ይጠይቁ' }], 2, { en: 'Protein needs are individual in kidney disease.', am: 'ፍላጎቱ ግላዊ ነው።' })]),
    L('labels', ['🏷️', '🔍', '🥫'], '#f1f5f9', { en: 'Reading food labels', am: 'የምግብ መለያ ማንበብ' }, [
      { en: 'Check the serving size first — all numbers are per serving.', am: 'መጀመሪያ የአቅርቦት መጠኑን ይመልከቱ — ሁሉም ቁጥሮች ለአንድ አቅርቦት ናቸው።' },
      { en: 'Look at sugars (especially added sugar), sodium and saturated fat.', am: 'ስኳርን (በተለይ የተጨመረ)፣ ሶዲየምንና ሳቹሬትድ ስብን ይመልከቱ።' },
      { en: 'Ingredients are listed from most to least — if sugar is first, it is mostly sugar.', am: 'ግብአቶች ከብዙ ወደ ትንሽ ይዘረዘራሉ — ስኳር መጀመሪያ ከሆነ በአብዛኛው ስኳር ነው።' },
      { en: '400 mg of sodium ≈ 1 g of salt (sodium × 2.5 = salt).', am: '400 ሚ.ግ ሶዲየም ≈ 1 ግ ጨው (ሶዲየም × 2.5 = ጨው)።' }],
      { en: 'Compare two brands of the same food — pick the lower sodium one.', am: 'የአንድ ምግብ ሁለት አይነቶችን ያወዳድሩ — ዝቅተኛ ሶዲየም ያለውን ይምረጡ።' }, 'WHO; FDA label guide', [
      Q({ en: 'What should you check first?', am: 'መጀመሪያ ምን መመልከት አለብዎ?' }, [{ en: 'Serving size', am: 'የአቅርቦት መጠን' }, { en: 'Colour', am: 'ቀለም' }, { en: 'Brand', am: 'የምርት ስም' }], 0, { en: 'Numbers depend on the serving size.', am: 'ቁጥሮቹ በአቅርቦቱ መጠን ይወሰናሉ።' }),
      Q({ en: 'Ingredients are listed…', am: 'ግብአቶች የሚዘረዘሩት…' }, [{ en: 'alphabetically', am: 'በፊደል ቅደም ተከተል' }, { en: 'from most to least', am: 'ከብዙ ወደ ትንሽ' }, { en: 'randomly', am: 'በዘፈቀደ' }], 1, { en: 'The first ingredient is the largest.', am: 'የመጀመሪያው ግብአት በብዛት ያለው ነው።' }),
      Q({ en: '1 g of salt contains about…', am: '1 ግ ጨው በግምት ይዟል…' }, [{ en: '40 mg sodium', am: '40 ሚ.ግ ሶዲየም' }, { en: '4000 mg sodium', am: '4000 ሚ.ግ ሶዲየም' }, { en: '400 mg sodium', am: '400 ሚ.ግ ሶዲየም' }], 2, { en: 'Salt is about 40% sodium.', am: 'ጨው 40% ገደማ ሶዲየም ነው።' })]),
    L('portions', ['🍽️', '✋', '🥗'], '#dcfce7', { en: 'Understanding portion sizes', am: 'የምግብ መጠንን መረዳት' }, [
      { en: 'Plate method: ½ vegetables, ¼ protein (legumes, meat, fish, eggs), ¼ starch (injera, rice).', am: 'የሳህን ዘዴ፡ ½ አትክልት፣ ¼ ፕሮቲን (ጥራጥሬ፣ ስጋ፣ አሳ፣ እንቁላል)፣ ¼ ስታርች (እንጀራ፣ ሩዝ)።' },
      { en: 'Hand guide: palm = a meat or fish portion, fist ≈ 1 cup of rice or wot, thumb ≈ 1 tablespoon of oil or butter.', am: 'የእጅ መመሪያ፡ መዳፍ = የስጋ/አሳ መጠን፣ ጡጫ ≈ 1 ኩባያ ሩዝ ወይም ወጥ፣ አውራ ጣት ≈ 1 ማንኪያ ዘይት ወይም ቅቤ።' },
      { en: 'Sharing a mesob makes it easy to eat more — try serving your own portion first, and count your gursha.', am: 'በመሶብ መጋራት ብዙ ለመብላት ያመቻል — መጀመሪያ የራስዎን ድርሻ ያስቀምጡ፣ ጉርሻዎን ይቁጠሩ።' },
      { en: 'Eat slowly — it takes about 20 minutes to feel full.', am: 'ቀስ ብለው ይመገቡ — ጥጋብ ለመሰማት 20 ደቂቃ ገደማ ይወስዳል።' }],
      { en: 'Put the vegetables on the injera first, then the wot.', am: 'መጀመሪያ አትክልቱን በእንጀራው ላይ፣ ከዚያ ወጡን ያድርጉ።' }, 'ADA Diabetes Plate', [
      Q({ en: 'With the plate method, half the plate should be…', am: 'በሳህን ዘዴ ግማሹ ሳህን…' }, [{ en: 'Vegetables', am: 'አትክልት' }, { en: 'Injera', am: 'እንጀራ' }, { en: 'Meat', am: 'ስጋ' }], 0, { en: 'Vegetables add fiber and volume with few calories.', am: 'አትክልት በትንሽ ካሎሪ ፋይበር ይጨምራል።' }),
      Q({ en: 'A palm-size is a guide for…', am: 'የመዳፍ መጠን መመሪያ ነው ለ…' }, [{ en: 'Oil', am: 'ዘይት' }, { en: 'Meat or fish', am: 'ስጋ ወይም አሳ' }, { en: 'Juice', am: 'ጭማቂ' }], 1, { en: 'About 100 g of meat or fish.', am: '100 ግ ገደማ ስጋ ወይም አሳ።' }),
      Q({ en: 'When sharing a mesob, a helpful tip is…', am: 'በመሶብ ሲመገቡ ጠቃሚ ምክር…' }, [{ en: 'Eat faster', am: 'በፍጥነት ይብሉ' }, { en: 'Skip vegetables', am: 'አትክልት ይዝለሉ' }, { en: 'Serve your own portion first', am: 'መጀመሪያ የራስዎን ድርሻ ያስቀምጡ' }], 2, { en: 'Seeing your portion helps you eat the amount you planned.', am: 'ድርሻዎን ማየት ያቀዱትን ያህል እንዲበሉ ይረዳል።' })]),
    L('cooking', ['🧅', '🫒', '🔥'], '#fef9c3', { en: 'Healthy Ethiopian cooking', am: 'ጤናማ የኢትዮጵያ ምግብ አሰራር' }, [
      { en: 'Use less niter kibbeh. Cook wot with a measured amount of vegetable oil, about 1 tablespoon per person.', am: 'ንጥር ቅቤ ይቀንሱ፤ ወጥን በተለካ የአትክልት ዘይት ያብስሉ (ለአንድ ሰው 1 ማንኪያ ገደማ)።' },
      { en: 'Skim the oil layer from wot, and choose derek (dry) tibs.', am: 'ከወጡ ላይ ዘይቱን ያንሱ፤ ደረቅ ጥብስ ይምረጡ።' },
      { en: 'Choose 100% teff injera for more fiber and iron.', am: 'ለተጨማሪ ፋይበርና ብረት 100% የጤፍ እንጀራ ይምረጡ።' },
      { en: 'Flavour with garlic, ginger, rosemary, koseret and lemon instead of extra salt; buy unsalted berbere.', am: 'ከተጨማሪ ጨው ይልቅ በነጭ ሽንኩርት፣ ዝንጅብል፣ የስጋ መጥበሻ፣ ኮሰረትና ሎሚ ያጣፍጡ፤ ጨው የሌለው በርበሬ ይግዙ።' }],
      { en: 'Measure oil with a spoon instead of pouring from the bottle.', am: 'ዘይትን ከጠርሙሱ ከማፍሰስ ይልቅ በማንኪያ ይለኩ።' }, 'AHA; WHO', [
      Q({ en: 'To lower saturated fat in wot…', am: 'በወጥ ውስጥ ሳቹሬትድ ስብን ለመቀነስ…' }, [{ en: 'use a measured amount of vegetable oil', am: 'የተለካ የአትክልት ዘይት ይጠቀሙ' }, { en: 'add more kibbeh', am: 'ተጨማሪ ቅቤ ይጨምሩ' }, { en: 'deep-fry everything', am: 'ሁሉንም በዘይት ይጥበሱ' }], 0, { en: 'Plant oils have far less saturated fat than butter.', am: 'የእፅዋት ዘይቶች ከቅቤ በጣም ያነሰ ሳቹሬትድ ስብ አላቸው።' }),
      Q({ en: 'Which injera has the most fiber?', am: 'የትኛው እንጀራ ብዙ ፋይበር አለው?' }, [{ en: 'White wheat', am: 'ነጭ ስንዴ' }, { en: '100% teff', am: '100% ጤፍ' }, { en: 'Rice flour', am: 'የሩዝ ዱቄት' }], 1, { en: 'Teff is a whole grain.', am: 'ጤፍ ሙሉ እህል ነው።' }),
      Q({ en: 'Flavour without extra salt with…', am: 'ያለ ተጨማሪ ጨው ለማጣፈጥ…' }, [{ en: 'more salt', am: 'ተጨማሪ ጨው' }, { en: 'bouillon cubes', am: 'የማጊ ኩብ' }, { en: 'garlic, ginger, koseret', am: 'ነጭ ሽንኩርት፣ ዝንጅብል፣ ኮሰረት' }], 2, { en: 'Herbs and spices add taste without sodium. Bouillon cubes are very salty.', am: 'ቅመማ ቅመሞች ያለ ሶዲየም ጣዕም ይሰጣሉ። የማጊ ኩብ በጣም ጨዋማ ነው።' })]),
    L('hydration', ['💧', '🫖', '🍋'], '#e0f2fe', { en: 'Hydration', am: 'የውሃ አወሳሰድ' }, [
      { en: 'Water is the best everyday drink — no sugar and no calories.', am: 'ውሃ ምርጡ የዕለት መጠጥ ነው — ስኳርም ካሎሪም የለውም።' },
      { en: 'Most adults need about 6–8 glasses of fluid a day, more in heat or with activity — unless your doctor limits fluids.', am: 'አብዛኞቹ አዋቂዎች በቀን 6–8 ብርጭቆ ፈሳሽ ያስፈልጋቸዋል፣ በሙቀትና በእንቅስቃሴ ብዙ — ሐኪም ካልገደበ በስተቀር።' },
      { en: 'High glucose can cause thirst and frequent urination — tell your doctor if it continues.', am: 'ከፍተኛ ስኳር ጥማትና ተደጋጋሚ ሽንት ሊያስከትል ይችላል — ከቀጠለ ለሐኪምዎ ይንገሩ።' },
      { en: 'Soda, juice-house drinks and sweet tea add a lot of sugar.', am: 'ለስላሳ፣ የጭማቂ ቤት መጠጦችና ጣፋጭ ሻይ ብዙ ስኳር ይጨምራሉ።' }],
      { en: 'Keep a bottle of water where you can see it.', am: 'የውሃ ጠርሙስ በሚታይ ቦታ ያስቀምጡ።' }, 'WHO; ADA', [
      Q({ en: 'The best everyday drink is…', am: 'ምርጡ የዕለት መጠጥ…' }, [{ en: 'Water', am: 'ውሃ' }, { en: 'Soda', am: 'ለስላሳ' }, { en: 'Sweet juice', am: 'ጣፋጭ ጭማቂ' }], 0, { en: 'Water hydrates without sugar.', am: 'ውሃ ያለ ስኳር ያረካል።' }),
      Q({ en: 'Constant thirst with diabetes means you should…', am: 'ከስኳር ህመም ጋር የማያቋርጥ ጥማት ካለ…' }, [{ en: 'drink soda', am: 'ለስላሳ ይጠጡ' }, { en: 'tell your doctor', am: 'ለሐኪምዎ ይንገሩ' }, { en: 'ignore it', am: 'ቸል ይበሉ' }], 1, { en: 'It can be a sign of high glucose.', am: 'የከፍተኛ ስኳር ምልክት ሊሆን ይችላል።' }),
      Q({ en: 'Who may need to limit fluids?', am: 'ፈሳሽ መገደብ ያለበት ማን ነው?' }, [{ en: 'Everyone', am: 'ሁሉም ሰው' }, { en: 'Athletes', am: 'አትሌቶች' }, { en: 'People told by their doctor (e.g. kidney or heart failure)', am: 'በሐኪም የተነገራቸው (ለምሳሌ የኩላሊት ወይም የልብ ድካም)' }], 2, { en: 'Only follow fluid limits your doctor gives you.', am: 'ሐኪምዎ የሰጠዎትን ገደብ ብቻ ይከተሉ።' })]),
    L('lifestyle', ['🚶', '😴', '🚭'], '#dcfce7', { en: 'Healthy lifestyle habits', am: 'ጤናማ የአኗኗር ልማዶች' }, [
      { en: 'Aim for 150 minutes of moderate activity a week (e.g. brisk walking) plus muscle strengthening on 2 days (WHO).', am: 'በሳምንት 150 ደቂቃ መካከለኛ እንቅስቃሴ (ለምሳሌ ፈጣን እርምጃ) እና 2 ቀን የጡንቻ ልምምድ (WHO)።' },
      { en: 'Sleep 7–9 hours; poor sleep affects glucose and appetite.', am: '7–9 ሰዓት ይተኙ፤ ደካማ እንቅልፍ ስኳርንና የምግብ ፍላጎትን ይነካል።' },
      { en: 'Avoid tobacco and limit alcohol — WHO says no amount of alcohol is completely safe.', am: 'ትምባሆን ያስወግዱ፣ አልኮልን ይገድቡ — WHO ምንም መጠን ሙሉ በሙሉ ደህንነቱ የተጠበቀ አይደለም ይላል።' },
      { en: 'Small steps last: a 10–15 minute walk after meals, one less spoon of sugar, one more vegetable.', am: 'ትናንሽ እርምጃዎች ይዘልቃሉ፡ ከምግብ በኋላ 10–15 ደቂቃ እርምጃ፣ አንድ ማንኪያ ስኳር መቀነስ፣ አንድ ተጨማሪ አትክልት።' }],
      { en: 'Walk to the next taxi stop instead of the nearest one.', am: 'ከቅርቡ ይልቅ እስከሚቀጥለው የታክሲ ማቆሚያ ይራመዱ።' }, 'WHO 2020; ADA', [
      Q({ en: 'WHO recommends weekly activity of…', am: 'WHO በሳምንት የሚመክረው እንቅስቃሴ…' }, [{ en: '15 minutes', am: '15 ደቂቃ' }, { en: '150 minutes moderate', am: '150 ደቂቃ መካከለኛ' }, { en: '1500 minutes', am: '1500 ደቂቃ' }], 1, { en: 'For example 30 minutes on 5 days.', am: 'ለምሳሌ 5 ቀን 30 ደቂቃ።' }),
      Q({ en: 'Adults should usually sleep…', am: 'አዋቂዎች በአብዛኛው መተኛት ያለባቸው…' }, [{ en: '7–9 hours', am: '7–9 ሰዓት' }, { en: '3–4 hours', am: '3–4 ሰዓት' }, { en: '12+ hours', am: '12+ ሰዓት' }], 0, { en: 'Sleep supports glucose and appetite control.', am: 'እንቅልፍ ስኳርንና የምግብ ፍላጎትን ይቆጣጠራል።' }),
      Q({ en: 'A good small step is…', am: 'ጥሩ ትንሽ እርምጃ…' }, [{ en: 'skip all meals', am: 'ሁሉንም ምግብ መዝለል' }, { en: 'double the sugar', am: 'ስኳርን እጥፍ ማድረግ' }, { en: 'walk 10–15 minutes after meals', am: 'ከምግብ በኋላ 10–15 ደቂቃ መራመድ' }], 2, { en: 'Post-meal walks help glucose.', am: 'ከምግብ በኋላ መራመድ ስኳርን ይረዳል።' })]),
  ];
  window.NolaAcademy = { LESSONS };
})();
