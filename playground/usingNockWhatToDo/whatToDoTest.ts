import chai from "chai";
const expect = chai.expect;
import app from "./whattodo";
import supertest from "supertest";
const request = supertest(app);
import nock from "nock";

describe("What to do endpoint", function () {
  before(() => {
    nock("https://www.boredapi.com").get("/api/activity").reply(200, {
      activity: "drink a single beer",
      type: "music",
      participants: 1,
      price: 0.05,
      link: "",
      key: "4296813",
      accessibility: 0.9,
    });
  });

  it("Should eventually provide 'drink a single beer'", async function () {
    const response = await request.get("/whattodo");
    expect(response.body.activity).to.be.equal("drink a single beer");
    expect(response.status).to.be.equal(200);
  });
});
