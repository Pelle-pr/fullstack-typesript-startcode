import fetch from "node-fetch";
import express from "express";
const app = express();

app.get("/nameinfo/:name", async (req, res, next) => {
  const name = req.params.name;

  const gender = fetch("Https://api.genderize.io?name=" + name).then((res) =>
    res.json()
  );
  const country = fetch("https://api.nationalize.io?name=" + name).then((res) =>
    res.json()
  );
  const age = fetch("https://api.agify.io?name=" + name).then((res) =>
    res.json()
  );

  const combined = await Promise.all([gender, country, age]);
  const result = {
    gender: combined[0].gender,
    country: combined[1].country[0].country_id,
    age: combined[2].age,
  };
  res.json(result);
});

export default app;
