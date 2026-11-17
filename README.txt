NOLA HEALTH v2 - AI-powered personal health & nutrition companion
==================================================================

LIVE: https://nolawi4444.github.io/nola-health/  (open on your phone -> "Add to Home screen")

HOW TO RUN (Windows)
  1. Unzip NOLA_HEALTH.zip anywhere (e.g. Desktop).
  2. Double-click START-HERE.bat. It starts a tiny local server and opens http://localhost:8642/
     (uses Python if installed, otherwise built-in PowerShell; if neither works it opens index.html directly).
  3. On Android/iPhone: open the live link above in Chrome/Safari and choose "Add to Home screen".
     After the first load it works fully offline.
Mac/Linux: run  python3 -m http.server 8642  in this folder and open http://localhost:8642/

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
  - Prices and nutrition values are estimates.

SAFETY
  NOLA HEALTH gives educational estimates. It is not a medical device, does not diagnose and never
  tells you to change medication. If a reading is high: rest 5 minutes and measure again; if high readings repeat,
  see a health professional. Emergency in Ethiopia: 907 (ambulance).
