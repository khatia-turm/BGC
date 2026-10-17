import express from "express";

// Importing this factory never opens a port or changes fixture files.
export function createMockApp({ api, persist = async () => {} }) {
  const app = express();
  app.use((req, res, next) => {
    const origin = req.get("Origin");
    if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      res.set("Access-Control-Allow-Origin", origin);
      res.vary("Origin");
    }
    res.set({
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS",
    });
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });
  app.use(express.json({ limit: "2mb" }));
  // Serialize commits so parallel mutations cannot overwrite a newer snapshot.
  let pending = Promise.resolve();
  app.use((req, res, next) => {
    const request = pending.then(async () => {
      const before = api.snapshot();
      const response = api.request(req.originalUrl, {
        method: req.method === "HEAD" ? "GET" : req.method,
        headers: req.headers,
        body: req.body,
      });
      const state = api.snapshot();
      if (JSON.stringify(before) !== JSON.stringify(state)) {
        try {
          await persist(state);
        } catch (error) {
          api.restore(before);
          throw error;
        }
      }
      if (response.status >= 400) res.type("application/problem+json");
      if (response.status === 204) res.status(204).end();
      else res.status(response.status).json(response.body);
    });
    pending = request.catch(() => {});
    request.catch(next);
  });
  app.use((error, _req, res, _next) => {
    const status =
      error.status >= 400 && error.status < 600 ? error.status : 500;
    res
      .status(status)
      .type("application/problem+json")
      .json({
        title: status === 400 ? "Bad Request" : "Request failed",
        status,
        detail: status === 400 ? "Invalid JSON request body." : error.message,
      });
  });
  return app;
}
