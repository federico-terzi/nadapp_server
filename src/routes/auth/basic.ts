import { Router } from "express"
import passport from "passport"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { HttpError } from "../../../errors"
import config from "config"
import Patient from "../../model/patient"
import Doctor from "../../model/doctor"
import { set, get, del, redisClient } from "../../redis"
import Crypto from "crypto"
import { randomDigitCode, randomString } from "../../util"

const TWO_FACTOR_CODE_LENGTH = 6           // 6 digits
const TWO_FACTOR_CODE_EXPIRATION = 60 * 10 // 10 minutes
export const REDIS_VERIFICATION_PREFIX = "VERIFY-USER-"

interface RedisVerificationPayload {
  code: string,
  user: any,
}

const router = Router()

router.post(
  '/login',
  async (req, res, next) => {
    try {
      const prefixedUser = req.body.username
      const password = req.body.password
      if (!prefixedUser || !password) {
        throw new HttpError("missing login params", 400)
      }

      const isPatient = prefixedUser.startsWith("patient@");
      const isMed = prefixedUser.startsWith("med@");
      if (!isMed && !isPatient) {
       throw new HttpError("invalid category", 400)
      }

      const tokens = prefixedUser.match(/.+?@(.+)/)
      if (!tokens) {
        throw new HttpError("bad username format", 400)
      }

      const username: string = tokens[1]
      if (!username || username.trim().length == 0) {
        throw new HttpError("bad username content", 400)
      }

      let user: Patient | Doctor | null = null

      if (isPatient) {
        user = await Patient.query().select().where("username", "=", username).first()
      }
      if (isMed) {
        user = await Doctor.query().select().where("username", "=", username).first()
      }

      if (!user) {
        throw new HttpError("user not found", 401)
      }

      // Validate the password
      const isValidPassword = await bcrypt.compare(password, user.hash)
      if (!isValidPassword) {
        throw new HttpError("invalid credentials", 401)
      }

      let userData = null
      if (isPatient) {
        userData = {
          patientId: user.id
        }
      } else if (isMed) {
        userData = {
          doctorId: user.id
        }
      }

      if (!userData) {
        throw new HttpError("bad user role", 403)
      }

      // Generate a 6 digit random code for the 2 factor authentication
      const code = randomDigitCode(TWO_FACTOR_CODE_LENGTH)
      // Generate a random verification token
      const verificationToken = randomString(100)

      // Now save the verification data on Redis
      const redisPayload: RedisVerificationPayload = {
        code: code,
        user: userData,
      }
      const redisKey = `${REDIS_VERIFICATION_PREFIX}${verificationToken}`

      await set(redisKey, JSON.stringify(redisPayload), "EX", TWO_FACTOR_CODE_EXPIRATION)
      
      // TODO: here we should send the SMS
      console.log("CODE: ", code)

      res.json({
        verify: verificationToken
      })
    } catch (err) {
      next(err)
    }
  }
);

router.post(
  '/verify',
  async (req, res, next) => {
    try {
      const verificationToken = req.body.token
      const code = req.body.code
      if (!verificationToken || !code) {
        throw new HttpError("missing verify params", 400)
      }

      const redisKey = `${REDIS_VERIFICATION_PREFIX}${verificationToken}`

      // Get the available data, if present
      const redisPayloadJSON = await get(redisKey)
      if (!redisPayloadJSON) {
        throw new HttpError("invalid token", 401)
      }

      const redisPayload = JSON.parse(redisPayloadJSON) as RedisVerificationPayload
      if (code !== redisPayload.code) {
        throw new HttpError("invalid code", 401)
      }

      // Delete used key from store
      await del(redisKey)
      
      // Generate the JWT token
      const token = jwt.sign({ user: redisPayload.user }, config.get("JWTSecret"))
      return res.json({ token });
    } catch (err) {
      next(err)
    }
  }
);

export default router