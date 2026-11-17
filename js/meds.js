/* NOLA HEALTH — bundled list of common medicines available in Ethiopia (NAMES + general class only).
   Used for search/autocomplete, general "what it is commonly used for" information and a few
   WELL-ESTABLISHED food interactions. It contains no doses and never suggests starting, stopping
   or changing a medicine. Sources: WHO Model List of Essential Medicines (2023), EFDA national
   essential medicines list, BNF / FDA consumer drug-food interaction guidance. */
(function () {
  // [id, English name, Amharic name, class]
  const LIST = [
    ['metformin', 'Metformin', 'ሜትፎርሚን', 'biguanide'], ['glibenclamide', 'Glibenclamide', 'ግሊቤንክላማይድ', 'sulfonylurea'], ['glimepiride', 'Glimepiride', 'ግሊሜፒራይድ', 'sulfonylurea'],
    ['gliclazide', 'Gliclazide', 'ግሊክላዛይድ', 'sulfonylurea'], ['sitagliptin', 'Sitagliptin', 'ሲታግሊፕቲን', 'dpp4'],
    ['insulin_regular', 'Insulin, regular (soluble)', 'ኢንሱሊን (ሬጉላር)', 'insulin'], ['insulin_nph', 'Insulin NPH (isophane)', 'ኢንሱሊን NPH', 'insulin'], ['insulin_mix', 'Insulin premixed 70/30', 'ኢንሱሊን 70/30', 'insulin'],
    ['insulin_glargine', 'Insulin glargine', 'ኢንሱሊን ግላርጂን', 'insulin'],
    ['amlodipine', 'Amlodipine', 'አምሎዲፒን', 'ccb'], ['nifedipine', 'Nifedipine', 'ኒፈዲፒን', 'ccb_gf'], ['enalapril', 'Enalapril', 'ኢናላፕሪል', 'acei'], ['lisinopril', 'Lisinopril', 'ሊሲኖፕሪል', 'acei'],
    ['captopril', 'Captopril', 'ካፕቶፕሪል', 'acei'], ['losartan', 'Losartan', 'ሎሳርታን', 'arb'], ['hydrochlorothiazide', 'Hydrochlorothiazide', 'ሃይድሮክሎሮታያዛይድ', 'thiazide'],
    ['furosemide', 'Furosemide', 'ፉሮሴማይድ', 'loop'], ['spironolactone', 'Spironolactone', 'ስፓይሮኖላክቶን', 'ksparing'], ['atenolol', 'Atenolol', 'አቴኖሎል', 'beta'],
    ['metoprolol', 'Metoprolol', 'ሜቶፕሮሎል', 'beta'], ['propranolol', 'Propranolol', 'ፕሮፕራኖሎል', 'beta'], ['methyldopa', 'Methyldopa', 'ሜቲልዶፓ', 'central'],
    ['atorvastatin', 'Atorvastatin', 'አቶርቫስታቲን', 'statin_gf'], ['simvastatin', 'Simvastatin', 'ሲምቫስታቲን', 'statin_gf'], ['rosuvastatin', 'Rosuvastatin', 'ሮሱቫስታቲን', 'statin'],
    ['aspirin', 'Aspirin (low dose)', 'አስፕሪን', 'antiplatelet'], ['clopidogrel', 'Clopidogrel', 'ክሎፒዶግሬል', 'antiplatelet'], ['warfarin', 'Warfarin', 'ዋርፋሪን', 'warfarin'],
    ['ferrous_sulfate', 'Ferrous sulfate (iron)', 'ፌረስ ሰልፌት (አይረን)', 'iron'], ['folic_acid', 'Folic acid', 'ፎሊክ አሲድ', 'vitamin'], ['vitamin_b12', 'Vitamin B12', 'ቫይታሚን B12', 'vitamin'],
    ['calcium_carbonate', 'Calcium carbonate', 'ካልሲየም ካርቦኔት', 'calcium'], ['omeprazole', 'Omeprazole', 'ኦሜፕራዞል', 'ppi'], ['pantoprazole', 'Pantoprazole', 'ፓንቶፕራዞል', 'ppi'],
    ['levothyroxine', 'Levothyroxine', 'ሌቮታይሮክሲን', 'thyroid'], ['salbutamol', 'Salbutamol inhaler', 'ሳልቡታሞል', 'bronch'], ['prednisolone', 'Prednisolone', 'ፕሬድኒሶሎን', 'steroid'],
    ['paracetamol', 'Paracetamol', 'ፓራሲታሞል', 'analgesic'], ['ibuprofen', 'Ibuprofen', 'አይቡፕሮፌን', 'nsaid'], ['diclofenac', 'Diclofenac', 'ዲክሎፌናክ', 'nsaid'],
    ['amoxicillin', 'Amoxicillin', 'አሞክሲሲሊን', 'antibiotic'], ['ciprofloxacin', 'Ciprofloxacin', 'ሲፕሮፍሎክሳሲን', 'quinolone'], ['doxycycline', 'Doxycycline', 'ዶክሲሳይክሊን', 'tetracycline'],
    ['metronidazole', 'Metronidazole', 'ሜትሮኒዳዞል', 'nitroimidazole'], ['tinidazole', 'Tinidazole', 'ቲኒዳዞል', 'nitroimidazole'], ['tld', 'Tenofovir/Lamivudine/Dolutegravir (TLD)', 'ቲኤልዲ (TLD)', 'arv'],
    ['allopurinol', 'Allopurinol', 'አሎፑሪኖል', 'xo'], ['carbamazepine', 'Carbamazepine', 'ካርባማዜፒን', 'aed'], ['isoniazid', 'Isoniazid', 'አይሶኒያዚድ', 'tb'],
  ].map(([id, en, am, cls]) => ({ id, en, am, cls }));
  const byId = {}; LIST.forEach(m => { byId[m.id] = m; });
  /* class → general purpose key + well-established food notes (i18n keys) */
  const CLS = {
    biguanide: { use: 'mu_dm', notes: ['mn_alcohol_dm'] }, sulfonylurea: { use: 'mu_dm', notes: ['mn_meals_lows', 'mn_alcohol_dm'] }, insulin: { use: 'mu_dm', notes: ['mn_meals_lows', 'mn_alcohol_dm'] },
    dpp4: { use: 'mu_dm', notes: [] }, ccb: { use: 'mu_bp', notes: [] }, ccb_gf: { use: 'mu_bp', notes: ['mn_grapefruit'] },
    acei: { use: 'mu_bp', notes: ['mn_ksalt'] }, arb: { use: 'mu_bp', notes: ['mn_ksalt'] }, ksparing: { use: 'mu_fluid', notes: ['mn_ksalt'] },
    thiazide: { use: 'mu_bp', notes: [] }, loop: { use: 'mu_fluid', notes: [] }, beta: { use: 'mu_bp_heart', notes: [] }, central: { use: 'mu_bp', notes: [] },
    statin: { use: 'mu_chol', notes: [] }, statin_gf: { use: 'mu_chol', notes: ['mn_grapefruit'] }, antiplatelet: { use: 'mu_clot', notes: [] },
    warfarin: { use: 'mu_clot', notes: ['mn_vitk', 'mn_alcohol_gen'] }, iron: { use: 'mu_iron', notes: ['mn_iron_tea', 'mn_iron_c'] }, vitamin: { use: 'mu_vit', notes: [] },
    calcium: { use: 'mu_calcium', notes: [] }, ppi: { use: 'mu_stomach', notes: [] }, thyroid: { use: 'mu_thyroid', notes: ['mn_thyroid'] }, bronch: { use: 'mu_asthma', notes: [] },
    steroid: { use: 'mu_steroid', notes: ['mn_steroid_sugar'] }, analgesic: { use: 'mu_pain', notes: ['mn_alcohol_gen'] }, nsaid: { use: 'mu_pain', notes: ['mn_nsaid'] },
    antibiotic: { use: 'mu_infection', notes: [] }, quinolone: { use: 'mu_infection', notes: ['mn_dairy_abx'] }, tetracycline: { use: 'mu_infection', notes: ['mn_dairy_abx'] },
    nitroimidazole: { use: 'mu_infection', notes: ['mn_no_alcohol'] }, arv: { use: 'mu_hiv', notes: ['mn_arv_minerals'] }, xo: { use: 'mu_gout', notes: [] }, aed: { use: 'mu_seizure', notes: ['mn_grapefruit'] }, tb: { use: 'mu_tb', notes: ['mn_alcohol_gen'] },
  };
  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9\u1200-\u137f]+/g, ' ').trim();
  /* find the bundled medicine a free-text name refers to (exact word match only — never a guess) */
  function find(name) {
    const n = norm(name); if (!n) return null;
    let best = null;
    LIST.forEach(m => { const keys = [m.id.replace(/_/g, ' '), norm(m.en), norm(m.am), norm(m.en).split(' ')[0]].filter(Boolean);
      if (keys.some(k => k.length >= 4 && (n === k || (' ' + n + ' ').includes(' ' + k + ' ')))) { if (!best || m.en.length > best.en.length) best = m; } });
    if (!best && /insulin|ኢንሱሊን/i.test(name)) best = byId.insulin_regular;
    return best;
  }
  function search(q, n = 8) { const s = norm(q); if (!s) return LIST.slice(0, n); return LIST.filter(m => norm(m.en).includes(s) || norm(m.am).includes(s) || m.id.includes(s.replace(/ /g, '_'))).slice(0, n); }
  function info(name) { const m = typeof name === 'object' && name && name.cls ? name : find(name); if (!m) return null; return Object.assign({ med: m }, CLS[m.cls] || { use: null, notes: [] }); }
  window.NolaMeds = { LIST, byId, CLS, find, search, info, norm };
})();
