import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import { app } from "../../init";
import Patient from "../../../../src/model/patient";
import { authRequest, RequestMethods } from "../../../testUtils";
import Doctor from "../../../../src/model/doctor";

describe("med (info)", () => {
  it("authorized doctor should see info correctly", async () => {
    const doctor = await Doctor.query().findById(1)
    const res = await (await authRequest(app)
      .loginAsDoctor(1))
      .get("/api/med/info")
      .build()
      .send()

    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      info: doctor.getFullInfo()
    })
  })
})