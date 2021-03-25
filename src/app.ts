import express from "express";
import dotenv from "dotenv";
dotenv.config();
import path from "path";
import friendRoute from "./routes/FriendsRoute";
import { ApiError } from "./errors/apiError";
import simplelog from "./middleware/simplelog";
import logger, { stream } from "./middleware/logger";
import morgan from "morgan";
const morganFormat = process.env.NODE_ENV == "production" ? "combined" : "dev";
import myCors from "./middleware/myCors";
const cors = require("cors");

const app = express();
app.use(morgan(morganFormat, { stream }));
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));
app.set("logger", logger);

//Cors
app.use("/api", cors());
//My own middleware
//app.use(simplelog);
//app.use("/api", myCors);

//Routes

app.use("/api/friends", friendRoute);

//404 handlers for api requests
app.use("/api", (req, res, next) => {
  res.status(404).send({
    msg: "Not found",
    error: 404,
  });
});

app.use((err: any, req: any, res: any, next: Function) => {
  if (err instanceof ApiError) {
    res.status(err.errorCode).send({ msg: err.message, code: err.errorCode });
  } else {
    next(err);
  }
});

export default app;
