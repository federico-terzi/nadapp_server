import app from "../../../index"
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import { authRequest, renderJson } from "../../testUtils";
import Patient from "../../../src/model/patient";

chai.use(chaiHttp)

describe("mobile", () => {
  it("authorized doctor should see patient info correctly", async () => {
    const patient = renderJson((await Patient.query().findById(3)).getInfo())
    const res = await authRequest(app)
      .loginAsDoctor(2)
      .get("/api/med/patient/3/info")
      .build()
      .send()
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      info: patient,
    })
  })

  // TODO: unauthorized patient should not sync
  // TODO: nothing to sync
  // TODO: meals to sync
  // TODO: balances to sync
  // TODO: both of them to sync
  // TODO: simple server side sync
  // TODO: combined (server + client) sync
})