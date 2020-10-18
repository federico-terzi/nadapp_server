import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import { app } from "../../init";
import Doctor from "../../../../src/model/doctor";
import { authRequest, renderJson, RequestMethods } from "../../../testUtils";

chai.use(chaiHttp)

describe("/admin permission check", () => {
  const endpoints = [
    "/api/admin/patients",
    "/api/admin/patients/1/authorization/2",
    "/api/admin/doctors",
    "/api/admin/doctors/1/info",
    "/api/admin/doctors/1/patients",
  ]

  it("not-logged in user cannot access admin endpoints", async () => {
    for (let endpoint of endpoints) {
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

  it("non-admin doctor cannot access admin endpoints", async () => {
    for (let endpoint of endpoints) {
      for (let method of RequestMethods) {
        const res = await authRequest(app)
          .loginAsDoctor(2)  // Doctor 2 is not an admin
          .request(method, endpoint)
          .build()
          .send()
        expect(res).to.have.status(403)
        expect(res.body).to.be.deep.eq({
          error: "missing admin rights",
        })
      }
    }
  })

  it("patient cannot access admin endpoints", async () => {
    for (let endpoint of endpoints) {
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
})

describe("admin (doctors)", () => {
  it("admin can see all doctors correctly", async () => {
    const doctors = (await Doctor.query().orderBy("lastName", "asc")).map(doctor => doctor.getShortInfo())
    const res = await authRequest(app)
      .loginAsDoctor(1) // Admin
      .get("/api/admin/doctors")
      .build()
      .send()

    expect(res).to.have.status(200)
    expect(res.body).to.have.property("doctors")
    expect(res.body.doctors).to.be.deep.eq(renderJson(doctors))
  })
})