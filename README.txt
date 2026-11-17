NOLA HEALTH v3 - AI-powered personal health & nutrition companion (Ethiopia-first)
===================================================================================

LIVE: https://nolawi4444.github.io/nola-health/  (open on your phone -> "Add to Home screen")

HOW TO RUN (Windows)
  1. Unzip NOLA_HEALTH.zip anywhere (e.g. Desktop).
  2. Double-click START-HERE.bat. It starts a tiny local server and opens http://localhost:8642/
     (uses Python if installed, otherwise built-in PowerShell; if neither works it opens index.html directly).
  3. On Android/iPhone: open the live link above in Chrome/Safari and choose "Add to Home screen".
     After the first load it works fully offline.
Mac/Linux: run  python3 -m http.server 8642  in this folder and open http://localhost:8642/

WHAT'S NEW IN v3 - "Powerful features, simple experience" (everything from v1 and v2 is kept)
  - New home: "Selam, {name}!" + 5 big buttons: SCAN MY FOOD, MY HEALTH, WHAT SHOULD I EAT?, ASK NOLA,
    MY DAILY PLAN. Below: today's summary, latest readings, today's challenge, reminders, goal progress.
  - Bottom bar: Home - My Health - Scan - NOLA AI - More. Advanced tools (glucose, BP, weight, report
    reading, insights, history, PDF report, clinician, family, weekly plans, shopping, voice, reminders)
    live under My Health and More, grouped into "Every day / Health / Food, money & learning / Family & settings".
  - Bigger default text (16px) and bigger buttons. "Simple mode" (Settings) = extra-large text, fewer options.
  - Language picker on first run and in Settings: English and Amharic now; Afaan Oromoo, Tigrinya and
    Somali are shown as "Coming soon" (see js/locales.js for how to add one). Noto Sans Ethiopic font included.
  - 3-step scan: Photo -> Check -> Result, with a Green / Yellow / Red colour, a simple explanation and a
    "not a medical diagnosis" note.
  - NOLA FOOD SCORE 0-100: start at 100, minus points when carbs, salt, saturated fat, added sugar or
    calories go above YOUR share for this meal (weighted for your conditions), plus points for fiber
    (and potassium if you watch BP). Tap "Why this score" for the full breakdown. The score always stays
    in its colour band (green 70-100, yellow 40-69, red 0-39). It is a personalised learning guide,
    not a medical measurement.
  - Ethiopian food: 96 foods including kocho/bula, marqa, chukko, ga'at, hilbet, tihlo, siga wot,
    minchet abish. Recipes vary - each dish shows its other versions (e.g. shiro with/without kibbeh)
    with their calorie range, and portion / oil / salt / method stay editable.
  - "What should I eat?": 3 ideas per meal from your health, past meals, likes, budget and fasting days, each with a reason.
  - "My daily plan": a simple checklist (meals, BP/sugar check, vegetables, water, walk, reminders).
  - Daily challenges: 3 small rotating challenges, streaks, weekly goal and badges - never shaming.
  - Reminders: meals, water, medicine (as prescribed), checkups, appointments, walks, routines; for you or a family member.
  - "Explain my medical report": type HbA1c, fasting sugar, cholesterol, LDL, HDL, triglycerides, eGFR
    and get plain-language explanations against ADA / AHA / NCEP / KDIGO ranges (no diagnosis). With an
    AI key you can photograph the report; values are only copied, never guessed, and must be checked.
  - Planner: likes and diet restrictions per plan, affordable local alternatives.
  - Market list: kilo, quintal, tera (bundle), piece, liter and "birr worth"; type your own price per item;
    totals and cheaper healthy swaps.
  - Family Circle: "Helper package" preset (profile, reminders, checkups, BP, sugar). The helper can add your
    reminders to their own phone. Same consent rules, nothing shared by default.
  - Low data: smaller photos, no pictures or animations. Offline: badge, cached screens; NOLA AI questions asked
    offline are saved and sent automatically when you are back online; failed AI calls have a Retry button.
    AI food recognition is NOT available offline (no local model) - the app says so and offers the food list.

WHAT'S NEW IN v2 (everything from v1 is kept)
  - NOLA AI companion: a floating button on every screen. Type or speak, e.g. "my BP is 140/90" or
    "sugar 180 after lunch". NOLA asks you to confirm before saving. Every suggestion shows "Why".
  - Smart food memory: likes/dislikes, recent meals, thumbs up/down. More -> "What NOLA remembers"
    lets you view, correct, delete or turn off each memory type.
  - Food & glucose insights (patterns only - never a diagnosis, never a cause, no predictions).
  - Restaurant assistant: photograph a menu (needs an AI key) or type dish names; it ranks them and
    compares 2-3 side by side.
  - Budget meal planner in Birr (prices are APPROXIMATE Addis Ababa prices - edit them in the price table)
    + a shopping list grouped by food group.
  - Family Health Circle: an encrypted share (file / QR / text) protected by a passphrase; the recipient sees a read-only view.
  - Doctor/Dietitian: a printable PDF report (Print -> Save as PDF) and a Clinician view.
  - Education Academy: 10 short lessons with quizzes (ADA / WHO / AHA), a daily tip, progress.
  - Health Journey: timeline, badges, check-up reminders, weekly/monthly summaries.
  - NOLA Voice: speak in English or Amharic (depends on your browser), hear replies.
  - Ethiopian measures (gursha, piece of injera, sini cup...) and cooking methods.
  - Text size setting, green design, Amharic everywhere.
  - Privacy: optional PIN lock that ENCRYPTS all data on the device (AES-256), encrypted backups.

AI FEATURES (optional)
  More -> Settings -> AI provider: Base URL + API key + model from any OpenAI-compatible service
  (e.g. https://api.openai.com/v1 + gpt-4o-mini, or OpenRouter / Groq). The key stays on this device and
  is never included in exports or shares. Without a key: you pick foods yourself, NOLA AI uses its
  built-in rule engine, and menu photos are not read (type the dish names instead).

LIMITS - HONESTLY
  - Revoking a family share only works on YOUR phone: a package someone already opened stays on their device.
    Live sharing, real revocation and doctor verification need a server (see BACKEND.md) - shown as
    "Requires server - not active".
  - If you forget your PIN, the data cannot be recovered (that is what encryption means). Keep an encrypted backup.
  - Voice: Amharic speech recognition / Amharic voices are not available in every browser; the app falls back to typing.
  - Prices and nutrition values are estimates. Recipe values vary by cook; the food database and the
    NOLA FOOD SCORE formula have NOT been clinically validated - they need review by a dietitian/clinician.
  - Live market prices: no reliable Ethiopian price feed exists yet - the adapter (js/planner.js priceFeed)
    is ready but NOT connected; prices are approximate and editable.
  - Reminders: there is no push server, so notifications appear while NOLA is open or running in the
    background; a fully closed app may not alert you (in-app reminders always show when you open it).
  - Photo food recognition, menu reading and report-photo reading need an AI key and internet.
  - Amharic text should be reviewed by a native-speaking health professional. Oromo, Tigrinya, Somali: coming soon.

SAFETY
  NOLA HEALTH gives educational estimates. It is not a medical device, does not diagnose and never
  tells you to change medication. If a reading is high: rest 5 minutes and measure again; if high readings repeat,
  see a health professional. Emergency in Ethiopia: 907 (ambulance).
