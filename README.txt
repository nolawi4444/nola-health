NOLA HEALTH v5.0 - Your Health. Your Food. Your Wellbeing.
==========================================================

LIVE: https://nolawi4444.github.io/nola-health/  (open on your phone -> "Add to Home screen")

HOW TO RUN (Windows)
  1. Unzip NOLA_HEALTH.zip anywhere (e.g. Desktop).
  2. Double-click START-HERE.bat. It starts a tiny local server and opens http://localhost:8642/
  3. On Android/iPhone: open the live link in Chrome/Safari and choose "Add to Home screen".
     After the first load it works offline.
Mac/Linux: run  python3 -m http.server 8642  in this folder and open http://localhost:8642/

NAVIGATION: Home | Doctor | About      (English / Amharic button in the header)

HOME - exactly four cards (each shows live info: records to update, today's meal, reminders done):
  1. My Health      profile (age, height, weight), conditions, allergies, medicines, health goals and
                    target weight; BP / sugar / weight readings with date and time; progress chart and
                    30/90-day changes; weekly summary; missing or overdue records with "Add now";
                    medical reports (photo or PDF, stored on this device, encrypted with a PIN; photo
                    reports can be sent to Doctor); export my data (JSON, never includes the AI key);
                    PIN lock; delete all data.
  2. What Should I Eat?  Today: breakfast, lunch, dinner and snack plan from the Ethiopian dish database,
                    with calories, protein, carbs, fat, fibre, estimated cost, why each meal is
                    recommended, swap and "I ate this" (saves to history). Ideas per meal and affordable
                    picks. Cook today: tick what you have at home. Week: 7-day plan with variety and cost.
                    All foods / vegetarian-fasting / with meat toggle, daily budget, allergies and fasting
                    days respected. Traditional foods are never labelled unhealthy.
  3. Reminders      medicine, appointment, check-up, water, BP, sugar, weight and daily-goal reminders;
                    suggestions from your medicines and goals; morning and evening routines; daily
                    motivational message; mark done / undo; weekly progress and medicine adherence;
                    reminders can be linked to a goal. Notifications while the app is open + in-app alert.
  4. Scan Food      take or upload a photo; with your own AI key foods are recognised, otherwise pick them
                    from the database. Result: ESTIMATES of calories, macros and fibre, possible
                    ingredients, portion, benefits, things to watch, fits-my-goals, advice, healthier
                    alternatives. Correct portions / oil / salt / items and it recalculates. Compare two
                    meals. Save to food history.

DOCTOR - uses your saved profile, readings and goals. Explains symptoms, conditions, medical words,
  medicine side effects, lab values (typed, or a lab photo with an AI key), BP and sugar readings and
  nutrition, in simple English or Amharic. Recognises warning signs and shows 907. Memory only with your
  consent (toggle + list of saved facts you can delete). Conversation summary and questions to ask your
  health professional. Never diagnoses or prescribes; says what it cannot know.

ABOUT - introduction, mission, vision, why Ethiopia, privacy, responsible AI, safety, contact.
  Contact details are a placeholder: edit js/config.js (window.NOLA_CONFIG.contact).

PRIVACY & SECURITY - consent screen before any health data is stored; all data stays on the device
  (IndexedDB); optional PIN encrypts everything (AES-GCM); AI key is entered by you, stored only on this
  device and never included in the code or in exports. Data from v3.1 and v4 is migrated automatically.

LIMITATIONS - photo recognition, lab-photo reading and free-form chat need your own AI key (otherwise an
  offline guide answers); PDF reports are stored but only photos can be sent to Doctor; notifications only
  fire while the app/browser is running; nutrition values and prices are estimates; NOLA HEALTH is not a
  doctor. Emergency: 907.

NOLA HEALTH - Understand Your Health. Make Better Choices. Live Better.
