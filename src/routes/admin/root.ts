import { Router } from "express"
import { HttpError } from "../../../errors"
import { LoginDoctorInfo } from "../../model/apiTypes"
import Doctor from "../../model/doctor"
import patientRoutes from "./patient"
import doctorRoutes from "./doctor"
import { trimFields } from "../../util"
import { addPatientValidator } from "../../schema/patient"
import Patient from "../../model/patient"

const MAX_USERNAME_NUMBER_ATTEMPTS = 10

const router = Router()

// Middleware to check the current user is an admin doctor
router.use(async (req, res, next) => {
  try {
    if (!req.user) {
      throw new HttpError("missing user information", 403)
    }
    const userInfo = req.user as LoginDoctorInfo
    if (!userInfo.doctorId) {
      throw new HttpError("missing doctor information", 403)
    }

    const doctorInfo = await Doctor.query().findById(userInfo.doctorId)
    if (!doctorInfo) {
      throw new HttpError("doctor not found", 404)
    }

    if (!doctorInfo.isAdmin()) {
      throw new HttpError("missing admin rights", 403)
    }

    res.locals.doctor = doctorInfo

    next()
  } catch (err) {
    next(err)
  }
})

router.get(
  '/doctors',
  async (req, res, next) => {
    try {
      const doctors = await Doctor.query().orderBy("lastName", "asc")
      const jsonDoctors = doctors.map(doctor => doctor.getShortInfo())
      
      res.json({
        doctors: jsonDoctors,
      })
    } catch (err) {
      next(err)
    }
  }
);

router.use("/doctors/:id", doctorRoutes);

router.post(
  '/patients',
  async (req, res, next) => {
    try {
      trimFields(req.body) // TODO: check field trimming

      if (addPatientValidator(req.body)) {
        // Generate a new username
        const cleanFirstName = req.body.firstName.replace(/\W/g, '').toLowerCase()
        const cleanLastName = req.body.lastName.replace(/\W/g, '').toLowerCase()
 
        let attempt = 0
        let username = null
        while (attempt < MAX_USERNAME_NUMBER_ATTEMPTS) {
          username = attempt > 0 ? 
            `${cleanFirstName}.${cleanLastName}-${attempt}` : 
            `${cleanFirstName}.${cleanLastName}`

          // Check if the username is available
          const patient = await Patient.query().where("username", username)
          if (!patient) {
            break
          }

          attempt++
        }

        if (attempt == MAX_USERNAME_NUMBER_ATTEMPTS) {
          console.error("too many users with the same name")
          throw new HttpError("name conflict", 500)
        }

        // TODO: test correct handling when two users have the same name
        // TODO: test CF duplicates

        // Initially the password is not assigned, but it has to be provided using the
        // credentials recovery procedure.

        const patient = await Patient.query().insertAndFetch({
          ...req.body,
          username: username,
          lastServerEdit: Date.now(),
          hash: "not yet assigned",
        })

        res.json({
          patient: patient.getInfo()
        })
      } else {
        throw new HttpError("bad patient format: " + JSON.stringify(addPatientValidator.errors), 400)
      }
    } catch (err) {
      next(err)
    }
  }
);

router.use("/patients/:id", patientRoutes);

export default router