import * as mongo from "mongodb";
import FriendFacade from "../src/facade/friendFacade";

import chai from "chai";
const expect = chai.expect;

//use these two lines for more streamlined tests of promise operations
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

import bcryptjs from "bcryptjs";
import { InMemoryDbConnector } from "../src/config/dbConnector";
import { ApiError } from "../src/errors/apiError";

let friendCollection: mongo.Collection;
let facade: FriendFacade;

describe("## Verify the Friends Facade ##", () => {
  before(async function () {
    //Connect to inmemory test database
    const client = await InMemoryDbConnector.connect();
    //Get the database and initialize the facade
    const db = client.db();
    facade = new FriendFacade(db);
    //Initialize friendCollection, to operate on the database without the facade
    friendCollection = db.collection("friends");
  });

  beforeEach(async () => {
    const hashedPW = await bcryptjs.hash("secret", 4);
    await friendCollection.deleteMany({});
    //Create a few few testusers for ALL the tests
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
        firstName: "Peter",
        lastName: "Admin",
        email: "peter@admin.dk",
        password: hashedPW,
        role: "admin",
      },
    ]);
  });

  describe("Verify the addFriend method", () => {
    it("It should Add the user Jan", async () => {
      const newFriend = {
        firstName: "Jan",
        lastName: "Olsen",
        email: "jan@b.dk",
        password: "secret",
      };
      const status = await facade.addFriend(newFriend);
      expect(status).to.be.not.null;
      const jan = await friendCollection.findOne({ email: "jan@b.dk" });
      expect(jan.firstName).to.be.equal("Jan");
    });

    it("It should not add a user with a role (validation fails)", async () => {
      const newFriend = {
        firstName: "Jan",
        lastName: "Olsen",
        email: "jan@b.dk",
        password: "secret",
        role: "admin",
      };
      await expect(facade.addFriend(newFriend)).to.be.rejectedWith(ApiError);
    });
  });

  describe("Verify the editFriend method", () => {
    it("It should change lastName to XXXX", async () => {
      const newPeter = {
        firstName: "Peter",
        lastName: "XXXX",
        email: "peter@admin.dk",
        password: "secret",
      };
      const status = await facade.editFriend("peter@admin.dk", newPeter);
      expect(status).to.not.be.null;
      const peter = await friendCollection.findOne({ email: "peter@admin.dk" });
      expect(peter.lastName).to.be.equal("XXXX");
    });
    it("It should not edit a user with a role", async () => {
      const newPeter = {
        firstName: "Peter",
        lastName: "XXXX",
        email: "peter@b.dk",
        password: "secret",
        role: "admin",
      };
      await expect(
        facade.editFriend("peter@b.dk", newPeter)
      ).to.be.rejectedWith(ApiError);
    });
  });

  describe("Verify the deleteFriend method", () => {
    it("It should remove the user Peter", async () => {
      const status = await facade.deleteFriend("pp@b.dk");
      expect(status).to.be.equal(true);
    });
    it("It should return false, for a user that does not exist", async () => {
      const status = await facade.deleteFriend("XXX@b.dk");
      expect(status).to.be.equal(false);
    });
  });

  describe("Verify the getAllFriends method", () => {
    it("It should get three friends", async () => {
      const friends = await facade.getAllFriends();
      expect(friends.length).to.be.equal(3);
    });
  });

  describe("Verify the getFriend method", () => {
    it("It should find Donald Duck", async () => {
      const dd = await facade.getFriend("dd@b.dk");
      expect(dd.firstName).to.be.equal("Donald");
    });
    it("It should not find xxx.@.b.dk", async () => {
      await expect(facade.getFriend("xxx.@.b.dk")).rejectedWith(ApiError);
    });
  });

  describe("Verify the getVerifiedUser method", () => {
    it("It should correctly validate Peter Pan's credential,s", async () => {
      const veriefiedPeter = await facade.getVerifiedUser("pp@b.dk", "secret");
      expect(veriefiedPeter).to.be.not.null;
    });

    it("It should NOT validate Peter Pan's credential,s", async () => {
      const dontVerifyPeter = await facade.getVerifiedUser(
        "pp@b.dk",
        "wrongPassword"
      );
      expect(dontVerifyPeter).to.be.null;
    });

    it("It should NOT validate a non-existing users credentials", async () => {
      const dontVerifyUser = await facade.getVerifiedUser("pap@b.dk", "secret");
      expect(dontVerifyUser).to.be.null;
    });
  });
});
