import { Router } from "express";
import { HttpError } from "../../../errors";
import Doctor from "../../model/doctor";
import Patient from "../../model/patient";

const router = Router({
  mergeParams: true,
})

// Middleware to load the doctor id and verify format
router.use(async (req, res, next) => {
  try {
    const doctorId = parseInt(req.params.id);
    if (isNaN(doctorId)) {
      throw new HttpError("bad doctor id format", 400)
    }

    // Make sure the doctor exists
    const result = await Doctor.knex().raw("select exists(select 1 from doctors where id=?)", [doctorId])
    const exists = result.rows[0]["exists"];
    if (!exists) {
      throw new HttpError("doctor not found", 404)
    }

    res.locals.doctorId = doctorId

    next()
  } catch (err) {
    next(err)
  }
})

router.get(
  '/info',
  async (req, res, next) => {
    try {
      const doctorId = res.locals.doctorId as number;
      const doctor: Doctor = await Doctor.query().findById(doctorId)
      const jsonDoctor = doctor.getInfo()

      res.json({
        info: jsonDoctor,
      })
    } catch (err) {
      next(err)
    }
  }
);

router.get(
  '/patients',
  async (req, res, next) => {
    try {
      const doctorId = res.locals.doctorId as number;
      const doctor = await Doctor.query().findById(doctorId);

      let authorizedPatients
      if (doctor.isAdmin()) {          
        authorizedPatients = await Patient.query().orderBy("lastName", "asc")
      } else {
        authorizedPatients = await Doctor.relatedQuery<Patient>("patients").for(doctorId).orderBy("lastName", "asc")
      }
      const jsonPatients = authorizedPatients.map(patient => patient.getShortInfo())

      res.json({
        patients: jsonPatients,
      })
    } catch (err) {
      next(err)
    }
  }
)

export default router