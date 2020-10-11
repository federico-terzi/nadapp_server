import app from "../../../../index"
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import { authRequest, renderJson } from "../../../testUtils";
import Patient from "../../../../src/model/patient";

chai.use(chaiHttp)

describe("doctor (patient-profile)", () => {
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

  it("admin should see patient info correctly", async () => {
    const patient = renderJson((await Patient.query().findById(3)).getInfo())
    const res = await authRequest(app)
      .loginAsDoctor(1)
      .get("/api/med/patient/3/info")
      .build()
      .send()
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      info: patient,
    })
  })

  it("unauthorized doctor should not see patient info", async () => {
    const res = await authRequest(app)
      .loginAsDoctor(2)
      .get("/api/med/patient/1/info")
      .build()
      .send()
    expect(res).to.have.status(403)
    expect(res.body).to.be.deep.eq({
      error: "missing patient authorization",
    })
  })

  it("patient should not see patient info", async () => {
    const res = await authRequest(app)
      .loginAsPatient(2)
      .get("/api/med/patient/1/info")
      .build()
      .send()
    expect(res).to.have.status(403)
    expect(res.body).to.be.deep.eq({
      error: "missing doctor information",
    })
  })

  it("invalid string as patient id should not crash", async () => {
    const res = await authRequest(app)
      .loginAsDoctor(2)
      .get("/api/med/patient/abc/info")
      .build()
      .send()
    expect(res).to.have.status(400)
    expect(res.body).to.be.deep.eq({
      error: "bad patient id format",
    })
  })
})