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
  '/doctor/add',
  async (req, res, next) => {
    try {
      // TODO: add authorized doctor endpoint
      /*
      const patientId = res.locals.patientId as number;
      const authorizedDoctors = await Patient.relatedQuery<Doctor>("doctors").for(patientId)
      const jsonDoctors = authorizedDoctors.map(doctor => doctor.getShortInfo())

      // TODO: only the admin should see the authorized doctors?
      // TODO: test unauthorized

      res.json({
        doctors: jsonDoctors,
      })
      */
    } catch (err) {
      next(err)
    }
  }
)

// TODO: if only the admin can upload reports, move the endpoint here (and update the tests)

export default router