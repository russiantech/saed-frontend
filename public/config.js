// SAED web app – deployment settings, read by the browser BEFORE the app starts (edit on the server, no rebuild).
//
// The API address is picked AUTOMATICALLY from the host name the app is opened on, so one build works everywhere:
// local development, staging and production each get their own API. Add one line per environment.
//   • exact host        "saed.example.com": "https://saed-api.example.com/api"
//   • wildcard          "*.staging.example.com": "https://api.staging.example.com/api"
//   • same host proxy   "/api"   (nginx/Docker proxies /api to the backend; also what the dev server does)
// Anything not listed falls back to the build-time VITE_API_URL, then to "/api".
//
// API_URL (below) is a hard override that beats the table - leave it empty unless you need it.
window.__SAED_CONFIG__ = {
  API_URL: "",
  API_URLS: {
    // production
    "saed.dunistech.ng": "https://saed-api.simplylovely.ng/api",
    // local development (Vite dev server proxies /api to the backend on :8002)
    "localhost": "/api",
    "127.0.0.1": "/api"
  }
};
