import path from "path";
import { expect } from "chai";
import app from "../src/app";

import supertest from "supertest";
const request = supertest(app);

import bcryptjs from "bcryptjs";
import * as mongo from "mongodb";
import { InMemoryDbConnector } from "../src/config/dbConnector";
import { response } from "express";
let friendCollection: mongo.Collection;

describe("### Describe the Friend Endpoints (/api/friends) ###", function () {
  let URL: string;

  before(async function () {
    //Connect to IN-MEMORY test database
    const connection = await InMemoryDbConnector.connect();
    //Get the database and set it on the app-object to make it availabe for the friendRoutes
    const db = connection.db();
    app.set("db", db);
    app.set("db-type", "Test-DB");
    //Initialize friendCollection, to operate on the database without the facade
    friendCollection = db.collection("friends");
  });

  beforeEach(async function () {
    const hashedPW = await bcryptjs.hash("secret", 8);
    await friendCollection.deleteMany({});
    //Last friend below is only necessary if you have added authentications
    await friendCollection.insertMany([
      {
        firstName: "Peter",
        lastName: "Pan",
        email: "pp@b.dk",
        password: hashedPW,
        role: "user",
      },
      {
        firstName: "Donald",
        lastName: "Duck",
        email: "dd@b.dk",
        password: hashedPW,
        role: "user",
      },
      {
        firstName: "Ad",
        lastName: "Admin",
        email: "aa@a.dk",
        password: hashedPW,
        role: "admin",
      },
    ]);
  });

  //In this, and all the following REMOVE tests that requires authentication if you are using the simple version of friendRoutes
  describe("While attempting to get all users", function () {
    it("it should get two users when authenticated", async () => {
      const response = await request
        .get("/api/friends/all")
        .auth("pp@b.dk", "secret");
      expect(response.status).to.equal(200);
      expect(response.body.length).to.equal(3);
    });

    it("it should get a 401 when NOT authenticated", async () => {
      const response = await request.get("/api/friends/all");

      expect(response.status).to.be.equal(401);
      expect(response.text).to.be.equal("Access denied");
    });
  });

  describe("While attempting to add a user", function () {
    it("it should Add the user Jan Olsen", async () => {
      const newFriend = {
        firstName: "Jan",
        lastName: "Olsen",
        email: "jan@b.dk",
        password: "secret",
      };
      const response = await request.post("/api/friends").send(newFriend);
      expect(response.status).to.equal(200);
      expect(response.body.id).to.be.not.null;
    });

    it("It should fail to Add user due to wrong password length", async () => {
      const newFriend = {
        firstName: "Jan",
        lastName: "Olsen",
        email: "jan@b.dk",
        password: "se",
      };

      const response = await request.post("/api/friends").send(newFriend);
      expect(response.status).to.be.equal(400);
      expect(response.body.msg).to.be.equal(
        `"password" length must be at least 4 characters long`
      );
    });
  });
  describe("While logged in as a user", function () {
    it("It should return the logged in user", async () => {
      const response = await request
        .get("/api/friends/me")
        .auth("pp@b.dk", "secret");
      expect(response.body.firstName).to.be.equal("Peter");
      expect(response.body.lastName).to.be.equal("Pan");
    });
    it("It should edit the logged in user", async () => {
      const newPeter = {
        firstName: "Poul",
        lastName: "Pan",
        email: "pp@b.dk",
        password: "secret",
      };
      const response = await request
        .put("/api/friends/editme")
        .auth("pp@b.dk", "secret")
        .send(newPeter);
      expect(response.status).to.be.equal(200);
      expect(response.body.firstName).to.be.equal("Poul");
      const theNewPeter = await friendCollection.findOne({ email: "pp@b.dk" });
      expect(theNewPeter.firstName).to.be.equal("Poul");
    });
  });
  describe("While verifying the get any user, given a userId (email)", function () {
    it("It should allow an admin user to find Donald Duck", async () => {
      const response = await request
        .get("/api/friends/find-user/dd@b.dk")
        .auth("aa@a.dk", "secret");
      expect(response.body.firstName).to.be.equal("Donald");
    });
    it("It should not, allow admin-users to find a non-existing user", async () => {
      const response = await request
        .get("/api/friends/find-user/dd@b.s")
        .auth("aa@a.dk", "secret");
      expect(response.status).to.be.equal(404);
      expect(response.body.msg).to.be.equal("User not found");
    });

    it("It should not let a non-admin user find Donald Duck", async () => {
      const response = await request
        .get("/api/friends/find-user/dd@b.dk")
        .auth("pp@b.dk", "secret");
      expect(response.status).to.be.equal(401);
      expect(response.body.msg).to.be.equal("Not Authorized");
    });
  });

  describe("While verifying the 'edit any user', given a userId (email)", function () {
    it("It should allow an admin-user to edit Peter Pan", async () => {
      const newPeter = {
        firstName: "Poul",
        lastName: "Pan",
        email: "pp@b.dk",
        password: "secret",
      };
      const response = await request
        .put("/api/friends/pp@b.dk")
        .auth("aa@a.dk", "secret")
        .send(newPeter);
      expect(response.body.firstName).to.be.equal("Poul");

      const theNewPeter = await friendCollection.findOne({ email: "pp@b.dk" });
      expect(theNewPeter.firstName).to.be.equal("Poul");
    });
    it("It should NOT allow a non-admin user to edit Peter Pan", async () => {
      const newPeter = {
        firstName: "Poul",
        lastName: "Pan",
        email: "pp@b.dk",
        password: "secret",
      };
      const response = await request
        .put("/api/friends/pp@b.dk")
        .auth("dd@b.dk", "secret")
        .send(newPeter);
      expect(response.status).to.be.equal(401);

      const theNewPeter = await friendCollection.findOne({ email: "pp@b.dk" });
      expect(theNewPeter.firstName).to.not.be.equal("Poul");
    });
  });
  describe("While verifying the delete any user, given a userId (email)", function () {
    it("It should allow an admin user to delete Donald Duck", async () => {
      const response = await request
        .delete("/api/friends/pp@b.dk")
        .auth("aa@a.dk", "secret");
      expect(response.body).to.be.equal(true);
      expect(response.status).to.be.equal(200);

      const friends = await friendCollection.find({}).toArray();
      expect(friends.length).to.be.equal(2);
    });
    it("It should NOT allow a non-admin user to delete Donald Duck", async () => {
      const response = await request
        .delete("/api/friends/dd@b.dk")
        .auth("pp@b.dk", "secret");
      expect(response.body.msg).to.be.equal("Not Authorized");
      expect(response.status).to.be.equal(401);

      const friends = await friendCollection.find({}).toArray();
      expect(friends.length).to.be.equal(3);
    });
  });
});
