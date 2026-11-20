// SAED web app – deployment settings. This file is copied as-is into the build and read by the browser
// BEFORE the app starts, so you can change it on the server without rebuilding.
//
// API_URL: where the SAED API lives.
//   • Frontend and API on different hosts (typical cPanel setup):  "https://saed-api.example.com/api"
//   • Same host, /api proxied to the backend (nginx/Docker):        leave empty ("")
window.__SAED_CONFIG__ = {
  API_URL: "https://saed-api.simplylovely.ng/api"
};
