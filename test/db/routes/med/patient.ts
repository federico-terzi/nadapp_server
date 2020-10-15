import app from "../../../../index"
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import { authRequest, binaryParser, renderJson } from "../../../testUtils";
import Patient from "../../../../src/model/patient";
import Doctor from "../../../../src/model/doctor";
import Report from "../../../../src/model/report";
import Meal from "../../../../src/model/meal";
import Balance from "../../../../src/model/balance";
import fs from "fs"
import config from "config"
import path from "path"
import { decryptData } from "../../../../src/util";

chai.use(chaiHttp)

describe("doctor (patient-info)", () => {
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
})

describe("doctor (patient-doctors)", () => {
  it("authorized doctor should see patient authorized doctors correctly", async () => {
    const patient = renderJson((await Patient.query().findById(3)).getInfo())
    const doctor = renderJson((await Doctor.query().findById(2)).getShortInfo())
    const res = await authRequest(app)
      .loginAsDoctor(2)
      .get("/api/med/patient/3/doctors")
      .build()
      .send()
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      doctors: [
        doctor
      ],
    })
  })

  // TODO: should a general doctor (non-admin) be authorized to see the list of patient's doctors?
})

describe("doctor (patient-meals)", () => {
  it("authorized doctor should see patient meals correctly", async () => {
    const meals = (await Meal.query().findByIds([3,4]).orderBy("date", "desc")).map(meal => meal.getInfo())
    expect(meals.length).to.be.eq(2)
    const jsonMeals = renderJson(meals)
    const res = await authRequest(app)
      .loginAsDoctor(2)
      .get("/api/med/patient/2/meals")
      .build()
      .send()
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      meals: jsonMeals,
    })
  })

  it("unauthorized doctor should not see patient meals", async () => {
    const res = await authRequest(app)
      .loginAsDoctor(2)
      .get("/api/med/patient/1/meals")  // Doctor 2 is not authorized to see patient 1
      .build()
      .send()
    expect(res).to.have.status(403)
    expect(res.body).to.be.deep.eq({
      error: "missing patient authorization"
    })
  })
})

describe("doctor (patient-balances)", () => {
  it("authorized doctor should see patient balances correctly", async () => {
    const balances = (await Balance.query().findByIds([3,5]).orderBy("date", "desc")).map(balance => balance.getInfo())
    expect(balances.length).to.be.eq(2)
    const jsonBalances = renderJson(balances)
    const res = await authRequest(app)
      .loginAsDoctor(2)
      .get("/api/med/patient/2/balances")
      .build()
      .send()
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      balances: jsonBalances,
    })
  })

  it("unauthorized doctor should not see patient balances", async () => {
    const res = await authRequest(app)
      .loginAsDoctor(2)
      .get("/api/med/patient/1/balances")  // Doctor 2 is not authorized to see patient 1
      .build()
      .send()
    expect(res).to.have.status(403)
    expect(res.body).to.be.deep.eq({
      error: "missing patient authorization"
    })
  })
})

describe("doctor (patient-reports)", () => {
  beforeEach(async () => {
    // Load some reports
    await authRequest(app)
      .loginAsDoctor(1)
      .post("/api/med/patient/1/report/upload")
      .build()
      .attach("file", "test/resources/testreport.pdf")

    await authRequest(app)
      .loginAsDoctor(1)
      .post("/api/med/patient/3/report/upload")
      .build()
      .attach("file", "test/resources/testreport.pdf")

    await authRequest(app)
      .loginAsDoctor(1)
      .post("/api/med/patient/3/report/upload")
      .build()
      .attach("file", "test/resources/testreport.pdf")
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
    expect(res.headers).to.have.property("content-disposition")
    expect(res.headers["content-type"]).to.be.eq("application/pdf")

    // TODO: compare actual download

    const stream = fs.createWriteStream('tmp/reportdownload.pdf');
    res.pipe(stream);

    // Make sure the resulting report content is correct
    const expectedContent = fs.readFileSync("test/resources/testreport.pdf")
    const actualContent = fs.readFileSync("tmp/reportdownload.pdf")
    expect(actualContent).to.be.eq(expectedContent)
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

  it("admin doctor should upload reports", async () => {
    const reports = await Report.query().where("patientId", 3)
    expect(reports.length).to.be.eq(2)

    const reportFileContent = fs.readFileSync("test/resources/testreport.pdf")

    const res = await authRequest(app)
      .loginAsDoctor(1)
      .post("/api/med/patient/3/report/upload")
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

  // TODO: test downloaded report is equal to the original file

  // TODO: test upload record without attaching file
  // TODO: non admin doctors should not upload reports?

  // TODO: test not logged in doctor
})