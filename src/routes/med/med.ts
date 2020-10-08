import { Router } from "express"
import { HttpError } from "../../../errors"
import { LoginDoctorInfo } from "../../model/apiTypes"
import Doctor from "../../model/doctor"
import Patient from "../../model/patient"
import patientRoutes from "./patient"

const router = Router()

// Middleware to check the current user is a doctor 
router.use(async (req, res, next) => {
  // TODO: test patient cannot access this endpoint
  try {
    if (!req.user) {
      return res.status(403).json({ message: "missing user information" })
    }
    const userInfo = req.user as LoginDoctorInfo
    if (!userInfo.doctorId) {
      return res.status(403).json({ message: "missing doctor information" })
    }

    const doctorInfo = await Doctor.query().findById(userInfo.doctorId)
    if (!doctorInfo) {
      return res.status(404).json({ message: "doctor not found" })
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
      // TODO: test
      const doctor = res.locals.doctor as Doctor

      // TODO: if admin, view all patients
      const authorizedPatients: Patient[] = await doctor.$relatedQuery<Patient>("patients")
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