import { Router } from "express"
import { HttpError } from "../../../errors";
import Doctor from "../../model/doctor";
import Patient from "../../model/patient";

const router = Router({
  mergeParams: true,
})

// Middleware to check that the current doctor can access the patient
router.use(async (req, res, next) => {
  // TODO: unauthorized doctor cannot access this route
  try {
    const patientId = parseInt(req.params.id); // TODO: test passing string
    const doctor = res.locals.doctor as Doctor
    if (!doctor.canReadPatient(patientId)) {
      throw new HttpError("missing patient authorization", 403)
    }

    res.locals.patientId = patientId

    next()
  } catch (err) {
    next(err)
  }
})

router.get(
  '/info',
  async (req, res, next) => {
    try {
      const patientId = res.locals.patientId as number;
      const patient: Patient = await Patient.query().findById(patientId) // TODO: test unauthorized patient
      const jsonPatient = patient.getInfo()

      res.json({
        patients: jsonPatient,
      })
    } catch (err) {
      next(err)
    }
  }
);

export default router