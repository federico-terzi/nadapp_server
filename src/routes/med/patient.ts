import { Router } from "express"
import { HttpError } from "../../../errors";
import Doctor from "../../model/doctor";
import Meal from "../../model/meal";
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

router.get(
  '/doctors',
  async (req, res, next) => {
    try {
      const patientId = res.locals.patientId as number;
      const authorizedDoctors = await Patient.relatedQuery<Doctor>("doctors").for(patientId)
      const jsonDoctors = authorizedDoctors.map(doctor => doctor.getShortInfo())

      // TODO: only the admin should see the authorized doctors?
      // TODO: test unauthorized

      res.json({
        doctors: jsonDoctors,
      })
    } catch (err) {
      next(err)
    }
  }
);

// TODO: referti

router.get(
  '/meals',
  async (req, res, next) => {
    try {
      const patientId = res.locals.patientId as number;
      const meals = await Meal.query().where("patientId", patientId).orderBy("date", "desc")
      
      // TODO

      res.json({
        //doctors: jsonDoctors,
      })
    } catch (err) {
      next(err)
    }
  }
);

export default router