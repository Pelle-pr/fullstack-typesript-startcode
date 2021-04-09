import chai from "chai";
const expect = chai.expect;
import app from "./nameInfo";
import supertest from "supertest";
const request = supertest(app);
import nock from "nock";

describe("Name info endpoint", function () {
  before(() => {
    nock("Https://api.genderize.io").get("/?name=tom").reply(200, {
      name: "tom",
      gender: "female",
      probability: 0.99,
      count: 22753,
    });
    nock("Https://api.nationalize.io")
      .get("/?name=tom")
      .reply(200, {
        name: "tom",
        country: [
          { country_id: "BR", probability: 0.3005188203986185 },
          { country_id: "GL", probability: 0.2607911881000869 },
          { country_id: "NO", probability: 0.17752889156602003 },
        ],
      });
    nock("Https://api.agify.io")
      .get("/?name=tom")
      .reply(200, { name: "tom", age: 5, count: 120238 });
  });

  it("Should eventually provide female from BR with the age 5", async function () {
    const response = await request.get("/nameinfo/tom");
    expect(response.body.gender).to.be.equal("female");
    expect(response.body.country).to.be.equal("BR");
    expect(response.body.age).to.be.equal(5);
    expect(response.status).to.be.equal(200);
  });
});
