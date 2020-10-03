import Ajv, { ValidationError } from "ajv";
import { Router } from "express"
import Objection from "objection";
import { nextTick } from "process";
import { CLIENT_RENEG_LIMIT } from "tls";
import { MAX_BALANCES_PER_SYNC, MAX_MEALS_PER_SYNC } from "../..";
import { HttpError } from "../../errors";
import { LoginUserInfo } from "../model/apiTypes";
import Balance from "../model/balance";
import Meal from "../model/meal";
import Patient from "../model/patient";
import { addPatientValidator } from "../schema/addPatient";
import { syncValidator } from "../schema/sync";
import { trimFields } from "../util";

const router = Router()

router.get(
  '/sync',
  async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(403).json({ message: "missing user information" })
      }
      const userInfo = req.user as LoginUserInfo
      if (!userInfo.patientId) {
        return res.status(403).json({ message: "missing patient information" })
      }

      const patientInfo = await Patient.query().findById(userInfo.patientId)
      if (!patientInfo) {
        return res.status(404).json({ message: "patient not found" })
      }

      if (!syncValidator(req.body)) {
        return res.status(400).json({ message: syncValidator.errors })
      }

      // Update patient monitoring data
      const meals = req.body.meals
      const hasMeals = meals && meals.length > 0
      const balances = req.body.balances
      const hasBalances = balances && balances.length > 0

      const knex = Patient.knex()

      if (hasMeals || hasBalances) {
        await knex.transaction(async trx => {
          // Load the meals if present
          if (hasMeals) {
            // TODO: add test to add meals
            // TODO: add test to overwrite previous meal
            for (const meal of meals) {
              await trx.raw(`INSERT INTO meals ("patientId", "uuid", "date", "meal") 
              VALUES (:patientId, :uuid, :date, :meal) 
              ON CONFLICT ("patientId", "uuid") 
              DO UPDATE SET ("date", "meal") = (EXCLUDED.date, EXCLUDED.meal)`,
                {
                  patientId: userInfo.patientId!,
                  uuid: meal.uuid,
                  date: meal.date,
                  meal: meal.meal,
                }
              )
            }
          }

          // Load the balances if present
          if (hasBalances) {
            // TODO: add test to add balance
            // TODO: add test to overwrite previous balance
            for (const balance of balances) {
              await trx.raw(`INSERT INTO balances ("patientId", "uuid", "date", "minPressure", "maxPressure",
              "heartFrequency", "weight", "diuresis", "fecesCount", "fecesTexture", "ostomyVolume", 
              "pegVolume", "otherGastrointestinalLosses", "parenteralNutritionVolume", "otherIntravenousLiquids", 
              "osLiquids", "intravenousLiquidsVolume") 
              VALUES (:patientId, :uuid, :date, :minPressure, :maxPressure, :heartFrequency, 
                :weight, :diuresis, :fecesCount, :fecesTexture, :ostomyVolume, :pegVolume, 
                :otherGastrointestinalLosses, :parenteralNutritionVolume, :otherIntravenousLiquids, 
                :osLiquids, :intravenousLiquidsVolume ) 
              ON CONFLICT ("patientId", "uuid") 
              DO UPDATE SET ("date", "minPressure", "maxPressure",
              "heartFrequency", "weight", "diuresis", "fecesCount", "fecesTexture", "ostomyVolume", 
              "pegVolume", "otherGastrointestinalLosses", "parenteralNutritionVolume", "otherIntravenousLiquids", 
              "osLiquids", "intravenousLiquidsVolume") = (EXCLUDED.date, EXCLUDED."minPressure", EXCLUDED."maxPressure",
              EXCLUDED."heartFrequency", EXCLUDED."weight", EXCLUDED."diuresis", EXCLUDED."fecesCount", EXCLUDED."fecesTexture", 
              EXCLUDED."ostomyVolume", EXCLUDED."pegVolume", EXCLUDED."otherGastrointestinalLosses", 
              EXCLUDED."parenteralNutritionVolume", EXCLUDED."otherIntravenousLiquids", EXCLUDED."osLiquids", 
              EXCLUDED."intravenousLiquidsVolume")`,
                {
                  patientId: userInfo.patientId!,
                  uuid: balance.uuid,
                  date: balance.date,
                  minPressure: balance.minPressure,
                  maxPressure: balance.maxPressure,
                  heartFrequency: balance.heartFrequency,
                  weight: balance.weight,
                  diuresis: balance.diuresis,
                  osLiquids: balance.osLiquids,
                  intravenousLiquidsVolume: balance.intravenousLiquidsVolume,
                  fecesCount: balance.fecesCount ?? null,
                  fecesTexture: balance.fecesTexture ?? null,
                  ostomyVolume: balance.ostomyVolume ?? null,
                  pegVolume: balance.pegVolume ?? null,
                  otherGastrointestinalLosses: balance.otherGastrointestinalLosses ?? null,
                  parenteralNutritionVolume: balance.parenteralNutritionVolume ?? null,
                  otherIntravenousLiquids: balance.otherIntravenousLiquids ?? null,
                }
              )
            }
          }
        })
      }

      if (req.body.lastServerEdit < patientInfo.getLastServerEditTimestamp()) {
        const meals = await Meal.query().select().where("patientId", "=", patientInfo.id)
          .limit(MAX_MEALS_PER_SYNC).orderBy("date", "desc");
        const jsonMeals = meals.map(meal => meal.syncJson())

        const balances = await Balance.query().select().where("patientId", "=", patientInfo.id)
          .limit(MAX_BALANCES_PER_SYNC).orderBy("date", "desc");
        const jsonBalances = balances.map(balance => balance.syncJson())

        // TODO: add doctors
        res.json({
          inSync: false,
          lastServerEdit: patientInfo.getLastServerEditTimestamp(),
          firstName: patientInfo.firstName,
          meals: jsonMeals,
          balances: jsonBalances,
        })
      } else {
        res.json({
          inSync: true,
        })
      }
    } catch (err) {
      next(err)
    }
  }
);

router.post(
  '/add/patient',
  async (req, res, next) => {
    // TODO: check admin permission level

    trimFields(req.body) // TODO: check field trimming

    if (addPatientValidator(req.body)) {
      // Generate a new username
      const firstName = req.body.firstName.replace(/\W/g, '').toLowerCase()
      const lastName = req.body.lastName.replace(/\W/g, '').toLowerCase()
      const username = `${firstName}.${lastName}`

      // TODO: test correct handling when two users have the same name

      // TODO: test CF duplicates

      // TODO: generate the password here

      try {
        await Patient.query().insert({
          ...req.body,
          username: username,
          lastServerEdit: Date.now(),
          hash: "", // TODO: change
        })

        // TODO: check if another user has the same username

        res.json({ message: "Ok" })
      } catch (err) {
        next(err)
      }
    } else {
      res.status(400).json({ message: addPatientValidator.errors })
    }
  }
);

export default router