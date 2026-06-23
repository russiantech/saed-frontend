const { createProxyMiddleware } = require("http-proxy-middleware");

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8002";

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: BACKEND_URL,
      changeOrigin: true,
      ws: false,
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
