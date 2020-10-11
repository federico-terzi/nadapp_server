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
      const jsonPatients = authorizedPatients.map(patient => patient.getShortDescription())
      
      res.json({
        patients: jsonPatients,
      })
    } catch (err) {
      next(err)
    }
  }
);

router.use("/patient/:id", patientRoutes);

export default router