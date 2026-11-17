NOLA HEALTH - AI-powered personal health & nutrition companion
===============================================================

HOW TO RUN (Windows)
  1. Unzip NOLA_HEALTH.zip anywhere (e.g. Desktop).
  2. Double-click START-HERE.bat. It starts a tiny local server and opens http://localhost:8642/
     (uses Python if installed, otherwise built-in PowerShell; if neither works it opens index.html directly).
  3. On Android/iPhone: host the folder on any static server on your Wi-Fi, open it in Chrome/Safari and choose
     "Add to Home screen" / "Install app". After the first load it works fully offline.

Mac/Linux: run  python3 -m http.server 8642  in this folder and open http://localhost:8642/

AI FEATURES (optional)
  Me -> Settings -> AI provider: enter a Base URL, an API key and a model from any OpenAI-compatible service
  (e.g. https://api.openai.com/v1 + gpt-4o-mini, or OpenRouter / Groq / a local LM Studio server).
  The key is stored only on this device. Without a key the app still works: you pick the foods yourself, and the
  offline coach answers common questions.

DATA
  Everything is stored on this device (IndexedDB). Use Settings -> Export to back up.

SAFETY
  NOLA HEALTH gives educational estimates. It is not a medical device, does not diagnose and never
  tells you to change medication. Emergency in Ethiopia: 907 (ambulance).
