import express from "express";
import dotenv from "dotenv";
dotenv.config();
import path from "path";
import friendRoute from "./routes/FriendsRoutes";
import { ApiError } from "./errors/apiError";
import simplelog from "./middleware/simplelog";
import logger, { stream } from "./middleware/logger";
import morgan from "morgan";
const morganFormat = process.env.NODE_ENV == "production" ? "combined" : "dev";
import myCors from "./middleware/myCors";
const cors = require("cors");
const app = express();



app.use(express.json())

//Cors
app.use("/api", cors());
//My own middleware
//app.use("/api", myCors);


app.use(morgan(morganFormat, { stream }));
app.use(express.static(path.join(process.cwd(), "public")));
app.set("logger", logger);
//My own middleware
//app.use(simplelog);


//Routes

app.use("/api/friends", friendRoute);


import { graphqlHTTP } from 'express-graphql';
import { schema } from './graphql/schema';

import authMiddleware from "./middleware/basic-auth";
import { assertWrappingType } from "graphql";
//app.use("/graphql", authMiddleware);


app.use("/graphql", (req, res, next) => {
  const body = req.body;
  if (body && body.query && body.query.includes("createFriend")) {
    return next();
  }
  if (body && body.operationName && body.query.includes("IntrospectionQuery")) {
    return next();
  }
  if (body && body.query && (body.mutation || body.query)) {
    return authMiddleware(req, res, next)
  }
  next()
})


app.use('/graphql', graphqlHTTP({
  schema: schema,
  graphiql: true,
}));



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
