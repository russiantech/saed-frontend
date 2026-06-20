// const { createProxyMiddleware } = require("http-proxy-middleware");

// module.exports = function (app) {
//   app.use(
//     "/api",
//     createProxyMiddleware({
//       target: "http://127.0.0.1:8002",
//       changeOrigin: true,
//       cookieDomainRewrite: { "*": "" },
//       onProxyRes(proxyRes) {
//         const sc = proxyRes.headers["set-cookie"];
//         if (sc) {
//           proxyRes.headers["set-cookie"] = sc.map((c) =>
//             c.replace(/Domain=[^;]+;?/i, "")
//           );
//         }
//       },
//     })
//   );
// };



// v2
// const { createProxyMiddleware } = require("http-proxy-middleware");

// module.exports = function (app) {
//   app.use(
//     "/api",
//     createProxyMiddleware({
//       target: "http://127.0.0.1:8002",
//       changeOrigin: true,
//       cookieDomainRewrite: { "*": "" },
//       onProxyRes(proxyRes) {
//         const sc = proxyRes.headers["set-cookie"];
//         if (sc) {
//           proxyRes.headers["set-cookie"] = sc.map((c) =>
//             c.replace(/Domain=[^;]+;?/i, "")
//           );
//         }
//       },
//     })
//   );
// };


// v3
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://127.0.0.1:8002",
      changeOrigin: true,
      ws: false,  // disable WebSocket proxying
      cookieDomainRewrite: { "*": "" },
      onProxyRes(proxyRes) {
        const sc = proxyRes.headers["set-cookie"];
        if (sc) {
          proxyRes.headers["set-cookie"] = sc.map((c) =>
            c.replace(/Domain=[^;]+;?/i, "")
          );
        }
      },
    })
  );
};