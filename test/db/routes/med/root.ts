import app from "../../../../index"
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import jwt from "jsonwebtoken"
import config from "config"
import { authRequest } from "../../../testUtils";
import Patient from "../../../../src/model/patient";

chai.use(chaiHttp)

describe("doctor (patients)", () => {
  it("normal doctor can see authorized patient profiles correctly", (done) => {
    // Test doctor carlo.alberti, which is authorized to see only some patients
    authRequest(app)
      .loginAsDoctor(2)
      .get("/api/med/patients")
      .build()
      .send()
      .end((err, res) => {
        if (err) done(err)
        expect(res).to.have.status(200)
        expect(res.body).to.have.property("patients")
        expect(res.body.patients).to.be.deep.eq([
          {
            id: 2,
            firstName: "Caterina",
            lastName: "Verdi"
          },
          {
            id: 3,
            firstName: "Maria",
            lastName: "Lambertini"
          }
        ])
        done()
      })
  })

  it("admin can see all patients", async () => {
    const patients = (await Patient.query().select()).map(patient => {
      return {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName
      }
    })
    const res = await authRequest(app)
      .loginAsDoctor(1) // Admin
      .get("/api/med/patients")
      .build()
      .send()

    expect(res).to.have.status(200)
    expect(res.body).to.have.property("patients")
    expect(res.body.patients).to.be.deep.eq(patients)
  })

  it("unauthorized doctor can't see patients", (done) => {
    authRequest(app)
      .get("/api/med/patients")
      .build()
      .send()
      .end((err, res) => {
        if (err) return err
        expect(res).to.have.status(401)
        expect(res.body).to.be.deep.eq({})
        done()
      })
  })

  it("patient can't see other patients", (done) => {
    authRequest(app)
      .loginAsPatient(1)
      .get("/api/med/patients")
      .build()
      .send()
      .end((err, res) => {
        if (err) return err
        expect(res).to.have.status(403)
        expect(res.body).to.be.deep.eq({
          error: "missing doctor information"
        })
        done()
      })
  })

  it("non-existing doctor can't see patients", (done) => {
    authRequest(app)
      .loginAsDoctor(99999)
      .get("/api/med/patients")
      .build()
      .send()
      .end((err, res) => {
        if (err) return err
        expect(res).to.have.status(404)
        expect(res.body).to.be.deep.eq({
          error: "doctor not found"
        })
        done()
      })
  })
})