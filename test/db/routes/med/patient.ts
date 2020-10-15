import app from "../../../../index"
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import { authRequest, renderJson } from "../../../testUtils";
import Patient from "../../../../src/model/patient";
import Report from "../../../../src/model/report";

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

  it("non-existent patient id should not crash", async () => {
    const res = await authRequest(app)
      .loginAsDoctor(2)
      .get("/api/med/patient/9999/info")
      .build()
      .send()
    expect(res).to.have.status(403)
    expect(res.body).to.be.deep.eq({
      error: "missing patient authorization",
    })
  })

  it("authorized doctor should see reports", async () => {
    const reports = renderJson((await Report.query().where("patientId", 3)).map(report => report.getInfo()))
    expect(reports.length).to.be.eq(2)
    const res = await authRequest(app)
      .loginAsDoctor(2)
      .get("/api/med/patient/3/reports")
      .build()
      .send()
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      reports: reports,
    })
  })

  it("unauthorized doctor should not see reports", async () => {
    const res = await authRequest(app)
      .loginAsDoctor(2) // Can't read patient 1
      .get("/api/med/patient/1/reports")
      .build()
      .send()
    expect(res).to.have.status(403)
    expect(res.body).to.be.deep.eq({
      error: "missing patient authorization"
    })
  })

  it("authorized doctor should download report", async () => {
    const res = await authRequest(app)
      .loginAsDoctor(2)
      .get("/api/med/patient/3/report/2/download")
      .build()
      .send()
    expect(res).to.have.status(200)
    // TODO: change, this should assert correct download
  })

  it("report mismatch with patient", async () => {
    const res = await authRequest(app)
      .loginAsDoctor(2)
      .get("/api/med/patient/3/report/1/download")  // Report 1 does not belong to patient 3
      .build()
      .send()
    expect(res).to.have.status(403)
    expect(res.body).to.be.deep.eq({
      error: "patient mismatch",
    })
  })

  it("non-existing report", async () => {
    const res = await authRequest(app)
      .loginAsDoctor(2)
      .get("/api/med/patient/3/report/9999/download")  // Report 1 does not belong to patient 3
      .build()
      .send()
    expect(res).to.have.status(404)
    expect(res.body).to.be.deep.eq({
      error: "report not found",
    })
  })

  // TODO: test not logged in doctor
  // TODO: test access report that doesn't belong to an authorized user
})