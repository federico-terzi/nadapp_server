import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import app from "../../../../index";
import Patient from "../../../../src/model/patient";
import { authRequest, RequestMethods } from "../../../testUtils";

describe("med (search)", () => {
  it("authorized doctor should search correctly", async () => {
    const patients = (await Patient.query().findByIds([2,3]).orderBy("lastName", "asc")).map(patient => patient.getNameInfo())
    const res = await authRequest(app)
      .loginAsDoctor(2)
      .get("/api/med/search?q=ri")
      .build()
      .send()

    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      patients: patients
    })
  })

  it("authorized doctor should search correctly (2)", async () => {
    const patients = (await Patient.query().findByIds([2]).orderBy("lastName", "asc")).map(patient => patient.getNameInfo())
    const res = await authRequest(app)
      .loginAsDoctor(2)
      .get("/api/med/search?q=caterina")
      .build()
      .send()

    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      patients: patients
    })
  })

  it("missing query parameter is handled correctly", async () => {
    const res = await authRequest(app)
      .loginAsDoctor(2)
      .get("/api/med/search")
      .build()
      .send()

    expect(res).to.have.status(400)
    expect(res.body).to.be.deep.eq({
      error: "missing query parameter"
    })
  })
})