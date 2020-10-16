import { Router } from "express"
import { HttpError } from "../../../errors"
import { LoginDoctorInfo } from "../../model/apiTypes"
import Doctor from "../../model/doctor"
import patientRoutes from "./patient"

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

router.post(
  '/patients',
  async (req, res, next) => {
    try {
      const doctor = res.locals.doctor as Doctor

      // TODO: add patient endpoint
      /*
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
      res.json({
        patients: jsonPatients,
      })
      */
    } catch (err) {
      next(err)
    }
  }
);

router.use("/patients/:id", patientRoutes);

export default router