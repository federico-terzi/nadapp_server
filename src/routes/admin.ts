import { Router } from "express"
import Patient from "../model/patient";
import { addPatientValidator } from "../schema/addPatient";
import { syncValidator } from "../schema/sync";
import { trimFields } from "../util";

const router = Router()

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