const express = require("express");
const app = express();

app.get("/health", (_q, r) => r.json({ status: "healthy" }));

app.get("/demo/healthy", (_q, r) => r.json({ status: "healthy" }));

app.get("/demo/slow", async (_q, r) => {
  await new Promise((x) => setTimeout(x, 5000));

  r.json({ status: "slow" });
});

app.get("/demo/fail", (_q, r) => r.status(503).json({ status: "failed" }));

app.listen(process.env.PORT || 4000, () => console.log("Demo API listening"));
