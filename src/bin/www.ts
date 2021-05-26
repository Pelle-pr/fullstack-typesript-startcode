import app from "../app";
import d from "debug";
import mongodb from "mongodb";
const debug = d("www");
const MongoError = mongodb.MongoError;
import { setupFacade } from "../graphql/resolvers"
import { DbConnector } from "../config/dbConnector";

const PORT = process.env.PORT || 3333;

(async function connectToDb() {
  try {
    const connection = await DbConnector.connect();
    const db = connection.db(process.env.DB_NAME);
    app
      .get("logger")
      .log("info", `Connection to ${process.env.DB_NAME} established`);

    debug(`Connection to ${process.env.DB_NAME} established`)

    app.set("db", db);
    app.set("db-type", "REAL");

    setupFacade(db)

    app.listen(PORT, () =>
      app
        .get("logger")
        .log("info", `Server started, listening on PORT: ${PORT}`)
    );
  } catch (err) {
    if (err instanceof MongoError) {
      app.get("logger").log("error", err.errmsg);
    } else {
      app.get("logger").log("error", err);
    }
  }
})();
