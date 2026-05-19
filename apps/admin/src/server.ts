import express from "express";
import { createAdminRouter } from "./router.js";

const app = express();
app.use("/", createAdminRouter(""));

const port = Number(process.env.PORT ?? 3200);
app.listen(port, () => {
  console.log(`Admin app running on http://localhost:${port}`);
});
