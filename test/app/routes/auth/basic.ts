import { app } from "../../init";
import chai, { expect } from "chai";
import chaiHttp from "chai-http";
import jwt from "jsonwebtoken"
import config from "config"
import { get } from "../../../../src/redis"
import { REDIS_VERIFICATION_PREFIX } from "../../../../src/routes/auth/basic";

chai.use(chaiHttp)

describe("login", () => {
  it("login patient correct", async () => {
    const res = await chai.request(app)
      .post("/auth/basic/login")
      .set("content-type", "application/json")
      .send({
        username: "patient@mario.rossi",
        password: "test"
      })

    expect(res).to.have.status(200)
    expect(res.body).to.have.property("verify")

    // Obtain the 2FA verification code from redis
    const redisKey = `${REDIS_VERIFICATION_PREFIX}${res.body.verify}`
    const payload = JSON.parse((await get(redisKey))!)
    const code = payload.code

    // Send the verification request
    const verifyRes = await chai.request(app)
      .post("/auth/basic/verify")
      .set("content-type", "application/json")
      .send({
        token: res.body.verify,
        code: code,
      })

    const decoded: any = jwt.verify(verifyRes.body.token, config.get("JWTSecret"))
    expect(decoded).to.have.property("user")
    expect(decoded.user).to.deep.eq({
      patientId: 1
    })
  })

  it("login doctor correct", async () => {
    const res = await chai.request(app)
      .post("/auth/basic/login")
      .set("content-type", "application/json")
      .send({
        username: "med@carlo.alberti",
        password: "password2020"
      })

    expect(res).to.have.status(200)
    expect(res.body).to.have.property("verify")

    // Obtain the 2FA verification code from redis
    const redisKey = `${REDIS_VERIFICATION_PREFIX}${res.body.verify}`
    const payload = JSON.parse((await get(redisKey))!)
    const code = payload.code

    // Send the verification request
    const verifyRes = await chai.request(app)
      .post("/auth/basic/verify")
      .set("content-type", "application/json")
      .send({
        token: res.body.verify,
        code: code,
      })

    const decoded: any = jwt.verify(verifyRes.body.token, config.get("JWTSecret"))
    expect(decoded).to.have.property("user")
    expect(decoded.user).to.deep.eq({
      doctorId: 2
    })
  })

  it("login without credentials is incorrect", (done) => {
    chai.request(app)
      .post("/auth/basic/login")
      .end((err, res) => {
        if (err) done(err)
        expect(res).to.have.status(400)
        expect(res.body).to.deep.eq({
          error: "missing login params"
        })
        done()
      })
  })

  it("login patient with wrong password", async () => {
    const res = await chai.request(app)
      .post("/auth/basic/login")
      .set("content-type", "application/json")
      .send({
        username: "patient@mario.rossi",
        password: "invalid"
      })

    expect(res).to.have.status(401)
    expect(res.body).to.be.deep.eq({
      error: "invalid credentials"
    })
  })

  it("login patient doesn't exist", async () => {
    const res = await chai.request(app)
      .post("/auth/basic/login")
      .set("content-type", "application/json")
      .send({
        username: "patient@invalid.patient",
        password: "invalid"
      })

    expect(res).to.have.status(401)
    expect(res.body).to.be.deep.eq({
      error: "user not found"
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

  it("login invalid verification code", async () => {
    const res = await chai.request(app)
      .post("/auth/basic/login")
      .set("content-type", "application/json")
      .send({
        username: "patient@mario.rossi",
        password: "test"
      })

    expect(res).to.have.status(200)
    expect(res.body).to.have.property("verify")

    // Send the verification request
    const verifyRes = await chai.request(app)
      .post("/auth/basic/verify")
      .set("content-type", "application/json")
      .send({
        token: res.body.verify,
        code: "12343567", // invalid
      })

    expect(verifyRes.status).to.eq(401)
    expect(verifyRes.body).to.deep.eq({
      error: "invalid code"
    })
  })

  it("verify with invalid token", async () => {
    const res = await chai.request(app)
      .post("/auth/basic/verify")
      .set("content-type", "application/json")
      .send({
        token: "invalid",
        code: "123435", // invalid
      })

    expect(res.status).to.eq(401)
    expect(res.body).to.deep.eq({
      error: "invalid token"
    })
  })

  it("verify two times with same code should be incorrect", async () => {
    const res = await chai.request(app)
      .post("/auth/basic/login")
      .set("content-type", "application/json")
      .send({
        username: "patient@mario.rossi",
        password: "test"
      })

    expect(res).to.have.status(200)
    expect(res.body).to.have.property("verify")

    // Obtain the 2FA verification code from redis
    const redisKey = `${REDIS_VERIFICATION_PREFIX}${res.body.verify}`
    const payload = JSON.parse((await get(redisKey))!)
    const code = payload.code

    // Send the verification request
    const verifyRes = await chai.request(app)
      .post("/auth/basic/verify")
      .set("content-type", "application/json")
      .send({
        token: res.body.verify,
        code: code,
      })

    const decoded: any = jwt.verify(verifyRes.body.token, config.get("JWTSecret"))
    expect(decoded).to.have.property("user")
    expect(decoded.user).to.deep.eq({
      patientId: 1
    })

    // Send the second verification request
    const verifyRes2 = await chai.request(app)
      .post("/auth/basic/verify")
      .set("content-type", "application/json")
      .send({
        token: res.body.verify,
        code: code,
      })
    expect(verifyRes2.status).to.eq(401)
    expect(verifyRes2.body).to.deep.eq({
      error: "invalid token"
    })
  })
})