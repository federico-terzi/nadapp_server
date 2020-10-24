import { expect } from "chai";
import { app } from "../../init";
import Doctor from "../../../../src/model/doctor";
import Patient from "../../../../src/model/patient";
import { authRequest } from "../../../testUtils";

describe("admin (search)", () => {
  it("admin should search correctly including the doctors", async () => {
    const patients = (await Patient.query().findByIds([1,2,3]).orderBy("lastName", "asc")).map(patient => patient.getNameInfo())
    const doctors = (await Doctor.query().findByIds([4]).orderBy("lastName", "asc")).map(doctor => doctor.getNameInfo())
    const res = await (await authRequest(app)
      .loginAsDoctor(1))
      .get("/api/med/search?q=ri")
      .build()
      .send()

    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      patients: patients,
      doctors: doctors
    })
  })
})