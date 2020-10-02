import Ajv, { ValidationError } from "ajv";
import { Router } from "express"
import Objection from "objection";
import { nextTick } from "process";
import { HttpError } from "../../errors";
import { LoginUserInfo } from "../model/apiTypes";
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
      const hasBalances = false // TODO

      const knex = Patient.knex()

      if (hasMeals || hasBalances) {
        await knex.transaction(async trx => {
          // Load the meals if present
          if (hasMeals) {
            // TODO: add test to add meals
            // TODO: add test to overwrite previous meal
            for (const meal of meals) {
              await trx.raw('INSERT INTO meals ("patientId", "uuid", "date", "meal") VALUES (:patientId, :uuid, :date, :meal) ON CONFLICT ("patientId", "uuid") DO UPDATE SET ("date", "meal") = (:date, :meal)',
                {
                  patientId: userInfo.patientId!,
                  uuid: meal.uuid,
                  date: meal.date,
                  meal: meal.meal,
                }
              )
            }
          }

          // TODO: balances
        })
      }

      if (req.body.lastServerEdit < patientInfo.lastServerEdit) {
        const meals = await Meal.query().select().where("patientId", "=", patientInfo.id).orderBy("date", "desc");
        const jsonMeals = meals.map(meal => meal.syncJson())

        // TODO: add doctors
        // TODO: add balances
        res.json({
          inSync: false,
          firstName: patientInfo.firstName,
          meals: jsonMeals,
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