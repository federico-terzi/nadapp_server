import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import app from "../../../../index";
import Doctor from "../../../../src/model/doctor";
import Patient from "../../../../src/model/patient";
import { authRequest, renderJson } from "../../../testUtils";

chai.use(chaiHttp)

describe("admin (patient-info)", () => {
  it("admin can edit patient info", async () => {
    const res = await authRequest(app)
      .loginAsDoctor(1)
      .put("/api/admin/patients/3/info")
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
      .put("/api/admin/patients/3/info")
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
      .put("/api/admin/patients/3/info")
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
})

describe("admin (patient-doctor-authorization)", () => {
  it("admin authorize a new doctor for patient", async () => {
    const authorizedPatients = await Doctor.relatedQuery<Patient>("patients").for(2)
    expect(authorizedPatients.map(p => p.id)).to.be.deep.eq([2,3])
    const res = await authRequest(app)
      .loginAsDoctor(1)
      .post("/api/admin/patients/1/authorization/2")
      .build()
      .send()
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      result: "ok"
    })

    const newAuthorizedPatients = await Doctor.relatedQuery<Patient>("patients").for(2)
    expect(newAuthorizedPatients.map(p => p.id).sort()).to.be.deep.eq([1,2,3])
  })

  it("double authorization should not crash", async () => {
    const authorizedPatients = await Doctor.relatedQuery<Patient>("patients").for(2)
    expect(authorizedPatients.map(p => p.id)).to.be.deep.eq([2,3])
    const res = await authRequest(app)
      .loginAsDoctor(1)
      .post("/api/admin/patients/1/authorization/2")
      .build()
      .send()
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      result: "ok"
    })

    const newAuthorizedPatients = await Doctor.relatedQuery<Patient>("patients").for(2)
    expect(newAuthorizedPatients.map(p => p.id).sort()).to.be.deep.eq([1,2,3])

    const res2 = await authRequest(app)
      .loginAsDoctor(1)
      .post("/api/admin/patients/1/authorization/2")
      .build()
      .send()
    expect(res2).to.have.status(200)
    expect(res2.body).to.be.deep.eq({
      result: "ok"
    })
  })

  it("admin deauthorize a doctor for patient correctly", async () => {
    const authorizedPatients = await Doctor.relatedQuery<Patient>("patients").for(2)
    expect(authorizedPatients.map(p => p.id)).to.be.deep.eq([2,3])
    const res = await authRequest(app)
      .loginAsDoctor(1)
      .delete("/api/admin/patients/2/authorization/2")
      .build()
      .send()
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      result: "ok"
    })

    const newAuthorizedPatients = await Doctor.relatedQuery<Patient>("patients").for(2)
    expect(newAuthorizedPatients.map(p => p.id).sort()).to.be.deep.eq([3])
  })

  it("invalid doctor id should not crash", async () => {
    const res = await authRequest(app)
      .loginAsDoctor(1)
      .post("/api/admin/patients/1/authorization/abc")
      .build()
      .send()
    expect(res).to.have.status(400)
    expect(res.body).to.be.deep.eq({
      error: "invalid doctor id format"
    })
  })

  it("should not authorize a non existent doctor", async () => {
    const res = await authRequest(app)
      .loginAsDoctor(1)
      .post("/api/admin/patients/1/authorization/99999")
      .build()
      .send()
    expect(res).to.have.status(404)
    expect(res.body).to.be.deep.eq({
      error: "authorized doctor not found"
    })
  })

  it("should not deauthorize a non existent doctor", async () => {
    const res = await authRequest(app)
      .loginAsDoctor(1)
      .delete("/api/admin/patients/1/authorization/99999")
      .build()
      .send()
    expect(res).to.have.status(404)
    expect(res.body).to.be.deep.eq({
      error: "authorized doctor not found"
    })
  })
})