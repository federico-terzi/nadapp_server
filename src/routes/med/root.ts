import { Router } from "express"
import { HttpError } from "../../../errors"
import { LoginDoctorInfo } from "../../model/apiTypes"
import Doctor from "../../model/doctor"
import Patient from "../../model/patient"
import patientRoutes from "./patient"

const router = Router()

// Middleware to check the current user is a doctor 
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

    res.locals.doctor = doctorInfo

    next()
  } catch (err) {
    next(err)
  }
})

router.get(
  '/patients',
  async (req, res, next) => {
    try {
      const doctor = res.locals.doctor as Doctor

      let authorizedPatients: Patient[]
      if (doctor.isAdmin()) {
        authorizedPatients = await Patient.query().select()
      } else {
        authorizedPatients = await doctor.$relatedQuery<Patient>("patients")
      }
      const jsonPatients = authorizedPatients.map(patient => patient.getShortInfo())
      
      res.json({
        patients: jsonPatients,
      })
    } catch (err) {
      next(err)
    }
  }
);

router.use("/patients/:id", patientRoutes);

router.get(
  '/search',
  async (req, res, next) => {
    try {
      const query = req.query.q
      if (!query) {
        throw new HttpError("missing query parameter", 400)
      }

      const doctor = res.locals.doctor as Doctor

      let patientsPromise
      let jsonDoctors = undefined
      if (doctor.isAdmin()) {
        patientsPromise = Patient.query().select()

        // Only the admin can see other doctors
        const doctors = await Doctor.query().whereRaw("LOWER(\"doctors\".\"firstName\" || ' ' || \"doctors\".\"lastName\") LIKE ?", [`%${query}%`]).orderBy("lastName", "asc")
        jsonDoctors = doctors.map(doctor => doctor.getNameInfo())
      } else {
        patientsPromise = doctor.$relatedQuery<Patient>("patients")
      }
      // This is not SQL injection vulnerable. See: https://github.com/knex/documentation/issues/73#issuecomment-572482153
      let patients = await patientsPromise.whereRaw("LOWER(\"patients\".\"firstName\" || ' ' || \"patients\".\"lastName\") LIKE ?", [`%${query}%`]).orderBy("lastName", "asc")
      const jsonPatients = patients.map(patient => patient.getNameInfo())
      
      res.json({
        patients: jsonPatients,
        doctors: jsonDoctors,
      })
    } catch (err) {
      next(err)
    }
  }
);

export default router