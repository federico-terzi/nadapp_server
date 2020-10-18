import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import { app } from "../../init";
import Patient from "../../../../src/model/patient";
import { authRequest, RequestMethods } from "../../../testUtils";

chai.use(chaiHttp)

describe("/med permission check", () => {
  const patientEndpoints = [
    "/api/med/patients/1/info",
    "/api/med/patients/1/doctors",
    "/api/med/patients/1/meals",
    "/api/med/patients/1/balances",
    "/api/med/patients/1/reports",
    "/api/med/patients/1/report/1/download",
    "/api/med/patients/1/report/upload"
  ]

  const allMedEndpoints = [
    "/api/med/patients",
    "/api/med/search",
    ...patientEndpoints
  ]

  it("not-logged in user cannot access med endpoints", async () => {
    for (let endpoint of allMedEndpoints) {
      for (let method of RequestMethods) {
        const res = await authRequest(app)
          .request(method, endpoint)
          .build()
          .send()
        expect(res).to.have.status(401)
        expect(res.body).to.be.deep.eq({})
      }
    }
  })

  it("patient cannot access med endpoints", async () => {
    for (let endpoint of allMedEndpoints) {
      for (let method of RequestMethods) {
        const res = await authRequest(app)
          .loginAsPatient(1)
          .request(method, endpoint)
          .build()
          .send()
        expect(res).to.have.status(403)
        expect(res.body).to.be.deep.eq({
          error: "missing doctor information"
        })
      }
    }
  })

  it("unauthorized doctor cannot access non-authorized patient endpoints", async () => {
    for (let endpoint of patientEndpoints) {
      for (let method of RequestMethods) {
        const res = await authRequest(app)
          .loginAsDoctor(2)  // Doctor 2 is not authorized to view patient 1 info
          .request(method, endpoint)
          .build()
          .send()
        expect(res).to.have.status(403)
        expect(res.body).to.be.deep.eq({
          error: "missing patient authorization",
        })
      }
    }
  })

  it("non-existant doctor cannot access non-authorized patient endpoints", async () => {
    for (let endpoint of patientEndpoints) {
      for (let method of RequestMethods) {
        const res = await authRequest(app)
          .loginAsDoctor(99999)
          .request(method, endpoint)
          .build()
          .send()
        expect(res).to.have.status(404)
        expect(res.body).to.be.deep.eq({
          error: "doctor not found",
        })
      }
    }
  })
})

describe("med (root)", () => {
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
})