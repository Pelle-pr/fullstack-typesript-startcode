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
app.use(cors());

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



// For my react native app

import PositionFacade from "./facade/positionFacade"
import IPosition from "./interfaces/IPosition"
let facade: PositionFacade

app.post("/friends", async (req, res, next) => {

  try {
    if (!facade) {
      const db = req.app.get("db")
      facade = new PositionFacade(db)
    }
    const { email, password, longitude, latitude, distance } = req.body;
    const friends = await facade.findNearbyFriends(email, password, longitude, latitude, distance)
    const friendsReturned = friends.map((f: IPosition) => {
      return { email: f.email, name: f.name, longitude: f.location.coordinates[0], latitude: f.location.coordinates[1] }
    })
    res.json(friendsReturned)
  }
  catch (err) {
    if (err instanceof ApiError) {
      return next(err);
    }
    next(new ApiError(err.message, 400));
  }
})

app.get("/gamearea", async (req, res) => {

  if (!facade) {
    const db = req.app.get("db")
    facade = new PositionFacade(db)
  }
  const gameArea = await facade.getGameArea()
  res.json(gameArea)
})

app.get("/:email", async (req, res, next) => {
  try {
    if (!facade) {
      const db = req.app.get("db")
      facade = new PositionFacade(db)
    }

    const friend = await facade.findFriendPositionByEmail(req.params.email)

    res.json(friend)
  } catch (err) {
    if (err instanceof ApiError) {
      return next(err);
    }
    next(new ApiError(err.message, 400))
  };
})


app.use((err: any, req: any, res: any, next: Function) => {
  if (err instanceof ApiError) {
    res.status(err.errorCode).send({ msg: err.message, code: err.errorCode });
  } else {
    next(err);
  }
});


export default app;
