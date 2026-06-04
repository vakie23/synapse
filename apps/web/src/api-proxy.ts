import express from "express";

export function createApiProxy(serverApiBase: string): express.Router {
  const router = express.Router();
  const jsonParser = express.json({ limit: "2mb" });

  router.use(async (req, res) => {
    const runProxy = async () => {
    try {
      const targetUrl = `${serverApiBase.replace(/\/$/, "")}${req.url}`;
      const method = String(req.method || "GET").toUpperCase();
      const headers: Record<string, string> = {};
      const hasJsonBody = req.body && typeof req.body === "object" && Object.keys(req.body).length > 0;
      if (hasJsonBody) {
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch(targetUrl, {
        method,
        headers,
        body: hasJsonBody ? JSON.stringify(req.body) : undefined
      });

      res.status(response.status);
      res.setHeader("Cache-Control", "no-store");
      const contentType = response.headers.get("content-type");
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      res.send(buffer);
    } catch (error) {
      console.error("API proxy error", error);
      res.status(502).json({ message: "Could not reach API" });
    }
    };

    if (["GET", "HEAD"].includes(String(req.method || "GET").toUpperCase())) {
      await runProxy();
      return;
    }

    jsonParser(req, res, (err) => {
      if (err) {
        res.status(400).json({ message: "Invalid request body" });
        return;
      }
      void runProxy();
    });
  });

  return router;
}
