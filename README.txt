NOLA HEALTH v4.0 - Your Personal Health Companion.
==================================================

LIVE: https://nolawi4444.github.io/nola-health/  (open on your phone -> "Add to Home screen")

HOW TO RUN (Windows)
  1. Unzip NOLA_HEALTH.zip anywhere (e.g. Desktop).
  2. Double-click START-HERE.bat. It starts a tiny local server and opens http://localhost:8642/
  3. On Android/iPhone: open the live link in Chrome/Safari and choose "Add to Home screen".
     After the first load it works offline.
Mac/Linux: run  python3 -m http.server 8642  in this folder and open http://localhost:8642/

STRUCTURE (v4 is a complete redesign - green & white, large cards, English / Amharic)
  Navigation: Home | Nolaa AI Doctor | About

  HOME - four cards:
    1. My Health        personal information, health conditions, medicines, blood pressure, blood sugar,
                        weight; add / edit / delete readings with date and time; chart; full health history
                        (readings + saved meals); PIN lock (secure login) and delete-all-data.
    2. What Should I Eat?  up to 4 dish ideas per meal (breakfast / lunch / dinner / snack) chosen from your
                        conditions, allergies, diet and fasting days, with estimated carbs, fibre, sodium and
                        the reasons. Ethiopian dishes included; traditional foods are never labelled unhealthy.
    3. Reminders        medicine reminders, check-ups and daily health goals (suggested from your profile).
                        System notifications where the browser allows it + in-app alerts.
    4. Scan Food        take or upload a meal photo; with an AI key the foods are recognised, otherwise you
                        pick them from the food database; then estimated nutrition + personalised advice.

  NOLAA AI DOCTOR - chat that uses your saved profile and readings. Answers only about health, symptoms,
    food, nutrition, medicines and lab reports (type values, or send a lab photo with an AI key).
    Politely declines other topics. Never diagnoses or prescribes; says when to see a doctor and when to
    seek urgent care (907). Without an AI key it uses the built-in rule-based guide.
    The AI key is set with the small gear button inside Nolaa AI Doctor.

  ABOUT - what NOLA HEALTH is, the mission (health and nutrition guidance accessible to everyone in
    Ethiopia), safety and privacy.

YOUR DATA
  Stored only on your device (IndexedDB). With a PIN it is encrypted (AES-GCM). Existing v1-v3.1 data
  (profile, conditions, medicines, readings, reminders, PIN) is kept and migrated automatically.
  Removed in v4: academy, journey, family circle, budget/market/shopping, restaurant assistant,
  challenges, clinician view and dashboards.

LIMITATIONS
  - Photo recognition, lab-photo reading and free-text AI answers need your own OpenAI-compatible API key.
  - Notifications work while the app/browser is open or running in the background; phones may stop them
    when the app is fully closed (there is no server).
  - Nutrition values are estimates. NOLA HEALTH is not a doctor and does not replace one.
