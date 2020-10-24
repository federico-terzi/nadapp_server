import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import config from "config";
import fs from "fs";
import path from "path";
import { app } from "../../init";
import Balance from "../../../../src/model/balance";
import Doctor from "../../../../src/model/doctor";
import Meal from "../../../../src/model/meal";
import Patient from "../../../../src/model/patient";
import Report from "../../../../src/model/report";
import { decryptData } from "../../../../src/util";
import { authRequest, binaryParser, renderJson } from "../../../testUtils";

chai.use(chaiHttp)

describe("admin (doctor-info)", () => {
  it("should display doctor info correctly", async () => {
    const doctor = renderJson((await Doctor.query().findById(2)).getInfo())
    const agent = await authRequest(app).loginAsDoctor(1)
    const res = await agent
      .get("/api/admin/doctors/2/info")
      .build()
      .send()
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      info: doctor,
    })
    agent.close()
  })

  it("non existent doctor should not crash", async () => {
    const agent = await authRequest(app).loginAsDoctor(1)
    const res = await agent
      .get("/api/admin/doctors/99999/info")
      .build()
      .send()

    expect(res).to.have.status(404)
    expect(res.body).to.be.deep.eq({
      error: "doctor not found"
    })
    agent.close()
  })
})

describe("admin (doctor-patients)", () => {
  it("should display authorized patients correctly", async () => {
    const patients = renderJson((await Patient.query().findByIds([2,3]).orderBy("lastName", "asc")).map(patient => patient.getShortInfo()))
    const res = await (await authRequest(app)
      .loginAsDoctor(1))
      .get("/api/admin/doctors/2/patients")
      .build()
      .send()
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      patients: patients
    })
  })

  it("admin should show all patients as being authorized", async () => {
    const patients = renderJson((await Patient.query().orderBy("lastName", "asc")).map(patient => patient.getShortInfo()))
    const res = await (await authRequest(app)
      .loginAsDoctor(1))
      .get("/api/admin/doctors/1/patients")
      .build()
      .send()
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      patients: patients
    })
  })
})