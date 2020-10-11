import { Router } from "express"
import { HttpError } from "../../../errors";
import Doctor from "../../model/doctor";
import Patient from "../../model/patient";

const router = Router({
  mergeParams: true,
})

// Middleware to check that the current doctor can access the patient
router.use(async (req, res, next) => {
  try {
    const patientId = parseInt(req.params.id);
    if (isNaN(patientId)) {
      throw new HttpError("bad patient id format", 400)
    }

    const doctor = res.locals.doctor as Doctor
    if (!await doctor.canReadPatient(patientId)) {
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
      const patient: Patient = await Patient.query().findById(patientId)
      const jsonPatient = patient.getInfo()

      res.json({
        info: jsonPatient,
      })
    } catch (err) {
      next(err)
    }
  }
);

export default router