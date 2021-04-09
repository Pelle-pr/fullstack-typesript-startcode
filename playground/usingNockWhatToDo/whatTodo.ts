import fetch from "node-fetch";
import express from "express";
const app = express();

app.get("/whattodo", async (req, res, next) => {
  const wtd = await fetch("https://www.boredapi.com/api/activity").then((r) =>
    r.json()
  );
  res.json(wtd);
});

export default app;
