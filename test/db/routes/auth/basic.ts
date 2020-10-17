import app from "../../../../index"
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import jwt from "jsonwebtoken"
import config from "config"

chai.use(chaiHttp)

describe("login", () => {
  it("login patient correct", (done) => {
    chai.request(app)
      .post("/auth/basic/login")
      .set("content-type", "application/json")
      .send({
        username: "patient@mario.rossi",
        password: "TODO" // TODO: change with actual password hash
      })
      .end((err, res) => {
        if (err) done(err)
        expect(res).to.have.status(200)
        expect(res.body).to.have.property("token")
        const decoded: any = jwt.verify(res.body.token, config.get("JWTSecret"))
        expect(decoded).to.have.property("user")
        expect(decoded.user).to.deep.eq({
          patientId: 1
        })
        done()
      })
  })

  it("login doctor correct", (done) => {
    chai.request(app)
      .post("/auth/basic/login")
      .set("content-type", "application/json")
      .send({
        username: "med@carlo.alberti",
        password: "TODO" // TODO: change with actual password hash
      })
      .end((err, res) => {
        if (err) done(err)
        expect(res).to.have.status(200)
        expect(res.body).to.have.property("token")
        const decoded: any = jwt.verify(res.body.token, config.get("JWTSecret"))
        expect(decoded).to.have.property("user")
        expect(decoded.user).to.deep.eq({
          doctorId: 2
        })
        done()
      })
  })

  it("login without credentials is incorrect", (done) => {
    chai.request(app)
      .post("/auth/basic/login")
      .end((err, res) => {
        if (err) done(err)
        expect(res).to.have.status(400)
        expect(res.body).to.deep.eq({
          error: "bad login request"
        })
        done()
      })
  })

  it("login with invalid category", (done) => {
    chai.request(app)
      .post("/auth/basic/login")
      .set("content-type", "application/json")
      .send({
        username: "jerry",
        password: "scotty"
      })
      .end((err, res) => {
        if (err) done(err)
        expect(res).to.have.status(400)
        expect(res.body).to.deep.eq({
          error: "invalid category"
        })
        done()
      })
  })

  it("login with bad username format", (done) => {
    chai.request(app)
      .post("/auth/basic/login")
      .set("content-type", "application/json")
      .send({
        username: "med@",
        password: "scotty"
      })
      .end((err, res) => {
        if (err) done(err)
        expect(res).to.have.status(400)
        expect(res.body).to.deep.eq({
          error: "bad username format"
        })
        done()
      })
  })

  // TODO: check login patient with invalid credentials
  // TODO: check login doctor with invalid credentials
  // TODO: spid login
})