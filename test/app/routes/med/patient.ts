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

describe("med (patient-info)", () => {
  it("authorized doctor should see patient info correctly", async () => {
    const patient = renderJson((await Patient.query().findById(3)).getInfo())
    const res = await (await authRequest(app)
      .loginAsDoctor(2))
      .get("/api/med/patients/3/info")
      .build()
      .send()
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      info: patient,
    })
  })

  it("admin should see patient info correctly", async () => {
    const patient = renderJson((await Patient.query().findById(3)).getInfo())
    const res = await (await authRequest(app)
      .loginAsDoctor(1))
      .get("/api/med/patients/3/info")
      .build()
      .send()
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      info: patient,
    })
  })

  it("invalid string as patient id should not crash", async () => {
    const res = await (await authRequest(app)
      .loginAsDoctor(2))
      .get("/api/med/patients/abc/info")
      .build()
      .send()
    expect(res).to.have.status(400)
    expect(res.body).to.be.deep.eq({
      error: "bad patient id format",
    })
  })

  it("non-existent patient id should not crash", async () => {
    const res = await (await authRequest(app)
      .loginAsDoctor(2))
      .get("/api/med/patients/9999/info")
      .build()
      .send()
    expect(res).to.have.status(403)
    expect(res.body).to.be.deep.eq({
      error: "missing patient authorization",
    })
  })

  it("non-existent patient id should not crash as admin", async () => {
    const res = await (await authRequest(app)
      .loginAsDoctor(1))
      .get("/api/med/patients/9999/info")
      .build()
      .send()
    expect(res).to.have.status(404)
    expect(res.body).to.be.deep.eq({
      error: "patient not found",
    })
  })
})

describe("med (patient-doctors)", () => {
  it("authorized doctor should see patient authorized doctors correctly", async () => {
    const patient = renderJson((await Patient.query().findById(3)).getInfo())
    const doctor = renderJson((await Doctor.query().findById(2)).getShortInfo())
    const res = await (await authRequest(app)
      .loginAsDoctor(2))
      .get("/api/med/patients/3/doctors")
      .build()
      .send()
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      doctors: [
        doctor
      ],
    })
  })

  // TODO: should a general med (non-admin) be authorized to see the list of patient's doctors?
})

describe("med (patient-meals)", () => {
  it("authorized doctor should see patient meals correctly", async () => {
    const meals = (await Meal.query().findByIds([3, 4]).orderBy("date", "desc")).map(meal => meal.getInfo())
    expect(meals.length).to.be.eq(2)
    const jsonMeals = renderJson(meals)
    const res = await (await authRequest(app)
      .loginAsDoctor(2))
      .get("/api/med/patients/2/meals")
      .build()
      .send()
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      meals: jsonMeals,
    })
  })
})

describe("med (patient-balances)", () => {
  it("authorized doctor should see patient balances correctly", async () => {
    const balances = (await Balance.query().findByIds([3, 5]).orderBy("date", "desc")).map(balance => balance.getInfo())
    expect(balances.length).to.be.eq(2)
    const jsonBalances = renderJson(balances)
    const res = await (await authRequest(app)
      .loginAsDoctor(2))
      .get("/api/med/patients/2/balances")
      .build()
      .send()
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      balances: jsonBalances,
    })
  })
})

describe("med (patient-reports)", () => {
  beforeEach(async () => {
    // Load some reports
    await (await authRequest(app)
      .loginAsDoctor(1))
      .post("/api/med/patients/1/reports/upload")
      .build()
      .attach("file", "test/resources/testreport.pdf")

    await (await authRequest(app)
      .loginAsDoctor(1))
      .post("/api/med/patients/3/reports/upload")
      .build()
      .attach("file", "test/resources/testreport.pdf")

    await (await authRequest(app)
      .loginAsDoctor(1))
      .post("/api/med/patients/3/reports/upload")
      .build()
      .attach("file", "test/resources/testreport.pdf")
  })

  it("authorized doctor should see reports", async () => {
    const reports = renderJson((await Report.query().where("patientId", 3).orderBy("date", "desc")).map(report => report.getInfo()))
    expect(reports.length).to.be.eq(2)
    const res = await (await authRequest(app)
      .loginAsDoctor(2))
      .get("/api/med/patients/3/reports")
      .build()
      .send()
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      reports: reports,
    })
  })

  it("authorized doctor should download report", (done) => {
    authRequest(app)
      .loginAsDoctor(2).then(req => {
        req.get("/api/med/patients/3/reports/2/download")
          .build()
          .buffer()
          .parse(binaryParser)
          .end((err, res) => {
            if (err) done(err)
            expect(res).to.have.status(200)
            expect(res.headers).to.have.property("content-disposition")
            expect(res.headers["content-type"]).to.be.eq("application/pdf")

            // Make sure the resulting report content is correct
            const expectedContent = fs.readFileSync("test/resources/testreport.pdf")
            expect(res.body).to.be.deep.eq(expectedContent)
            done()
          })
      })
  })

  it("report mismatch with patient", async () => {
    const res = await (await authRequest(app)
      .loginAsDoctor(2))
      .get("/api/med/patients/3/reports/1/download")  // Report 1 does not belong to patient 3
      .build()
      .send()
    expect(res).to.have.status(403)
    expect(res.body).to.be.deep.eq({
      error: "patient mismatch",
    })
  })

  it("non-existing report", async () => {
    const res = await (await authRequest(app)
      .loginAsDoctor(2))
      .get("/api/med/patients/3/reports/9999/download")  // Report 1 does not belong to patient 3
      .build()
      .send()
    expect(res).to.have.status(404)
    expect(res.body).to.be.deep.eq({
      error: "report not found",
    })
  })

  it("admin doctor should upload reports", async () => {
    const reports = await Report.query().where("patientId", 3)
    expect(reports.length).to.be.eq(2)

    const reportFileContent = fs.readFileSync("test/resources/testreport.pdf")

    const res = await (await authRequest(app)
      .loginAsDoctor(1))
      .post("/api/med/patients/3/reports/upload")
      .build()
      .attach("file", "test/resources/testreport.pdf")
    expect(res).to.have.status(200)
    expect(res.body.report).to.have.property("date")
    expect(res.body.report).to.have.property("id")

    // Extract the record from the returned id
    const report = await Report.query().findById(res.body.report.id)

    // Calculate the output file location
    const uploadedFilePath = path.join(config.get("uploadDestinationDir"), report.location)
    // Make sure the file exists
    expect(fs.existsSync(uploadedFilePath)).to.be.true

    // Decrypt the file and check the content
    const uploadedFileContent = fs.readFileSync(uploadedFilePath)
    const [iv, key] = report.getIVKey()
    const decrypted = decryptData(iv, key, uploadedFileContent)
    expect(decrypted).to.be.deep.eq(reportFileContent)
  })

  it("upload without file should fail", async () => {
    const res = await (await authRequest(app)
      .loginAsDoctor(1))
      .post("/api/med/patients/3/reports/upload")
      .build()
      .send()
    expect(res).to.have.status(400)
    expect(res.body).to.be.deep.eq({
      error: "missing file"
    })
  })

  it("unauthorized doctor should not upload reports", async () => {
    const reports = await Report.query().where("patientId", 1)
    expect(reports.length).to.be.eq(1)

    const res = await (await authRequest(app)
      .loginAsDoctor(2))
      .post("/api/med/patients/1/reports/upload")
      .build()
      .attach("file", "test/resources/testreport.pdf")
    expect(res).to.have.status(403)
    expect(res.body).to.be.deep.eq({
      error: "missing patient authorization"
    })

    // Make sure no reports are added
    const newReports = await Report.query().where("patientId", 1)
    expect(newReports.length).to.be.eq(reports.length)
  })

  // TODO: non admin doctors should not upload reports?

  // TODO: test not logged in doctor
})