import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import app from "../../../../index";
import { authRequest, RequestMethods } from "../../../testUtils";

chai.use(chaiHttp)

describe("/admin permission check", () => {
  const endpoints = [
    "/api/admin/patient/add"
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