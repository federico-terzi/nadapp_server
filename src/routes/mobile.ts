import { Router } from "express"
import { MAX_BALANCES_PER_SYNC, MAX_MEALS_PER_SYNC } from "../..";
import { LoginPatientInfo } from "../model/apiTypes";
import Balance from "../model/balance";
import Meal from "../model/meal";
import Patient from "../model/patient";
import { syncValidator } from "../schema/sync";

const router = Router()

// Middleware to check the current user is a patient
router.use(async (req, res, next) => {
  // TODO: test doctor cannot access this endpoint
  try {
    if (!req.user) {
      return res.status(403).json({ message: "missing user information" })
    }
    const userInfo = req.user as LoginPatientInfo
    if (!userInfo.patientId) {
      return res.status(403).json({ message: "missing patient information" })
    }

    const patientInfo = await Patient.query().findById(userInfo.patientId)
    if (!patientInfo) {
      return res.status(404).json({ message: "patient not found" })
    }

    res.locals.patient = patientInfo

    next()
  } catch (err) {
    next(err)
  }
})

router.post(
  '/sync',
  async (req, res, next) => {
    try {
      const patient = res.locals.patient as Patient

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
                  patientId: patient.id,
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
                  patientId: patient.id,
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

      if (req.body.lastServerEdit < patient.getLastServerEditTimestamp()) {
        const meals = await Meal.query().select().where("patientId", "=", patient.id)
          .limit(MAX_MEALS_PER_SYNC).orderBy("date", "desc");
        const jsonMeals = meals.map(meal => meal.syncJson())

        const balances = await Balance.query().select().where("patientId", "=", patient.id)
          .limit(MAX_BALANCES_PER_SYNC).orderBy("date", "desc");
        const jsonBalances = balances.map(balance => balance.syncJson())

        // TODO: add doctors
        res.json({
          inSync: false,
          lastServerEdit: patient.getLastServerEditTimestamp(),
          firstName: patient.firstName,
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

export default router