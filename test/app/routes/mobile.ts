import { app } from "../init";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import { authRequest, binaryParser, renderJson } from "../../testUtils";
import Patient from "../../../src/model/patient";
import Meal from "../../../src/model/meal";
import Balance from "../../../src/model/balance";
import Doctor from "../../../src/model/doctor";
import Report from "../../../src/model/report";
import fs from "fs"

chai.use(chaiHttp)

describe("mobile", () => {
  it("unauthorized patient can't sync", async () => {
    const res = await authRequest(app)
      .post("/api/mobile/sync")
      .build()
      .send()
    expect(res).to.have.status(401)
    expect(res.body).to.be.deep.eq({})
  })

  it("doctor can't sync", async () => {
    const res = await (await authRequest(app)
      .loginAsDoctor(2))
      .post("/api/mobile/sync")
      .build()
      .send()
    expect(res).to.have.status(403)
    expect(res.body).to.be.deep.eq({
      error: "missing patient information"
    })
  })

  it("non-existent patient can't sync", async () => {
    const res = await (await authRequest(app)
      .loginAsPatient(9999))
      .post("/api/mobile/sync")
      .build()
      .send()
    expect(res).to.have.status(404)
    expect(res.body).to.be.deep.eq({
      error: "patient not found"
    })
  })

  it("malformed body should be handled correctly", async () => {
    const res = await (await authRequest(app)
      .loginAsPatient(1))
      .post("/api/mobile/sync")
      .build()
      .send({
        malformed: "body"
      })
    expect(res).to.have.status(400)
  })

  it("first sync should dump all information", async () => {
    const patient = await Patient.query().findById(1)
    const meals = (await Meal.query().findByIds([1, 2]).orderBy("date", "desc")).map(meal => meal.getInfo())
    const balances = (await Balance.query().findByIds([1, 2, 4]).orderBy("date", "desc")).map(balance => balance.getInfo())
    const doctors = (await Doctor.query().findByIds([4])).map(doctor => doctor.getSyncInfo())
    const res = await (await authRequest(app)
      .loginAsPatient(1))
      .post("/api/mobile/sync")
      .build()
      .send({
        lastServerEdit: 0,
      })
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      inSync: false,
      lastServerEdit: patient.getLastServerEditTimestamp(),
      meals: renderJson(meals),
      balances: renderJson(balances),
      doctors: renderJson(doctors),
      reports: [],
    })
  })

  it("user already in sync should not receive all information", async () => {
    const patient = await Patient.query().findById(1)
    const res = await (await authRequest(app)
      .loginAsPatient(1))
      .post("/api/mobile/sync")
      .build()
      .send({
        lastServerEdit: patient.getLastServerEditTimestamp(),
      })
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      inSync: true, // User should not receive new information, as he's already up to date
    })
  })

  it("add meal works correctly", async () => {
    const patient = await Patient.query().findById(1)
    const meals = await Meal.query().select().where("patientId", patient.id)
    expect(meals.map(meal => meal.id)).to.be.deep.eq([1, 2])

    const newMeals = [
      {
        uuid: "c9be66fb-3697-42f2-be8c-911f306f2e95",
        date: new Date().toISOString(),
        meal: "tortellini in brodo 50 grammi"
      },
      {
        uuid: "b35689ad-d52e-4522-96a2-12cc114b88da",
        date: new Date().toISOString(),
        meal: "pasta al pesto 80 grammi"
      },
    ]
    const res = await (await authRequest(app)
      .loginAsPatient(1))
      .post("/api/mobile/sync")
      .build()
      .send({
        lastServerEdit: patient.getLastServerEditTimestamp(),
        meals: newMeals,
      })
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      inSync: true,
    })

    // Check if the meals have been added
    const updatedMeals = renderJson((await Meal.query().select().where("patientId", patient.id)).map(meal => meal.getInfo()))
    const expectedMeals = renderJson(meals.map(meal => meal.getInfo()).concat(renderJson(newMeals)))
    expect(updatedMeals).to.be.deep.eq(expectedMeals)
  })

  it("update meal works correctly", async () => {
    const patient = await Patient.query().findById(1)
    const meals = await Meal.query().select().where("patientId", patient.id)
    expect(meals.length).to.be.eq(2)
    expect((await Meal.query().findById(1)).meal).to.be.eq("Pasta al pomodoro 100 grammi")

    const updatedMeals = [
      {
        uuid: "abb7723c-7890-4a4f-8e3d-ed158b2416b5",
        date: new Date().toISOString(),
        meal: "tortellini in brodo 50 grammi"
      },
    ]
    const res = await (await authRequest(app)
      .loginAsPatient(1))
      .post("/api/mobile/sync")
      .build()
      .send({
        lastServerEdit: patient.getLastServerEditTimestamp(),
        meals: updatedMeals,
      })
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      inSync: true,
    })

    const newMeals = await Meal.query().select().where("patientId", patient.id)
    expect(newMeals.length).to.be.eq(2)  // No change in number
    expect((await Meal.query().findById(1)).meal).to.be.eq("tortellini in brodo 50 grammi") // New description
  })

  it("conflicting uuid doesn't override entry of other patient", async () => {
    const patient = await Patient.query().findById(1)

    // There should be an entry (of another patient) with the same UUID
    expect((await Meal.query().where("uuid", "a514ce42-4b62-4797-a589-36a0bf1571d7")).length).to.be.eq(1)

    const newMeals = [
      {
        uuid: "a514ce42-4b62-4797-a589-36a0bf1571d7",  // This UUID is used by another patient
        date: new Date().toISOString(),
        meal: "tortellini in brodo 50 grammi"
      },
    ]
    const res = await (await authRequest(app)
      .loginAsPatient(1))
      .post("/api/mobile/sync")
      .build()
      .send({
        lastServerEdit: patient.getLastServerEditTimestamp(),
        meals: newMeals,
      })
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      inSync: true,
    })

    // Now we should have 2 of them
    expect((await Meal.query().where("uuid", "a514ce42-4b62-4797-a589-36a0bf1571d7")).length).to.be.eq(2)
  })

  it("client data should have priority if a conflict occurs", async () => {
    const updatedMeals = [
      {
        uuid: "abb7723c-7890-4a4f-8e3d-ed158b2416b5",
        date: new Date().toISOString(),
        meal: "tortellini in brodo 50 grammi"
      },
    ]
    const res = await (await authRequest(app)
      .loginAsPatient(1))
      .post("/api/mobile/sync")
      .build()
      .send({
        lastServerEdit: 0,
        meals: updatedMeals,
      })
    expect(res).to.have.status(200)
    expect(res.body.inSync).to.be.eq(false)
    expect(res.body.meals.length).to.be.eq(2)
    expect(res.body.meals[0].uuid).to.be.eq("abb7723c-7890-4a4f-8e3d-ed158b2416b5")
    expect(res.body.meals[0].meal).to.be.eq("tortellini in brodo 50 grammi")
    expect(res.body.meals[1].uuid).to.be.eq("be4c5118-432e-4402-b9c0-9db53a64b7e2")
    expect(res.body.meals[1].meal).to.be.eq("Bistecca di pollo 80 grammi")
  })

  it("add balance works correctly", async () => {
    const patient = await Patient.query().findById(2)
    const balances = await Balance.query().select().where("patientId", patient.id)
    expect(balances.map(balance => balance.id)).to.be.deep.eq([3, 5])

    const newBalances = [
      {
        uuid: "ae5a453b-7502-4c4e-8a40-c7fdf0e33cf9",
        date: new Date().toISOString(),
        minPressure: 60,
        maxPressure: 120,
        heartFrequency: 70,
        weight: 80,
        diuresis: 500,
        fecesCount: 1,
        fecesTexture: "Formata",
        ostomyVolume: 10,
        pegVolume: 100,
        otherGastrointestinalLosses: "diverse 100ml",
        parenteralNutritionVolume: 121,
        otherIntravenousLiquids: "extra data"
      },
      {
        uuid: "8cd0a026-ec3e-40b7-8b80-7627aa031a54",
        date: new Date().toISOString(),
      }
    ]
    const res = await (await authRequest(app)
      .loginAsPatient(2))
      .post("/api/mobile/sync")
      .build()
      .send({
        lastServerEdit: patient.getLastServerEditTimestamp(),
        balances: newBalances,
      })
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      inSync: true,
    })

    // Check if the balances have been added
    const updatedBalances = renderJson((await Balance.query().select().where("patientId", patient.id)).map(balance => balance.getInfo()))
    const expectedBalances = renderJson(balances.map(balance => balance.getInfo()).concat(renderJson(newBalances)))
    expect(updatedBalances).to.be.deep.eq(expectedBalances)
  })

  it("update balance works correctly", async () => {
    const patient = await Patient.query().findById(1)
    const previousBalance = renderJson((await Balance.query().findById(4)).getInfo())
    expect(previousBalance).to.be.deep.eq({
      uuid: "4f53980d-5bf2-4646-983e-17d5b278f2be",
      date: previousBalance.date,
      minPressure: 64,
      maxPressure: 115,
    })

    const updatedBalances = [
      {
        uuid: "4f53980d-5bf2-4646-983e-17d5b278f2be",
        date: previousBalance.date,
        minPressure: 64,
        maxPressure: 115,
        heartFrequency: 65
      }
    ]
    const res = await (await authRequest(app)
      .loginAsPatient(1))
      .post("/api/mobile/sync")
      .build()
      .send({
        lastServerEdit: patient.getLastServerEditTimestamp(),
        balances: updatedBalances,
      })
    expect(res).to.have.status(200)
    expect(res.body).to.be.deep.eq({
      inSync: true,
    })

    const updatedBalance = renderJson((await Balance.query().findById(4)).getInfo())
    expect(updatedBalance).to.be.deep.eq({
      uuid: "4f53980d-5bf2-4646-983e-17d5b278f2be",
      date: updatedBalance.date,
      minPressure: 64,
      maxPressure: 115,
      heartFrequency: 65,
    })
  })
})

describe("mobile (reports)", () => {
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

  it("authorized patient should download report", (done) => {
    authRequest(app)
      .loginAsPatient(3).then(req => {
        req.get("/api/mobile/reports/3/download")
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

  it("patient cannot read a report that doesn't belong to him", async () => {
    const res = await (await authRequest(app)
      .loginAsPatient(3))
      .get("/api/mobile/reports/1/download")  // Report 1 does not belong to patient 3
      .build()
      .send()
    expect(res).to.have.status(403)
    expect(res.body).to.be.deep.eq({
      error: "patient mismatch",
    })
  })

  it("non-existing report", async () => {
    const res = await (await authRequest(app)
      .loginAsPatient(3))
      .get("/api/mobile/reports/9999/download")
      .build()
      .send()
    expect(res).to.have.status(404)
    expect(res.body).to.be.deep.eq({
      error: "report not found",
    })
  })
})