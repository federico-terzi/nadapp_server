import { Router } from "express";
import { HttpError } from "../../../errors";
import Doctor from "../../model/doctor";
import Patient from "../../model/patient";
import { editPatientValidator } from "../../schema/patient";
import { trimFields } from "../../util";

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

    // Make sure the patient exists
    const result = await Patient.knex().raw("select exists(select 1 from patients where id=?)", [patientId])
    const exists = result.rows[0]["exists"];
    if (!exists) {
      throw new HttpError("patient not found", 404)
    }

    res.locals.patientId = patientId

    next()
  } catch (err) {
    next(err)
  }
})

router.put(
  '/info',
  async (req, res, next) => {
    try {
      const patientId = res.locals.patientId as number;
      
      trimFields(req.body)

      if (editPatientValidator(req.body)) {
        const lastServerEdit = new Date()
        const updatedPatient: Patient = await Patient.query().patchAndFetchById(patientId, {
          lastServerEdit,
          ...req.body,
        })

        res.json({
          info: updatedPatient.getInfo()
        })
      } else {
        throw new HttpError(`malformed patient info: ${JSON.stringify(editPatientValidator.errors)}`, 400)
      }
    } catch (err) {
      next(err)
    }
  }
);

router.post(
  '/authorization/:doctorId',
  async (req, res, next) => {
    try {
      const patientId = res.locals.patientId as number;
      const doctorId = parseInt(req.params.doctorId)
      if (isNaN(doctorId)) {
        throw new HttpError("invalid doctor id format", 400)
      }

      const doctor = await Doctor.query().findById(doctorId)
      if (!doctor) {
        throw new HttpError("authorized doctor not found", 404)
      }

      await Doctor.knex().raw("INSERT INTO authorized_doctors (\"doctorId\", \"patientId\") VALUES (?, ?) ON CONFLICT DO NOTHING", [doctorId, patientId])

      res.json({
        result: "ok"
      })
    } catch (err) {
      next(err)
    }
  }
);

router.delete(
  '/authorization/:doctorId',
  async (req, res, next) => {
    try {
      const patientId = res.locals.patientId as number;
      const doctorId = parseInt(req.params.doctorId)
      if (isNaN(doctorId)) {
        throw new HttpError("invalid doctor id format", 400)
      }

      const doctor = await Doctor.query().findById(doctorId)
      if (!doctor) {
        throw new HttpError("authorized doctor not found", 404)
      }

      await Doctor.knex().raw("DELETE FROM authorized_doctors WHERE \"doctorId\" = ? AND \"patientId\" = ?", [doctorId, patientId])

      res.json({
        result: "ok"
      })
    } catch (err) {
      next(err)
    }
  }
);

// TODO: if only the admin can upload reports, move the endpoint here (and update the tests)

export default router