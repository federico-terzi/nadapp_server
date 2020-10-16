import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import app from "../../../../index";
import Patient from "../../../../src/model/patient";
import { authRequest, renderJson } from "../../../testUtils";

chai.use(chaiHttp)

describe("admin (patient-info)", () => {
  it("admin can edit patient info", async () => {
    const res = await authRequest(app)
      .loginAsDoctor(1)
      .put("/api/admin/patient/3/info")
      .build()
      .send({
        firstName: "Luca",
        lastName: "Mirri",
        CF: "MRRLCA87ALEH124H",
        telephone: "321123123",
        email: "luca.mirri@gmail.com",
        address: "Via Nuova 23",
        birthDate: "1987-12-03",
      })

    const newPatient = renderJson((await Patient.query().findById(3)).getInfo())
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      info: newPatient,
    })
    expect(newPatient).to.be.deep.eq({
      id: 3,
      firstName: "Luca",
      lastName: "Mirri",
      CF: "MRRLCA87ALEH124H",
      telephone: "321123123",
      email: "luca.mirri@gmail.com",
      address: "Via Nuova 23",
      birthDate: "1987-12-03T00:00:00.000Z",
      notes: null
    })
  })

  it("admin can edit patient info (partial)", async () => {
    const patient = renderJson((await Patient.query().findById(3)).getInfo())
    const res = await authRequest(app)
      .loginAsDoctor(1)
      .put("/api/admin/patient/3/info")
      .build()
      .send({
        CF: "MRRLCA87ALEH124H",
      })

    const newPatient = renderJson((await Patient.query().findById(3)).getInfo())
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      info: newPatient,
    })
    expect(newPatient).to.be.deep.eq({
      ...patient,
      CF: "MRRLCA87ALEH124H"
    })
  })

  it("admin can edit patient info (trim fields correctly)", async () => {
    const patient = renderJson((await Patient.query().findById(3)).getInfo())
    const res = await authRequest(app)
      .loginAsDoctor(1)
      .put("/api/admin/patient/3/info")
      .build()
      .send({
        CF: "    MRRLCA87ALEH124H \n",
      })

    const newPatient = renderJson((await Patient.query().findById(3)).getInfo())
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      info: newPatient,
    })
    expect(newPatient).to.be.deep.eq({
      ...patient,
      CF: "MRRLCA87ALEH124H"
    })
  })

  // TODO: test trim
})